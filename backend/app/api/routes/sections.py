from fastapi import APIRouter, Response, status
from sqlalchemy import func, select

from app.api.common import IdPath, bad_request, get_owned_course_or_403, get_owned_section_or_403
from app.core.deps import DbSession, TeacherUser
from app.models import Section
from app.schemas.section import SectionCreate, SectionOrder, SectionOut, SectionUpdate
from app.services import storage
from app.services.catalog import section_out, sections_for_course, unpublish_when_empty

router = APIRouter(tags=["sections"])


@router.post(
    "/courses/{course_id}/sections", response_model=SectionOut, status_code=status.HTTP_201_CREATED
)
def create_section(
    course_id: IdPath, payload: SectionCreate, db: DbSession, user: TeacherUser
) -> SectionOut:
    course = get_owned_course_or_403(db, course_id, user)
    max_position = db.execute(
        select(func.coalesce(func.max(Section.position), 0)).where(Section.course_id == course.id)
    ).scalar_one()
    section = Section(course_id=course.id, title=payload.title.strip(), position=max_position + 1)
    db.add(section)
    db.commit()
    db.refresh(section)
    return section_out(section, True, set())


@router.put("/courses/{course_id}/sections/order", response_model=list[SectionOut])
def reorder_sections(
    course_id: IdPath, payload: SectionOrder, db: DbSession, user: TeacherUser
) -> list[SectionOut]:
    course = get_owned_course_or_403(db, course_id, user)
    sections = {section.id: section for section in course.sections}
    if sorted(payload.section_ids) != sorted(sections) or len(set(payload.section_ids)) != len(
        payload.section_ids
    ):
        raise bad_request("Bo'limlar ro'yxati noto'g'ri")
    for position, section_id in enumerate(payload.section_ids, start=1):
        sections[section_id].position = position
    db.commit()
    db.expire(course, ["sections"])
    return sections_for_course(db, course, user)


@router.patch("/sections/{section_id}", response_model=SectionOut)
def update_section(
    section_id: IdPath, payload: SectionUpdate, db: DbSession, user: TeacherUser
) -> SectionOut:
    section, _course = get_owned_section_or_403(db, section_id, user)
    if payload.title is not None:
        section.title = payload.title.strip()
    db.commit()
    db.refresh(section)
    return section_out(section, True, set())


@router.delete(
    "/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response
)
def delete_section(section_id: IdPath, db: DbSession, user: TeacherUser) -> Response:
    section, course = get_owned_section_or_403(db, section_id, user)
    files = storage.lesson_files(section.lessons)
    db.delete(section)
    unpublish_when_empty(db, course)
    db.commit()
    storage.delete_uploads(files)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
