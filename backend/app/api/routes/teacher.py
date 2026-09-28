from fastapi import APIRouter
from sqlalchemy import func, select

from app.core.deps import DbSession, TeacherUser
from app.models import Course, Enrollment, Payment, PaymentStatus, Review
from app.schemas.course import CourseCard
from app.schemas.teacher import TeacherStats
from app.services.catalog import courses_with_stats, fetch_cards

router = APIRouter(prefix="/teacher", tags=["teacher"])


@router.get("/courses", response_model=list[CourseCard])
def my_courses(db: DbSession, user: TeacherUser) -> list[CourseCard]:
    query = courses_with_stats()
    stmt = query.stmt.where(Course.teacher_id == user.id).order_by(
        Course.created_at.desc(), Course.id.desc()
    )
    return fetch_cards(db, stmt)


@router.get("/stats", response_model=TeacherStats)
def my_stats(db: DbSession, user: TeacherUser) -> TeacherStats:
    course_ids = select(Course.id).where(Course.teacher_id == user.id)
    courses_count = db.execute(select(func.count()).select_from(course_ids.subquery())).scalar_one()
    students_count = db.execute(
        select(func.count(func.distinct(Enrollment.user_id))).where(
            Enrollment.course_id.in_(course_ids)
        )
    ).scalar_one()
    revenue = db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.course_id.in_(course_ids), Payment.status == PaymentStatus.paid
        )
    ).scalar_one()
    reviews_avg = db.execute(
        select(func.coalesce(func.avg(Review.rating), 0.0)).where(Review.course_id.in_(course_ids))
    ).scalar_one()
    return TeacherStats(
        courses_count=int(courses_count),
        students_count=int(students_count),
        revenue=int(revenue),
        reviews_avg=round(float(reviews_avg), 1),
    )
