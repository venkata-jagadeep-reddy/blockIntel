from fastapi import APIRouter, Depends, File, UploadFile, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from blockintel.api.deps import get_db, require_admin
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
    summary="Upload and validate a credential (PDF, PNG, JPEG) [Admin Only]"
)
async def upload_credential(
    file: UploadFile = File(..., description="Digital credential file (PDF, PNG, or JPEG)"),
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
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
    summary="Retrieve credential details by credential ID [Admin Only]"
)
async def get_credential(
    credential_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    cred = await ingestion_service.get_credential(credential_id, db)
    return CredentialDetailResponse.model_validate(cred)

@router.get(
    "/{credential_id}/file",
    summary="Stream raw credential artifact bytes for in-browser visual preview [Admin Only]"
)
async def get_credential_file(
    credential_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    from pathlib import Path
    from fastapi import Response
    from blockintel.infrastructure.storage.local_vault import LocalVaultStorage

    cred = await ingestion_service.get_credential(credential_id, db)
    vault = LocalVaultStorage()
    file_bytes = vault.read_file(Path(cred.storage_path).name)
    return Response(
        content=file_bytes,
        media_type=cred.mime_type,
        headers={"Content-Disposition": f"inline; filename=\"{cred.original_filename}\""}
    )


@router.get(
    "",
    response_model=CredentialListResponse,
    summary="List all ingested credentials [Admin Only]"
)
async def list_credentials(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    total, items = await ingestion_service.list_credentials(db, skip=skip, limit=limit)
    return CredentialListResponse(
        total=total,
        items=[CredentialDetailResponse.model_validate(item) for item in items]
    )


@router.delete(
    "/{credential_id}",
    summary="Delete a credential and its associated intelligence and vault files [Admin Only]"
)
async def delete_credential(
    credential_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    await ingestion_service.delete_credential(credential_id, db)
    return {
        "status": "deleted",
        "credential_id": credential_id,
        "message": f"Credential '{credential_id}' and all associated records deleted successfully."
    }
