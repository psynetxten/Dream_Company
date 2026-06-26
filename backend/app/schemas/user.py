from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
import uuid


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "user"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: Optional[str] = None
    full_name: str
    role: str                       # 활성(active) role
    roles: list[str] = []           # 보유한 역할 집합 (멀티-role)
    is_active: bool
    credits: int = 0
    subscription_plan: Optional[str]
    subscription_expires_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None


class ActiveRoleUpdate(BaseModel):
    """활성 role 전환 — 보유한 역할(roles) 중 하나로만 가능."""
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
