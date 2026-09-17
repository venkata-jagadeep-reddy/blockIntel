from datetime import datetime, timezone

import pytest
import pymupdf

from blockintel.domain.enums import RiskLevel
from blockintel.infrastructure.database.models import MetadataRecordModel
from blockintel.services.document_service import DocumentProcessorService
from blockintel.services.ingestion_service import IngestionService
from blockintel.services.risk_service import AuthenticityRiskService


def pdf_with_text(text: str) -> bytes:
    doc = pymupdf.open()
    doc.new_page().insert_text((50, 72), text)
    value = doc.tobytes()
    doc.close()
    return value


@pytest.mark.asyncio
async def test_clean_document_has_low_risk_and_no_verdict(db_session):
    credential, _ = await IngestionService().ingest_credential(
        pdf_with_text("Certificate issued after completing Python programming training."), "clean.pdf", db_session
    )
    await DocumentProcessorService().process_credential(credential.credential_id, db_session)
    assessment = await AuthenticityRiskService().assess_credential(credential.credential_id, db_session)
    assert assessment.risk_level == RiskLevel.LOW.value
    assert assessment.risk_score == 0
    assert "not proof" in assessment.summary_explanations[0]


@pytest.mark.asyncio
async def test_conflicting_metadata_is_explainable_risk_signal(db_session):
    credential, _ = await IngestionService().ingest_credential(
        pdf_with_text("Credential for completed React course."), "metadata.pdf", db_session
    )
    await DocumentProcessorService().process_credential(credential.credential_id, db_session)
    db_session.add(MetadataRecordModel(
        credential_id=credential.id,
        creation_date=datetime(2026, 2, 1, tzinfo=timezone.utc),
        modification_date=datetime(2025, 1, 1, tzinfo=timezone.utc),
        producer="Adobe Photoshop",
        structural_info={},
    ))
    await db_session.commit()
    assessment = await AuthenticityRiskService().assess_credential(credential.credential_id, db_session)
    types = {signal.signal_type for signal in assessment.signals}
    assert "metadata_date_conflict" in types
    assert "metadata_editing_tool" in types
    assert assessment.risk_score >= 55
