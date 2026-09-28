from fastapi import APIRouter

from app.api.common import (
    IdPath,
    COURSE_NOT_FOUND,
    forbidden,
    get_lesson_or_404,
    get_visible_course_or_404,
    not_found,
)
from app.core.deps import CurrentUser, DbSession
from app.schemas.progress import CourseProgressOut, ProgressOut
from app.services.access import user_can_see_course, user_has_course_access
from app.services.progress import (
    calculate_course_progress,
    mark_lesson_completed,
    unmark_lesson_completed,
)

router = APIRouter(tags=["progress"])

LESSON_LOCKED = "Bu darsni ko'rish uchun kursni sotib oling"


@router.get("/courses/{course_id}/progress", response_model=CourseProgressOut)
def course_progress(course_id: IdPath, db: DbSession, user: CurrentUser) -> CourseProgressOut:
    course = get_visible_course_or_404(db, course_id, user)
    progress = calculate_course_progress(db, user.id, course.id)
    return CourseProgressOut(
        progress_percent=progress.progress_percent,
        completed_lessons=progress.completed_lessons,
        total_lessons=progress.total_lessons,
        completed_lesson_ids=progress.completed_lesson_ids,
    )


def _toggle(db: DbSession, lesson_id: int, user: CurrentUser, completed: bool) -> ProgressOut:
    lesson, course = get_lesson_or_404(db, lesson_id)
    if not user_can_see_course(user, course):
        raise not_found(COURSE_NOT_FOUND)
    if not user_has_course_access(db, user, course):
        raise forbidden(LESSON_LOCKED)
    if completed:
        mark_lesson_completed(db, user.id, lesson.id)
    else:
        unmark_lesson_completed(db, user.id, lesson.id)
    progress = calculate_course_progress(db, user.id, course.id)
    return ProgressOut(
        progress_percent=progress.progress_percent,
        completed_lessons=progress.completed_lessons,
        total_lessons=progress.total_lessons,
    )


@router.post("/lessons/{lesson_id}/complete", response_model=ProgressOut)
def complete_lesson(lesson_id: IdPath, db: DbSession, user: CurrentUser) -> ProgressOut:
    return _toggle(db, lesson_id, user, completed=True)


@router.delete("/lessons/{lesson_id}/complete", response_model=ProgressOut)
def uncomplete_lesson(lesson_id: IdPath, db: DbSession, user: CurrentUser) -> ProgressOut:
    return _toggle(db, lesson_id, user, completed=False)
