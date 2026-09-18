from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from blockintel.config import settings
from blockintel.core.logging import logger

Base = declarative_base()

def get_async_database_url(url: str) -> str:
    """
    Normalizes standard database URLs into async SQLAlchemy drivers.
    Supports local SQLite and global PostgreSQL (Neon, Supabase, Cloud SQL, AWS RDS, CockroachDB).
    """
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("sqlite://") and not url.startswith("sqlite+aiosqlite://"):
        url = url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    return url

_normalized_url = get_async_database_url(settings.DATABASE_URL)

_engine_kwargs: dict = {
    "echo": False,
    "future": True,
}

if "sqlite" in _normalized_url:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
elif "postgresql" in _normalized_url:
    # Production-ready connection pooling for globally distributed / cloud databases
    _engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_recycle": 300,
    })

engine = create_async_engine(
    _normalized_url,
    **_engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def init_db() -> None:
    """Initializes tables in database."""
    dialect_name = engine.dialect.name
    logger.info(f"Connecting to database backend: {dialect_name.upper()} ({engine.url.render_as_string(hide_password=True)})")
    async with engine.begin() as conn:
        from blockintel.infrastructure.database import models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
    logger.info(f"Database tables verified and initialized successfully on {dialect_name.upper()}.")

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
