"""Single source of truth for who may view a course's paid content."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Course, Enrollment, Lesson, User, UserRole


def is_enrolled(db: Session, user_id: int, course_id: int) -> bool:
    stmt = select(Enrollment.id).where(
        Enrollment.user_id == user_id, Enrollment.course_id == course_id
    )
    return db.execute(stmt).scalar_one_or_none() is not None


def user_can_manage_course(user: User | None, course: Course) -> bool:
    """Admins manage every course; teachers only their own."""
    if user is None:
        return False
    return user.role == UserRole.admin or course.teacher_id == user.id


def user_has_course_access(db: Session, user: User | None, course: Course) -> bool:
    """True if the user is admin, the course teacher, or holds an enrollment.

    Enrollments are created directly for free courses and when a payment becomes paid,
    so a single membership check covers both the free and the paid case.
    """
    if user is None:
        return False
    if user_can_manage_course(user, course):
        return True
    return is_enrolled(db, user.id, course.id)


def user_can_view_lesson(db: Session, user: User | None, course: Course, lesson: Lesson) -> bool:
    return lesson.is_free_preview or user_has_course_access(db, user, course)


def user_can_see_course(user: User | None, course: Course) -> bool:
    """Unpublished courses are visible only to their teacher and admins."""
    return course.is_published or user_can_manage_course(user, course)
