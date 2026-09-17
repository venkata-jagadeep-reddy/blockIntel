from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from blockintel.api.deps import get_db
from blockintel.domain.blockchain import BlockchainRegistrationResponse, IntegrityVerificationResponse
from blockintel.services.blockchain_service import BlockchainService

router = APIRouter(prefix="/credentials", tags=["Artifact Integrity"])
service = BlockchainService()


@router.post("/{credential_id}/register", response_model=BlockchainRegistrationResponse)
async def register_credential_hash(credential_id: str, db: AsyncSession = Depends(get_db)):
    record = await service.register_hash(credential_id, db)
    credential = await service.get_credential(credential_id, db)
    return BlockchainRegistrationResponse(
        credential_id=credential_id, artifact_hash=credential.sha256_hash, registered=True,
        contract_address=record.contract_address, transaction_hash=record.transaction_hash,
        block_number=record.block_number, network_id=record.network_id, registered_at=record.registered_at,
    )


@router.get("/{credential_id}/registration", response_model=BlockchainRegistrationResponse)
async def get_registration(credential_id: str, db: AsyncSession = Depends(get_db)):
    credential = await service.get_credential(credential_id, db)
    record = await service.get_record(credential_id, db)
    return BlockchainRegistrationResponse(
        credential_id=credential_id, artifact_hash=credential.sha256_hash, registered=record is not None,
        contract_address=record.contract_address if record else None,
        transaction_hash=record.transaction_hash if record else None,
        block_number=record.block_number if record else None, network_id=record.network_id if record else None,
        registered_at=record.registered_at if record else None,
    )


@router.post("/{credential_id}/verify", response_model=IntegrityVerificationResponse)
async def verify_credential_file(
    credential_id: str,
    file: UploadFile = File(..., description="Credential file to compare to the registered original bytes"),
    db: AsyncSession = Depends(get_db),
):
    submitted_hash, registered_hash, hash_match, integrity_status = await service.verify_hash(credential_id, await file.read(), db)
    return IntegrityVerificationResponse(
        credential_id=credential_id, submitted_hash=submitted_hash, registered_hash=registered_hash,
        hash_match=hash_match, integrity_status=integrity_status,
        message=("Submitted file exactly matches the registered artifact." if hash_match else
                 "Submitted file does not match the registered artifact." if registered_hash else
                 "No artifact hash has been registered for this credential."),
        verified_at=datetime.now(timezone.utc),
    )
