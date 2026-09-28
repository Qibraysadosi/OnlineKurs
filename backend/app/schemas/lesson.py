from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class LessonOut(ORMModel):
    id: int
    title: str
    description: str | None
    duration_minutes: int
    position: int
    is_free_preview: bool
    has_access: bool
    is_completed: bool
    video_url: str | None
    attachment_url: str | None
    attachment_name: str | None


class LessonCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    video_url: str | None = Field(default=None, max_length=500)
    duration_minutes: int = Field(default=0, ge=0, le=10000)
    is_free_preview: bool = False


class LessonUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    video_url: str | None = Field(default=None, max_length=500)
    duration_minutes: int | None = Field(default=None, ge=0, le=10000)
    is_free_preview: bool | None = None


class LessonOrder(BaseModel):
    lesson_ids: list[int] = Field(min_length=1)
