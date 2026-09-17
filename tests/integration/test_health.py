import pytest

@pytest.mark.asyncio
async def test_health_check_endpoint(async_client):
    response = await async_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "BlockIntel"
    assert "version" in data

@pytest.mark.asyncio
async def test_api_v1_ping_endpoint(async_client):
    response = await async_client.get("/api/v1/ping")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "operational" in data["message"]

@pytest.mark.asyncio
async def test_openapi_docs_available(async_client):
    response = await async_client.get("/docs")
    assert response.status_code == 200
    assert "swagger-ui" in response.text.lower()
