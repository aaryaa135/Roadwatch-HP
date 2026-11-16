from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "RoadWatch_HP"
    environment: str = "development"
    debug: bool = True

    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    ai_service_host: str = "0.0.0.0"
    ai_service_port: int = 8001
    ai_service_url: str = "http://localhost:8001"

    database_url: str
    frontend_url: str = "http://localhost:5173"

    upload_dir: str = "uploads"
    upload_base_url: str = "http://localhost:8000/uploads"


settings = Settings()
