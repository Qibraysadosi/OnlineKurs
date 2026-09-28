from fastapi import APIRouter, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.common import forbidden, get_visible_course_or_404
from app.core.deps import CurrentUser, DbSession, OptionalUser
from app.models import Review
from app.schemas.common import Page
from app.schemas.review import ReviewCreate, ReviewOut
from app.services.access import user_has_course_access
from app.services.catalog import pages_for, review_out

router = APIRouter(prefix="/courses", tags=["reviews"])


@router.get("/{course_id}/reviews", response_model=Page[ReviewOut])
def list_reviews(
    course_id: int,
    db: DbSession,
    user: OptionalUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
) -> Page[ReviewOut]:
    course = get_visible_course_or_404(db, course_id, user)
    total = db.execute(
        select(func.count(Review.id)).where(Review.course_id == course.id)
    ).scalar_one()
    stmt = (
        select(Review)
        .where(Review.course_id == course.id)
        .order_by(Review.created_at.desc(), Review.id.desc())
        .options(selectinload(Review.user))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = [review_out(review) for review in db.execute(stmt).scalars().all()]
    return Page(
        items=items, total=total, page=page, page_size=page_size, pages=pages_for(total, page_size)
    )


@router.post("/{course_id}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_or_update_review(
    course_id: int, payload: ReviewCreate, db: DbSession, user: CurrentUser, response: Response
) -> ReviewOut:
    course = get_visible_course_or_404(db, course_id, user)
    if course.teacher_id == user.id:
        raise forbidden("O'z kursingizga sharh qoldira olmaysiz")
    if not user_has_course_access(db, user, course):
        raise forbidden("Sharh qoldirish uchun kursga yozilgan bo'lishingiz kerak")
    stmt = select(Review).where(Review.course_id == course.id, Review.user_id == user.id)
    review = db.execute(stmt).scalar_one_or_none()
    comment = payload.comment.strip() if payload.comment else None
    if review is None:
        review = Review(
            user_id=user.id, course_id=course.id, rating=payload.rating, comment=comment
        )
        db.add(review)
    else:
        review.rating = payload.rating
        review.comment = comment
        response.status_code = status.HTTP_200_OK
    db.commit()
    db.refresh(review)
    return review_out(review)
