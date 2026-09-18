import difflib
import re
from datetime import datetime, timezone
from pathlib import Path

import pymupdf
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from blockintel.core.exceptions import CredentialNotFoundError
from blockintel.core.security import compute_sha256_bytes, sanitize_filename, validate_magic_bytes
from blockintel.domain.blockchain import UniversalVerificationResponse
from blockintel.domain.enums import FileType, IntegrityStatus
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

    async def verify_document_against_all(
        self,
        submitted_bytes: bytes,
        original_filename: str,
        db: AsyncSession
    ) -> UniversalVerificationResponse:
        """
        Universal Artifact Verification:
        Checks submitted document against all documents in the database/vault.
        Determines:
        1. Whether it is PRESENT or NOT in the dataset.
        2. Whether it is an unaltered ORIGINAL or a TAMPERED artifact.
        """
        now = datetime.now(timezone.utc)
        safe_filename = sanitize_filename(original_filename)
        submitted_hash = compute_sha256_bytes(submitted_bytes)
        submitted_size = len(submitted_bytes)

        # Validate magic bytes
        file_type, _ = validate_magic_bytes(submitted_bytes)

        # Quick text extraction from submitted bytes for content comparison
        submitted_text = ""
        if file_type == FileType.PDF:
            try:
                doc = pymupdf.open(stream=submitted_bytes, filetype="pdf")
                texts = [page.get_text("text") for page in doc]
                doc.close()
                submitted_text = "\n".join(texts).strip()
            except Exception:
                submitted_text = ""

        # Fetch all credentials with extractions and blockchain records
        query = await db.execute(
            select(CredentialModel).options(
                selectinload(CredentialModel.extraction),
                selectinload(CredentialModel.blockchain_record)
            )
        )
        all_credentials = query.scalars().all()

        # Step 1: Check for Exact SHA-256 Hash Match (Original & Present)
        for cred in all_credentials:
            if cred.sha256_hash == submitted_hash:
                b_rec = cred.blockchain_record
                db.add(VerificationLogModel(
                    submitted_hash=submitted_hash,
                    registered_hash=cred.sha256_hash,
                    hash_match=True,
                    integrity_status=IntegrityStatus.MATCH.value,
                ))
                await db.commit()
                return UniversalVerificationResponse(
                    is_present=True,
                    verdict="ORIGINAL",
                    is_tampered=False,
                    is_original=True,
                    submitted_filename=safe_filename,
                    submitted_hash=submitted_hash,
                    submitted_size_bytes=submitted_size,
                    matched_credential_id=cred.credential_id,
                    matched_filename=cred.original_filename,
                    registered_hash=cred.sha256_hash,
                    match_confidence=1.0,
                    match_reason="EXACT_HASH_MATCH",
                    details=f"Document is PRESENT in the database as '{cred.original_filename}' ({cred.credential_id}) and verified as authentic and unaltered. Cryptographic SHA-256 digest matches 100%.",
                    diff_indicators=[],
                    blockchain_registered=b_rec is not None,
                    contract_address=b_rec.contract_address if b_rec else None,
                    transaction_hash=b_rec.transaction_hash if b_rec else None,
                    block_number=b_rec.block_number if b_rec else None,
                    network_id=b_rec.network_id if b_rec else None,
                    registered_at=b_rec.registered_at if b_rec else cred.created_at,
                    verified_at=now,
                )

        # Step 2: Check for Tampering against all stored credentials
        best_match: CredentialModel | None = None
        best_confidence: float = 0.0
        best_reason: str = ""
        diffs: list[str] = []

        norm_sub_name = safe_filename.lower().strip()
        stem_sub_name = Path(safe_filename).stem.lower().strip()

        # Token set for submitted text
        sub_words = set(re.findall(r"\w{3,}", submitted_text.lower())) if submitted_text else set()

        for cred in all_credentials:
            cred_name = cred.original_filename.lower().strip()
            cred_stem = Path(cred.original_filename).stem.lower().strip()
            confidence = 0.0
            reason = ""
            current_diffs = []

            # Check filename equality
            if norm_sub_name == cred_name:
                confidence = 0.95
                reason = "EXACT_FILENAME_MATCH_WITH_HASH_MISMATCH"
                current_diffs.append(f"Filename matches '{cred.original_filename}', but SHA-256 hash does not match stored fingerprint.")
            elif stem_sub_name == cred_stem or (len(stem_sub_name) > 5 and stem_sub_name in cred_stem) or (len(cred_stem) > 5 and cred_stem in stem_sub_name):
                confidence = 0.85
                reason = "FILENAME_STEM_MATCH_WITH_HASH_MISMATCH"
                current_diffs.append(f"Filename stem closely matches '{cred.original_filename}', but SHA-256 hash does not match.")

            # Check text similarity if text is available
            if submitted_text and cred.extraction and cred.extraction.full_raw_text:
                cred_text = cred.extraction.full_raw_text.strip()
                cred_words = set(re.findall(r"\w{3,}", cred_text.lower()))
                if sub_words and cred_words:
                    jaccard = len(sub_words & cred_words) / len(sub_words | cred_words)
                    seq_ratio = difflib.SequenceMatcher(None, submitted_text[:2000], cred_text[:2000]).ratio()
                    text_score = max(jaccard, seq_ratio)
                    if text_score > 0.40:
                        if text_score > confidence:
                            confidence = text_score
                            reason = f"TEXT_CONTENT_SIMILARITY_{int(text_score * 100)}PCT"
                            current_diffs.append(f"Text content shares {int(text_score * 100)}% vocabulary overlap with '{cred.original_filename}'.")

            if confidence > best_confidence:
                best_confidence = confidence
                best_match = cred
                best_reason = reason
                diffs = current_diffs

        if best_match and best_confidence >= 0.45:
            b_rec = best_match.blockchain_record
            size_diff = submitted_size - best_match.file_size_bytes
            if size_diff != 0:
                diffs.append(f"File size disparity: submitted {submitted_size} bytes vs registered {best_match.file_size_bytes} bytes ({size_diff:+d} bytes).")
            diffs.append("Cryptographic integrity check failed: file bytes have been altered since original ledger registration.")

            db.add(VerificationLogModel(
                submitted_hash=submitted_hash,
                registered_hash=best_match.sha256_hash,
                hash_match=False,
                integrity_status=IntegrityStatus.MISMATCH.value,
            ))
            await db.commit()

            return UniversalVerificationResponse(
                is_present=True,
                verdict="TAMPERED",
                is_tampered=True,
                is_original=False,
                submitted_filename=safe_filename,
                submitted_hash=submitted_hash,
                submitted_size_bytes=submitted_size,
                matched_credential_id=best_match.credential_id,
                matched_filename=best_match.original_filename,
                registered_hash=best_match.sha256_hash,
                match_confidence=round(best_confidence, 2),
                match_reason=best_reason,
                details=f"TAMPER DETECTED: Document matches registered record '{best_match.original_filename}' ({best_match.credential_id}), but its SHA-256 cryptographic digest does not match the registered ledger fingerprint. File bytes or contents have been modified.",
                diff_indicators=diffs,
                blockchain_registered=b_rec is not None,
                contract_address=b_rec.contract_address if b_rec else None,
                transaction_hash=b_rec.transaction_hash if b_rec else None,
                block_number=b_rec.block_number if b_rec else None,
                network_id=b_rec.network_id if b_rec else None,
                registered_at=b_rec.registered_at if b_rec else best_match.created_at,
                verified_at=now,
            )

        # Step 3: Not Present in system dataset
        db.add(VerificationLogModel(
            submitted_hash=submitted_hash,
            registered_hash=None,
            hash_match=False,
            integrity_status=IntegrityStatus.NOT_REGISTERED.value,
        ))
        await db.commit()

        return UniversalVerificationResponse(
            is_present=False,
            verdict="NOT_PRESENT",
            is_tampered=False,
            is_original=False,
            submitted_filename=safe_filename,
            submitted_hash=submitted_hash,
            submitted_size_bytes=submitted_size,
            matched_credential_id=None,
            matched_filename=None,
            registered_hash=None,
            match_confidence=0.0,
            match_reason="NO_MATCH_FOUND",
            details="Document is NOT PRESENT in the system database. No matching original artifact, hash, or filename was found in BlockIntel records. This is an unregistered document.",
            diff_indicators=["No prior registration found in local vault or blockchain registry."],
            blockchain_registered=False,
            contract_address=None,
            transaction_hash=None,
            block_number=None,
            network_id=None,
            registered_at=None,
            verified_at=now,
        )

    async def _credential(self, credential_id: str, db: AsyncSession) -> CredentialModel:
        result = await db.execute(select(CredentialModel).where(CredentialModel.credential_id == credential_id))
        credential = result.scalar_one_or_none()
        if credential is None:
            raise CredentialNotFoundError(f"Credential '{credential_id}' not found.")
        return credential
