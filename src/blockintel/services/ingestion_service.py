from pathlib import Path
from typing import Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from blockintel.config import settings
from blockintel.core.exceptions import (
    FileSizeLimitExceededError, CredentialNotFoundError
)
from blockintel.core.security import (
    validate_magic_bytes, validate_file_extension, compute_sha256_bytes,
    sanitize_filename, generate_credential_id
)
from blockintel.domain.enums import CredentialStatus, FileType
from blockintel.infrastructure.storage.local_vault import LocalVaultStorage
from blockintel.infrastructure.database.models import CredentialModel

class IngestionService:
    def __init__(self, vault_storage: LocalVaultStorage | None = None):
        self.vault = vault_storage or LocalVaultStorage()

    async def ingest_credential(
        self,
        content: bytes,
        original_filename: str,
        db: AsyncSession
    ) -> Tuple[CredentialModel, bool]:
        """
        Executes complete Objective 1A ingestion pipeline:
        1. File size limit validation
        2. Magic byte inspection
        3. Extension cross-validation
        4. SHA-256 fingerprint generation
        5. Duplicate detection
        6. Secure vault storage
        7. Database persistence
        Returns (CredentialModel, is_duplicate)
        """
        # 1. File size check
        file_size = len(content)
        if file_size == 0:
            raise FileSizeLimitExceededError("Submitted credential file is empty (0 bytes).")
        if file_size > settings.MAX_FILE_SIZE_BYTES:
            raise FileSizeLimitExceededError(
                f"File size ({file_size} bytes) exceeds limit of {settings.MAX_FILE_SIZE_BYTES} bytes."
            )

        # 2. Magic byte inspection
        file_type, mime_type = validate_magic_bytes(content[:32])

        # 3. Filename sanitation & extension check
        clean_name = sanitize_filename(original_filename)
        validate_file_extension(clean_name, file_type)

        # 4. Cryptographic SHA-256 fingerprint of EXACT bytes
        file_hash = compute_sha256_bytes(content)

        # 5. Duplicate check
        dup_query = await db.execute(
            select(CredentialModel).where(CredentialModel.sha256_hash == file_hash)
        )
        existing = dup_query.scalar_one_or_none()
        if existing:
            return existing, True

        # 6. Generate unique ID & secure vault name
        credential_id = generate_credential_id()
        ext = Path(clean_name).suffix.lower()
        storage_filename = f"{credential_id.lower()}_{file_hash[:12]}{ext}"
        
        # 7. Store file in vault
        saved_path = self.vault.store_file(content, storage_filename)

        # 8. Persist to database
        cred = CredentialModel(
            credential_id=credential_id,
            original_filename=clean_name,
            file_type=file_type.value,
            mime_type=mime_type,
            file_size_bytes=file_size,
            storage_path=str(saved_path),
            sha256_hash=file_hash,
            status=CredentialStatus.UPLOADED.value
        )
        db.add(cred)
        await db.commit()
        await db.refresh(cred)
        return cred, False

    async def get_credential(self, credential_id: str, db: AsyncSession) -> CredentialModel:
        query = await db.execute(
            select(CredentialModel).where(CredentialModel.credential_id == credential_id)
        )
        cred = query.scalar_one_or_none()
        if not cred:
            raise CredentialNotFoundError(f"Credential '{credential_id}' not found.")
        return cred

    async def list_credentials(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[int, list[CredentialModel]]:
        from sqlalchemy import func
        count_query = await db.execute(select(func.count(CredentialModel.id)))
        total = count_query.scalar_one()

        query = await db.execute(
            select(CredentialModel).order_by(CredentialModel.created_at.desc()).offset(skip).limit(limit)
        )
        items = list(query.scalars().all())
        return total, items

    async def delete_credential(self, credential_id: str, db: AsyncSession) -> bool:
        """Deletes credential, vault artifact file, and cascades all associated intelligence records."""
        from pathlib import Path
        cred = await self.get_credential(credential_id, db)

        # Remove physical file from vault if present
        if cred.storage_path:
            storage_filename = Path(cred.storage_path).name
            self.vault.delete_file(storage_filename)

        # Delete database record (cascading all child relations)
        await db.delete(cred)
        await db.commit()
        return True
