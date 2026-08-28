"""Application configuration and constants."""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "QuantumHealth AI"
    app_version: str = "1.0.0"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000
    database_url: str = f"sqlite+aiosqlite:///{BASE_DIR}/quantumhealth.db"
    models_cache_dir: Path = BASE_DIR / "models_cache"
    quantum_backend: str = "pennylane:default.qubit"
    quantum_n_layers: int = 2
    quantum_n_qubits: int = 6
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

settings = Settings()

# Ensure model cache dir exists
settings.models_cache_dir.mkdir(parents=True, exist_ok=True)
