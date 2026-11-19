from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    phone: Optional[str] = Field(default=None, max_length=20)
    district: Optional[str] = Field(default=None, max_length=50)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class UserRead(BaseModel):
    id: UUID
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    district: Optional[str] = None
    is_active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    district: Optional[str] = Field(default=None, max_length=50)


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)
