from fastapi import APIRouter, Response, status
from sqlalchemy import func, select

from app.api.common import (
    IdPath,
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
from app.services import storage
from app.services.access import user_can_see_course, user_can_view_lesson
from app.services.catalog import lesson_out, lesson_out_for_user, unpublish_when_empty

router = APIRouter(tags=["lessons"])

LESSON_LOCKED = "Bu darsni ko'rish uchun kursni sotib oling"
INTERNAL_VIDEO_URL = (
    "Video havolasi tashqi manzil bo'lishi kerak; faylni video yuklash orqali biriktiring"
)


def _require_external_video_url(video_url: str | None) -> None:
    """Uploaded files are attached only through POST /lessons/{id}/video.

    A client-supplied URL under our own /uploads/ would let a teacher point at (and later
    delete) files that belong to other users, so it is rejected outright.
    """
    if storage.is_uploaded_url(video_url):
        raise bad_request(INTERNAL_VIDEO_URL)


@router.post(
    "/sections/{section_id}/lessons", response_model=LessonOut, status_code=status.HTTP_201_CREATED
)
def create_lesson(
    section_id: IdPath, payload: LessonCreate, db: DbSession, user: TeacherUser
) -> LessonOut:
    section, _course = get_owned_section_or_403(db, section_id, user)
    _require_external_video_url(payload.video_url)
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
    section_id: IdPath, payload: LessonOrder, db: DbSession, user: TeacherUser
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
def read_lesson(lesson_id: IdPath, db: DbSession, user: OptionalUser) -> LessonOut:
    lesson, course = get_lesson_or_404(db, lesson_id)
    if not user_can_see_course(user, course):
        raise not_found(COURSE_NOT_FOUND)
    if not user_can_view_lesson(db, user, course, lesson):
        raise forbidden(LESSON_LOCKED)
    return lesson_out_for_user(db, course, lesson, user)


@router.patch("/lessons/{lesson_id}", response_model=LessonOut)
def update_lesson(
    lesson_id: IdPath, payload: LessonUpdate, db: DbSession, user: TeacherUser
) -> LessonOut:
    lesson, course = get_owned_lesson_or_403(db, lesson_id, user)
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("title") is not None:
        changes["title"] = changes["title"].strip()
    previous_video = lesson.video_url
    if "video_url" in changes and changes["video_url"] != previous_video:
        _require_external_video_url(changes["video_url"])
    for field, value in changes.items():
        if value is None and field not in ("description", "video_url"):
            continue
        setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    if previous_video != lesson.video_url:
        storage.delete_upload(previous_video, storage.VIDEO)
    return lesson_out_for_user(db, course, lesson, user)


@router.delete(
    "/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response
)
def delete_lesson(lesson_id: IdPath, db: DbSession, user: TeacherUser) -> Response:
    lesson, course = get_owned_lesson_or_403(db, lesson_id, user)
    files = storage.lesson_files([lesson])
    db.delete(lesson)
    unpublish_when_empty(db, course)
    db.commit()
    storage.delete_uploads(files)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
