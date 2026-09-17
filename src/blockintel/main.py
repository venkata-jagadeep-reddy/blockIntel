from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from blockintel.config import settings
from blockintel.core.logging import configure_logging, logger
from blockintel.core.exceptions import BlockIntelError
from blockintel.infrastructure.database.session import init_db
from blockintel.api.v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info("Initializing BlockIntel system...")
    settings.ensure_directories()
    await init_db()
    logger.info("BlockIntel startup sequence completed.")
    yield
    logger.info("Shutting down BlockIntel system...")

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        description="BlockIntel: Tamper-Evident Credential Ingestion, Risk Assessment & Skill Intelligence System (Phase 1)",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(BlockIntelError)
    async def blockintel_exception_handler(request: Request, exc: BlockIntelError):
        return JSONResponse(
            status_code=400,
            content={"error": exc.__class__.__name__, "message": exc.message, "details": exc.details}
        )

    @app.get("/health", tags=["Health"])
    async def health_check() -> dict:
        return {
            "status": "healthy",
            "app_name": settings.APP_NAME,
            "environment": settings.ENVIRONMENT,
            "version": "0.1.0"
        }

    app.include_router(api_router, prefix=settings.API_V1_STR)
    return app

app = create_app()
