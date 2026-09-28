"""Lesson access, free enrollment, mock paid checkout, progress and reviews."""

from fastapi.testclient import TestClient

from tests.conftest import create_course, login


def _lesson_ids(course) -> list[int]:
    return [lesson.id for lesson in course.sections[0].lessons]


def test_lesson_access_preview_locked_enrolled(
    client: TestClient, db, teacher, student_headers, teacher_headers
) -> None:
    course = create_course(db, teacher, title="Pullik kurs", price=200000)
    preview_id, locked_id, _ = _lesson_ids(course)

    anonymous_preview = client.get(f"/api/lessons/{preview_id}")
    assert anonymous_preview.status_code == 200
    assert anonymous_preview.json()["has_access"] is True
    assert anonymous_preview.json()["video_url"] is not None

    anonymous_locked = client.get(f"/api/lessons/{locked_id}")
    assert anonymous_locked.status_code == 403
    assert anonymous_locked.json()["detail"] == "Bu darsni ko'rish uchun kursni sotib oling"
    assert client.get(f"/api/lessons/{locked_id}", headers=student_headers).status_code == 403

    detail = client.get("/api/courses/pullik-kurs", headers=student_headers).json()
    assert detail["has_access"] is False
    assert detail["is_enrolled"] is False
    assert detail["progress_percent"] is None
    lessons = detail["sections"][0]["lessons"]
    assert [lesson["has_access"] for lesson in lessons] == [True, False, False]
    assert lessons[1]["video_url"] is None

    owner = client.get(f"/api/lessons/{locked_id}", headers=teacher_headers)
    assert owner.status_code == 200
    assert owner.json()["video_url"] is not None


def test_free_enroll_is_idempotent_and_unlocks(
    client: TestClient, db, teacher, student_headers
) -> None:
    course = create_course(db, teacher, title="Bepul kurs", price=0)
    locked_id = _lesson_ids(course)[1]
    assert client.get(f"/api/lessons/{locked_id}", headers=student_headers).status_code == 403

    first = client.post(f"/api/courses/{course.id}/enroll", headers=student_headers)
    assert first.status_code == 201
    assert first.json()["course"]["slug"] == "bepul-kurs"
    assert first.json()["progress_percent"] == 0
    assert first.json()["total_lessons"] == 3

    again = client.post(f"/api/courses/{course.id}/enroll", headers=student_headers)
    assert again.status_code == 200
    assert again.json()["id"] == first.json()["id"]

    assert client.get(f"/api/lessons/{locked_id}", headers=student_headers).status_code == 200
    enrollments = client.get("/api/me/enrollments", headers=student_headers).json()
    assert [item["course"]["id"] for item in enrollments] == [course.id]
    assert client.get("/api/courses/bepul-kurs").json()["students_count"] == 1


def test_free_enroll_rejected_for_paid_course(
    client: TestClient, db, teacher, student_headers
) -> None:
    course = create_course(db, teacher, title="Pullik kurs", price=200000)
    response = client.post(f"/api/courses/{course.id}/enroll", headers=student_headers)
    assert response.status_code == 409
    assert response.json()["detail"] == "Bu kurs pullik"


def test_paid_flow_confirm_creates_enrollment(
    client: TestClient, db, teacher, student_headers
) -> None:
    course = create_course(db, teacher, title="Pullik kurs", price=250000)
    locked_id = _lesson_ids(course)[2]

    created = client.post("/api/payments", json={"course_id": course.id}, headers=student_headers)
    assert created.status_code == 201
    payment = created.json()
    assert payment["status"] == "pending"
    assert payment["amount"] == 250000
    assert payment["paid_at"] is None
    assert payment["course"]["slug"] == "pullik-kurs"
    assert payment["user"]["email"] == "student@test.uz"

    assert client.get(f"/api/lessons/{locked_id}", headers=student_headers).status_code == 403

    confirmed = client.post(f"/api/payments/{payment['id']}/confirm", headers=student_headers)
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "paid"
    assert confirmed.json()["paid_at"] is not None

    again = client.post(f"/api/payments/{payment['id']}/confirm", headers=student_headers)
    assert again.status_code == 200
    assert again.json()["paid_at"] == confirmed.json()["paid_at"]

    assert client.get(f"/api/lessons/{locked_id}", headers=student_headers).status_code == 200
    assert (
        client.get("/api/courses/pullik-kurs", headers=student_headers).json()["is_enrolled"]
        is True
    )
    duplicate = client.post("/api/payments", json={"course_id": course.id}, headers=student_headers)
    assert duplicate.status_code == 409
    mine = client.get("/api/me/payments", headers=student_headers).json()
    assert [item["id"] for item in mine] == [payment["id"]]


