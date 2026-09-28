from pydantic import BaseModel, Field, field_validator

from app.core.security import validate_password_bytes
from app.models.enums import UserRole
from app.schemas.common import ORMModel, UTCDatetime


class UserPublic(ORMModel):
    id: int
    full_name: str
    email: str
    phone: str | None
    role: UserRole
    avatar_url: str | None
    bio: str | None
    is_active: bool
    created_at: UTCDatetime


class TeacherMini(ORMModel):
    id: int
    full_name: str
    avatar_url: str | None
    bio: str | None


class ReviewAuthor(ORMModel):
    id: int
    full_name: str
    avatar_url: str | None


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    bio: str | None = Field(default=None, max_length=2000)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=72)
    new_password: str = Field(min_length=8, max_length=72)

    _password_bytes = field_validator("current_password", "new_password")(validate_password_bytes)


class AdminUserUpdate(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None
