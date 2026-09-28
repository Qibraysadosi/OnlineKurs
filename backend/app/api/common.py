"""Lookup helpers shared by route modules; they raise the API's Uzbek HTTP errors."""

from typing import Annotated

from fastapi import HTTPException, Path, status
from sqlalchemy.orm import Session, selectinload

from app.models import Category, Course, Lesson, Payment, Section, User
from app.services.access import user_can_manage_course, user_can_see_course

COURSE_NOT_FOUND = "Kurs topilmadi"
SECTION_NOT_FOUND = "Bo'lim topilmadi"
LESSON_NOT_FOUND = "Dars topilmadi"
CATEGORY_NOT_FOUND = "Kategoriya topilmadi"
USER_NOT_FOUND = "Foydalanuvchi topilmadi"
PAYMENT_NOT_FOUND = "To'lov topilmadi"
NOT_COURSE_OWNER = "Bu kursni tahrirlash huquqingiz yo'q"

# Bounded numeric path parameter: ids beyond the SQL integer range would otherwise blow up
# in the database driver (OverflowError -> 500) instead of answering 404/422.
IdPath = Annotated[int, Path(ge=1, le=2_147_483_647)]


def not_found(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def forbidden(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def conflict(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)


def bad_request(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def get_course_or_404(db: Session, course_id: int) -> Course:
    course = db.get(
        Course, course_id, options=[selectinload(Course.sections).selectinload(Section.lessons)]
    )
    if course is None:
        raise not_found(COURSE_NOT_FOUND)
    return course


def get_visible_course_or_404(db: Session, course_id: int, user: User | None) -> Course:
    course = get_course_or_404(db, course_id)
    if not user_can_see_course(user, course):
        raise not_found(COURSE_NOT_FOUND)
    return course


def get_owned_course_or_403(db: Session, course_id: int, user: User) -> Course:
    course = get_course_or_404(db, course_id)
    if not user_can_manage_course(user, course):
        raise forbidden(NOT_COURSE_OWNER)
    return course


def get_section_or_404(db: Session, section_id: int) -> Section:
    section = db.get(Section, section_id, options=[selectinload(Section.lessons)])
    if section is None:
        raise not_found(SECTION_NOT_FOUND)
    return section


def get_owned_section_or_403(db: Session, section_id: int, user: User) -> tuple[Section, Course]:
    section = get_section_or_404(db, section_id)
    course = get_owned_course_or_403(db, section.course_id, user)
    return section, course


def get_lesson_or_404(db: Session, lesson_id: int) -> tuple[Lesson, Course]:
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise not_found(LESSON_NOT_FOUND)
    course = get_course_or_404(db, lesson.section.course_id)
    return lesson, course


def get_owned_lesson_or_403(db: Session, lesson_id: int, user: User) -> tuple[Lesson, Course]:
    lesson, course = get_lesson_or_404(db, lesson_id)
    if not user_can_manage_course(user, course):
        raise forbidden(NOT_COURSE_OWNER)
    return lesson, course


def get_category_or_404(db: Session, category_id: int) -> Category:
    category = db.get(Category, category_id)
    if category is None:
        raise not_found(CATEGORY_NOT_FOUND)
    return category


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise not_found(USER_NOT_FOUND)
    return user


def get_payment_or_404(db: Session, payment_id: int) -> Payment:
    payment = db.get(
        Payment, payment_id, options=[selectinload(Payment.user), selectinload(Payment.course)]
    )
    if payment is None:
        raise not_found(PAYMENT_NOT_FOUND)
    return payment
