"""Application settings loaded from environment variables (and backend/.env)."""

from pathlib import Path
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_SECRET_KEY = "dev-only-insecure-secret-key-change-me"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = "sqlite:///./onlinekurs.db"
    SECRET_KEY: str = DEFAULT_SECRET_KEY
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    CORS_ORIGINS: str = "http://localhost:5173"
    UPLOAD_DIR: Path = BACKEND_DIR / "uploads"
    MAX_UPLOAD_MB: int = 500
    ENVIRONMENT: Literal["development", "production"] = "development"
    BACKEND_URL: str = "http://localhost:8000"

    @field_validator("UPLOAD_DIR", mode="after")
    @classmethod
    def _resolve_upload_dir(cls, value: Path) -> Path:
        if value.is_absolute():
            return value
        return (BACKEND_DIR / value).resolve()

    @field_validator("BACKEND_URL", mode="after")
    @classmethod
    def _strip_trailing_slash(cls, value: str) -> str:
        return value.rstrip("/")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_default_secret(self) -> bool:
        return self.SECRET_KEY == DEFAULT_SECRET_KEY

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_MB * 1024 * 1024


settings = Settings()
