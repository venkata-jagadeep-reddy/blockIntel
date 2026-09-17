import os
from pathlib import Path
from blockintel.config import Settings

def test_settings_default_values():
    settings = Settings()
    assert settings.APP_NAME == "BlockIntel"
    assert settings.ENVIRONMENT in ["development", "testing", "production"]
    assert settings.API_V1_STR == "/api/v1"
    assert settings.MAX_FILE_SIZE_BYTES == 15 * 1024 * 1024
    assert settings.RISK_THRESHOLD_LOW == 30
    assert settings.RISK_THRESHOLD_HIGH == 70
    assert isinstance(settings.VAULT_DIR, Path)

def test_settings_directory_creation(tmp_path):
    custom_vault = tmp_path / "custom_vault"
    settings = Settings(VAULT_DIR=custom_vault)
    settings.ensure_directories()
    assert custom_vault.exists()
