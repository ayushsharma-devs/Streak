from datetime import date
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str | None = None
    FRONTEND_URL: str = "https://streak-eosin.vercel.app, http://localhost:3000"
    PUZZLE_START_DATE: date = date(2026, 1, 1)
    GAME_TIMEZONE: str = "UTC"
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_database_url(self) -> "Settings":
        if self.ENVIRONMENT.lower() == "production" and not self.DATABASE_URL:
            raise ValueError("DATABASE_URL is required when ENVIRONMENT=production")
        if self.ENVIRONMENT.lower() == "production" and self.GAME_TIMEZONE != "UTC":
            raise ValueError("GAME_TIMEZONE must be UTC when ENVIRONMENT=production")
        if not self.DATABASE_URL:
            self.DATABASE_URL = "sqlite:///./streak.db"
        return self


settings = Settings()
