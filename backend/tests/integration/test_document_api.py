import pytest
import io
import pymupdf
from blockintel.domain.enums import CredentialStatus

def make_test_pdf() -> bytes:
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 100), "BlockIntel Full Stack Certificate: React, Python, PostgreSQL.")
    b = doc.tobytes()
    doc.close()
    return b

@pytest.mark.asyncio
async def test_process_document_end_to_end_api(async_client):
    pdf_bytes = make_test_pdf()
    files = {"file": ("fs_cert.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    
    # 1. Upload
    up_res = await async_client.post("/api/v1/credentials/upload", files=files)
    assert up_res.status_code == 201
    cred_id = up_res.json()["credential_id"]

    # 2. Process
    proc_res = await async_client.post(f"/api/v1/credentials/{cred_id}/process")
    assert proc_res.status_code == 200
    proc_data = proc_res.json()
    assert proc_data["credential_id"] == cred_id
    assert proc_data["status"] == CredentialStatus.PROCESSED.value
    assert proc_data["text_available"] is True
    assert proc_data["extraction_method"] == "NATIVE"

    # 3. Retrieve Extraction Details
    ext_res = await async_client.get(f"/api/v1/credentials/{cred_id}/extraction")
    assert ext_res.status_code == 200
    ext_data = ext_res.json()
    assert ext_data["total_pages"] == 1
    assert "React" in ext_data["full_raw_text"]
    assert len(ext_data["pages"]) == 1
    assert "React" in ext_data["pages"][0]["page_text"]
