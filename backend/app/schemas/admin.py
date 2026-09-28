from pydantic import BaseModel

from app.schemas.course import CourseCard
from app.schemas.payment import PaymentOut


class MonthlyRevenue(BaseModel):
    month: str
    revenue: int
    payments_count: int


class AdminStats(BaseModel):
    users_count: int
    students_count: int
    teachers_count: int
    courses_count: int
    published_courses_count: int
    enrollments_count: int
    revenue_total: int
    revenue_last_30_days: int
    recent_payments: list[PaymentOut]
    monthly_revenue: list[MonthlyRevenue]
    top_courses: list[CourseCard]
