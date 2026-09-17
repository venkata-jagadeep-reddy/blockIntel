import pytest

from blockintel.domain.enums import IntegrityStatus
from blockintel.services.blockchain_service import BlockchainService
from blockintel.services.ingestion_service import IngestionService


@pytest.mark.asyncio
async def test_register_and_verify_exact_original_bytes(db_session):
    original = b"%PDF-1.4\nexact credential content\n%%EOF"
    credential, _ = await IngestionService().ingest_credential(original, "original.pdf", db_session)
    service = BlockchainService()
    record = await service.register_hash(credential.credential_id, db_session)
    assert record.network_id == "local"
    assert len(record.transaction_hash) == 66

    _, registered_hash, matches, status = await service.verify_hash(credential.credential_id, original, db_session)
    assert matches is True
    assert status == IntegrityStatus.MATCH
    assert registered_hash == credential.sha256_hash

    _, _, matches, status = await service.verify_hash(credential.credential_id, original + b"changed", db_session)
    assert matches is False
    assert status == IntegrityStatus.MISMATCH
