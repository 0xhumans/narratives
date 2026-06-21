"""Application configuration loaded from environment."""
from __future__ import annotations

from functools import lru_cache
from typing import Any, Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_db_url(url: str) -> tuple[str, dict[str, Any]]:
    """asyncpg does not accept `sslmode=`; translate it to `ssl=require`.

    Returns (cleaned_url_without_sslmode, connect_args) where connect_args
    holds the asyncpg-compatible ssl keyword.
    """
    from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

    parts = urlparse(url)
    qs = parse_qs(parts.query)
    connect_args: dict[str, Any] = {}
    if "sslmode" in qs:
        val = qs.pop("sslmode")[0]
        if val in ("require", "verify-ca", "verify-full"):
            connect_args["ssl"] = "require"
        elif val == "disable":
            connect_args["ssl"] = False
        else:
            connect_args["ssl"] = val
    # also drop channel_binding (not understood by asyncpg)
    qs.pop("channel_binding", None)
    new_query = urlencode([(k, v) for k, vs in qs.items() for v in vs])
    cleaned = urlunparse(parts._replace(query=new_query))
    return cleaned, connect_args


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/nie_db",
        description="Neon (or local Postgres) async connection string",
    )

    # LLM (GLM-5.2 via OpenRouter — OpenAI-compatible endpoint)
    glm_api_key: str = Field(default="", description="API key for OpenRouter")
    glm_base_url: str = Field(
        default="https://openrouter.ai/api/v1",
        description="OpenAI-compatible base URL (OpenRouter)",
    )
    glm_model: str = Field(default="z-ai/glm-5.2", description="Model slug on OpenRouter")
    llm_temperature: float = 0.4
    llm_max_tokens: int = 4000
    llm_max_retries: int = 2
    # Optional OpenRouter ranking / app metadata
    openrouter_site_url: str = Field(default="", description="Optional site URL for OpenRouter rankings")
    openrouter_app_name: str = Field(default="Narrative Intelligence Engine", description="App name for OpenRouter rankings")

    # Pipeline
    pipeline_concurrency: int = 3
    score_weights: dict[str, float] = Field(
        default_factory=lambda: {
            "narrative_strength": 1.0,
            "adoption_probability": 1.0,
            "economic_impact": 1.0,
            "bottleneck_advantage": 1.0,
            "competitive_advantage": 1.0,
            "valuation_support": 1.0,
            "market_awareness_gap": 1.0,
            "second_order_effects": 1.0,
            "duration": 1.0,
            "conviction": 1.0,
        }
    )

    # API
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )

    env: Literal["dev", "prod", "test"] = "dev"
    pipeline_enabled: bool = Field(
        default=True,
        description="When false, POST /api/pipeline/run returns 403",
    )

    @property
    def echo_sql(self) -> bool:
        return self.env == "dev"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

# Pre-compute cleaned URL + asyncpg connect args (ssl handling).
_cleaned_db_url, db_connect_args = _normalize_db_url(settings.database_url)
