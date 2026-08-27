"""Environment-backed application settings."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration read from environment variables or `.env`."""

    app_name: str = "AI-Based Fake Identity & Document Screening System"
    environment: str = "development"
    log_level: str = "INFO"
    database_url: str = "sqlite:///./screening.db"
    api_prefix: str = "/api/v1"
    max_upload_size_bytes: int = 10 * 1024 * 1024
    upload_temp_dir: str = "/tmp/ai-border-screening-uploads"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
