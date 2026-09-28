from fastapi import APIRouter, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.common import (
    bad_request,
    conflict,
    forbidden,
    get_payment_or_404,
    get_visible_course_or_404,
)
from app.core.deps import CurrentUser, DbSession
from app.db.base import utcnow
from app.models import Payment, PaymentStatus
from app.schemas.payment import PaymentCreate, PaymentOut
from app.services.access import is_enrolled
from app.services.catalog import payment_out, payments_out
from app.services.enrollments import ensure_enrollment

router = APIRouter(tags=["payments"])

NOT_PAYMENT_OWNER = "Bu to'lov sizga tegishli emas"


def _own_payment(db: DbSession, payment_id: int, user: CurrentUser) -> Payment:
    payment = get_payment_or_404(db, payment_id)
    if payment.user_id != user.id:
        raise forbidden(NOT_PAYMENT_OWNER)
    return payment


@router.get("/me/payments", response_model=list[PaymentOut])
def my_payments(db: DbSession, user: CurrentUser) -> list[PaymentOut]:
    stmt = (
        select(Payment)
        .where(Payment.user_id == user.id)
        .order_by(Payment.created_at.desc(), Payment.id.desc())
        .options(selectinload(Payment.user), selectinload(Payment.course))
    )
    return payments_out(db, list(db.execute(stmt).scalars().all()))


@router.post("/payments", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment(payload: PaymentCreate, db: DbSession, user: CurrentUser) -> PaymentOut:
    course = get_visible_course_or_404(db, payload.course_id, user)
    if course.price == 0:
        raise bad_request("Bu kurs bepul, to'g'ridan-to'g'ri yozilishingiz mumkin")
    if is_enrolled(db, user.id, course.id):
        raise conflict("Siz bu kursga allaqachon yozilgansiz")
    payment = Payment(
        user_id=user.id, course_id=course.id, amount=course.price, status=PaymentStatus.pending
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment_out(db, payment)


@router.post("/payments/{payment_id}/confirm", response_model=PaymentOut)
def confirm_payment(payment_id: int, db: DbSession, user: CurrentUser) -> PaymentOut:
    payment = _own_payment(db, payment_id, user)
    if payment.status in (PaymentStatus.failed, PaymentStatus.refunded):
        raise conflict("Bu to'lov bekor qilingan")
    if payment.status == PaymentStatus.pending:
        payment.status = PaymentStatus.paid
        payment.paid_at = utcnow()
    ensure_enrollment(db, payment.user_id, payment.course_id)
    db.commit()
    db.refresh(payment)
    return payment_out(db, payment)


@router.post("/payments/{payment_id}/cancel", response_model=PaymentOut)
def cancel_payment(payment_id: int, db: DbSession, user: CurrentUser) -> PaymentOut:
    payment = _own_payment(db, payment_id, user)
    if payment.status != PaymentStatus.pending:
        raise conflict("Faqat kutilayotgan to'lovni bekor qilish mumkin")
    payment.status = PaymentStatus.failed
    db.commit()
    db.refresh(payment)
    return payment_out(db, payment)
