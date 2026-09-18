import pytest
from datetime import datetime, timezone
from sqlalchemy import select
from blockintel.infrastructure.database.models import (
    CredentialModel, DocumentExtractionModel, ExtractedPageModel,
    MetadataRecordModel, RiskAssessmentModel, RiskSignalModel,
    BlockchainRecordModel, VerificationLogModel, SkillModel,
    SkillEvidenceModel, SkillEvaluationModel
)
from blockintel.domain.enums import CredentialStatus, FileType, RiskLevel, IntegrityStatus

@pytest.mark.asyncio
async def test_create_and_query_credential(db_session):
    cred = CredentialModel(
        credential_id="CRD-TEST-001",
        original_filename="sample_cert.pdf",
        file_type=FileType.PDF.value,
        mime_type="application/pdf",
        file_size_bytes=10240,
        storage_path="/data/vault/sample_cert.pdf",
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        status=CredentialStatus.UPLOADED.value
    )
    db_session.add(cred)
    await db_session.commit()

    result = await db_session.execute(
        select(CredentialModel).where(CredentialModel.credential_id == "CRD-TEST-001")
    )
    saved_cred = result.scalar_one_or_none()
    assert saved_cred is not None
    assert saved_cred.credential_id == "CRD-TEST-001"
    assert saved_cred.file_type == "PDF"
    assert saved_cred.status == "UPLOADED"

@pytest.mark.asyncio
async def test_credential_full_relationships(db_session):
    cred = CredentialModel(
        credential_id="CRD-REL-002",
        original_filename="degree.pdf",
        file_type="PDF",
        mime_type="application/pdf",
        file_size_bytes=20480,
        storage_path="/data/vault/degree.pdf",
        sha256_hash="01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b",
        status=CredentialStatus.COMPLETED.value
    )
    db_session.add(cred)
    await db_session.flush()

    # Add extraction & pages
    extraction = DocumentExtractionModel(
        credential_id=cred.id,
        extraction_method="HYBRID",
        text_available=True,
        average_ocr_confidence=0.95,
        total_pages=1,
        full_raw_text="Awarded for proficiency in Python and React."
    )
    page = ExtractedPageModel(
        credential_id=cred.id,
        page_number=1,
        page_text="Awarded for proficiency in Python and React.",
        ocr_confidence=0.95
    )
    db_session.add_all([extraction, page])

    # Add metadata record
    meta = MetadataRecordModel(
        credential_id=cred.id,
        author="University Registrar",
        producer="CertGen v1.0",
        raw_metadata={"Keywords": "Certificate, Computer Science"}
    )
    db_session.add(meta)

    # Add risk assessment with signals
    risk = RiskAssessmentModel(
        credential_id=cred.id,
        risk_score=15,
        risk_level=RiskLevel.LOW.value,
        summary_explanations=["Document exhibits normal structure and verified metadata."]
    )
    db_session.add(risk)
    await db_session.flush()

    signal = RiskSignalModel(
        risk_assessment_id=risk.id,
        signal_type="metadata_consistency",
        severity="LOW",
        description="Standard metadata timestamp ordering."
    )
    db_session.add(signal)

    # Add blockchain record
    b_record = BlockchainRecordModel(
        credential_id=cred.id,
        contract_address="0x1234567890123456789012345678901234567890",
        transaction_hash="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        block_number=1001,
        network_id="1337",
        registered_by="0x9876543210987654321098765432109876543210"
    )
    db_session.add(b_record)

    # Add skill with evidence and evaluation
    skill = SkillModel(
        credential_id=cred.id,
        canonical_skill="Python",
        detected_term="Python",
        category="Programming Language"
    )
    db_session.add(skill)
    await db_session.flush()

    evidence = SkillEvidenceModel(
        skill_id=skill.id,
        evidence_text="Awarded for proficiency in Python",
        page_number=1,
        char_start=25,
        char_end=31,
        confidence_weight=1.0
    )
    evaluation = SkillEvaluationModel(
        skill_id=skill.id,
        competency_score=80,
        confidence_score=95,
        competency_reasons=["Explicit proficiency certificate citation"],
        confidence_reasons=["Exact lexical match with high OCR confidence"]
    )
    db_session.add_all([evidence, evaluation])
    await db_session.commit()

    # Query back and assert relationships
    query = await db_session.execute(
        select(CredentialModel).where(CredentialModel.credential_id == "CRD-REL-002")
    )
    retrieved = query.scalar_one()
    assert retrieved.extraction is not None
    assert retrieved.extraction.extraction_method == "HYBRID"
    assert len(retrieved.pages) == 1
    assert retrieved.metadata_record.author == "University Registrar"
    assert retrieved.risk_assessment.risk_score == 15
    assert len(retrieved.risk_assessment.signals) == 1
    assert retrieved.blockchain_record.block_number == 1001
    assert len(retrieved.skills) == 1
    assert retrieved.skills[0].canonical_skill == "Python"
    assert retrieved.skills[0].evidence.char_start == 25
    assert retrieved.skills[0].evaluation.competency_score == 80
