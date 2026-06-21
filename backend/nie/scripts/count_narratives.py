"""Print narrative count (used by start.bat)."""
import asyncio

from sqlalchemy import func, select

from nie.db.base import SessionLocal
from nie.db.models import Narrative


async def main() -> None:
    async with SessionLocal() as s:
        count = (await s.execute(select(func.count()).select_from(Narrative))).scalar_one()
        print(count)


if __name__ == "__main__":
    asyncio.run(main())
