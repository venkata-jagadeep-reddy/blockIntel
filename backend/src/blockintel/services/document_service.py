import io
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional
import pymupdf
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from blockintel.config import settings
from blockintel.core.logging import logger
from blockintel.core.exceptions import ProcessingFailedError, CredentialNotFoundError
from blockintel.domain.enums import CredentialStatus, ExtractionMethod, FileType
from blockintel.infrastructure.storage.local_vault import LocalVaultStorage
from blockintel.infrastructure.ocr.tesseract_ocr import TesseractEngine
from blockintel.infrastructure.database.models import (
    CredentialModel, DocumentExtractionModel, ExtractedPageModel
)

class DocumentProcessorService:
    def __init__(
        self,
        vault_storage: Optional[LocalVaultStorage] = None,
        ocr_engine: Optional[TesseractEngine] = None
    ):
        self.vault = vault_storage or LocalVaultStorage()
        self.ocr = ocr_engine or TesseractEngine()

    async def process_credential(
        self,
        credential_id: str,
        db: AsyncSession,
        force_ocr: bool = False
    ) -> DocumentExtractionModel:
        """
        Executes Objective 1B Text Extraction:
        - For PDFs: native text first, fallback to OCR if insufficient text.
        - For Images: OCR directly.
        - Stores extracted text, page numbers, extraction method, OCR confidences.
        - Preserves original document bytes in vault.
        """
        query = await db.execute(
            select(CredentialModel).where(CredentialModel.credential_id == credential_id)
        )
        cred = query.scalar_one_or_none()
        if not cred:
            raise CredentialNotFoundError(f"Credential '{credential_id}' not found.")

        # If already processed and extraction exists, return it
        if cred.extraction:
            return cred.extraction

        # Update status to PROCESSING
        cred.status = CredentialStatus.PROCESSING.value
        await db.commit()

        try:
            # Read unaltered bytes from storage vault
            storage_path = Path(cred.storage_path)
            content = self.vault.read_file(storage_path.name)

            pages_data: List[Dict[str, Any]] = []
            total_pages = 1
            used_methods = set()
            ocr_confidences = []

            if cred.file_type == FileType.PDF.value:
                # Open PDF stream with PyMuPDF
                try:
                    doc = pymupdf.open(stream=content, filetype="pdf")
                except Exception as e:
                    raise ProcessingFailedError(f"Failed to parse PDF document structure: {str(e)}")

                total_pages = len(doc)
                if total_pages == 0:
                    raise ProcessingFailedError("PDF document contains 0 pages.")

                for page_idx in range(total_pages):
                    page = doc[page_idx]
                    page_num = page_idx + 1
                    native_text = page.get_text("text").strip()
                    native_blocks = page.get_text("blocks")

                    needs_ocr = force_ocr or (len(native_text) < settings.MIN_NATIVE_TEXT_CHARS)

                    if not needs_ocr:
                        # Usable native text present
                        used_methods.add(ExtractionMethod.NATIVE)
                        structured_blocks = [
                            {
                                "text": b[4].strip(),
                                "bbox": [b[0], b[1], b[2], b[3]],
                                "block_num": b[5],
                                "confidence": 1.0
                            }
                            for b in native_blocks if b[4].strip()
                        ]
                        pages_data.append({
                            "page_number": page_num,
                            "page_text": native_text,
                            "ocr_confidence": 1.0,
                            "blocks": structured_blocks
                        })
                        ocr_confidences.append(1.0)
                    else:
                        # Scanned PDF page -> Render to Pixmap and run OCR
                        used_methods.add(ExtractionMethod.OCR)
                        pix = page.get_pixmap(dpi=settings.OCR_DPI)
                        img_bytes = pix.tobytes("png")
                        
                        ocr_text, avg_conf, ocr_blocks = self.ocr.extract_from_image_bytes(img_bytes)
                        pages_data.append({
                            "page_number": page_num,
                            "page_text": ocr_text,
                            "ocr_confidence": avg_conf,
                            "blocks": ocr_blocks
                        })
                        ocr_confidences.append(avg_conf)

                doc.close()

            elif cred.file_type in (FileType.PNG.value, FileType.JPEG.value):
                # Pure image credential -> Tesseract OCR
                used_methods.add(ExtractionMethod.OCR)
                ocr_text, avg_conf, ocr_blocks = self.ocr.extract_from_image_bytes(content)
                pages_data.append({
                    "page_number": 1,
                    "page_text": ocr_text,
                    "ocr_confidence": avg_conf,
                    "blocks": ocr_blocks
                })
                ocr_confidences.append(avg_conf)

            else:
                raise ProcessingFailedError(f"Unsupported file type for text extraction: {cred.file_type}")

            # Determine aggregate extraction method
            if len(used_methods) == 1:
                overall_method = list(used_methods)[0]
            else:
                overall_method = ExtractionMethod.HYBRID

            full_text = "\n\n".join([p["page_text"] for p in pages_data if p["page_text"]])
            avg_ocr_conf = (
                sum(ocr_confidences) / len(ocr_confidences) if ocr_confidences else None
            )

            # Persist DocumentExtractionModel
            extraction = DocumentExtractionModel(
                credential_id=cred.id,
                extraction_method=overall_method.value,
                text_available=bool(full_text.strip()),
                average_ocr_confidence=round(avg_ocr_conf, 4) if avg_ocr_conf is not None else None,
                total_pages=total_pages,
                full_raw_text=full_text,
                layout_structure={"pages_count": total_pages, "methods": [m.value for m in used_methods]}
            )
            db.add(extraction)
            await db.flush()

            # Persist ExtractedPageModel records
            for p in pages_data:
                page_record = ExtractedPageModel(
                    credential_id=cred.id,
                    page_number=p["page_number"],
                    page_text=p["page_text"],
                    ocr_confidence=p["ocr_confidence"],
                    blocks=p["blocks"]
                )
                db.add(page_record)

            # Update credential status to PROCESSED
            cred.status = CredentialStatus.PROCESSED.value
            await db.commit()
            await db.refresh(extraction)
            logger.info(f"Credential '{credential_id}' processed successfully using {overall_method.value}.")
            return extraction

        except Exception as e:
            cred.status = CredentialStatus.FAILED.value
            await db.commit()
            logger.error(f"Processing failed for credential '{credential_id}': {e}", exc_info=True)
            if isinstance(e, ProcessingFailedError):
                raise
            raise ProcessingFailedError(f"Document processing failed: {str(e)}")

    async def get_extraction(self, credential_id: str, db: AsyncSession) -> DocumentExtractionModel:
        query = await db.execute(
            select(CredentialModel).where(CredentialModel.credential_id == credential_id)
        )
        cred = query.scalar_one_or_none()
        if not cred:
            raise CredentialNotFoundError(f"Credential '{credential_id}' not found.")
        if not cred.extraction:
            raise ProcessingFailedError(f"Credential '{credential_id}' has not been processed yet.")
        return cred.extraction
