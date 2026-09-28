from fastapi.testclient import TestClient

from app.models import CourseLevel
from tests.conftest import create_course

COURSE_BODY = {
    "title": "Python asoslari",
    "short_description": "Python tilini noldan o'rganing",
    "description": "Bu kursda Python tilining asoslari o'rgatiladi.",
    "level": "beginner",
    "price": 0,
    "what_you_learn": ["Sintaksis", "Funksiyalar"],
}


def test_student_cannot_create_course(client: TestClient, student_headers: dict[str, str]) -> None:
    response = client.post("/api/courses", json=COURSE_BODY, headers=student_headers)
    assert response.status_code == 403
    assert client.post("/api/courses", json=COURSE_BODY).status_code == 401


def test_course_crud_and_slug_uniqueness(
    client: TestClient, teacher_headers: dict[str, str]
) -> None:
    first = client.post("/api/courses", json=COURSE_BODY, headers=teacher_headers)
    assert first.status_code == 201, first.text
    assert first.json()["slug"] == "python-asoslari"
    assert first.json()["is_published"] is False
    assert first.json()["has_access"] is True
    assert first.json()["sections"] == []

    second = client.post("/api/courses", json=COURSE_BODY, headers=teacher_headers)
    assert second.json()["slug"] == "python-asoslari-2"
    third = client.post("/api/courses", json=COURSE_BODY, headers=teacher_headers)
    assert third.json()["slug"] == "python-asoslari-3"

    course_id = first.json()["id"]
    patched = client.patch(
        f"/api/courses/{course_id}",
        json={"price": 150000, "level": "advanced"},
        headers=teacher_headers,
    )
    assert patched.status_code == 200
    assert patched.json()["price"] == 150000
    assert patched.json()["level"] == "advanced"
    assert patched.json()["slug"] == "python-asoslari"

    deleted = client.delete(f"/api/courses/{course_id}", headers=teacher_headers)
    assert deleted.status_code == 204
    assert client.get("/api/courses/python-asoslari", headers=teacher_headers).status_code == 404


def test_teacher_cannot_edit_other_teachers_course(
    client: TestClient, db, teacher, teacher_headers
) -> None:
    from app.models import UserRole
    from tests.conftest import create_user, login

    other = create_user(db, "other@test.uz", UserRole.teacher)
    course = create_course(db, other, title="Boshqa kurs")
    assert (
        client.patch(
            f"/api/courses/{course.id}", json={"price": 1}, headers=teacher_headers
        ).status_code
        == 403
    )
    assert client.delete(f"/api/courses/{course.id}", headers=teacher_headers).status_code == 403
    other_headers = login(client, other.email)
    assert (
        client.patch(
            f"/api/courses/{course.id}", json={"price": 1}, headers=other_headers
        ).status_code
        == 200
    )


