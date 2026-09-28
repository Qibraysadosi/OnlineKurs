"""Lesson completion tracking and per-course progress calculation."""

from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Lesson, LessonProgress, Section


@dataclass(frozen=True)
class CourseProgress:
    progress_percent: int
    completed_lessons: int
    total_lessons: int
    completed_lesson_ids: list[int]
    last_lesson_id: int | None


def course_lesson_ids(db: Session, course_id: int) -> list[int]:
    stmt = (
        select(Lesson.id)
        .join(Section, Section.id == Lesson.section_id)
        .where(Section.course_id == course_id)
        .order_by(Section.position, Lesson.position)
    )
    return list(db.execute(stmt).scalars().all())


def completed_lessons_for_course(
    db: Session, user_id: int, course_id: int
) -> list[tuple[int, object]]:
    """(lesson_id, completed_at) pairs for the user within a course, latest first."""
    stmt = (
        select(LessonProgress.lesson_id, LessonProgress.completed_at)
        .join(Lesson, Lesson.id == LessonProgress.lesson_id)
        .join(Section, Section.id == Lesson.section_id)
        .where(Section.course_id == course_id, LessonProgress.user_id == user_id)
        .order_by(LessonProgress.completed_at.desc(), LessonProgress.id.desc())
    )
    return [(row[0], row[1]) for row in db.execute(stmt).all()]


def percent(completed: int, total: int) -> int:
    if total <= 0:
        return 0
    return min(100, round(completed * 100 / total))


def calculate_course_progress(db: Session, user_id: int, course_id: int) -> CourseProgress:
    total = db.execute(
        select(func.count(Lesson.id))
        .join(Section, Section.id == Lesson.section_id)
        .where(Section.course_id == course_id)
    ).scalar_one()
    completed = completed_lessons_for_course(db, user_id, course_id)
    completed_set = {lesson_id for lesson_id, _ in completed}
    ordered_ids = [
        lesson_id for lesson_id in course_lesson_ids(db, course_id) if lesson_id in completed_set
    ]
    return CourseProgress(
        progress_percent=percent(len(ordered_ids), total),
        completed_lessons=len(ordered_ids),
        total_lessons=total,
        completed_lesson_ids=ordered_ids,
        last_lesson_id=completed[0][0] if completed else None,
    )


def mark_lesson_completed(db: Session, user_id: int, lesson_id: int) -> None:
    stmt = select(LessonProgress).where(
        LessonProgress.user_id == user_id, LessonProgress.lesson_id == lesson_id
    )
    if db.execute(stmt).scalar_one_or_none() is None:
        db.add(LessonProgress(user_id=user_id, lesson_id=lesson_id))
        db.commit()


def unmark_lesson_completed(db: Session, user_id: int, lesson_id: int) -> None:
    stmt = select(LessonProgress).where(
        LessonProgress.user_id == user_id, LessonProgress.lesson_id == lesson_id
    )
    record = db.execute(stmt).scalar_one_or_none()
    if record is not None:
        db.delete(record)
        db.commit()
