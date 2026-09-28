"""Course statistics (aggregates) and serialization into API response schemas."""

from dataclasses import dataclass
from math import ceil

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    Category,
    Course,
    Enrollment,
    Lesson,
    LessonProgress,
    Payment,
    Review,
    Section,
    User,
)
from app.schemas.category import CategoryOut
from app.schemas.course import CourseCard, CourseDetail
from app.schemas.enrollment import EnrollmentOut
from app.schemas.lesson import LessonOut
from app.schemas.payment import PaymentOut
from app.schemas.review import ReviewOut
from app.schemas.section import SectionOut
from app.schemas.user import ReviewAuthor, TeacherMini, UserPublic
from app.services.access import user_has_course_access
from app.services.progress import calculate_course_progress


@dataclass(frozen=True)
class CourseStats:
    lessons_count: int = 0
    duration_minutes: int = 0
    reviews_count: int = 0
    rating_avg: float = 0.0
    students_count: int = 0


@dataclass(frozen=True)
class CourseStatsQuery:
    """A select of (Course, *stats) plus the stat expressions available for ordering."""

    stmt: Select
    students_count: object
    rating_avg: object


def category_course_counts(db: Session) -> dict[int, int]:
    """Published course count per category id."""
    stmt = (
        select(Course.category_id, func.count(Course.id))
        .where(Course.is_published.is_(True), Course.category_id.is_not(None))
        .group_by(Course.category_id)
    )
    return {category_id: count for category_id, count in db.execute(stmt).all()}


def category_out(category: Category | None, counts: dict[int, int]) -> CategoryOut | None:
    if category is None:
        return None
    return CategoryOut(
        id=category.id,
        name=category.name,
        slug=category.slug,
        icon=category.icon,
        description=category.description,
        courses_count=counts.get(category.id, 0),
    )


def courses_with_stats() -> CourseStatsQuery:
    lessons_sq = (
        select(
            Section.course_id.label("course_id"),
            func.count(Lesson.id).label("lessons_count"),
            func.coalesce(func.sum(Lesson.duration_minutes), 0).label("duration_minutes"),
        )
        .join(Lesson, Lesson.section_id == Section.id)
        .group_by(Section.course_id)
        .subquery()
    )
    reviews_sq = (
        select(
            Review.course_id.label("course_id"),
            func.count(Review.id).label("reviews_count"),
            func.avg(Review.rating).label("rating_avg"),
        )
        .group_by(Review.course_id)
        .subquery()
    )
    enrollments_sq = (
        select(
            Enrollment.course_id.label("course_id"),
            func.count(Enrollment.id).label("students_count"),
        )
        .group_by(Enrollment.course_id)
        .subquery()
    )
    students_count = func.coalesce(enrollments_sq.c.students_count, 0)
    rating_avg = func.coalesce(reviews_sq.c.rating_avg, 0.0)
    stmt = (
        select(
            Course,
            func.coalesce(lessons_sq.c.lessons_count, 0),
            func.coalesce(lessons_sq.c.duration_minutes, 0),
            func.coalesce(reviews_sq.c.reviews_count, 0),
            rating_avg,
            students_count,
        )
        .outerjoin(lessons_sq, lessons_sq.c.course_id == Course.id)
        .outerjoin(reviews_sq, reviews_sq.c.course_id == Course.id)
        .outerjoin(enrollments_sq, enrollments_sq.c.course_id == Course.id)
        .options(selectinload(Course.teacher), selectinload(Course.category))
    )
    return CourseStatsQuery(stmt=stmt, students_count=students_count, rating_avg=rating_avg)


def _row_stats(row) -> CourseStats:
    return CourseStats(
        lessons_count=int(row[1]),
        duration_minutes=int(row[2]),
        reviews_count=int(row[3]),
        rating_avg=round(float(row[4]), 1),
        students_count=int(row[5]),
    )


def fetch_cards(db: Session, stmt: Select) -> list[CourseCard]:
    rows = db.execute(stmt).all()
    counts = category_course_counts(db)
    return [course_card(row[0], _row_stats(row), counts) for row in rows]


def count_rows(db: Session, stmt: Select) -> int:
    return db.execute(select(func.count()).select_from(stmt.order_by(None).subquery())).scalar_one()


def pages_for(total: int, page_size: int) -> int:
    return max(1, ceil(total / page_size)) if total else 0


def course_stats(db: Session, course_id: int) -> CourseStats:
    query = courses_with_stats()
    row = db.execute(query.stmt.where(Course.id == course_id)).first()
    return _row_stats(row) if row is not None else CourseStats()


def teacher_mini(user: User) -> TeacherMini:
    return TeacherMini(
        id=user.id, full_name=user.full_name, avatar_url=user.avatar_url, bio=user.bio
    )


def course_card(course: Course, stats: CourseStats, counts: dict[int, int]) -> CourseCard:
    return CourseCard(
        id=course.id,
        title=course.title,
        slug=course.slug,
        short_description=course.short_description,
        cover_url=course.cover_url,
        price=course.price,
        level=course.level,
        language=course.language,
        is_published=course.is_published,
        category=category_out(course.category, counts),
        teacher=teacher_mini(course.teacher),
        rating_avg=stats.rating_avg,
        reviews_count=stats.reviews_count,
        students_count=stats.students_count,
        lessons_count=stats.lessons_count,
        duration_minutes=stats.duration_minutes,
        created_at=course.created_at,
    )


