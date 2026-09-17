from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict

class FontSummaryDto(BaseModel):
    name: str
    type: Optional[str] = None
    sizes: List[float] = []
    page: int

class ImageObjectDto(BaseModel):
    xref: int
    page: int
    width: int
    height: int
    colorspace: str
    extension: str

class StructuralInfoDto(BaseModel):
    page_count: int
    total_text_blocks: int
    total_images: int
    total_drawings: int
    fonts: List[FontSummaryDto] = []
    headings: List[Dict[str, Any]] = []
    embedded_images: List[ImageObjectDto] = []
    page_dimensions: List[Dict[str, float]] = []

class MetadataDto(BaseModel):
    author: Optional[str] = None
    producer: Optional[str] = None
    creator: Optional[str] = None
    creation_date: Optional[datetime] = None
    modification_date: Optional[datetime] = None
    raw_metadata: Dict[str, Any] = {}
    structural_info: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)

class MetadataResponse(BaseModel):
    credential_id: str
    metadata: MetadataDto
    extracted_at: datetime

    model_config = ConfigDict(from_attributes=True)
