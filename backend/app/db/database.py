from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from backend.app.config.settings import settings

# Enterprise production connection tuning settings
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,               # Set True in active local debugging cycles
    pool_pre_ping=True,       # Verifies connection integrity automatically
    pool_size=30,             # Optimum threshold for industrial connection volumes
    max_overflow=15,          # Buffer parameters
    pool_recycle=1800         # Close connections older than 30 minutes to clean resources
)

# Shared Thread-Safe session factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency injector providing thread-safe scoped transactions to endpoints."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
