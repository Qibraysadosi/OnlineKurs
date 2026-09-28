from datetime import timedelta

from fastapi import APIRouter, Query, Response, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import selectinload

from app.api.common import IdPath, bad_request, conflict, get_payment_or_404, get_user_or_404
from app.core.deps import AdminUser, DbSession
from app.db.base import utcnow
from app.models import Course, Enrollment, Payment, PaymentStatus, User, UserRole
from app.schemas.admin import AdminStats, MonthlyRevenue
from app.schemas.common import Page
from app.schemas.course import CourseCard
from app.schemas.payment import PaymentOut, PaymentStatusUpdate
from app.schemas.user import AdminUserUpdate, UserPublic
from app.services.catalog import (
    count_rows,
    courses_with_stats,
    fetch_cards,
    pages_for,
    payment_out,
    payments_out,
)
from app.services import storage
from app.services.enrollments import ensure_enrollment, remove_enrollment

router = APIRouter(prefix="/admin", tags=["admin"])


def _month_start(year: int, month: int):
    return utcnow().replace(
        year=year, month=month, day=1, hour=0, minute=0, second=0, microsecond=0
    )


def _last_six_months() -> list[tuple[int, int]]:
    now = utcnow()
    year, month = now.year, now.month
    months: list[tuple[int, int]] = []
    for _ in range(6):
        months.append((year, month))
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    return list(reversed(months))


@router.get("/stats", response_model=AdminStats)
def admin_stats(db: DbSession, _admin: AdminUser) -> AdminStats:
    def count(stmt) -> int:
        return int(db.execute(stmt).scalar_one())

    paid = Payment.status == PaymentStatus.paid
    now = utcnow()
    months = _last_six_months()
    window_start = _month_start(*months[0])

    paid_payments = db.execute(
        select(Payment.amount, Payment.paid_at).where(paid, Payment.paid_at >= window_start)
    ).all()
    buckets = {f"{year:04d}-{month:02d}": [0, 0] for year, month in months}
    for amount, paid_at in paid_payments:
        key = paid_at.strftime("%Y-%m")
        if key in buckets:
            buckets[key][0] += int(amount)
            buckets[key][1] += 1

    recent_stmt = (
        select(Payment)
        .order_by(Payment.created_at.desc(), Payment.id.desc())
        .limit(10)
        .options(selectinload(Payment.user), selectinload(Payment.course))
    )
    recent = list(db.execute(recent_stmt).scalars().all())

    top_query = courses_with_stats()
    top_courses = fetch_cards(
        db,
        top_query.stmt.order_by(
            top_query.students_count.desc(), top_query.rating_avg.desc(), Course.id.desc()
        ).limit(5),
    )

    return AdminStats(
        users_count=count(select(func.count(User.id))),
        students_count=count(select(func.count(User.id)).where(User.role == UserRole.student)),
        teachers_count=count(select(func.count(User.id)).where(User.role == UserRole.teacher)),
        courses_count=count(select(func.count(Course.id))),
        published_courses_count=count(
            select(func.count(Course.id)).where(Course.is_published.is_(True))
        ),
        enrollments_count=count(select(func.count(Enrollment.id))),
        revenue_total=count(select(func.coalesce(func.sum(Payment.amount), 0)).where(paid)),
        revenue_last_30_days=count(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                paid, Payment.paid_at >= now - timedelta(days=30)
            )
        ),
        recent_payments=payments_out(db, recent),
        monthly_revenue=[
            MonthlyRevenue(month=month, revenue=values[0], payments_count=values[1])
            for month, values in buckets.items()
        ],
        top_courses=top_courses,
    )


