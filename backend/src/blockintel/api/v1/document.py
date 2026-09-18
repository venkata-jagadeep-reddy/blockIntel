from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from blockintel.api.deps import get_db, require_admin
from blockintel.services.document_service import DocumentProcessorService
from blockintel.infrastructure.database.models import ExtractedPageModel
from blockintel.domain.document import (
    DocumentProcessingResponse, DocumentDetailResponse, ExtractedPageDto
)
from blockintel.domain.enums import CredentialStatus

router = APIRouter(prefix="/credentials", tags=["Document Processing"])
doc_service = DocumentProcessorService()

@router.post(
    "/{credential_id}/process",
    response_model=DocumentProcessingResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger text extraction and OCR for an uploaded credential [Admin Only]"
)
async def process_credential_document(
    credential_id: str,
    force_ocr: bool = Query(False, description="Force OCR even if native text is present"),
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    extraction = await doc_service.process_credential(
        credential_id=credential_id,
        db=db,
        force_ocr=force_ocr
    )
    preview = extraction.full_raw_text[:200] + "..." if len(extraction.full_raw_text) > 200 else extraction.full_raw_text
    return DocumentProcessingResponse(
        credential_id=credential_id,
        extraction_method=extraction.extraction_method,
        text_available=extraction.text_available,
        total_pages=extraction.total_pages,
        average_ocr_confidence=extraction.average_ocr_confidence,
        extracted_text_preview=preview,
        extracted_at=extraction.extracted_at,
        status=CredentialStatus.PROCESSED
    )

@router.get(
    "/{credential_id}/extraction",
    response_model=DocumentDetailResponse,
    summary="Get full extracted text, pages, and OCR confidences [Admin Only]"
)
async def get_credential_extraction(
    credential_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    extraction = await doc_service.get_extraction(credential_id, db)
    
    # Query extracted pages directly for high efficiency and async safety
    pages_query = await db.execute(
        select(ExtractedPageModel)
        .where(ExtractedPageModel.credential_id == extraction.credential_id)
        .order_by(ExtractedPageModel.page_number)
    )
    pages_records = pages_query.scalars().all()
    
    pages = [
        ExtractedPageDto(
            page_number=p.page_number,
            page_text=p.page_text,
            ocr_confidence=p.ocr_confidence,
            blocks=p.blocks
        )
        for p in pages_records
    ]
    return DocumentDetailResponse(
        credential_id=credential_id,
        extraction_method=extraction.extraction_method,
        text_available=extraction.text_available,
        total_pages=extraction.total_pages,
        average_ocr_confidence=extraction.average_ocr_confidence,
        full_raw_text=extraction.full_raw_text,
        pages=pages,
        extracted_at=extraction.extracted_at
    )
