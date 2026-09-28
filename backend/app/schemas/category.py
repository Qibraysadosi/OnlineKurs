from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class CategoryOut(ORMModel):
    id: int
    name: str
    slug: str
    icon: str | None
    description: str | None
    courses_count: int


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    icon: str | None = Field(default=None, max_length=50)
    description: str | None = Field(default=None, max_length=300)


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    icon: str | None = Field(default=None, max_length=50)
    description: str | None = Field(default=None, max_length=300)
