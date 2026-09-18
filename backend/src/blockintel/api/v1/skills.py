from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from blockintel.api.deps import get_db, require_admin
from blockintel.domain.skill import SkillEvidenceDto, SkillProfileDto, SkillProfileResponse
from blockintel.services.skill_service import SkillIntelligenceService

router = APIRouter(prefix="/credentials", tags=["Skill Intelligence"])
service = SkillIntelligenceService()


def profile(skill) -> SkillProfileDto:
    return SkillProfileDto(
        canonical_skill=skill.canonical_skill, detected_term=skill.detected_term, category=skill.category,
        evidence=SkillEvidenceDto(
            text=skill.evidence.evidence_text, page_number=skill.evidence.page_number,
            char_start=skill.evidence.char_start, char_end=skill.evidence.char_end,
            source_type=skill.evidence.source_type, confidence_weight=skill.evidence.confidence_weight,
        ),
        competency_score=skill.evaluation.competency_score, confidence_score=skill.evaluation.confidence_score,
        competency_reasons=skill.evaluation.competency_reasons,
        confidence_reasons=skill.evaluation.confidence_reasons,
    )


@router.post("/{credential_id}/skills", response_model=SkillProfileResponse, summary="Extract skills [Admin Only]")
async def extract_skills(
    credential_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    skills = await service.extract_and_evaluate(credential_id, db)
    return SkillProfileResponse(credential_id=credential_id, skills=[profile(skill) for skill in skills])


@router.get("/{credential_id}/skills", response_model=SkillProfileResponse, summary="Get skills [Admin Only]")
async def get_skills(
    credential_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    skills = await service.get_skills(credential_id, db)
    return SkillProfileResponse(credential_id=credential_id, skills=[profile(skill) for skill in skills])
