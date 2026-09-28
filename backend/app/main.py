"""FastAPI application factory."""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.services.storage import ensure_upload_dirs

logger = logging.getLogger("onlinekurs")

VALIDATION_MESSAGES: dict[str, str] = {
    "missing": "majburiy maydon",
    "string_too_short": "juda qisqa",
    "string_too_long": "juda uzun",
    "too_short": "juda kam element",
    "too_long": "juda ko'p element",
    "value_error": "noto'g'ri qiymat",
    "greater_than_equal": "juda kichik qiymat",
    "less_than_equal": "juda katta qiymat",
    "int_parsing": "butun son bo'lishi kerak",
    "bool_parsing": "true yoki false bo'lishi kerak",
    "enum": "ruxsat etilgan qiymatlardan biri bo'lishi kerak",
    "literal_error": "ruxsat etilgan qiymatlardan biri bo'lishi kerak",
    "json_invalid": "JSON noto'g'ri",
}


def _field_errors(errors: list[dict]) -> list[tuple[str, str]]:
    """(field, Uzbek message) pairs for each validation error."""
    described: list[tuple[str, str]] = []
    for error in errors:
        location = [
            str(part) for part in error.get("loc", ()) if part not in ("body", "query", "path")
        ]
        field = ".".join(location) or "so'rov"
        message = VALIDATION_MESSAGES.get(error.get("type", ""), "noto'g'ri qiymat")
        custom = error.get("ctx", {}).get("error")
        if error.get("type") == "value_error" and isinstance(custom, ValueError) and str(custom):
            message = str(custom)  # our own validators already speak Uzbek
        described.append((field, message))
    return described


async def validation_exception_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    field_errors = _field_errors(exc.errors())
    detail = (
        "; ".join(f"{field}: {message}" for field, message in field_errors)
        or "Ma'lumotlar noto'g'ri"
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={
            "detail": detail,
            "errors": [{"field": field, "message": message} for field, message in field_errors],
        },
    )


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    if settings.is_insecure_secret:
        if not settings.is_development:
            raise RuntimeError(
                "SECRET_KEY is a known placeholder or too short; "
                "set a random SECRET_KEY of at least 32 characters in production"
            )
        logger.warning(
            "SECRET_KEY is an insecure development value; set SECRET_KEY in production"
        )
    Base.metadata.create_all(bind=engine)
    ensure_upload_dirs()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="ONLINEKURS API",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        openapi_url="/openapi.json" if settings.is_development else None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.include_router(api_router)
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
    return app


app = create_app()
