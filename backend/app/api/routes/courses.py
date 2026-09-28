from typing import Literal

from fastapi import APIRouter, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.api.common import (
    COURSE_NOT_FOUND,
    bad_request,
    get_category_or_404,
    get_owned_course_or_403,
    not_found,
)
from app.core.deps import DbSession, OptionalUser, TeacherUser
from app.models import Category, Course, CourseLevel, Lesson, Section
from app.schemas.common import Page
from app.schemas.course import CourseCard, CourseCreate, CourseDetail, CoursePublish, CourseUpdate
from app.services.access import user_can_see_course
from app.services.catalog import (
    count_rows,
    course_detail,
    courses_with_stats,
    fetch_cards,
    pages_for,
)
from app.services.slugs import generate_course_slug
from app.services.storage import delete_upload

router = APIRouter(prefix="/courses", tags=["courses"])

SortOption = Literal["newest", "popular", "rating", "price_asc", "price_desc"]
PriceFilter = Literal["free", "paid"]


@router.get("", response_model=Page[CourseCard])
def list_courses(
    db: DbSession,
    q: str | None = Query(default=None, max_length=200),
    category: str | None = Query(default=None, max_length=120),
    level: CourseLevel | None = None,
    price: PriceFilter | None = None,
    sort: SortOption = "newest",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=48),
) -> Page[CourseCard]:
    query = courses_with_stats()
    stmt = query.stmt.where(Course.is_published.is_(True))
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Course.title.ilike(pattern),
                Course.short_description.ilike(pattern),
                Course.description.ilike(pattern),
            )
        )
    if category:
        stmt = stmt.join(Category, Category.id == Course.category_id).where(
            Category.slug == category
        )
    if level is not None:
        stmt = stmt.where(Course.level == level)
    if price == "free":
        stmt = stmt.where(Course.price == 0)
    elif price == "paid":
        stmt = stmt.where(Course.price > 0)

    if sort == "popular":
        stmt = stmt.order_by(query.students_count.desc(), query.rating_avg.desc(), Course.id.desc())
    elif sort == "rating":
        stmt = stmt.order_by(query.rating_avg.desc(), query.students_count.desc(), Course.id.desc())
    elif sort == "price_asc":
        stmt = stmt.order_by(Course.price.asc(), Course.id.desc())
    elif sort == "price_desc":
        stmt = stmt.order_by(Course.price.desc(), Course.id.desc())
    else:
        stmt = stmt.order_by(Course.created_at.desc(), Course.id.desc())

    total = count_rows(db, stmt)
    items = fetch_cards(db, stmt.offset((page - 1) * page_size).limit(page_size))
    return Page(
        items=items, total=total, page=page, page_size=page_size, pages=pages_for(total, page_size)
    )


@router.get("/featured", response_model=list[CourseCard])
def featured_courses(db: DbSession) -> list[CourseCard]:
    query = courses_with_stats()
    stmt = (
        query.stmt.where(Course.is_published.is_(True))
        .order_by(query.students_count.desc(), query.rating_avg.desc(), Course.created_at.desc())
        .limit(6)
    )
    return fetch_cards(db, stmt)


@router.get("/{slug_or_id}", response_model=CourseDetail)
def read_course(slug_or_id: str, db: DbSession, user: OptionalUser) -> CourseDetail:
    """Course detail by slug (public links) or by numeric id (editor routes)."""
    key = Course.id == int(slug_or_id) if slug_or_id.isdigit() else Course.slug == slug_or_id
    stmt = (
        select(Course)
        .where(key)
        .options(
            selectinload(Course.sections).selectinload(Section.lessons),
            selectinload(Course.teacher),
            selectinload(Course.category),
        )
    )
    course = db.execute(stmt).scalar_one_or_none()
    if course is None or not user_can_see_course(user, course):
        raise not_found(COURSE_NOT_FOUND)
    return course_detail(db, course, user)


@router.post("", response_model=CourseDetail, status_code=status.HTTP_201_CREATED)
def create_course(payload: CourseCreate, db: DbSession, user: TeacherUser) -> CourseDetail:
    if payload.category_id is not None:
        get_category_or_404(db, payload.category_id)
    course = Course(
        title=payload.title.strip(),
        slug=generate_course_slug(db, payload.title),
        short_description=payload.short_description.strip(),
        description=payload.description.strip(),
        what_you_learn=[item.strip() for item in payload.what_you_learn if item.strip()],
        requirements=[item.strip() for item in payload.requirements if item.strip()],
        category_id=payload.category_id,
        teacher_id=user.id,
        level=payload.level,
        price=payload.price,
        language=payload.language,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course_detail(db, course, user)


@router.patch("/{course_id}", response_model=CourseDetail)
def update_course(
    course_id: int, payload: CourseUpdate, db: DbSession, user: TeacherUser
) -> CourseDetail:
    course = get_owned_course_or_403(db, course_id, user)
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("category_id") is not None:
        get_category_or_404(db, changes["category_id"])
    for field in ("title", "short_description", "description"):
        if changes.get(field) is not None:
            changes[field] = changes[field].strip()
    for field in ("what_you_learn", "requirements"):
        if changes.get(field) is not None:
            changes[field] = [item.strip() for item in changes[field] if item.strip()]
    for field, value in changes.items():
        if value is None and field != "category_id":
            continue
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course_detail(db, course, user)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_course(course_id: int, db: DbSession, user: TeacherUser) -> Response:
    course = get_owned_course_or_403(db, course_id, user)
    cover_url = course.cover_url
    db.delete(course)
    db.commit()
    delete_upload(cover_url)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{course_id}/publish", response_model=CourseDetail)
def publish_course(
    course_id: int, payload: CoursePublish, db: DbSession, user: TeacherUser
) -> CourseDetail:
    course = get_owned_course_or_403(db, course_id, user)
    if payload.is_published:
        lessons_count = db.execute(
            select(func.count(Lesson.id))
            .join(Section, Section.id == Lesson.section_id)
            .where(Section.course_id == course.id)
        ).scalar_one()
        if lessons_count == 0:
            raise bad_request("Nashr qilish uchun kamida bitta dars kerak")
    course.is_published = payload.is_published
    db.commit()
    db.refresh(course)
    return course_detail(db, course, user)
