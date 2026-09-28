from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, PkCreatedMixin
from app.models.enums import PaymentStatus

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.user import User


class Payment(PkCreatedMixin, Base):
    __tablename__ = "payments"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, native_enum=False, length=20),
        default=PaymentStatus.pending,
        nullable=False,
        index=True,
    )
    provider: Mapped[str] = mapped_column(String(30), default="mock", nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="payments")
    course: Mapped["Course"] = relationship(back_populates="payments")
