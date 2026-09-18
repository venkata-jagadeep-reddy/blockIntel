import pytest
from pathlib import Path
from blockintel.infrastructure.storage.local_vault import LocalVaultStorage, VaultStorageError

def test_vault_storage_store_and_read(tmp_path):
    vault = LocalVaultStorage(vault_dir=tmp_path / "vault")
    payload = b"%PDF-1.5 exact byte content for storage"
    
    saved_path = vault.store_file(payload, "test_file.pdf")
    assert saved_path.exists()
    assert oct(saved_path.stat().st_mode)[-3:] == "600"

    retrieved = vault.read_file("test_file.pdf")
    assert retrieved == payload

def test_vault_storage_traversal_prevention(tmp_path):
    vault = LocalVaultStorage(vault_dir=tmp_path / "vault")
    with pytest.raises(VaultStorageError):
        vault.store_file(b"payload", "../escape.pdf")
