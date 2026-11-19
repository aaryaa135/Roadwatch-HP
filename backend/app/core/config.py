from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "RoadWatch_HP"
    environment: str = "development"
    debug: bool = True

    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # Public URL that browsers use to reach the backend (host port).
    # Inside Docker, this defaults to localhost:8002 (the published host port).
    # Docker Compose can override via PUBLIC_BACKEND_URL=http://backend:8000
    # only when the caller is another container; browsers must use the host port.
    public_backend_url: str = "http://localhost:8002"

    ai_service_host: str = "0.0.0.0"
    ai_service_port: int = 8001
    # Internal Docker URL used by the backend to call the AI service.
    # Compose overrides this to http://ai-service:8001 via AI_SERVICE_URL.
    ai_service_url: str = "http://localhost:8001"

    database_url: str = Field(..., description="SQLAlchemy database URL (required)")

    frontend_url: str = "http://localhost:5173"

    # Auth. Override SECRET_KEY in production.
    secret_key: str = "roadwatch-hp-development-secret-change-me"
    access_token_expire_minutes: int = 60 * 24 * 7

    upload_dir: str = "uploads"
    # Public URL prefix for uploaded images. Derived from public_backend_url.
    upload_base_url: str = "http://localhost:8002/uploads"

    upload_max_size: int = 10 * 1024 * 1024  # 10 MB

    @field_validator("upload_base_url")
    @classmethod
    def _validate_upload_base_url(cls, v: str) -> str:
        if not v:
            raise ValueError("upload_base_url must not be empty")
        return v.rstrip("/")


settings = Settings()
