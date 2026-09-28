from fastapi import APIRouter, Response, status
from sqlalchemy import select, update

from app.api.common import IdPath, conflict, get_category_or_404
from app.core.deps import AdminUser, DbSession
from app.models import Category, Course
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate
from app.services.catalog import category_course_counts, category_out
from app.services.slugs import generate_category_slug

router = APIRouter(prefix="/categories", tags=["categories"])

NAME_TAKEN = "Bunday nomli kategoriya allaqachon mavjud"


def _name_taken(db: DbSession, name: str, exclude_id: int | None = None) -> bool:
    stmt = select(Category.id).where(Category.name == name)
    if exclude_id is not None:
        stmt = stmt.where(Category.id != exclude_id)
    return db.execute(stmt).scalar_one_or_none() is not None


@router.get("", response_model=list[CategoryOut])
def list_categories(db: DbSession) -> list[CategoryOut]:
    counts = category_course_counts(db)
    categories = db.execute(select(Category).order_by(Category.name)).scalars().all()
    return [category_out(category, counts) for category in categories]


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: DbSession, _admin: AdminUser) -> CategoryOut:
    name = payload.name.strip()
    if _name_taken(db, name):
        raise conflict(NAME_TAKEN)
    category = Category(
        name=name,
        slug=generate_category_slug(db, name),
        icon=payload.icon,
        description=payload.description,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category_out(category, {})


@router.patch("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: IdPath, payload: CategoryUpdate, db: DbSession, _admin: AdminUser
) -> CategoryOut:
    category = get_category_or_404(db, category_id)
    changes = payload.model_dump(exclude_unset=True)
    if "name" in changes and changes["name"] is not None:
        name = changes["name"].strip()
        if _name_taken(db, name, exclude_id=category.id):
            raise conflict(NAME_TAKEN)
        category.name = name
        category.slug = generate_category_slug(db, name, exclude_id=category.id)
    if "icon" in changes:
        category.icon = changes["icon"]
    if "description" in changes:
        category.description = changes["description"]
    db.commit()
    db.refresh(category)
    return category_out(category, category_course_counts(db))


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_category(category_id: IdPath, db: DbSession, _admin: AdminUser) -> Response:
    category = get_category_or_404(db, category_id)
    db.execute(update(Course).where(Course.category_id == category.id).values(category_id=None))
    db.delete(category)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
