from app.schemas.common import ORMModel, UTCDatetime
from app.schemas.course import CourseCard


class EnrollmentOut(ORMModel):
    id: int
    course: CourseCard
    progress_percent: int
    completed_lessons: int
    total_lessons: int
    last_lesson_id: int | None
    created_at: UTCDatetime
