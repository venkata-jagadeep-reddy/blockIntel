from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, Query, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from blockintel.infrastructure.database.session import get_db
from blockintel.core.auth import decode_access_token

security = HTTPBearer(auto_error=False)

async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    token: Optional[str] = Query(None, description="Access token fallback"),
) -> Optional[dict]:
    """Extracts and validates current user if Bearer token or token query param is provided."""
    raw_token = credentials.credentials if (credentials and credentials.credentials) else token
    if not raw_token:
        return None
    payload = decode_access_token(raw_token)
    return payload

async def require_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    token: Optional[str] = Query(None, description="Admin access token fallback for streaming media"),
) -> dict:
    """
    Authorization guard requiring a valid Administrator JWT token.
    Accepts Bearer header or ?token= query parameter (for direct browser file streaming).
    Blocks unauthenticated users and regular public verifiers from internal repository endpoints.
    """
    raw_token = credentials.credentials if (credentials and credentials.credentials) else token
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authorization required to access this resource. Please sign in as an Administrator.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(raw_token)
    if not payload or payload.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin privileges required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

__all__ = ["get_db", "AsyncSession", "get_optional_current_user", "require_admin"]
