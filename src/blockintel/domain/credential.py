from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from blockintel.domain.enums import CredentialStatus, FileType

class CredentialBase(BaseModel):
    credential_id: str
    original_filename: str
    file_type: FileType
    mime_type: str
    file_size_bytes: int
    sha256_hash: str
    status: CredentialStatus

class CredentialUploadResponse(CredentialBase):
    id: str
    created_at: datetime
    is_duplicate: bool = False
    message: str = "Credential uploaded and securely stored successfully."

    model_config = ConfigDict(from_attributes=True)

class CredentialDetailResponse(CredentialBase):
    id: str
    storage_path: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CredentialListResponse(BaseModel):
    total: int
    items: list[CredentialDetailResponse]
