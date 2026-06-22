from fastapi import APIRouter, Depends, Response, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.database import get_db_session
from backend.app.auth.schemas import (
    UserRegisterSchema,
    UserLoginSchema,
    UserResponseSchema,
    TokenResponseSchema
)
from backend.app.auth.services import AuthenticationService
from backend.app.auth.dependencies import (
    get_auth_service,
    get_current_active_user
)
from backend.app.auth.security import create_access_token, create_refresh_token, decode_token
from backend.app.db.models import UserModel

router = APIRouter(prefix="/auth", tags=["Authentication"])

def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    # Set HTTP-only secure cookie for access token
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=3600,  # 1 hour
        path="/"
    )
    # Set HTTP-only secure cookie for refresh token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=30 * 86400,  # 30 days
        path="/"
    )

def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")

@router.post("/register", response_model=UserResponseSchema, status_code=status.HTTP_21_CREATED or status.HTTP_201_CREATED)
async def register(
    payload: UserRegisterSchema,
    response: Response,
    session: AsyncSession = Depends(get_db_session),
    service: AuthenticationService = Depends(get_auth_service)
) -> UserResponseSchema:
    user = await service.register_user(session, payload)
    
    # Generate token credentials post-registration automatically
    permissions = [p.name for p in user.role.permissions] if user.role else []
    access_token = create_access_token(subject=user.id, role=user.role.name if user.role else "Viewer", permissions=permissions)
    refresh_token = create_refresh_token(subject=user.id)
    
    set_auth_cookies(response, access_token, refresh_token)
    
    return UserResponseSchema(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role_name=user.role.name if user.role else "Viewer",
        permissions=permissions,
        is_active=user.is_active,
        created_at=user.created_at
    )

@router.post("/login", response_model=UserResponseSchema)
async def login(
    payload: UserLoginSchema,
    response: Response,
    session: AsyncSession = Depends(get_db_session),
    service: AuthenticationService = Depends(get_auth_service)
) -> UserResponseSchema:
    user = await service.authenticate_user(session, payload)
    
    permissions = [p.name for p in user.role.permissions] if user.role else []
    access_token = create_access_token(subject=user.id, role=user.role.name if user.role else "Viewer", permissions=permissions)
    refresh_token = create_refresh_token(subject=user.id)
    
    set_auth_cookies(response, access_token, refresh_token)
    
    # Store initial refresh token tracker
    decoded = decode_token(refresh_token)
    import uuid
    from datetime import datetime, timezone
    jti = decoded.get("jti") or str(uuid.uuid4())
    exp_timestamp = decoded.get("exp")
    expires_at = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc) if exp_timestamp else datetime.now(timezone.utc)
    
    await service.store_refresh_token(
        session=session,
        user_id=user.id,
        jti=jti,
        expires_at=expires_at
    )
    
    return UserResponseSchema(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role_name=user.role.name if user.role else "Viewer",
        permissions=permissions,
        is_active=user.is_active,
        created_at=user.created_at
    )

@router.post("/refresh", response_model=TokenResponseSchema)
async def refresh(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db_session),
    service: AuthenticationService = Depends(get_auth_service)
) -> TokenResponseSchema:
    # Read refresh token from HTTP-only cookie first, fallback to authorization headers
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        # Fallback to header or JSON parsing if needed
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            refresh_token = auth_header.split(" ")[1]

    if not refresh_token:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session refresh request failed: refresh token missing."
        )

    user, new_access, new_refresh, role_name, _ = await service.rotate_refresh_token(
        session=session,
        refresh_token_string=refresh_token
    )
    
    set_auth_cookies(response, new_access, new_refresh)
    
    return TokenResponseSchema(
        access_token=new_access,
        refresh_token=new_refresh,
        role_name=role_name
    )

@router.post("/logout")
async def logout(
    response: Response,
    current_user: UserModel = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session),
    service: AuthenticationService = Depends(get_auth_service)
):
    await service.invalidate_user_tokens(session, current_user.id)
    clear_auth_cookies(response)
    return {"message": "Successfully logged out and session context cleared."}

@router.get("/me", response_model=UserResponseSchema)
async def get_me(
    current_user: UserModel = Depends(get_current_active_user)
) -> UserResponseSchema:
    permissions = [p.name for p in current_user.role.permissions] if current_user.role else []
    return UserResponseSchema(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role_name=current_user.role.name if current_user.role else "Viewer",
        permissions=permissions,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )
