from typing import AsyncGenerator
import redis.asyncio as aioredis
from backend.app.config.settings import settings

class RedisConnectionManager:
    """Manager for async Redis connections to prevent leakage of physical file descriptors."""
    _client: aioredis.Redis | None = None

    @classmethod
    def get_client(cls) -> aioredis.Redis:
        """Lazily initialize client connection to prevent startups crashes if keys are absent."""
        if cls._client is None:
            cls._client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=50
            )
        return cls._client

    @classmethod
    async def close(cls) -> None:
        """Closes the Redis database pools safely during container shutdown cycles."""
        if cls._client:
            await cls._client.close()
            cls._client = None

async def get_redis_client() -> AsyncGenerator[aioredis.Redis, None]:
    """Dependency generator injecting active cached Redis links to routes."""
    client = RedisConnectionManager.get_client()
    try:
        yield client
    finally:
        pass  # Pool handles lifecycle closing via the top-level lifespan events
