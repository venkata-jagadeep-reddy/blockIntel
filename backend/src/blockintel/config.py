from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "BlockIntel"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    API_V1_STR: str = "/api/v1"

    # Storage Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    VAULT_DIR: Path = BASE_DIR / "data" / "vault"
    MAX_FILE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB

    # Database Configuration
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR}/data/blockintel.db"

    # Blockchain
    BLOCKCHAIN_RPC_URL: str = "http://127.0.0.1:8545"
    CONTRACT_ADDRESS: str = "0x0000000000000000000000000000000000000000"
    BLOCKCHAIN_CHAIN_ID: int = 1337

    # Authentication & Authorization (Admin RBAC)
    JWT_SECRET_KEY: str = "blockintel-enterprise-auth-secret-key-2026-secure"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ADMIN_USERNAME: str = "admin@blockintel.com"
    ADMIN_PASSWORD: str = "Admin@BlockIntel2026!"

    # Authenticity Risk Thresholds (Objective 2)
    RISK_THRESHOLD_LOW: int = 30
    RISK_THRESHOLD_HIGH: int = 70

    # OCR & Document Processing (Objective 1B)
    TESSERACT_CMD: str = str(BASE_DIR / "bin" / "tesseract")
    MIN_NATIVE_TEXT_CHARS: int = 50
    OCR_DPI: int = 150

    def ensure_directories(self) -> None:
        self.VAULT_DIR.mkdir(parents=True, exist_ok=True)
        (self.BASE_DIR / "data").mkdir(parents=True, exist_ok=True)

settings = Settings()
settings.ensure_directories()
