import pytest
import pymupdf

from blockintel.services.document_service import DocumentProcessorService
from blockintel.services.ingestion_service import IngestionService
from blockintel.services.skill_service import SkillIntelligenceService


def skill_pdf() -> bytes:
    doc = pymupdf.open()
    doc.new_page(width=1200).insert_text(
        (50, 72),
        "Completed a Full Stack Development program covering React.js, NodeJS, Express.js and MongoDB. "
        "Built a practical project using React.js."
    )
    value = doc.tobytes()
    doc.close()
    return value


@pytest.mark.asyncio
async def test_skills_are_normalized_deduplicated_and_evidence_grounded(db_session):
    credential, _ = await IngestionService().ingest_credential(skill_pdf(), "skills.pdf", db_session)
    await DocumentProcessorService().process_credential(credential.credential_id, db_session)
    skills = await SkillIntelligenceService().extract_and_evaluate(credential.credential_id, db_session)
    by_name = {skill.canonical_skill: skill for skill in skills}
    assert set(by_name) == {"React", "Node.js", "Express.js", "MongoDB"}
    assert by_name["React"].detected_term == "React.js"
    assert "React.js" in by_name["React"].evidence.evidence_text
    assert by_name["React"].evaluation.competency_score > 45
    assert by_name["React"].evaluation.confidence_score >= 90
    assert "Django" not in by_name
