from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from blockintel.api.deps import get_db, require_admin
from blockintel.services.metadata_service import MetadataStructuralService
from blockintel.domain.metadata import MetadataDto, MetadataResponse

router = APIRouter(prefix="/credentials", tags=["Metadata & Structural Analysis"])
meta_service = MetadataStructuralService()

@router.post(
    "/{credential_id}/metadata",
    response_model=MetadataResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract document metadata, fonts, embedded objects, and structural layout [Admin Only]"
)
async def extract_metadata(
    credential_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    record = await meta_service.extract_metadata_and_structure(credential_id, db)
    return MetadataResponse(
        credential_id=credential_id,
        metadata=MetadataDto(
            author=record.author,
            producer=record.producer,
            creator=record.creator,
            creation_date=record.creation_date,
            modification_date=record.modification_date,
            raw_metadata=record.raw_metadata or {},
            structural_info=record.structural_info or {}
        ),
        extracted_at=datetime.now(timezone.utc)
    )

@router.get(
    "/{credential_id}/metadata",
    response_model=MetadataResponse,
    summary="Retrieve extracted metadata and structural layout [Admin Only]"
)
async def get_metadata(
    credential_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    record = await meta_service.get_metadata(credential_id, db)
    return MetadataResponse(
        credential_id=credential_id,
        metadata=MetadataDto(
            author=record.author,
            producer=record.producer,
            creator=record.creator,
            creation_date=record.creation_date,
            modification_date=record.modification_date,
            raw_metadata=record.raw_metadata or {},
            structural_info=record.structural_info or {}
        ),
        extracted_at=datetime.now(timezone.utc)
    )
