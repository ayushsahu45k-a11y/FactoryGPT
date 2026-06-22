from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

class PermissionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=255)

class RoleSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    name: str = Field(..., max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    permissions: List[PermissionSchema] = []

class UserRegisterSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)
    role_name: str = Field("Viewer", description="Must be one of: Admin, Manager, SafetyOfficer, Operator, Viewer")

    @field_validator("role_name")
    @classmethod
    def validate_role_name(cls, v: str) -> str:
        valid_roles = {"Admin", "Manager", "SafetyOfficer", "Operator", "Viewer"}
        if v not in valid_roles:
            raise ValueError(f"Role must be one of {valid_roles}")
        return v

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class UserResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    email: EmailStr
    full_name: str
    role_name: str
    permissions: List[str] = []
    is_active: bool
    created_at: datetime

class TokenResponseSchema(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    role_name: str
    expires_in: int = 3600
