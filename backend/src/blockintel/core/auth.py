import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from pydantic import BaseModel, Field
from blockintel.config import settings
from blockintel.core.logging import logger

class LoginRequest(BaseModel):
    username: str = Field(..., description="Admin username or email")
    password: str = Field(..., description="Admin password")

class UserResponse(BaseModel):
    username: str
    email: Optional[str] = None
    role: str
    name: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

def verify_admin_credentials(username: str, password: str) -> bool:
    """Constant-time comparison of admin credentials."""
    user_match = secrets.compare_digest(username.strip().lower(), settings.ADMIN_USERNAME.strip().lower())
    pass_match = secrets.compare_digest(password.strip(), settings.ADMIN_PASSWORD.strip())
    return user_match and pass_match

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates an encrypted signed JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates token signature and expiration."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError as e:
        logger.warning(f"Invalid access token: {e}")
        return None
