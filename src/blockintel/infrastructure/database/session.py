from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from blockintel.config import settings
from blockintel.core.logging import logger

Base = declarative_base()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def init_db() -> None:
    """Initializes tables in database."""
    async with engine.begin() as conn:
        from blockintel.infrastructure.database import models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables verified and initialized successfully.")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency injection generator for async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
