from pydantic import BaseModel


class TeacherStats(BaseModel):
    courses_count: int
    students_count: int
    revenue: int
    reviews_avg: float
