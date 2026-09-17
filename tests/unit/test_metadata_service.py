import pytest
import pymupdf
import io
from PIL import Image, ImageDraw
from datetime import datetime, timezone
from blockintel.services.metadata_service import MetadataStructuralService, parse_pdf_date
from blockintel.services.ingestion_service import IngestionService

def create_pdf_with_rich_metadata() -> bytes:
    doc = pymupdf.open()
    doc.set_metadata({
        "title": "Certificate of Distinction",
        "author": "Registrar General",
        "producer": "ReportLab PDF Library v3.5",
        "creator": "Academic Credential System",
        "creationDate": "D:20250810143000Z",
        "modDate": "D:20250810150000Z"
    })
    page = doc.new_page(width=800, height=600)
    
    # Large Heading
    page.insert_text((50, 80), "CERTIFICATE OF EXCELLENCE", fontsize=18)
    # Body text
    page.insert_text((50, 140), "Presented for distinguished contributions to System Architecture.", fontsize=11)
    
    # Insert drawing (line)
    shape = page.new_shape()
    shape.draw_line(pymupdf.Point(50, 100), pymupdf.Point(750, 100))
    shape.finish()
    shape.commit()

    # Insert a small embedded image
    img = Image.new("RGB", (100, 100), color=(180, 200, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    page.insert_image(pymupdf.Rect(50, 450, 150, 550), stream=buf.getvalue())

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def test_parse_pdf_date_formats():
    d1 = parse_pdf_date("D:20250810143000Z")
    assert d1 == datetime(2025, 8, 10, 14, 30, 0, tzinfo=timezone.utc)

    d2 = parse_pdf_date("20240101")
    assert d2 == datetime(2024, 1, 1, 0, 0, 0, tzinfo=timezone.utc)

    assert parse_pdf_date("invalid_date_string") is None
    assert parse_pdf_date(None) is None

@pytest.mark.asyncio
async def test_extract_pdf_metadata_and_structure(db_session):
    ingest_svc = IngestionService()
    meta_svc = MetadataStructuralService()

    pdf_bytes = create_pdf_with_rich_metadata()
    cred, _ = await ingest_svc.ingest_credential(pdf_bytes, "cert_with_meta.pdf", db_session)

    record = await meta_svc.extract_metadata_and_structure(cred.credential_id, db_session)
    assert record.author == "Registrar General"
    assert record.producer == "ReportLab PDF Library v3.5"
    assert record.creator == "Academic Credential System"
    assert record.creation_date == datetime(2025, 8, 10, 14, 30, 0, tzinfo=timezone.utc)
    assert record.modification_date == datetime(2025, 8, 10, 15, 0, 0, tzinfo=timezone.utc)

    struct = record.structural_info
    assert struct["page_count"] == 1
    assert len(struct["page_dimensions"]) == 1
    assert struct["page_dimensions"][0]["width"] == 800.0
    assert struct["total_drawings"] >= 1
    assert struct["total_images"] >= 1
    assert len(struct["headings"]) >= 1
    assert "EXCELLENCE" in struct["headings"][0]["text"]
    assert len(struct["fonts"]) >= 1

@pytest.mark.asyncio
async def test_extract_image_metadata_and_structure(db_session):
    ingest_svc = IngestionService()
    meta_svc = MetadataStructuralService()

    img = Image.new("RGB", (640, 480), color=(240, 240, 240))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()

    cred, _ = await ingest_svc.ingest_credential(png_bytes, "diploma.png", db_session)
    record = await meta_svc.extract_metadata_and_structure(cred.credential_id, db_session)

    assert record.raw_metadata["format"] == "PNG"
    assert record.raw_metadata["size"] == [640, 480]
    assert record.structural_info["page_dimensions"][0]["width"] == 640
    assert record.structural_info["total_images"] == 1
