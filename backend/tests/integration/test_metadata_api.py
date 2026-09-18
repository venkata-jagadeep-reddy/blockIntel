import pytest
import pymupdf
import io

def make_meta_pdf() -> bytes:
    doc = pymupdf.open()
    doc.set_metadata({
        "title": "Cloud Architect Diploma",
        "author": "BlockIntel Academy",
        "producer": "BlockIntel Generator v2"
    })
    page = doc.new_page(width=600, height=400)
    page.insert_text((50, 80), "CLOUD ARCHITECT CERTIFICATE", fontsize=16)
    b = doc.tobytes()
    doc.close()
    return b

@pytest.mark.asyncio
async def test_metadata_extraction_api_flow(async_client):
    pdf_bytes = make_meta_pdf()
    files = {"file": ("cloud_cert.pdf", io.BytesIO(pdf_bytes), "application/pdf")}

    # 1. Upload
    up_res = await async_client.post("/api/v1/credentials/upload", files=files)
    assert up_res.status_code == 201
    cid = up_res.json()["credential_id"]

    # 2. Extract Metadata & Structure
    meta_res = await async_client.post(f"/api/v1/credentials/{cid}/metadata")
    assert meta_res.status_code == 200
    data = meta_res.json()
    assert data["credential_id"] == cid
    assert data["metadata"]["author"] == "BlockIntel Academy"
    assert data["metadata"]["producer"] == "BlockIntel Generator v2"
    assert data["metadata"]["structural_info"]["page_count"] == 1
    assert len(data["metadata"]["structural_info"]["headings"]) >= 1

    # 3. GET Metadata
    get_res = await async_client.get(f"/api/v1/credentials/{cid}/metadata")
    assert get_res.status_code == 200
    assert get_res.json()["metadata"]["author"] == "BlockIntel Academy"
