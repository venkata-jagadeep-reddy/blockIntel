"""Single endpoint that safely orchestrates the complete Phase 1 workflow."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from blockintel.api.deps import get_db
from blockintel.api.v1.risk import response_for as risk_response
from blockintel.api.v1.skills import profile as skill_profile
from blockintel.domain.blockchain import BlockchainRegistrationResponse, IntegritySummaryDto
from blockintel.domain.credential import CredentialDetailResponse
from blockintel.domain.document import DocumentProcessingResponse
from blockintel.domain.enums import CredentialStatus, IntegrityStatus
from blockintel.domain.metadata import MetadataDto
from blockintel.domain.result import CredentialIntelligenceResponse
from blockintel.services.blockchain_service import BlockchainService
from blockintel.services.document_service import DocumentProcessorService
from blockintel.services.ingestion_service import IngestionService
from blockintel.services.metadata_service import MetadataStructuralService
from blockintel.services.risk_service import AuthenticityRiskService
from blockintel.services.skill_service import SkillIntelligenceService

router = APIRouter(prefix="/credentials", tags=["Phase 1 Intelligence Result"])
ingestion = IngestionService()
documents = DocumentProcessorService()
metadata = MetadataStructuralService()
risk = AuthenticityRiskService()
blockchain = BlockchainService()
skills = SkillIntelligenceService()


@router.post("/{credential_id}/complete", response_model=CredentialIntelligenceResponse)
async def complete_phase_one(credential_id: str, db: AsyncSession = Depends(get_db)):
    credential = await ingestion.get_credential(credential_id, db)
    await db.refresh(credential, ["extraction", "metadata_record", "blockchain_record"])
    extraction = credential.extraction or await documents.process_credential(credential_id, db)
    credential = await ingestion.get_credential(credential_id, db)
    await db.refresh(credential, ["metadata_record", "blockchain_record"])
    if credential.metadata_record is None:
        await metadata.extract_metadata_and_structure(credential_id, db)
    assessment = await risk.assess_credential(credential_id, db)
    await blockchain.register_hash(credential_id, db)
    _, _, matches, integrity_status = await blockchain.verify_stored_artifact(credential_id, db)
    extracted_skills = await skills.extract_and_evaluate(credential_id, db)
    credential = await ingestion.get_credential(credential_id, db)
    await db.refresh(credential, ["metadata_record", "blockchain_record"])

    meta_dto = None
    if credential.metadata_record:
        meta_dto = MetadataDto(
            author=credential.metadata_record.author,
            producer=credential.metadata_record.producer,
            creator=credential.metadata_record.creator,
            creation_date=credential.metadata_record.creation_date,
            modification_date=credential.metadata_record.modification_date,
            raw_metadata=credential.metadata_record.raw_metadata or {},
            structural_info=credential.metadata_record.structural_info or {},
        )

    blockchain_dto = None
    if credential.blockchain_record:
        blockchain_dto = BlockchainRegistrationResponse(
            credential_id=credential_id,
            artifact_hash=credential.sha256_hash,
            registered=True,
            contract_address=credential.blockchain_record.contract_address,
            transaction_hash=credential.blockchain_record.transaction_hash,
            block_number=credential.blockchain_record.block_number,
            network_id=credential.blockchain_record.network_id,
            registered_at=credential.blockchain_record.registered_at,
        )

    return CredentialIntelligenceResponse(
        credential=CredentialDetailResponse.model_validate(credential),
        document_processing=DocumentProcessingResponse(
            credential_id=credential_id, extraction_method=extraction.extraction_method,
            text_available=extraction.text_available, total_pages=extraction.total_pages,
            average_ocr_confidence=extraction.average_ocr_confidence,
            extracted_text_preview=(extraction.full_raw_text[:200] + "..." if len(extraction.full_raw_text) > 200 else extraction.full_raw_text),
            extracted_at=extraction.extracted_at, status=CredentialStatus.PROCESSED,
            full_text=extraction.full_raw_text,
        ),
        authenticity_risk=risk_response(credential_id, assessment),
        integrity=IntegritySummaryDto(
            hash=credential.sha256_hash, blockchain_registered=credential.blockchain_record is not None,
            integrity_status=IntegrityStatus.MATCH if matches else integrity_status,
        ),
        skills=[skill_profile(skill) for skill in extracted_skills],
        metadata=meta_dto,
        blockchain_registration=blockchain_dto,
    )
