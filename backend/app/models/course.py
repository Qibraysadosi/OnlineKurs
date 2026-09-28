from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, PkCreatedMixin, utcnow
from app.models.enums import CourseLevel

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.enrollment import Enrollment
    from app.models.payment import Payment
    from app.models.review import Review
    from app.models.section import Section
    from app.models.user import User


class Course(PkCreatedMixin, Base):
    __tablename__ = "courses"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True, nullable=False)
    short_description: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    what_you_learn: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    requirements: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    teacher_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    level: Mapped[CourseLevel] = mapped_column(
        Enum(CourseLevel, native_enum=False, length=20),
        default=CourseLevel.beginner,
        nullable=False,
    )
    price: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="uz", nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=utcnow, onupdate=utcnow, server_default=func.now()
    )

    teacher: Mapped["User"] = relationship(back_populates="courses")
    category: Mapped["Category | None"] = relationship(back_populates="courses")
    sections: Mapped[list["Section"]] = relationship(
        back_populates="course",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Section.position",
    )
    enrollments: Mapped[list["Enrollment"]] = relationship(
        back_populates="course", cascade="all, delete-orphan", passive_deletes=True
    )
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="course", cascade="all, delete-orphan", passive_deletes=True
    )
    payments: Mapped[list["Payment"]] = relationship(
        back_populates="course", cascade="all, delete-orphan", passive_deletes=True
    )
