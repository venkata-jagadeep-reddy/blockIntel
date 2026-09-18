import pytest
import pymupdf
import io
from PIL import Image, ImageDraw
from blockintel.services.document_service import DocumentProcessorService
from blockintel.services.ingestion_service import IngestionService
from blockintel.domain.enums import ExtractionMethod, CredentialStatus
from blockintel.core.exceptions import ProcessingFailedError

def create_sample_native_pdf() -> bytes:
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), "BlockIntel Professional Certification in React and Node.js.")
    page.insert_text((50, 120), "Recipient has demonstrated proficiency in Full Stack Architecture.")
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def create_sample_scanned_pdf() -> bytes:
    # Create an image containing text
    img = Image.new("RGB", (600, 200), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((40, 80), "Scanned Diploma: React and Python Expertise", fill=(0, 0, 0))
    img_buf = io.BytesIO()
    img.save(img_buf, format="PNG")
    
    # Put image on PDF page without adding text layer
    doc = pymupdf.open()
    page = doc.new_page(width=600, height=200)
    page.insert_image(page.rect, stream=img_buf.getvalue())
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def create_sample_png() -> bytes:
    img = Image.new("RGB", (600, 150), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((30, 50), "Certificate of Competence in Cloud Security", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

@pytest.mark.asyncio
async def test_native_pdf_processing(db_session):
    ingest_svc = IngestionService()
    doc_svc = DocumentProcessorService()

    pdf_bytes = create_sample_native_pdf()
    cred, _ = await ingest_svc.ingest_credential(pdf_bytes, "native_cert.pdf", db_session)

    extraction = await doc_svc.process_credential(cred.credential_id, db_session)
    assert extraction.extraction_method == ExtractionMethod.NATIVE.value
    assert extraction.text_available is True
    assert "React" in extraction.full_raw_text
    assert extraction.total_pages == 1
    assert extraction.average_ocr_confidence == 1.0

    await db_session.refresh(cred)
    assert cred.status == CredentialStatus.PROCESSED.value

@pytest.mark.asyncio
async def test_scanned_pdf_fallback_to_ocr(db_session):
    ingest_svc = IngestionService()
    doc_svc = DocumentProcessorService()

    scanned_pdf = create_sample_scanned_pdf()
    cred, _ = await ingest_svc.ingest_credential(scanned_pdf, "scanned_diploma.pdf", db_session)

    extraction = await doc_svc.process_credential(cred.credential_id, db_session)
    # Since native text is empty, it triggers OCR fallback
    assert extraction.extraction_method in (ExtractionMethod.OCR.value, ExtractionMethod.HYBRID.value)
    assert extraction.text_available is True
    assert "React" in extraction.full_raw_text or "Diploma" in extraction.full_raw_text or "Expertise" in extraction.full_raw_text
    assert extraction.average_ocr_confidence is not None

@pytest.mark.asyncio
async def test_image_credential_ocr_processing(db_session):
    ingest_svc = IngestionService()
    doc_svc = DocumentProcessorService()

    png_bytes = create_sample_png()
    cred, _ = await ingest_svc.ingest_credential(png_bytes, "badge.png", db_session)

    extraction = await doc_svc.process_credential(cred.credential_id, db_session)
    assert extraction.extraction_method == ExtractionMethod.OCR.value
    assert extraction.text_available is True
    assert "Certificate" in extraction.full_raw_text or "Cloud" in extraction.full_raw_text
    assert extraction.average_ocr_confidence is not None

@pytest.mark.asyncio
async def test_corrupted_pdf_handling(db_session):
    ingest_svc = IngestionService()
    doc_svc = DocumentProcessorService()

    # Corrupt PDF that starts with magic bytes but contains broken structure
    corrupt_bytes = b"%PDF-1.4\ncorrupt content without xref or root"
    cred, _ = await ingest_svc.ingest_credential(corrupt_bytes, "corrupt.pdf", db_session)

    with pytest.raises(ProcessingFailedError):
        await doc_svc.process_credential(cred.credential_id, db_session)

    await db_session.refresh(cred)
    assert cred.status == CredentialStatus.FAILED.value