def test_payment_rules(client: TestClient, db, teacher, student_headers, admin_headers) -> None:
    free_course = create_course(db, teacher, title="Bepul kurs", price=0)
    assert (
        client.post(
            "/api/payments", json={"course_id": free_course.id}, headers=student_headers
        ).status_code
        == 400
    )

    paid_course = create_course(db, teacher, title="Pullik kurs", price=100000)
    payment = client.post(
        "/api/payments", json={"course_id": paid_course.id}, headers=student_headers
    ).json()
    assert (
        client.post(f"/api/payments/{payment['id']}/confirm", headers=admin_headers).status_code
        == 403
    )

    cancelled = client.post(f"/api/payments/{payment['id']}/cancel", headers=student_headers)
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "failed"
    assert (
        client.post(f"/api/payments/{payment['id']}/confirm", headers=student_headers).status_code
        == 409
    )
    assert (
        client.post(f"/api/payments/{payment['id']}/cancel", headers=student_headers).status_code
        == 409
    )
    assert (
        client.post("/api/payments", json={"course_id": 9999}, headers=student_headers).status_code
        == 404
    )


def test_duplicate_pending_payments_are_reused_and_never_double_charged(
    client: TestClient, db, teacher, student_headers, admin_headers
) -> None:
    course = create_course(db, teacher, title="Pullik kurs", price=150000)
    first = client.post("/api/payments", json={"course_id": course.id}, headers=student_headers)
    assert first.status_code == 201
    second = client.post("/api/payments", json={"course_id": course.id}, headers=student_headers)
    assert second.status_code == 200
    assert second.json()["id"] == first.json()["id"]

    # A second pending row (e.g. one an admin left open) cannot be confirmed once enrolled.
    from app.models import Payment, PaymentStatus

    extra = Payment(
        user_id=first.json()["user"]["id"],
        course_id=course.id,
        amount=course.price,
        status=PaymentStatus.pending,
    )
    db.add(extra)
    db.commit()
    assert (
        client.post(f"/api/payments/{first.json()['id']}/confirm", headers=student_headers).json()[
            "status"
        ]
        == "paid"
    )
    rejected = client.post(f"/api/payments/{extra.id}/confirm", headers=student_headers)
    assert rejected.status_code == 409
    mine = {item["id"]: item["status"] for item in client.get("/api/me/payments", headers=student_headers).json()}
    assert mine[extra.id] == "failed"
    assert mine[first.json()["id"]] == "paid"

    # Refunding one of two paid payments keeps the enrollment backed by the other.
    paid_twice = Payment(
        user_id=first.json()["user"]["id"],
        course_id=course.id,
        amount=course.price,
        status=PaymentStatus.paid,
    )
    db.add(paid_twice)
    db.commit()
    client.patch(
        f"/api/admin/payments/{paid_twice.id}", json={"status": "refunded"}, headers=admin_headers
    )
    assert (
        client.get("/api/courses/pullik-kurs", headers=student_headers).json()["is_enrolled"]
        is True
    )
    client.patch(
        f"/api/admin/payments/{first.json()['id']}",
        json={"status": "refunded"},
        headers=admin_headers,
    )
    assert (
        client.get("/api/courses/pullik-kurs", headers=student_headers).json()["is_enrolled"]
        is False
    )


