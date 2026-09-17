import io

import pymupdf
import pytest


def phase_one_pdf() -> bytes:
    doc = pymupdf.open()
    doc.new_page(width=1200).insert_text(
        (50, 72), "Certificate: Completed Full Stack program covering React.js, Node.js, Express.js and MongoDB."
    )
    value = doc.tobytes()
    doc.close()
    return value


@pytest.mark.asyncio
async def test_complete_phase_one_endpoint(async_client):
    source = phase_one_pdf()
    upload = await async_client.post(
        "/api/v1/credentials/upload", files={"file": ("phase-one.pdf", io.BytesIO(source), "application/pdf")}
    )
    assert upload.status_code == 201
    credential_id = upload.json()["credential_id"]

    result = await async_client.post(f"/api/v1/credentials/{credential_id}/complete")
    assert result.status_code == 200
    data = result.json()
    assert data["credential"]["status"] == "COMPLETED"
    assert data["integrity"]["blockchain_registered"] is True
    assert data["integrity"]["integrity_status"] == "MATCH"
    assert {skill["canonical_skill"] for skill in data["skills"]} >= {"React", "Node.js", "Express.js", "MongoDB"}