def test_admin_can_edit_any_course(client: TestClient, db, teacher, admin_headers) -> None:
    course = create_course(db, teacher)
    response = client.patch(
        f"/api/courses/{course.id}", json={"title": "Yangilangan nom"}, headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Yangilangan nom"


def test_publish_requires_lesson(client: TestClient, teacher_headers: dict[str, str]) -> None:
    course_id = client.post("/api/courses", json=COURSE_BODY, headers=teacher_headers).json()["id"]
    denied = client.post(
        f"/api/courses/{course_id}/publish", json={"is_published": True}, headers=teacher_headers
    )
    assert denied.status_code == 400
    assert denied.json()["detail"] == "Nashr qilish uchun kamida bitta dars kerak"

    section = client.post(
        f"/api/courses/{course_id}/sections", json={"title": "Kirish"}, headers=teacher_headers
    )
    assert section.status_code == 201
    assert section.json()["position"] == 1
    lesson = client.post(
        f"/api/sections/{section.json()['id']}/lessons",
        json={"title": "Birinchi dars", "duration_minutes": 12, "is_free_preview": True},
        headers=teacher_headers,
    )
    assert lesson.status_code == 201
    assert lesson.json()["position"] == 1

    published = client.post(
        f"/api/courses/{course_id}/publish", json={"is_published": True}, headers=teacher_headers
    )
    assert published.status_code == 200
    assert published.json()["is_published"] is True
    assert published.json()["lessons_count"] == 1
    assert published.json()["duration_minutes"] == 12


def test_curriculum_reorder_and_delete(client: TestClient, teacher_headers: dict[str, str]) -> None:
    course_id = client.post("/api/courses", json=COURSE_BODY, headers=teacher_headers).json()["id"]
    section_ids = [
        client.post(
            f"/api/courses/{course_id}/sections",
            json={"title": f"Bo'lim {i}"},
            headers=teacher_headers,
        ).json()["id"]
        for i in range(1, 4)
    ]
    reordered = client.put(
        f"/api/courses/{course_id}/sections/order",
        json={"section_ids": list(reversed(section_ids))},
        headers=teacher_headers,
    )
    assert reordered.status_code == 200
    assert [section["id"] for section in reordered.json()] == list(reversed(section_ids))
    assert [section["position"] for section in reordered.json()] == [1, 2, 3]

    invalid = client.put(
        f"/api/courses/{course_id}/sections/order",
        json={"section_ids": [section_ids[0]]},
        headers=teacher_headers,
    )
    assert invalid.status_code == 400

    lesson_ids = [
        client.post(
            f"/api/sections/{section_ids[0]}/lessons",
            json={"title": f"Dars {i}"},
            headers=teacher_headers,
        ).json()["id"]
        for i in range(1, 3)
    ]
    lessons = client.put(
        f"/api/sections/{section_ids[0]}/lessons/order",
        json={"lesson_ids": list(reversed(lesson_ids))},
        headers=teacher_headers,
    )
    assert [lesson["id"] for lesson in lessons.json()] == list(reversed(lesson_ids))

    renamed = client.patch(
        f"/api/lessons/{lesson_ids[0]}", json={"title": "Yangi nom"}, headers=teacher_headers
    )
    assert renamed.json()["title"] == "Yangi nom"
    assert (
        client.delete(f"/api/lessons/{lesson_ids[0]}", headers=teacher_headers).status_code == 204
    )
    assert (
        client.delete(f"/api/sections/{section_ids[1]}", headers=teacher_headers).status_code == 204
    )
    detail = client.get("/api/courses/python-asoslari", headers=teacher_headers).json()
    assert len(detail["sections"]) == 2
    assert detail["lessons_count"] == 1


def test_catalog_filters_pagination_and_visibility(client: TestClient, db, teacher) -> None:
    create_course(db, teacher, title="Python asoslari", price=0)
    create_course(db, teacher, title="React kursi", price=300000, level=CourseLevel.intermediate)
    create_course(db, teacher, title="Yashirin kurs", price=0, published=False)
    for index in range(12):
        create_course(db, teacher, title=f"Ommaviy kurs {index}", price=100000 + index)

    everything = client.get("/api/courses").json()
    assert everything["total"] == 14
    assert everything["page_size"] == 12
    assert everything["pages"] == 2
    assert len(everything["items"]) == 12
    assert all(item["is_published"] for item in everything["items"])

    second_page = client.get("/api/courses", params={"page": 2}).json()
    assert len(second_page["items"]) == 2

    free = client.get("/api/courses", params={"price": "free"}).json()
    assert {item["title"] for item in free["items"]} == {"Python asoslari"}

    searched = client.get("/api/courses", params={"q": "react"}).json()
    assert searched["total"] == 1
    assert searched["items"][0]["slug"] == "react-kursi"

    by_level = client.get("/api/courses", params={"level": "intermediate"}).json()
    assert by_level["total"] == 1

    cheapest = client.get("/api/courses", params={"sort": "price_asc", "page_size": 1}).json()
    assert cheapest["items"][0]["price"] == 0
    priciest = client.get("/api/courses", params={"sort": "price_desc", "page_size": 1}).json()
    assert priciest["items"][0]["price"] == 300000

    assert client.get("/api/courses", params={"page_size": 100}).status_code == 422

    assert client.get("/api/courses/yashirin-kurs").status_code == 404
    featured = client.get("/api/courses/featured").json()
    assert len(featured) == 6
    assert "Yashirin kurs" not in {item["title"] for item in featured}


def test_unpublished_visible_to_owner_and_admin(
    client: TestClient, db, teacher, teacher_headers, admin_headers, student_headers
) -> None:
    create_course(db, teacher, title="Qoralama", published=False)
    assert client.get("/api/courses/qoralama").status_code == 404
    assert client.get("/api/courses/qoralama", headers=student_headers).status_code == 404
    assert client.get("/api/courses/qoralama", headers=teacher_headers).status_code == 200
    assert client.get("/api/courses/qoralama", headers=admin_headers).status_code == 200
    mine = client.get("/api/teacher/courses", headers=teacher_headers).json()
    assert [item["slug"] for item in mine] == ["qoralama"]


def test_course_detail_by_id(client: TestClient, db, teacher, teacher_headers) -> None:
    course = create_course(db, teacher, title="Raqamli kurs")
    by_id = client.get(f"/api/courses/{course.id}")
    assert by_id.status_code == 200
    assert by_id.json()["slug"] == "raqamli-kurs"
    assert by_id.json() == client.get("/api/courses/raqamli-kurs").json()
    assert client.get(f"/api/courses/{course.id + 1000}").status_code == 404
    draft = create_course(db, teacher, title="Qoralama id", published=False)
    assert client.get(f"/api/courses/{draft.id}").status_code == 404
    assert client.get(f"/api/courses/{draft.id}", headers=teacher_headers).status_code == 200


def test_category_filter_and_admin_crud(
    client: TestClient, db, teacher, admin_headers, student_headers
) -> None:
    created = client.post(
        "/api/categories", json={"name": "Dasturlash", "icon": "code"}, headers=admin_headers
    )
    assert created.status_code == 201
    category = created.json()
    assert category["slug"] == "dasturlash"
    assert (
        client.post("/api/categories", json={"name": "Dizayn"}, headers=student_headers).status_code
        == 403
    )
    assert (
        client.post(
            "/api/categories", json={"name": "Dasturlash"}, headers=admin_headers
        ).status_code
        == 409
    )

    course = create_course(db, teacher, title="Python kursi")
    course.category_id = category["id"]
    db.commit()
    create_course(db, teacher, title="Boshqa kurs")

    listed = client.get("/api/categories").json()
    assert listed[0]["courses_count"] == 1
    filtered = client.get("/api/courses", params={"category": "dasturlash"}).json()
    assert filtered["total"] == 1
    assert filtered["items"][0]["category"]["name"] == "Dasturlash"

    renamed = client.patch(
        f"/api/categories/{category['id']}", json={"name": "Programmalash"}, headers=admin_headers
    )
    assert renamed.json()["slug"] == "programmalash"
    assert (
        client.delete(f"/api/categories/{category['id']}", headers=admin_headers).status_code == 204
    )
    assert client.get("/api/courses/python-kursi").json()["category"] is None


def test_cover_upload_validation(
    client: TestClient, db, teacher, teacher_headers: dict[str, str]
) -> None:
    course = create_course(db, teacher)
    rejected = client.post(
        f"/api/courses/{course.id}/cover",
        files={"file": ("notes.txt", b"hello", "text/plain")},
        headers=teacher_headers,
    )
    assert rejected.status_code == 400
    assert "rasm" in rejected.json()["detail"].lower()

    too_big = client.post(
        f"/api/courses/{course.id}/cover",
        files={"file": ("big.png", b"0" * (5 * 1024 * 1024 + 1), "image/png")},
        headers=teacher_headers,
    )
    assert too_big.status_code == 400

    accepted = client.post(
        f"/api/courses/{course.id}/cover",
        files={"file": ("cover.png", b"\x89PNG" + b"0" * 32, "image/png")},
        headers=teacher_headers,
    )
    assert accepted.status_code == 200
    assert accepted.json()["cover_url"].startswith("http://testserver/uploads/covers/")


def test_video_and_attachment_upload(
    client: TestClient, db, teacher, teacher_headers: dict[str, str]
) -> None:
    course = create_course(db, teacher)
    lesson_id = course.sections[0].lessons[0].id
    bad_video = client.post(
        f"/api/lessons/{lesson_id}/video",
        files={"file": ("clip.avi", b"0" * 10, "video/x-msvideo")},
        headers=teacher_headers,
    )
    assert bad_video.status_code == 400
    video = client.post(
        f"/api/lessons/{lesson_id}/video",
        files={"file": ("clip.mp4", b"0" * 10, "video/mp4")},
        headers=teacher_headers,
    )
    assert video.status_code == 200
    assert video.json()["video_url"].startswith("http://testserver/uploads/videos/")

    attachment = client.post(
        f"/api/lessons/{lesson_id}/attachment",
        files={"file": ("Slaydlar.pdf", b"%PDF-1.4", "application/pdf")},
        headers=teacher_headers,
    )
    assert attachment.status_code == 200
    assert attachment.json()["attachment_name"] == "Slaydlar.pdf"
    assert attachment.json()["attachment_url"].startswith("http://testserver/uploads/attachments/")