@router.get("/users", response_model=Page[UserPublic])
def list_users(
    db: DbSession,
    _admin: AdminUser,
    q: str | None = Query(default=None, max_length=200),
    role: UserRole | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> Page[UserPublic]:
    stmt = select(User)
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(or_(User.full_name.ilike(pattern), User.email.ilike(pattern)))
    if role is not None:
        stmt = stmt.where(User.role == role)
    stmt = stmt.order_by(User.created_at.desc(), User.id.desc())
    total = count_rows(db, stmt)
    users = db.execute(stmt.offset((page - 1) * page_size).limit(page_size)).scalars().all()
    return Page(
        items=[UserPublic.model_validate(user) for user in users],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages_for(total, page_size),
    )


@router.patch("/users/{user_id}", response_model=UserPublic)
def update_user(
    user_id: IdPath, payload: AdminUserUpdate, db: DbSession, admin: AdminUser
) -> UserPublic:
    user = get_user_or_404(db, user_id)
    changes = payload.model_dump(exclude_unset=True)
    if user.id == admin.id and (
        changes.get("role") not in (None, UserRole.admin) or changes.get("is_active") is False
    ):
        raise bad_request("O'zingizning huquqlaringizni o'zgartira olmaysiz")
    if changes.get("role") is not None:
        user.role = changes["role"]
    if changes.get("is_active") is not None:
        user.is_active = changes["is_active"]
    db.commit()
    db.refresh(user)
    return UserPublic.model_validate(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_user(user_id: IdPath, db: DbSession, admin: AdminUser) -> Response:
    user = get_user_or_404(db, user_id)
    if user.id == admin.id:
        raise bad_request("O'zingizni o'chira olmaysiz")
    # Settled payments (the user's own, or on courses they teach) are revenue history.
    settled = Payment.status.in_([PaymentStatus.paid, PaymentStatus.refunded])
    owned = select(Course.id).where(Course.teacher_id == user.id)
    involved = or_(Payment.user_id == user.id, Payment.course_id.in_(owned))
    if db.execute(select(Payment.id).where(settled, involved)).first() is not None:
        raise conflict(
            "Foydalanuvchi to'lovlar bilan bog'liq; uni o'chirish o'rniga faolsizlantiring"
        )
    files = storage.user_files(user)
    db.execute(delete(Payment).where(involved))
    db.delete(user)
    db.commit()
    storage.delete_uploads(files)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/courses", response_model=Page[CourseCard])
def list_all_courses(
    db: DbSession,
    _admin: AdminUser,
    q: str | None = Query(default=None, max_length=200),
    is_published: bool | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> Page[CourseCard]:
    query = courses_with_stats()
    stmt = query.stmt
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(or_(Course.title.ilike(pattern), Course.short_description.ilike(pattern)))
    if is_published is not None:
        stmt = stmt.where(Course.is_published.is_(is_published))
    stmt = stmt.order_by(Course.created_at.desc(), Course.id.desc())
    total = count_rows(db, stmt)
    items = fetch_cards(db, stmt.offset((page - 1) * page_size).limit(page_size))
    return Page(
        items=items, total=total, page=page, page_size=page_size, pages=pages_for(total, page_size)
    )


@router.get("/payments", response_model=Page[PaymentOut])
def list_payments(
    db: DbSession,
    _admin: AdminUser,
    status_filter: PaymentStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> Page[PaymentOut]:
    stmt = select(Payment).options(selectinload(Payment.user), selectinload(Payment.course))
    if status_filter is not None:
        stmt = stmt.where(Payment.status == status_filter)
    stmt = stmt.order_by(Payment.created_at.desc(), Payment.id.desc())
    total = count_rows(db, stmt)
    payments = list(
        db.execute(stmt.offset((page - 1) * page_size).limit(page_size)).scalars().all()
    )
    return Page(
        items=payments_out(db, payments),
        total=total,
        page=page,
        page_size=page_size,
        pages=pages_for(total, page_size),
    )


@router.patch("/payments/{payment_id}", response_model=PaymentOut)
def update_payment(
    payment_id: IdPath, payload: PaymentStatusUpdate, db: DbSession, _admin: AdminUser
) -> PaymentOut:
    payment = get_payment_or_404(db, payment_id)
    payment.status = payload.status
    if payload.status == PaymentStatus.paid:
        if payment.paid_at is None:
            payment.paid_at = utcnow()
        ensure_enrollment(db, payment.user_id, payment.course_id)
    elif payload.status == PaymentStatus.refunded:
        other_paid = db.execute(
            select(Payment.id).where(
                Payment.user_id == payment.user_id,
                Payment.course_id == payment.course_id,
                Payment.id != payment.id,
                Payment.status == PaymentStatus.paid,
            )
        ).first()
        if other_paid is None:
            remove_enrollment(db, payment.user_id, payment.course_id)
    db.commit()
    db.refresh(payment)
    return payment_out(db, payment)
