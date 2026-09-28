"""Enrollment lifecycle: granted for free courses and paid payments, revoked on refund."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Enrollment


def get_enrollment(db: Session, user_id: int, course_id: int) -> Enrollment | None:
    stmt = select(Enrollment).where(
        Enrollment.user_id == user_id, Enrollment.course_id == course_id
    )
    return db.execute(stmt).scalar_one_or_none()


def ensure_enrollment(db: Session, user_id: int, course_id: int) -> tuple[Enrollment, bool]:
    """Return (enrollment, created). Does not commit."""
    existing = get_enrollment(db, user_id, course_id)
    if existing is not None:
        return existing, False
    enrollment = Enrollment(user_id=user_id, course_id=course_id)
    db.add(enrollment)
    db.flush()
    return enrollment, True


def remove_enrollment(db: Session, user_id: int, course_id: int) -> None:
    """Delete the enrollment if present. Does not commit."""
    existing = get_enrollment(db, user_id, course_id)
    if existing is not None:
        db.delete(existing)
        db.flush()
