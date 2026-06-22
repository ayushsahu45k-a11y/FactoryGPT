import logging
from typing import List, Optional
from fastapi import Depends, Request, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.db.database import get_db_session
from backend.app.db.models import UserModel, RoleModel
from backend.app.auth.security import decode_token
from backend.app.auth.services import AuthenticationService
from backend.app.exceptions.custom_exceptions import (
    AuthenticationFailedException,
    ActionForbiddenException
)

logger = logging.getLogger("factory_gpt.auth.dependencies")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_auth_service() -> AuthenticationService:
    return AuthenticationService()

async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_db_session)
) -> UserModel:
    # 1. Attempt lookup from Authorization Header, fallback to HTTP-Only Cookie
    final_token = token
    if not final_token:
        final_token = request.cookies.get("access_token")
        
    if not final_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session signature is missing or token is expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Decode & extract access token sub claims
    payload = decode_token(final_token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session verification failed or token is malformed.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User reference invalid in active payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Retrieve User context with RBAC profiles pre-loaded
    stmt = select(UserModel).where(
        UserModel.id == user_id,
        UserModel.deleted_at.is_(None)
    ).options(
        selectinload(UserModel.role).selectinload(RoleModel.permissions)
    )
    
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Associated user context is deleted or cannot be resolved.",
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This user account has been disabled.",
        )

    return user

async def get_current_active_user(
    current_user: UserModel = Depends(get_current_user)
) -> UserModel:
    if not current_user.is_active:
        raise ActionForbiddenException("This user account profile is currently deactivate / offline.")
    return current_user


class PermissionChecker:
    """Enforces fine-grained permission-based access control inside endpoints."""
    
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions

    def __call__(self, current_user: UserModel = Depends(get_current_user)) -> UserModel:
        if not current_user.role:
            raise ActionForbiddenException("Access denied: User does not possess a system role.")
            
        user_permissions = {p.name for p in current_user.role.permissions}
        
        # Admin is treated as superuser and passes all checks
        if current_user.role.name == "Admin":
            return current_user

        missing = [p for p in self.required_permissions if p not in user_permissions]
        if missing:
            logger.warning(f"User {current_user.email} denied access. Missing permissions: {missing}")
            raise ActionForbiddenException("Access denied: Insufficient privileges to complete operation.")
            
        return current_user


class RoleChecker:
    """Enforces coarse-grained role-based access control inside endpoints."""
    
    def __init__(self, authorized_roles: List[str]):
        self.authorized_roles = authorized_roles

    def __call__(self, current_user: UserModel = Depends(get_current_user)) -> UserModel:
        if not current_user.role or current_user.role.name not in self.authorized_roles:
            logger.warning(f"Access denied to user: {current_user.email} with role: {current_user.role.name if current_user.role else 'None'}. Required: {self.authorized_roles}")
            raise ActionForbiddenException("Access denied: Authorized roles required for this node.")
        return current_user
