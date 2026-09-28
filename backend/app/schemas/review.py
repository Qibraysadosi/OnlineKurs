from pydantic import BaseModel, Field

from app.schemas.common import ORMModel, UTCDatetime
from app.schemas.user import ReviewAuthor


class ReviewOut(ORMModel):
    id: int
    user: ReviewAuthor
    rating: int
    comment: str | None
    created_at: UTCDatetime


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)
