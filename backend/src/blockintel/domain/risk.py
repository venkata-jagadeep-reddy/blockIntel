from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from blockintel.domain.enums import RiskLevel, Severity


class RiskSignalDto(BaseModel):
    signal_type: str
    severity: Severity
    description: str
    metadata: dict[str, Any] | None = None


class RiskAssessmentResponse(BaseModel):
    credential_id: str
    risk_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    signals: list[RiskSignalDto] = Field(default_factory=list)
    explanations: list[str] = Field(default_factory=list)
    assessed_at: datetime

    model_config = ConfigDict(from_attributes=True)
