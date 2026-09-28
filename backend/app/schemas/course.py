from pydantic import BaseModel, Field

from app.models.enums import CourseLevel
from app.schemas.category import CategoryOut
from app.schemas.common import ORMModel, UTCDatetime
from app.schemas.review import ReviewOut
from app.schemas.section import SectionOut
from app.schemas.user import TeacherMini


class CourseCard(ORMModel):
    id: int
    title: str
    slug: str
    short_description: str
    cover_url: str | None
    price: int
    level: CourseLevel
    language: str
    is_published: bool
    category: CategoryOut | None
    teacher: TeacherMini
    rating_avg: float
    reviews_count: int
    students_count: int
    lessons_count: int
    duration_minutes: int
    created_at: UTCDatetime


class CourseDetail(CourseCard):
    description: str
    what_you_learn: list[str]
    requirements: list[str]
    updated_at: UTCDatetime
    sections: list[SectionOut]
    has_access: bool
    is_enrolled: bool
    progress_percent: int | None
    my_review: ReviewOut | None = None


class CourseCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    short_description: str = Field(min_length=10, max_length=300)
    description: str = Field(min_length=10, max_length=20000)
    category_id: int | None = None
    level: CourseLevel = CourseLevel.beginner
    price: int = Field(default=0, ge=0, le=1_000_000_000)
    language: str = Field(default="uz", min_length=2, max_length=10)
    what_you_learn: list[str] = Field(default_factory=list, max_length=20)
    requirements: list[str] = Field(default_factory=list, max_length=20)


class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    short_description: str | None = Field(default=None, min_length=10, max_length=300)
    description: str | None = Field(default=None, min_length=10, max_length=20000)
    category_id: int | None = None
    level: CourseLevel | None = None
    price: int | None = Field(default=None, ge=0, le=1_000_000_000)
    language: str | None = Field(default=None, min_length=2, max_length=10)
    what_you_learn: list[str] | None = Field(default=None, max_length=20)
    requirements: list[str] | None = Field(default=None, max_length=20)


class CoursePublish(BaseModel):
    is_published: bool
