"""Upload storage: validates, streams to disk under UPLOAD_DIR and builds absolute URLs."""

import logging
import re
import uuid
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.models import Course, Lesson, User

logger = logging.getLogger("onlinekurs.storage")

CHUNK_SIZE = 1024 * 1024
SUBDIRS = ("avatars", "covers", "videos", "attachments", "seed")
# Stored filenames are always `uuid4.hex + "." + extension` (see save_upload).
STORED_FILENAME_RE = re.compile(r"^[0-9a-f]{32}\.([a-z0-9]{1,10})$")

UploadRef = tuple[str | None, "UploadKind"]


@dataclass(frozen=True)
class UploadKind:
    subdir: str
    extensions: frozenset[str]
    mime_prefixes: tuple[str, ...]
    max_bytes: int
    type_error: str
    size_error: str


IMAGE_KIND_ERROR = "Faqat rasm fayllari qabul qilinadi (jpg, png, webp, gif)"
IMAGE_MAX_BYTES = 5 * 1024 * 1024

AVATAR = UploadKind(
    subdir="avatars",
    extensions=frozenset({"jpg", "jpeg", "png", "webp", "gif"}),
    mime_prefixes=("image/",),
    max_bytes=IMAGE_MAX_BYTES,
    type_error=IMAGE_KIND_ERROR,
    size_error="Rasm hajmi 5 MB dan oshmasligi kerak",
)
COVER = UploadKind(
    subdir="covers",
    extensions=AVATAR.extensions,
    mime_prefixes=("image/",),
    max_bytes=IMAGE_MAX_BYTES,
    type_error=IMAGE_KIND_ERROR,
    size_error="Rasm hajmi 5 MB dan oshmasligi kerak",
)
VIDEO = UploadKind(
    subdir="videos",
    extensions=frozenset({"mp4", "webm", "mov"}),
    mime_prefixes=("video/",),
    max_bytes=settings.max_upload_bytes,
    type_error="Faqat video fayllari qabul qilinadi (mp4, webm, mov)",
    size_error=f"Video hajmi {settings.MAX_UPLOAD_MB} MB dan oshmasligi kerak",
)
ATTACHMENT = UploadKind(
    subdir="attachments",
    extensions=frozenset({"pdf", "zip", "docx", "pptx", "xlsx", "txt"}),
    mime_prefixes=(),
    max_bytes=50 * 1024 * 1024,
    type_error="Faqat pdf, zip, docx, pptx, xlsx yoki txt fayllari qabul qilinadi",
    size_error="Fayl hajmi 50 MB dan oshmasligi kerak",
)


def ensure_upload_dirs() -> None:
    for subdir in SUBDIRS:
        (settings.UPLOAD_DIR / subdir).mkdir(parents=True, exist_ok=True)


def public_url(subdir: str, filename: str) -> str:
    return f"{settings.BACKEND_URL}/uploads/{subdir}/{filename}"


def _extension(filename: str | None) -> str:
    if not filename or "." not in filename:
        return ""
    return filename.rsplit(".", 1)[1].lower()


def _validate(file: UploadFile, kind: UploadKind) -> str:
    extension = _extension(file.filename)
    content_type = file.content_type or ""
    mime_ok = not kind.mime_prefixes or any(content_type.startswith(p) for p in kind.mime_prefixes)
    if extension not in kind.extensions or not mime_ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=kind.type_error)
    return extension


async def save_upload(file: UploadFile, kind: UploadKind) -> str:
    """Stream the upload to disk and return its absolute public URL."""
    extension = _validate(file, kind)
    target_dir = settings.UPLOAD_DIR / kind.subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{extension}"
    target = target_dir / filename
    written = 0
    async with aiofiles.open(target, "wb") as out:
        while chunk := await file.read(CHUNK_SIZE):
            written += len(chunk)
            if written > kind.max_bytes:
                await out.close()
                target.unlink(missing_ok=True)
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=kind.size_error)
            await out.write(chunk)
    if written == 0:
        target.unlink(missing_ok=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fayl bo'sh")
    return public_url(kind.subdir, filename)


def is_uploaded_url(url: str | None) -> bool:
    """True when the URL points into this backend's own /uploads/ folder."""
    return bool(url) and str(url).startswith(f"{settings.BACKEND_URL}/uploads/")


def delete_upload(url: str | None, kind: UploadKind) -> None:
    """Remove a file previously stored by `save_upload(..., kind)`.

    Only URLs that point at `kind.subdir` with a generated filename and an allowed
    extension are touched, so a planted URL can never reach another kind of file.
    """
    if not url or not is_uploaded_url(url):
        return
    relative = url[len(f"{settings.BACKEND_URL}/uploads/") :]
    subdir, _, filename = relative.partition("/")
    match = STORED_FILENAME_RE.match(filename)
    if subdir != kind.subdir or match is None or match.group(1) not in kind.extensions:
        return
    path: Path = settings.UPLOAD_DIR / subdir / filename
    try:
        path.unlink(missing_ok=True)
    except OSError:
        logger.warning("Could not delete upload %s", path)


def delete_uploads(refs: Iterable[UploadRef]) -> None:
    for url, kind in refs:
        delete_upload(url, kind)


def lesson_files(lessons: Iterable[Lesson]) -> list[UploadRef]:
    refs: list[UploadRef] = []
    for lesson in lessons:
        refs.append((lesson.video_url, VIDEO))
        refs.append((lesson.attachment_url, ATTACHMENT))
    return refs


def course_files(course: Course) -> list[UploadRef]:
    """Cover plus every lesson video/attachment; collect before deleting the course."""
    refs: list[UploadRef] = [(course.cover_url, COVER)]
    for section in course.sections:
        refs.extend(lesson_files(section.lessons))
    return refs


def user_files(user: User) -> list[UploadRef]:
    """Avatar plus the files of every course the user teaches."""
    refs: list[UploadRef] = [(user.avatar_url, AVATAR)]
    for course in user.courses:
        refs.extend(course_files(course))
    return refs
