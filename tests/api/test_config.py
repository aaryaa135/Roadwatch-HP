"""Configuration tests for the backend settings."""

from backend.app.core.config import Settings


def test_settings_defaults_from_env_file():
    settings = Settings()
    assert settings.app_name == "RoadWatch_HP"
    assert settings.environment == "development"
    assert settings.backend_port == 8000
    assert settings.ai_service_port == 8001
    assert settings.frontend_url == "http://localhost:5173"
    assert settings.database_url.startswith("postgresql+psycopg://")


def test_constructor_override():
    settings = Settings(database_url="postgresql+psycopg://custom:custom@localhost:5432/test")
    assert settings.database_url == "postgresql+psycopg://custom:custom@localhost:5432/test"
