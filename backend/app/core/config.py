from datetime import date
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./streak.db"
    FRONTEND_URL: str = "https://streak-eosin.vercel.app"
    PUZZLE_START_DATE: date = date(2026, 1, 1)
    GAME_TIMEZONE: str = "UTC"
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
