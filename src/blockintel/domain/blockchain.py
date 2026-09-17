from datetime import datetime

from pydantic import BaseModel, Field

from blockintel.domain.enums import IntegrityStatus


class BlockchainRegistrationResponse(BaseModel):
    credential_id: str
    algorithm: str = "SHA-256"
    artifact_hash: str
    registered: bool
    contract_address: str | None = None
    transaction_hash: str | None = None
    block_number: int | None = None
    network_id: str | None = None
    registered_at: datetime | None = None


class IntegrityVerificationResponse(BaseModel):
    credential_id: str
    submitted_hash: str
    registered_hash: str | None = None
    hash_match: bool
    integrity_status: IntegrityStatus
    message: str
    verified_at: datetime


class IntegritySummaryDto(BaseModel):
    algorithm: str = "SHA-256"
    hash: str
    blockchain_registered: bool
    integrity_status: IntegrityStatus
