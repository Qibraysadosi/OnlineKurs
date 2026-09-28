"""Multipart upload endpoints: avatars, course covers, lesson videos and attachments."""

from fastapi import APIRouter, File, UploadFile

from app.api.common import IdPath, get_owned_course_or_403, get_owned_lesson_or_403
from app.core.deps import CurrentUser, DbSession, TeacherUser
from app.schemas.course import CourseDetail
from app.schemas.lesson import LessonOut
from app.schemas.user import UserPublic
from app.services import storage
from app.services.catalog import course_detail, lesson_out_for_user

router = APIRouter(tags=["uploads"])

ATTACHMENT_NAME_MAX = 200


@router.post("/auth/me/avatar", response_model=UserPublic)
async def upload_avatar(
    db: DbSession, user: CurrentUser, file: UploadFile = File(...)
) -> UserPublic:
    url = await storage.save_upload(file, storage.AVATAR)
    previous = user.avatar_url
    user.avatar_url = url
    db.commit()
    db.refresh(user)
    storage.delete_upload(previous, storage.AVATAR)
    return UserPublic.model_validate(user)


@router.post("/courses/{course_id}/cover", response_model=CourseDetail)
async def upload_cover(
    course_id: IdPath, db: DbSession, user: TeacherUser, file: UploadFile = File(...)
) -> CourseDetail:
    course = get_owned_course_or_403(db, course_id, user)
    url = await storage.save_upload(file, storage.COVER)
    previous = course.cover_url
    course.cover_url = url
    db.commit()
    db.refresh(course)
    storage.delete_upload(previous, storage.COVER)
    return course_detail(db, course, user)


@router.post("/lessons/{lesson_id}/video", response_model=LessonOut)
async def upload_video(
    lesson_id: IdPath, db: DbSession, user: TeacherUser, file: UploadFile = File(...)
) -> LessonOut:
    lesson, course = get_owned_lesson_or_403(db, lesson_id, user)
    url = await storage.save_upload(file, storage.VIDEO)
    previous = lesson.video_url
    lesson.video_url = url
    db.commit()
    db.refresh(lesson)
    storage.delete_upload(previous, storage.VIDEO)
    return lesson_out_for_user(db, course, lesson, user)


@router.post("/lessons/{lesson_id}/attachment", response_model=LessonOut)
async def upload_attachment(
    lesson_id: IdPath, db: DbSession, user: TeacherUser, file: UploadFile = File(...)
) -> LessonOut:
    lesson, course = get_owned_lesson_or_403(db, lesson_id, user)
    url = await storage.save_upload(file, storage.ATTACHMENT)
    previous = lesson.attachment_url
    lesson.attachment_url = url
    lesson.attachment_name = (file.filename or "fayl")[:ATTACHMENT_NAME_MAX]
    db.commit()
    db.refresh(lesson)
    storage.delete_upload(previous, storage.ATTACHMENT)
    return lesson_out_for_user(db, course, lesson, user)
