from pydantic import BaseModel, Field

from app.schemas.common import ORMModel
from app.schemas.lesson import LessonOut


class SectionOut(ORMModel):
    id: int
    title: str
    position: int
    lessons: list[LessonOut]


class SectionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class SectionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)


class SectionOrder(BaseModel):
    section_ids: list[int] = Field(min_length=1)
