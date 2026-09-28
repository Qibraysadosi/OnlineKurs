from fastapi import APIRouter, Response, status
from sqlalchemy import func, select

from app.api.common import (
    COURSE_NOT_FOUND,
    bad_request,
    forbidden,
    get_lesson_or_404,
    get_owned_lesson_or_403,
    get_owned_section_or_403,
    not_found,
)
from app.core.deps import DbSession, OptionalUser, TeacherUser
from app.models import Lesson
from app.schemas.lesson import LessonCreate, LessonOrder, LessonOut, LessonUpdate
from app.services.access import user_can_see_course, user_can_view_lesson
from app.services.catalog import lesson_out, lesson_out_for_user
from app.services.storage import delete_upload

router = APIRouter(tags=["lessons"])

LESSON_LOCKED = "Bu darsni ko'rish uchun kursni sotib oling"


@router.post(
    "/sections/{section_id}/lessons", response_model=LessonOut, status_code=status.HTTP_201_CREATED
)
def create_lesson(
    section_id: int, payload: LessonCreate, db: DbSession, user: TeacherUser
) -> LessonOut:
    section, _course = get_owned_section_or_403(db, section_id, user)
    max_position = db.execute(
        select(func.coalesce(func.max(Lesson.position), 0)).where(Lesson.section_id == section.id)
    ).scalar_one()
    lesson = Lesson(
        section_id=section.id,
        title=payload.title.strip(),
        description=payload.description,
        video_url=payload.video_url,
        duration_minutes=payload.duration_minutes,
        position=max_position + 1,
        is_free_preview=payload.is_free_preview,
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson_out(lesson, True, set())


@router.put("/sections/{section_id}/lessons/order", response_model=list[LessonOut])
def reorder_lessons(
    section_id: int, payload: LessonOrder, db: DbSession, user: TeacherUser
) -> list[LessonOut]:
    section, _course = get_owned_section_or_403(db, section_id, user)
    lessons = {lesson.id: lesson for lesson in section.lessons}
    if sorted(payload.lesson_ids) != sorted(lessons) or len(set(payload.lesson_ids)) != len(
        payload.lesson_ids
    ):
        raise bad_request("Darslar ro'yxati noto'g'ri")
    for position, lesson_id in enumerate(payload.lesson_ids, start=1):
        lessons[lesson_id].position = position
    db.commit()
    ordered = sorted(lessons.values(), key=lambda item: item.position)
    return [lesson_out(lesson, True, set()) for lesson in ordered]


@router.get("/lessons/{lesson_id}", response_model=LessonOut)
def read_lesson(lesson_id: int, db: DbSession, user: OptionalUser) -> LessonOut:
    lesson, course = get_lesson_or_404(db, lesson_id)
    if not user_can_see_course(user, course):
        raise not_found(COURSE_NOT_FOUND)
    if not user_can_view_lesson(db, user, course, lesson):
        raise forbidden(LESSON_LOCKED)
    return lesson_out_for_user(db, course, lesson, user)


@router.patch("/lessons/{lesson_id}", response_model=LessonOut)
def update_lesson(
    lesson_id: int, payload: LessonUpdate, db: DbSession, user: TeacherUser
) -> LessonOut:
    lesson, course = get_owned_lesson_or_403(db, lesson_id, user)
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("title") is not None:
        changes["title"] = changes["title"].strip()
    previous_video = lesson.video_url
    for field, value in changes.items():
        if value is None and field not in ("description", "video_url"):
            continue
        setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    if "video_url" in changes and previous_video != lesson.video_url:
        delete_upload(previous_video)
    return lesson_out_for_user(db, course, lesson, user)


@router.delete(
    "/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response
)
def delete_lesson(lesson_id: int, db: DbSession, user: TeacherUser) -> Response:
    lesson, _course = get_owned_lesson_or_403(db, lesson_id, user)
    video_url, attachment_url = lesson.video_url, lesson.attachment_url
    db.delete(lesson)
    db.commit()
    delete_upload(video_url)
    delete_upload(attachment_url)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
