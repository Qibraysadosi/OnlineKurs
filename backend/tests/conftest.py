"""Test fixtures: isolated SQLite file DB and upload dir, TestClient, demo accounts."""

import os
import tempfile
from collections.abc import Iterator
from pathlib import Path

import pytest

_TMP = Path(tempfile.mkdtemp(prefix="onlinekurs-tests-"))
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP / 'test.db'}"
os.environ["UPLOAD_DIR"] = str(_TMP / "uploads")
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-hs256"
os.environ["BACKEND_URL"] = "http://testserver"
os.environ["ENVIRONMENT"] = "development"

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.core.security import hash_password  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Course, CourseLevel, Lesson, Section, User, UserRole  # noqa: E402

PASSWORD = "Parol123!"


@pytest.fixture(autouse=True)
def _fresh_schema() -> Iterator[None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
def db() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


def create_user(
    db: Session, email: str, role: UserRole, full_name: str = "Test Foydalanuvchi"
) -> User:
    user = User(full_name=full_name, email=email, password_hash=hash_password(PASSWORD), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login(client: TestClient, email: str) -> dict[str, str]:
    response = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture()
def admin(db: Session) -> User:
    return create_user(db, "admin@test.uz", UserRole.admin, "Admin")


@pytest.fixture()
def teacher(db: Session) -> User:
    return create_user(db, "teacher@test.uz", UserRole.teacher, "Ustoz")


@pytest.fixture()
def student(db: Session) -> User:
    return create_user(db, "student@test.uz", UserRole.student, "Talaba")


@pytest.fixture()
def admin_headers(client: TestClient, admin: User) -> dict[str, str]:
    return login(client, admin.email)


@pytest.fixture()
def teacher_headers(client: TestClient, teacher: User) -> dict[str, str]:
    return login(client, teacher.email)


@pytest.fixture()
def student_headers(client: TestClient, student: User) -> dict[str, str]:
    return login(client, student.email)


def create_course(
    db: Session,
    teacher: User,
    title: str = "Test kursi",
    price: int = 0,
    published: bool = True,
    lessons: int = 3,
    level: CourseLevel = CourseLevel.beginner,
) -> Course:
    """Course with one section and `lessons` lessons; the first lesson is a free preview."""
    slug = title.lower().replace(" ", "-").replace(":", "")
    course = Course(
        title=title,
        slug=slug,
        short_description="Qisqa tavsif matni",
        description="To'liq tavsif matni",
        what_you_learn=["Bir", "Ikki"],
        requirements=[],
        teacher_id=teacher.id,
        level=level,
        price=price,
        is_published=published,
    )
    db.add(course)
    db.flush()
    section = Section(course_id=course.id, title="Bo'lim 1", position=1)
    db.add(section)
    db.flush()
    for position in range(1, lessons + 1):
        db.add(
            Lesson(
                section_id=section.id,
                title=f"Dars {position}",
                video_url=f"https://example.com/video{position}.mp4",
                duration_minutes=10,
                position=position,
                is_free_preview=position == 1,
            )
        )
    db.commit()
    db.refresh(course)
    return course
