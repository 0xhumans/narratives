"""GLM-5.2 OpenAI-compatible LLM client with strict-JSON + retry helper."""
from __future__ import annotations

import json
import re
from typing import Any, TypeVar

from openai import AsyncOpenAI
from pydantic import BaseModel, ValidationError
from tenacity import retry, stop_after_attempt, wait_exponential

from nie.config import settings

T = TypeVar("T", bound=BaseModel)


_CODE_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def _strip_fences(text: str) -> str:
    """Strip ```json fences if present and extract the JSON object/array."""
    text = text.strip()
    if text.startswith("```"):
        text = _CODE_FENCE_RE.sub("", text).strip()
    # Try to locate the first { or [ in case the model added preamble text.
    for opener, closer in (("{", "}"), ("[", "]")):
        start = text.find(opener)
        end = text.rfind(closer)
        if start != -1 and end != -1 and end > start:
            return text[start : end + 1]
    return text


class LLMClient:
    """Async wrapper around the OpenAI-compatible GLM-5.2 endpoint."""

    def __init__(self) -> None:
        headers: dict[str, str] = {}
        if settings.openrouter_site_url:
            headers["HTTP-Referer"] = settings.openrouter_site_url
        if settings.openrouter_app_name:
            headers["X-Title"] = settings.openrouter_app_name
        self._client = AsyncOpenAI(
            api_key=settings.glm_api_key or "EMPTY",
            base_url=settings.glm_base_url,
            default_headers=headers or None,
        )
        self.model = settings.glm_model

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        reraise=True,
    )
    async def _chat(self, system: str, user: str, temperature: float | None = None) -> str:
        resp = await self._client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=settings.llm_temperature if temperature is None else temperature,
            max_tokens=settings.llm_max_tokens,
        )
        return resp.choices[0].message.content or ""

    async def chat(self, system: str, user: str, temperature: float | None = None) -> str:
        """Plain text chat (used for free-form context gathering)."""
        return await self._chat(system, user, temperature)

    async def chat_json(
        self,
        system: str,
        user: str,
        schema_model: type[T],
        temperature: float | None = None,
    ) -> T:
        """Call the LLM and validate the response against a Pydantic schema.

        Retries up to `llm_max_retries` times by feeding the validation error
        back to the model so it can correct itself.
        """
        schema_hint = json.dumps(
            schema_model.model_json_schema(), ensure_ascii=False, indent=2
        )
        full_system = (
            system
            + "\n\nYou MUST respond with a single JSON object that strictly "
            "conforms to the following JSON Schema. Do not include any prose, "
            "commentary, or markdown fences.\n\nSchema:\n"
            + schema_hint
        )

        last_error: str | None = None
        for attempt in range(settings.llm_max_retries + 1):
            user_msg = user
            if last_error:
                user_msg = (
                    f"{user}\n\nYour previous response failed validation with "
                    f"this error:\n{last_error}\n\nPlease return ONLY a corrected "
                    "JSON object."
                )
            raw = await self._chat(full_system, user_msg, temperature)
            cleaned = _strip_fences(raw)
            try:
                data = json.loads(cleaned)
            except json.JSONDecodeError as exc:
                last_error = f"Invalid JSON: {exc}. Raw was: {raw[:500]}"
                continue
            try:
                return schema_model.model_validate(data)
            except ValidationError as exc:
                last_error = exc.json()
                continue
        raise ValueError(
            f"LLM failed to produce valid {schema_model.__name__} after retries. "
            f"Last error: {last_error}"
        )


_llm: LLMClient | None = None


def get_llm() -> LLMClient:
    global _llm
    if _llm is None:
        _llm = LLMClient()
    return _llm
