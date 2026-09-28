from pydantic import BaseModel

from app.models.enums import PaymentStatus
from app.schemas.common import ORMModel, UTCDatetime
from app.schemas.course import CourseCard
from app.schemas.user import UserPublic


class PaymentOut(ORMModel):
    id: int
    user: UserPublic
    course: CourseCard
    amount: int
    status: PaymentStatus
    provider: str
    created_at: UTCDatetime
    paid_at: UTCDatetime | None


class PaymentCreate(BaseModel):
    course_id: int


class PaymentStatusUpdate(BaseModel):
    status: PaymentStatus