def test_pending_payment_follows_course_price_changes(
    client: TestClient, db, teacher, teacher_headers, student_headers, admin_headers
) -> None:
    course = create_course(db, teacher, title="Pullik kurs", price=150000)
    opened = client.post("/api/payments", json={"course_id": course.id}, headers=student_headers)
    assert opened.status_code == 201
    assert opened.json()["amount"] == 150000

    repriced = client.patch(
        f"/api/courses/{course.id}", json={"price": 250000}, headers=teacher_headers
    )
    assert repriced.status_code == 200

    reopened = client.post("/api/payments", json={"course_id": course.id}, headers=student_headers)
    assert reopened.status_code == 200
    assert reopened.json()["id"] == opened.json()["id"]
    assert reopened.json()["amount"] == 250000

    confirmed = client.post(
        f"/api/payments/{opened.json()['id']}/confirm", headers=student_headers
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "paid"
    assert confirmed.json()["amount"] == 250000
    stats = client.get("/api/admin/stats", headers=admin_headers).json()
    assert stats["revenue_total"] == 250000


def test_confirming_stale_pending_payment_charges_current_price(
    client: TestClient, db, teacher, teacher_headers, student_headers
) -> None:
    course = create_course(db, teacher, title="Pullik kurs", price=150000)
    opened = client.post("/api/payments", json={"course_id": course.id}, headers=student_headers)
    assert opened.status_code == 201
    client.patch(f"/api/courses/{course.id}", json={"price": 250000}, headers=teacher_headers)

    # The checkout page confirms the cached pending row without re-posting.
    confirmed = client.post(
        f"/api/payments/{opened.json()['id']}/confirm", headers=student_headers
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["amount"] == 250000
    mine = client.get("/api/me/payments", headers=student_headers).json()
    assert [(item["id"], item["amount"], item["status"]) for item in mine] == [
        (opened.json()["id"], 250000, "paid")
    ]


def test_progress_percent(client: TestClient, db, teacher, student_headers) -> None:
    course = create_course(db, teacher, title="Bepul kurs", price=0, lessons=4)
    ids = _lesson_ids(course)
    assert (
        client.post(f"/api/lessons/{ids[1]}/complete", headers=student_headers).status_code == 403
    )
    # Free-preview lessons are viewable, but completion still needs course access.
    assert (
        client.post(f"/api/lessons/{ids[0]}/complete", headers=student_headers).status_code == 403
    )

    client.post(f"/api/courses/{course.id}/enroll", headers=student_headers)
    first = client.post(f"/api/lessons/{ids[0]}/complete", headers=student_headers)
    assert first.status_code == 200
    assert first.json() == {"progress_percent": 25, "completed_lessons": 1, "total_lessons": 4}
    assert (
        client.post(f"/api/lessons/{ids[0]}/complete", headers=student_headers).json()[
            "completed_lessons"
        ]
        == 1
    )
    client.post(f"/api/lessons/{ids[1]}/complete", headers=student_headers)
    third = client.post(f"/api/lessons/{ids[2]}/complete", headers=student_headers).json()
    assert third["progress_percent"] == 75

    progress = client.get(f"/api/courses/{course.id}/progress", headers=student_headers).json()
    assert progress["completed_lesson_ids"] == ids[:3]
    assert progress["progress_percent"] == 75

    detail = client.get("/api/courses/bepul-kurs", headers=student_headers).json()
    assert detail["progress_percent"] == 75
    assert [lesson["is_completed"] for lesson in detail["sections"][0]["lessons"]] == [
        True,
        True,
        True,
        False,
    ]

    enrollment = client.get("/api/me/enrollments", headers=student_headers).json()[0]
    assert enrollment["completed_lessons"] == 3
    assert enrollment["last_lesson_id"] == ids[2]

    undone = client.delete(f"/api/lessons/{ids[2]}/complete", headers=student_headers).json()
    assert undone == {"progress_percent": 50, "completed_lessons": 2, "total_lessons": 4}


def test_reviews_one_per_user_and_update(
    client: TestClient, db, teacher, student, student_headers, teacher_headers
) -> None:
    course = create_course(db, teacher, title="Bepul kurs", price=0)
    denied = client.post(
        f"/api/courses/{course.id}/reviews", json={"rating": 5}, headers=student_headers
    )
    assert denied.status_code == 403
    assert (
        client.post(
            f"/api/courses/{course.id}/reviews", json={"rating": 5}, headers=teacher_headers
        ).status_code
        == 403
    )

    client.post(f"/api/courses/{course.id}/enroll", headers=student_headers)
    created = client.post(
        f"/api/courses/{course.id}/reviews",
        json={"rating": 4, "comment": "Yaxshi kurs"},
        headers=student_headers,
    )
    assert created.status_code == 201
    assert created.json()["user"]["full_name"] == "Talaba"
    assert created.json()["rating"] == 4

    updated = client.post(
        f"/api/courses/{course.id}/reviews",
        json={"rating": 5, "comment": "Zo'r kurs"},
        headers=student_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["id"] == created.json()["id"]
    assert updated.json()["rating"] == 5
    detail = client.get("/api/courses/bepul-kurs", headers=student_headers).json()
    assert detail["my_review"]["id"] == created.json()["id"]
    assert detail["my_review"]["comment"] == "Zo'r kurs"
    assert client.get("/api/courses/bepul-kurs").json()["my_review"] is None

    assert (
        client.post(
            f"/api/courses/{course.id}/reviews", json={"rating": 6}, headers=student_headers
        ).status_code
        == 422
    )

    listed = client.get(f"/api/courses/{course.id}/reviews").json()
    assert listed["total"] == 1
    assert listed["items"][0]["comment"] == "Zo'r kurs"
    card = client.get("/api/courses/bepul-kurs").json()
    assert card["rating_avg"] == 5.0
    assert card["reviews_count"] == 1

    from app.models import UserRole
    from tests.conftest import create_user

    other = create_user(db, "other@test.uz", UserRole.student, "Boshqa")
    other_headers = login(client, other.email)
    client.post(f"/api/courses/{course.id}/enroll", headers=other_headers)
    client.post(f"/api/courses/{course.id}/reviews", json={"rating": 3}, headers=other_headers)
    assert client.get("/api/courses/bepul-kurs").json()["rating_avg"] == 4.0
    stats = client.get("/api/teacher/stats", headers=teacher_headers).json()
    assert stats == {"courses_count": 1, "students_count": 2, "revenue": 0, "reviews_avg": 4.0}
