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


@pytest.mark.asyncio
async def test_universal_document_verification_flow(db_session):
    service = BlockchainService()
    original_bytes = b"%PDF-1.4\nOriginal Degree Credential Content\n%%EOF"
    cred, _ = await IngestionService().ingest_credential(original_bytes, "mit_degree.pdf", db_session)
    await service.register_hash(cred.credential_id, db_session)

    # 1. Exact Original Upload
    res_orig = await service.verify_document_against_all(original_bytes, "mit_degree.pdf", db_session)
    assert res_orig.is_present is True
    assert res_orig.verdict == "ORIGINAL"
    assert res_orig.is_tampered is False
    assert res_orig.is_original is True
    assert res_orig.matched_credential_id == cred.credential_id

    # 2. Tampered Document (same name, altered bytes)
    tampered_bytes = original_bytes + b"\nAltered Grade: A++"
    res_tamp = await service.verify_document_against_all(tampered_bytes, "mit_degree.pdf", db_session)
    assert res_tamp.is_present is True
    assert res_tamp.verdict == "TAMPERED"
    assert res_tamp.is_tampered is True
    assert res_tamp.is_original is False
    assert res_tamp.matched_credential_id == cred.credential_id
    assert len(res_tamp.diff_indicators) > 0

    # 3. Not Present (unregistered file)
    unseen_bytes = b"%PDF-1.4\nTotally Unknown Student Certificate\n%%EOF"
    res_unknown = await service.verify_document_against_all(unseen_bytes, "unknown.pdf", db_session)
    assert res_unknown.is_present is False
    assert res_unknown.verdict == "NOT_PRESENT"
    assert res_unknown.is_tampered is False
    assert res_unknown.is_original is False
    assert res_unknown.matched_credential_id is None

