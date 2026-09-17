"""Provider-neutral registration and exact-byte integrity verification."""

from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from blockintel.core.exceptions import CredentialNotFoundError
from blockintel.core.security import compute_sha256_bytes
from blockintel.domain.enums import IntegrityStatus
from blockintel.infrastructure.blockchain.local_provider import LocalBlockchainProvider
from blockintel.infrastructure.database.models import BlockchainRecordModel, CredentialModel, VerificationLogModel
from blockintel.infrastructure.storage.local_vault import LocalVaultStorage


class BlockchainService:
    """Application-facing blockchain boundary; the provider can be replaced independently."""

    def __init__(self, provider: LocalBlockchainProvider | None = None, vault: LocalVaultStorage | None = None):
        self.provider = provider or LocalBlockchainProvider()
        self.vault = vault or LocalVaultStorage()

    async def register_hash(self, credential_id: str, db: AsyncSession) -> BlockchainRecordModel:
        credential = await self._credential(credential_id, db)
        await db.refresh(credential, ["blockchain_record"])
        if credential.blockchain_record:
            return credential.blockchain_record
        credential.status = "BLOCKCHAIN_PENDING"
        receipt = self.provider.register_hash(credential.sha256_hash, credential.credential_id)
        record = BlockchainRecordModel(
            credential_id=credential.id,
            contract_address=receipt.contract_address,
            transaction_hash=receipt.transaction_hash,
            block_number=receipt.block_number,
            network_id=receipt.network_id,
            registered_by=receipt.registered_by,
        )
        db.add(record)
        credential.status = "REGISTERED"
        await db.commit()
        await db.refresh(record)
        return record

    async def get_record(self, credential_id: str, db: AsyncSession) -> BlockchainRecordModel | None:
        credential = await self._credential(credential_id, db)
        await db.refresh(credential, ["blockchain_record"])
        return credential.blockchain_record

    async def get_credential(self, credential_id: str, db: AsyncSession) -> CredentialModel:
        """Return the registry credential for response composition."""
        return await self._credential(credential_id, db)

    async def verify_hash(self, credential_id: str, submitted_bytes: bytes, db: AsyncSession) -> tuple[str, str | None, bool, IntegrityStatus]:
        credential = await self._credential(credential_id, db)
        await db.refresh(credential, ["blockchain_record"])
        submitted_hash = compute_sha256_bytes(submitted_bytes)
        registered_hash = credential.sha256_hash if credential.blockchain_record else None
        if registered_hash is None:
            status, matches = IntegrityStatus.NOT_REGISTERED, False
        else:
            matches = submitted_hash == registered_hash
            status = IntegrityStatus.MATCH if matches else IntegrityStatus.MISMATCH
        db.add(VerificationLogModel(
            submitted_hash=submitted_hash,
            registered_hash=registered_hash,
            hash_match=matches,
            integrity_status=status.value,
        ))
        await db.commit()
        return submitted_hash, registered_hash, matches, status

    async def verify_stored_artifact(self, credential_id: str, db: AsyncSession) -> tuple[str, str | None, bool, IntegrityStatus]:
        credential = await self._credential(credential_id, db)
        original_bytes = self.vault.read_file(Path(credential.storage_path).name)
        return await self.verify_hash(credential_id, original_bytes, db)

    async def _credential(self, credential_id: str, db: AsyncSession) -> CredentialModel:
        result = await db.execute(select(CredentialModel).where(CredentialModel.credential_id == credential_id))
        credential = result.scalar_one_or_none()
        if credential is None:
            raise CredentialNotFoundError(f"Credential '{credential_id}' not found.")
        return credential
