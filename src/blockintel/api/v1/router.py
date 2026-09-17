from fastapi import APIRouter
from blockintel.api.v1.credentials import router as credentials_router
from blockintel.api.v1.document import router as document_router
from blockintel.api.v1.metadata import router as metadata_router
from blockintel.api.v1.risk import router as risk_router
from blockintel.api.v1.blockchain import router as blockchain_router
from blockintel.api.v1.skills import router as skills_router
from blockintel.api.v1.complete import router as complete_router

api_router = APIRouter()

@api_router.get("/ping", tags=["System"])
async def ping() -> dict:
    """Lightweight system ping endpoint."""
    return {"status": "ok", "message": "BlockIntel API v1 operational"}

api_router.include_router(credentials_router)
api_router.include_router(document_router)
api_router.include_router(metadata_router)
api_router.include_router(risk_router)
api_router.include_router(blockchain_router)
api_router.include_router(skills_router)
api_router.include_router(complete_router)
