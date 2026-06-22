from datetime import datetime, timezone
from typing import List, Optional
from fastapi import Depends, Header, status
from jose import jwt, JWTError
from pydantic import BaseModel, Field

from backend.app.config.settings import settings
from backend.app.exceptions.custom_exceptions import AuthenticationFailedException, ActionForbiddenException

class UserTokenPayload(BaseModel):
    sub: str = Field(..., description="User unique email or ID")
    role: str = Field(..., description="RBAC target role - e.g. Operator, Engineer, Admin")
    permissions: List[str] = Field(default_factory=list, description="Access permissions array")
    exp: float

class CurrentUser(BaseModel):
    user_id: str
    email: str
    role: str
    permissions: List[str]

async def verify_jwt_token(authorization: Optional[str] = Header(None)) -> CurrentUser:
    """Extracts and validates bearers' credentials against configured cryptographic keys."""
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationFailedException("Bearer token missing or incorrectly specified in authorization header.")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        token_data = UserTokenPayload(**payload)
        
        # Expiry confirmation
        if datetime.fromtimestamp(token_data.exp, tz=timezone.utc) < datetime.now(timezone.utc):
            raise AuthenticationFailedException("Session token has expired. Please log in again.")
            
        return CurrentUser(
            user_id=token_data.sub,
            email=token_data.sub,
            role=token_data.role,
            permissions=token_data.permissions
        )
    except JWTError as e:
        raise AuthenticationFailedException("Token signature check failed.", details={"jwt_reason": str(e)})


class RoleChecker:
    """Enforces structural RBAC restrictions across controllers."""
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: CurrentUser = Depends(verify_jwt_token)) -> CurrentUser:
        if current_user.role not in self.allowed_roles:
            raise ActionForbiddenException(
                f"Required credentials not found. Clearance level required: {self.allowed_roles}"
            )
        return current_user
