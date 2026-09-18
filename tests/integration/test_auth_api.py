import io
import pytest
from blockintel.core.auth import create_access_token
from blockintel.config import settings

SAMPLE_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<< /Title (Doc) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"

@pytest.mark.asyncio
async def test_public_can_access_universal_verifier(public_client):
    """Public users must be able to verify documents without an auth token."""
    files = {"file": ("test.pdf", io.BytesIO(SAMPLE_PDF_BYTES), "application/pdf")}
    response = await public_client.post("/api/v1/credentials/verify-document", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "verdict" in data
    assert "is_present" in data
    assert "submitted_hash" in data

@pytest.mark.asyncio
async def test_unauthenticated_blocked_from_credential_list(public_client):
    """Unauthenticated users cannot enumerate the credentials database."""
    response = await public_client.get("/api/v1/credentials")
    assert response.status_code == 401
    assert "Admin authorization required" in response.json()["detail"]

@pytest.mark.asyncio
async def test_unauthenticated_blocked_from_upload(public_client):
    """Unauthenticated users cannot upload credentials to the database."""
    files = {"file": ("doc.pdf", io.BytesIO(SAMPLE_PDF_BYTES), "application/pdf")}
    response = await public_client.post("/api/v1/credentials/upload", files=files)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_unauthenticated_blocked_from_file_preview(public_client):
    """Unauthenticated users cannot stream document artifacts."""
    response = await public_client.get("/api/v1/credentials/CRD-12345678/file")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_unauthenticated_blocked_from_delete(public_client):
    """Unauthenticated users cannot delete records."""
    response = await public_client.delete("/api/v1/credentials/CRD-12345678")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_unauthenticated_blocked_from_complete_pipeline(public_client):
    """Unauthenticated users cannot trigger analysis pipeline."""
    response = await public_client.post("/api/v1/credentials/CRD-12345678/complete")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_login_failure_invalid_credentials(public_client):
    """Invalid credentials return 401."""
    response = await public_client.post("/api/v1/auth/login", json={
        "username": "wrong@example.com",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401
    assert "Invalid administrator credentials" in response.json()["detail"]

@pytest.mark.asyncio
async def test_login_success_and_token_exchange(public_client):
    """Valid admin credentials return a JWT access token."""
    response = await public_client.post("/api/v1/auth/login", json={
        "username": settings.ADMIN_USERNAME,
        "password": settings.ADMIN_PASSWORD
    })
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["role"] == "ADMIN"
    assert token_data["user"]["email"] == settings.ADMIN_USERNAME

    # Use token to call protected /api/v1/auth/me
    token = token_data["access_token"]
    me_resp = await public_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["role"] == "ADMIN"

    # Use token to call protected /api/v1/credentials
    list_resp = await public_client.get("/api/v1/credentials", headers={"Authorization": f"Bearer {token}"})
    assert list_resp.status_code == 200

@pytest.mark.asyncio
async def test_non_admin_token_forbidden(public_client):
    """A user token with non-ADMIN role is forbidden (403) from admin endpoints."""
    non_admin_token = create_access_token({
        "sub": "user@example.com",
        "role": "USER",
        "name": "Standard User"
    })
    response = await public_client.get(
        "/api/v1/credentials",
        headers={"Authorization": f"Bearer {non_admin_token}"}
    )
    assert response.status_code == 403
    assert "Admin privileges required" in response.json()["detail"]

@pytest.mark.asyncio
async def test_query_param_token_allowed_for_file_streaming(public_client, admin_token):
    """Admin token passed as ?token= query parameter is accepted on protected endpoints."""
    # Try with valid-format non-existent id so it passes auth guard and reaches service
    response = await public_client.get(f"/api/v1/credentials/CRD-A1B2C3D4/file?token={admin_token}")
    assert response.status_code == 400
    assert response.json()["error"] == "CredentialNotFoundError"

    # Without token, it must be 401 Unauthorized
    unauth_resp = await public_client.get("/api/v1/credentials/CRD-A1B2C3D4/file")
    assert unauth_resp.status_code == 401
