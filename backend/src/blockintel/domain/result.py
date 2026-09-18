from pydantic import BaseModel

from blockintel.domain.blockchain import BlockchainRegistrationResponse, IntegritySummaryDto
from blockintel.domain.credential import CredentialDetailResponse
from blockintel.domain.document import DocumentProcessingResponse
from blockintel.domain.metadata import MetadataDto
from blockintel.domain.risk import RiskAssessmentResponse
from blockintel.domain.skill import SkillProfileDto


class CredentialIntelligenceResponse(BaseModel):
    """The complete, Phase 1-only view of one credential."""

    credential: CredentialDetailResponse
    document_processing: DocumentProcessingResponse
    authenticity_risk: RiskAssessmentResponse
    integrity: IntegritySummaryDto
    skills: list[SkillProfileDto]
    metadata: MetadataDto | None = None
    blockchain_registration: BlockchainRegistrationResponse | None = None
