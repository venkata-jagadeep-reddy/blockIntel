from datetime import datetime

from pydantic import BaseModel, Field


class SkillEvidenceDto(BaseModel):
    text: str
    page_number: int
    char_start: int | None = None
    char_end: int | None = None
    source_type: str
    confidence_weight: float = Field(ge=0, le=1)


class SkillProfileDto(BaseModel):
    canonical_skill: str
    detected_term: str
    category: str | None = None
    evidence: SkillEvidenceDto
    competency_score: int = Field(ge=0, le=100)
    confidence_score: int = Field(ge=0, le=100)
    competency_reasons: list[str]
    confidence_reasons: list[str]


class SkillProfileResponse(BaseModel):
    credential_id: str
    skills: list[SkillProfileDto]
    extracted_at: datetime | None = None
