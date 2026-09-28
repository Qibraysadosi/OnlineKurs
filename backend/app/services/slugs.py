"""Unique slug generation for courses and categories (suffixes -2, -3, ... on collision)."""

from slugify import slugify
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import InstrumentedAttribute

from app.models import Category, Course

APOSTROPHES = [("'", ""), ("ʻ", ""), ("’", ""), ("`", "")]


def _base_slug(text: str, max_length: int) -> str:
    return (
        slugify(text, max_length=max_length, word_boundary=True, replacements=APOSTROPHES) or "item"
    )


def _unique_slug(
    db: Session,
    column: InstrumentedAttribute,
    id_column: InstrumentedAttribute,
    base: str,
    exclude_id: int | None,
) -> str:
    stmt = select(column).where(column.like(f"{base}%"))
    if exclude_id is not None:
        stmt = stmt.where(id_column != exclude_id)
    taken = set(db.execute(stmt).scalars().all())
    if base not in taken:
        return base
    suffix = 2
    while f"{base}-{suffix}" in taken:
        suffix += 1
    return f"{base}-{suffix}"


def generate_course_slug(db: Session, title: str) -> str:
    return _unique_slug(db, Course.slug, Course.id, _base_slug(title, 200), None)


def generate_category_slug(db: Session, name: str, exclude_id: int | None = None) -> str:
    return _unique_slug(db, Category.slug, Category.id, _base_slug(name, 100), exclude_id)
