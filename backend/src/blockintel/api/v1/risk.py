from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from blockintel.api.deps import get_db, require_admin
from blockintel.domain.enums import Severity
from blockintel.domain.risk import RiskAssessmentResponse, RiskSignalDto
from blockintel.services.risk_service import AuthenticityRiskService

router = APIRouter(prefix="/credentials", tags=["Authenticity Risk"])
service = AuthenticityRiskService()


def response_for(credential_id: str, assessment) -> RiskAssessmentResponse:
    return RiskAssessmentResponse(
        credential_id=credential_id,
        risk_score=assessment.risk_score,
        risk_level=assessment.risk_level,
        signals=[RiskSignalDto(
            signal_type=signal.signal_type,
            severity=Severity(signal.severity),
            description=signal.description,
            metadata=signal.signal_metadata,
        ) for signal in assessment.signals],
        explanations=assessment.summary_explanations,
        assessed_at=assessment.assessed_at,
    )


@router.post("/{credential_id}/risk", response_model=RiskAssessmentResponse, summary="Assess credential risk [Admin Only]")
async def assess_risk(
    credential_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    return response_for(credential_id, await service.assess_credential(credential_id, db))


@router.get("/{credential_id}/risk", response_model=RiskAssessmentResponse, summary="Get credential risk [Admin Only]")
async def get_risk(
    credential_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    return response_for(credential_id, await service.get_assessment(credential_id, db))
