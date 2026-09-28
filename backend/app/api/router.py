"""Aggregates every route module under the /api prefix."""

from fastapi import APIRouter

from app.api.routes import (
    admin,
    auth,
    categories,
    courses,
    enrollments,
    lessons,
    payments,
    progress,
    reviews,
    sections,
    teacher,
    uploads,
    users,
)
from app.schemas.health import Health

api_router = APIRouter(prefix="/api")


@api_router.get("/health", response_model=Health, tags=["misc"])
def health() -> Health:
    return Health()


for module in (
    auth,
    users,
    categories,
    courses,
    teacher,
    sections,
    lessons,
    enrollments,
    payments,
    progress,
    reviews,
    admin,
    uploads,
):
    api_router.include_router(module.router)