def card_for_course(db: Session, course: Course) -> CourseCard:
    return course_card(course, course_stats(db, course.id), category_course_counts(db))


def completed_lesson_ids(db: Session, user: User | None, course_id: int) -> set[int]:
    if user is None:
        return set()
    stmt = (
        select(LessonProgress.lesson_id)
        .join(Lesson, Lesson.id == LessonProgress.lesson_id)
        .join(Section, Section.id == Lesson.section_id)
        .where(Section.course_id == course_id, LessonProgress.user_id == user.id)
    )
    return set(db.execute(stmt).scalars().all())


def lesson_out(lesson: Lesson, course_access: bool, completed: set[int]) -> LessonOut:
    has_access = course_access or lesson.is_free_preview
    return LessonOut(
        id=lesson.id,
        title=lesson.title,
        description=lesson.description,
        duration_minutes=lesson.duration_minutes,
        position=lesson.position,
        is_free_preview=lesson.is_free_preview,
        has_access=has_access,
        is_completed=lesson.id in completed,
        video_url=lesson.video_url if has_access else None,
        attachment_url=lesson.attachment_url if has_access else None,
        attachment_name=lesson.attachment_name if has_access else None,
    )


def section_out(section: Section, course_access: bool, completed: set[int]) -> SectionOut:
    lessons = sorted(section.lessons, key=lambda item: (item.position, item.id))
    return SectionOut(
        id=section.id,
        title=section.title,
        position=section.position,
        lessons=[lesson_out(lesson, course_access, completed) for lesson in lessons],
    )


def sections_for_course(db: Session, course: Course, user: User | None) -> list[SectionOut]:
    access = user_has_course_access(db, user, course)
    completed = completed_lesson_ids(db, user, course.id)
    sections = sorted(course.sections, key=lambda item: (item.position, item.id))
    return [section_out(section, access, completed) for section in sections]


def lesson_out_for_user(
    db: Session, course: Course, lesson: Lesson, user: User | None
) -> LessonOut:
    access = user_has_course_access(db, user, course)
    completed = completed_lesson_ids(db, user, course.id)
    return lesson_out(lesson, access, completed)


def course_detail(db: Session, course: Course, user: User | None) -> CourseDetail:
    card = card_for_course(db, course)
    access = user_has_course_access(db, user, course)
    completed = completed_lesson_ids(db, user, course.id)
    sections = sorted(course.sections, key=lambda item: (item.position, item.id))
    enrolled = False
    progress_percent: int | None = None
    if user is not None:
        stmt = select(Enrollment.id).where(
            Enrollment.user_id == user.id, Enrollment.course_id == course.id
        )
        enrolled = db.execute(stmt).scalar_one_or_none() is not None
        if enrolled:
            progress_percent = calculate_course_progress(db, user.id, course.id).progress_percent
    return CourseDetail(
        **card.model_dump(),
        description=course.description,
        what_you_learn=list(course.what_you_learn or []),
        requirements=list(course.requirements or []),
        updated_at=course.updated_at,
        sections=[section_out(section, access, completed) for section in sections],
        has_access=access,
        is_enrolled=enrolled,
        progress_percent=progress_percent,
    )


def enrollment_out(db: Session, enrollment: Enrollment, card: CourseCard) -> EnrollmentOut:
    progress = calculate_course_progress(db, enrollment.user_id, enrollment.course_id)
    return EnrollmentOut(
        id=enrollment.id,
        course=card,
        progress_percent=progress.progress_percent,
        completed_lessons=progress.completed_lessons,
        total_lessons=progress.total_lessons,
        last_lesson_id=progress.last_lesson_id,
        created_at=enrollment.created_at,
    )


def cards_by_id(db: Session, course_ids: list[int]) -> dict[int, CourseCard]:
    if not course_ids:
        return {}
    query = courses_with_stats()
    cards = fetch_cards(db, query.stmt.where(Course.id.in_(set(course_ids))))
    return {card.id: card for card in cards}


def payments_out(db: Session, payments: list[Payment]) -> list[PaymentOut]:
    cards = cards_by_id(db, [payment.course_id for payment in payments])
    return [
        PaymentOut(
            id=payment.id,
            user=UserPublic.model_validate(payment.user),
            course=cards[payment.course_id],
            amount=payment.amount,
            status=payment.status,
            provider=payment.provider,
            created_at=payment.created_at,
            paid_at=payment.paid_at,
        )
        for payment in payments
    ]


def payment_out(db: Session, payment: Payment) -> PaymentOut:
    return payments_out(db, [payment])[0]


def review_out(review: Review) -> ReviewOut:
    return ReviewOut(
        id=review.id,
        user=ReviewAuthor(
            id=review.user.id, full_name=review.user.full_name, avatar_url=review.user.avatar_url
        ),
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
    )
