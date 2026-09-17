from pathlib import Path
from blockintel.config import settings
from blockintel.core.exceptions import BlockIntelError

class VaultStorageError(BlockIntelError):
    pass

class LocalVaultStorage:
    """
    Secure file vault adapter.
    Stores raw, unaltered credential files with path traversal protection.
    """
    def __init__(self, vault_dir: Path | None = None):
        self.vault_dir = vault_dir or settings.VAULT_DIR
        self.vault_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_safe_path(self, filename: str) -> Path:
        target = (self.vault_dir / filename).resolve()
        if not str(target).startswith(str(self.vault_dir.resolve())):
            raise VaultStorageError("Attempted directory traversal detected in vault storage.")
        return target

    def store_file(self, content: bytes, storage_filename: str) -> Path:
        """Writes exact unaltered bytes to disk with strict permissions."""
        safe_path = self._resolve_safe_path(storage_filename)
        safe_path.write_bytes(content)
        safe_path.chmod(0o600)  # Read/write for owner only
        return safe_path

    def read_file(self, storage_filename: str) -> bytes:
        """Reads raw bytes from vault without alteration."""
        safe_path = self._resolve_safe_path(storage_filename)
        if not safe_path.exists():
            raise VaultStorageError(f"File '{storage_filename}' not found in vault.")
        return safe_path.read_bytes()

    def file_exists(self, storage_filename: str) -> bool:
        safe_path = self._resolve_safe_path(storage_filename)
        return safe_path.exists()
