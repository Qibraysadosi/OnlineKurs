from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.security import validate_password_bytes
from app.schemas.user import UserPublic


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=72)
    phone: str | None = Field(default=None, max_length=30)

    _password_bytes = field_validator("password")(validate_password_bytes)


class LoginRequest(BaseModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=1, max_length=72)

    _password_bytes = field_validator("password")(validate_password_bytes)


class RefreshRequest(BaseModel):
    refresh_token: str


class Tokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserPublic
