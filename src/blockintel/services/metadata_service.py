import io
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import pymupdf
from PIL import Image, ExifTags
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from blockintel.core.logging import logger
from blockintel.core.exceptions import ProcessingFailedError, CredentialNotFoundError
from blockintel.domain.enums import FileType
from blockintel.infrastructure.storage.local_vault import LocalVaultStorage
from blockintel.infrastructure.database.models import CredentialModel, MetadataRecordModel

def parse_pdf_date(date_str: Optional[str]) -> Optional[datetime]:
    """
    Converts PDF date string format (e.g. 'D:YYYYMMDDHHmmSSOHH'mm'') into a UTC datetime.
    """
    if not date_str or not isinstance(date_str, str):
        return None
    cleaned = date_str.replace("D:", "").strip()
    match = re.match(r"^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?", cleaned)
    if not match:
        return None
    try:
        parts = [int(p) if p else 0 for p in match.groups()]
        year, month, day, hour, minute, second = parts
        month = max(1, min(12, month))
        day = max(1, min(31, day))
        return datetime(year, month, day, hour, minute, second, tzinfo=timezone.utc)
    except Exception:
        return None

class MetadataStructuralService:
    def __init__(self, vault_storage: Optional[LocalVaultStorage] = None):
        self.vault = vault_storage or LocalVaultStorage()

    async def extract_metadata_and_structure(
        self,
        credential_id: str,
        db: AsyncSession
    ) -> MetadataRecordModel:
        """
        Executes Objective 1C (Metadata) & 1D (Structural Extraction).
        Extracts author, producer, creator, creation/mod dates, fonts,
        embedded images, vector drawings, text blocks, and headings.
        """
        query = await db.execute(
            select(CredentialModel).where(CredentialModel.credential_id == credential_id)
        )
        cred = query.scalar_one_or_none()
        if not cred:
            raise CredentialNotFoundError(f"Credential '{credential_id}' not found.")

        # If already extracted, return existing record
        if cred.metadata_record:
            return cred.metadata_record

        # Read unaltered bytes from vault
        storage_path = Path(cred.storage_path)
        content = self.vault.read_file(storage_path.name)

        author: Optional[str] = None
        producer: Optional[str] = None
        creator: Optional[str] = None
        creation_date: Optional[datetime] = None
        modification_date: Optional[datetime] = None
        raw_metadata: Dict[str, Any] = {}
        structural_info: Dict[str, Any] = {}

        try:
            if cred.file_type == FileType.PDF.value:
                doc = pymupdf.open(stream=content, filetype="pdf")
                raw_metadata = doc.metadata or {}
                
                author = raw_metadata.get("author") or None
                producer = raw_metadata.get("producer") or None
                creator = raw_metadata.get("creator") or None
                creation_date = parse_pdf_date(raw_metadata.get("creationDate"))
                modification_date = parse_pdf_date(raw_metadata.get("modDate"))

                fonts_list: List[Dict[str, Any]] = []
                embedded_images: List[Dict[str, Any]] = []
                page_dimensions: List[Dict[str, float]] = []
                headings: List[Dict[str, Any]] = []
                total_blocks = 0
                total_drawings = 0

                for page_idx in range(len(doc)):
                    page = doc[page_idx]
                    page_num = page_idx + 1
                    rect = page.rect
                    page_dimensions.append({
                        "page": page_num,
                        "width": round(rect.width, 1),
                        "height": round(rect.height, 1),
                        "orientation": "Portrait" if rect.height >= rect.width else "Landscape"
                    })

                    # Fonts
                    for f in page.get_fonts(full=True):
                        fonts_list.append({
                            "xref": f[0],
                            "name": f[3],
                            "type": f[2],
                            "encoding": f[5],
                            "page": page_num,
                            "sizes": []
                        })

                    # Embedded Images
                    for img in page.get_images(full=True):
                        img_xref = img[0]
                        img_ext = "png"
                        try:
                            extracted_img = doc.extract_image(img_xref)
                            if extracted_img and "ext" in extracted_img:
                                img_ext = str(extracted_img["ext"]).lower()
                        except Exception:
                            img_ext = "png"
                        embedded_images.append({
                            "xref": img_xref,
                            "page": page_num,
                            "width": img[2],
                            "height": img[3],
                            "colorspace": str(img[5]),
                            "extension": img_ext
                        })

                    # Drawings
                    drawings = page.get_drawings()
                    total_drawings += len(drawings)

                    # Text blocks and headings analysis
                    font_sizes_map: Dict[str, set] = {}
                    all_spans: List[Dict[str, Any]] = []

                    text_dict = page.get_text("dict")
                    for block in text_dict.get("blocks", []):
                        if "lines" in block:
                            total_blocks += 1
                            for line in block["lines"]:
                                for span in line.get("spans", []):
                                    text = span.get("text", "").strip()
                                    size = round(span.get("size", 10.0), 1)
                                    font_name = span.get("font", "Unknown")
                                    if font_name not in font_sizes_map:
                                        font_sizes_map[font_name] = set()
                                    font_sizes_map[font_name].add(size)
                                    if text:
                                        all_spans.append({
                                            "text": text,
                                            "size": size,
                                            "font": font_name,
                                            "page": page_num,
                                            "bbox": span.get("bbox")
                                        })

                    # Prominent headings: text with bold styling or largest sizes in document
                    if all_spans:
                        max_size = max(s["size"] for s in all_spans)
                        for s in all_spans:
                            is_bold = any(w in s["font"].lower() for w in ("bold", "black", "heavy", "medium", "semibold"))
                            is_max_size = (s["size"] == max_size and max_size >= 10.0)
                            is_large = s["size"] >= 13.0
                            if (is_bold or is_max_size or is_large) and len(s["text"].strip()) > 3:
                                # Avoid duplicating exact same line
                                if not any(h["text"] == s["text"] for h in headings):
                                    headings.append(s)
                                if len(headings) >= 15:
                                    break

                    # Update font sizes
                    for f in fonts_list:
                        fname = f.get("name", "")
                        matched: List[float] = []
                        for k, v in font_sizes_map.items():
                            if k in fname or fname in k:
                                matched.extend(list(v))
                        if matched:
                            f["sizes"] = sorted(list(set(matched)))

                doc.close()

                structural_info = {
                    "page_count": len(page_dimensions),
                    "page_dimensions": page_dimensions,
                    "total_text_blocks": total_blocks,
                    "total_images": len(embedded_images),
                    "total_drawings": total_drawings,
                    "fonts": fonts_list,
                    "embedded_images": embedded_images,
                    "headings": headings
                }

            elif cred.file_type in (FileType.PNG.value, FileType.JPEG.value):
                img = Image.open(io.BytesIO(content))
                width, height = img.size
                aspect_ratio = "Portrait" if height >= width else "Landscape"

                raw_metadata = {
                    "format": img.format,
                    "mode": img.mode,
                    "size": [width, height],
                    "aspect_ratio": aspect_ratio,
                    "info": {k: str(v) for k, v in img.info.items() if not isinstance(v, (bytes, bytearray))}
                }

                # Extract EXIF if available
                exif_data = {}
                try:
                    exif_raw = img.getexif()
                    if exif_raw:
                        for tag_id, value in exif_raw.items():
                            tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                            if not isinstance(value, (bytes, bytearray)):
                                exif_data[tag_name] = str(value)
                        raw_metadata["exif"] = exif_data
                        
                        # Check EXIF software / date
                        if "Software" in exif_data:
                            producer = exif_data["Software"]
                        if "DateTime" in exif_data:
                            creation_date = parse_pdf_date(exif_data["DateTime"].replace(":", ""))
                except Exception as ex:
                    logger.debug(f"EXIF parsing skipped: {ex}")

                structural_info = {
                    "page_count": 1,
                    "page_dimensions": [{
                        "page": 1,
                        "width": float(width),
                        "height": float(height),
                        "orientation": aspect_ratio
                    }],
                    "total_text_blocks": 1,
                    "total_images": 1,
                    "total_drawings": 0,
                    "fonts": [],
                    "embedded_images": [{
                        "xref": 1,
                        "page": 1,
                        "width": width,
                        "height": height,
                        "colorspace": img.mode,
                        "extension": (img.format or "PNG").lower()
                    }],
                    "headings": []
                }

            record = MetadataRecordModel(
                credential_id=cred.id,
                author=author,
                producer=producer,
                creator=creator,
                creation_date=creation_date,
                modification_date=modification_date,
                raw_metadata=raw_metadata,
                structural_info=structural_info
            )
            db.add(record)
            await db.commit()
            await db.refresh(record)
            logger.info(f"Metadata and structural record created for credential '{credential_id}'.")
            return record

        except Exception as e:
            logger.error(f"Metadata extraction failed for '{credential_id}': {e}", exc_info=True)
            if isinstance(e, ProcessingFailedError):
                raise
            raise ProcessingFailedError(f"Metadata and structural extraction failed: {str(e)}")

    async def get_metadata(self, credential_id: str, db: AsyncSession) -> MetadataRecordModel:
        query = await db.execute(
            select(CredentialModel).where(CredentialModel.credential_id == credential_id)
        )
        cred = query.scalar_one_or_none()
        if not cred:
            raise CredentialNotFoundError(f"Credential '{credential_id}' not found.")
        if not cred.metadata_record:
            return await self.extract_metadata_and_structure(credential_id, db)
        return cred.metadata_record

