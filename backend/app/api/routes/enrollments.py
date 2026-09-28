from fastapi import APIRouter, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.common import conflict, get_visible_course_or_404
from app.core.deps import CurrentUser, DbSession
from app.models import Enrollment, Lesson, LessonProgress, Section
from app.schemas.enrollment import EnrollmentOut
from app.services.catalog import cards_by_id, enrollment_out
from app.services.enrollments import ensure_enrollment

router = APIRouter(tags=["enrollments"])


@router.get("/me/enrollments", response_model=list[EnrollmentOut])
def my_enrollments(db: DbSession, user: CurrentUser) -> list[EnrollmentOut]:
    last_activity = (
        select(
            Section.course_id.label("course_id"),
            func.max(LessonProgress.completed_at).label("last_at"),
        )
        .join(Lesson, Lesson.id == LessonProgress.lesson_id)
        .join(Section, Section.id == Lesson.section_id)
        .where(LessonProgress.user_id == user.id)
        .group_by(Section.course_id)
        .subquery()
    )
    stmt = (
        select(Enrollment)
        .outerjoin(last_activity, last_activity.c.course_id == Enrollment.course_id)
        .where(Enrollment.user_id == user.id)
        .order_by(
            func.coalesce(last_activity.c.last_at, Enrollment.created_at).desc(),
            Enrollment.id.desc(),
        )
        .options(selectinload(Enrollment.course))
    )
    enrollments = db.execute(stmt).scalars().all()
    cards = cards_by_id(db, [enrollment.course_id for enrollment in enrollments])
    return [
        enrollment_out(db, enrollment, cards[enrollment.course_id]) for enrollment in enrollments
    ]


@router.post(
    "/courses/{course_id}/enroll", response_model=EnrollmentOut, status_code=status.HTTP_201_CREATED
)
def enroll_free(
    course_id: int, db: DbSession, user: CurrentUser, response: Response
) -> EnrollmentOut:
    course = get_visible_course_or_404(db, course_id, user)
    if course.price > 0:
        raise conflict("Bu kurs pullik")
    enrollment, created = ensure_enrollment(db, user.id, course.id)
    db.commit()
    db.refresh(enrollment)
    if not created:
        response.status_code = status.HTTP_200_OK
    return enrollment_out(db, enrollment, cards_by_id(db, [course.id])[course.id])
