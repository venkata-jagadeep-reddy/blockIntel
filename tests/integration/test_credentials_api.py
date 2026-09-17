import pytest
import io
from blockintel.domain.enums import CredentialStatus

SAMPLE_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<< /Title (Degree Certificate) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
SAMPLE_PNG_BYTES = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"

@pytest.mark.asyncio
async def test_upload_valid_pdf(async_client):
    files = {"file": ("degree.pdf", io.BytesIO(SAMPLE_PDF_BYTES), "application/pdf")}
    response = await async_client.post("/api/v1/credentials/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["credential_id"].startswith("CRD-")
    assert data["file_type"] == "PDF"
    assert data["mime_type"] == "application/pdf"
    assert data["status"] == CredentialStatus.UPLOADED.value
    assert data["file_size_bytes"] == len(SAMPLE_PDF_BYTES)
    assert not data["is_duplicate"]
    assert len(data["sha256_hash"]) == 64

@pytest.mark.asyncio
async def test_upload_valid_png(async_client):
    files = {"file": ("cert.png", io.BytesIO(SAMPLE_PNG_BYTES), "image/png")}
    response = await async_client.post("/api/v1/credentials/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["file_type"] == "PNG"
    assert data["mime_type"] == "image/png"

@pytest.mark.asyncio
async def test_upload_duplicate_detection(async_client):
    files1 = {"file": ("degree.pdf", io.BytesIO(SAMPLE_PDF_BYTES), "application/pdf")}
    res1 = await async_client.post("/api/v1/credentials/upload", files=files1)
    assert res1.status_code == 201
    cred_id_1 = res1.json()["credential_id"]

    # Re-upload same byte payload
    files2 = {"file": ("re_uploaded_degree.pdf", io.BytesIO(SAMPLE_PDF_BYTES), "application/pdf")}
    res2 = await async_client.post("/api/v1/credentials/upload", files=files2)
    assert res2.status_code == 201
    data2 = res2.json()
    assert data2["is_duplicate"] is True
    assert data2["credential_id"] == cred_id_1
    assert "Duplicate credential detected" in data2["message"]

@pytest.mark.asyncio
async def test_reject_spoofed_file_extension(async_client):
    fake_content = b"This is a shell script or plain text."
    files = {"file": ("malicious.pdf", io.BytesIO(fake_content), "application/pdf")}
    response = await async_client.post("/api/v1/credentials/upload", files=files)
    assert response.status_code == 400
    data = response.json()
    assert data["error"] == "InvalidFileFormatError"
    assert "magic byte signature" in data["message"]

@pytest.mark.asyncio
async def test_reject_empty_file(async_client):
    files = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    response = await async_client.post("/api/v1/credentials/upload", files=files)
    assert response.status_code == 400
    assert response.json()["error"] == "FileSizeLimitExceededError"

@pytest.mark.asyncio
async def test_get_and_list_credentials(async_client):
    # Upload one credential first
    files = {"file": ("award.pdf", io.BytesIO(SAMPLE_PDF_BYTES), "application/pdf")}
    up_res = await async_client.post("/api/v1/credentials/upload", files=files)
    cred_id = up_res.json()["credential_id"]

    # Get by ID
    get_res = await async_client.get(f"/api/v1/credentials/{cred_id}")
    assert get_res.status_code == 200
    assert get_res.json()["credential_id"] == cred_id
    assert "vault" in get_res.json()["storage_path"]

    # List
    list_res = await async_client.get("/api/v1/credentials")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    assert any(item["credential_id"] == cred_id for item in list_data["items"])

@pytest.mark.asyncio
async def test_get_nonexistent_credential_returns_400(async_client):
    response = await async_client.get("/api/v1/credentials/CRD-NONEXISTENT")
    assert response.status_code == 400
    assert response.json()["error"] == "CredentialNotFoundError"
