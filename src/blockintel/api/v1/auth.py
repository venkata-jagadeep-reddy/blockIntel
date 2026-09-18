from fastapi import APIRouter, Depends, HTTPException, status
from blockintel.api.deps import require_admin
from blockintel.core.auth import (
    LoginRequest, TokenResponse, UserResponse,
    create_access_token, verify_admin_credentials
)

router = APIRouter(prefix="/auth", tags=["Authentication & Authorization"])

@router.post("/login", response_model=TokenResponse, summary="Sign in as an Administrator")
async def login(req: LoginRequest):
    if not verify_admin_credentials(req.username, req.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator credentials. Please check your username and password."
        )
    user_payload = {
        "sub": req.username,
        "username": req.username,
        "role": "ADMIN",
        "name": "System Administrator"
    }
    token = create_access_token(user_payload)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            username=req.username,
            email=req.username,
            role="ADMIN",
            name="System Administrator"
        )
    )

@router.get("/me", response_model=UserResponse, summary="Retrieve current authenticated administrator profile")
async def get_me(admin_user: dict = Depends(require_admin)):
    uname = admin_user.get("username", "admin@blockintel.com")
    return UserResponse(
        username=uname,
        email=uname,
        role=admin_user.get("role", "ADMIN"),
        name=admin_user.get("name", "System Administrator")
    )
