import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # General Project Configurations
    PROJECT_NAME: str = "FactoryGPT API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = Field(default="production", env="ENV")

    # Ingress and Ports
    PORT: int = 3000
    HOST: str = "0.0.0.0"

    # Security & JWT Tokens
    JWT_SECRET_KEY: str = Field(..., env="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Async Database (PostgreSQL)
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    
    # Redis Cache & Celery Broker
    REDIS_URL: str = Field(..., env="REDIS_URL")

    # CORS settings
    ALLOWED_ORIGINS: List[str] = ["*"]

settings = AppSettings()
