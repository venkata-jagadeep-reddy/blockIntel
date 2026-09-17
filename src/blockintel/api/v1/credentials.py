from fastapi import APIRouter, Depends, File, UploadFile, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from blockintel.api.deps import get_db
from blockintel.services.ingestion_service import IngestionService
from blockintel.domain.credential import (
    CredentialUploadResponse, CredentialDetailResponse, CredentialListResponse
)

router = APIRouter(prefix="/credentials", tags=["Credentials Ingestion"])
ingestion_service = IngestionService()

@router.post(
    "/upload",
    response_model=CredentialUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and validate a credential (PDF, PNG, JPEG)"
)
async def upload_credential(
    file: UploadFile = File(..., description="Digital credential file (PDF, PNG, or JPEG)"),
    db: AsyncSession = Depends(get_db)
):
    content = await file.read()
    cred, is_dup = await ingestion_service.ingest_credential(
        content=content,
        original_filename=file.filename or "credential",
        db=db
    )
    return CredentialUploadResponse(
        id=cred.id,
        credential_id=cred.credential_id,
        original_filename=cred.original_filename,
        file_type=cred.file_type,
        mime_type=cred.mime_type,
        file_size_bytes=cred.file_size_bytes,
        sha256_hash=cred.sha256_hash,
        status=cred.status,
        created_at=cred.created_at,
        is_duplicate=is_dup,
        message="Duplicate credential detected; returning existing record." if is_dup else "Credential uploaded and securely stored successfully."
    )

@router.get(
    "/{credential_id}",
    response_model=CredentialDetailResponse,
    summary="Retrieve credential details by credential ID"
)
async def get_credential(
    credential_id: str,
    db: AsyncSession = Depends(get_db)
):
    cred = await ingestion_service.get_credential(credential_id, db)
    return CredentialDetailResponse.model_validate(cred)

@router.get(
    "",
    response_model=CredentialListResponse,
    summary="List all ingested credentials"
)
async def list_credentials(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    total, items = await ingestion_service.list_credentials(db, skip=skip, limit=limit)
    return CredentialListResponse(
        total=total,
        items=[CredentialDetailResponse.model_validate(item) for item in items]
    )
