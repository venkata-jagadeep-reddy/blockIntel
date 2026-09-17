from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict
from blockintel.domain.enums import ExtractionMethod, CredentialStatus

class TextBlockDto(BaseModel):
    text: str
    bbox: List[float]
    block_num: int
    confidence: Optional[float] = None

class ExtractedPageDto(BaseModel):
    page_number: int
    page_text: str
    ocr_confidence: Optional[float] = None
    blocks: Optional[List[Any]] = None

    model_config = ConfigDict(from_attributes=True)

class DocumentProcessingResponse(BaseModel):
    credential_id: str
    extraction_method: ExtractionMethod
    text_available: bool
    total_pages: int
    average_ocr_confidence: Optional[float] = None
    extracted_text_preview: str
    extracted_at: datetime
    status: CredentialStatus
    full_text: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class DocumentDetailResponse(BaseModel):
    credential_id: str
    extraction_method: ExtractionMethod
    text_available: bool
    total_pages: int
    average_ocr_confidence: Optional[float] = None
    full_raw_text: str
    pages: List[ExtractedPageDto]
    extracted_at: datetime

    model_config = ConfigDict(from_attributes=True)
