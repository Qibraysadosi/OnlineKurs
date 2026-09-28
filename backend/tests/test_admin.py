from fastapi.testclient import TestClient

from tests.conftest import create_course, login


def test_admin_endpoints_require_admin(
    client: TestClient, student_headers, teacher_headers
) -> None:
    assert client.get("/api/admin/stats", headers=student_headers).status_code == 403
    assert client.get("/api/admin/stats", headers=teacher_headers).status_code == 403
    assert client.get("/api/admin/stats").status_code == 401


def test_admin_stats(
    client: TestClient, db, teacher, student, admin_headers, student_headers
) -> None:
    free_course = create_course(db, teacher, title="Bepul kurs", price=0)
    paid_course = create_course(db, teacher, title="Pullik kurs", price=300000)
    create_course(db, teacher, title="Qoralama", published=False)
    client.post(f"/api/courses/{free_course.id}/enroll", headers=student_headers)
    payment = client.post(
        "/api/payments", json={"course_id": paid_course.id}, headers=student_headers
    ).json()
    client.post(f"/api/payments/{payment['id']}/confirm", headers=student_headers)

    stats = client.get("/api/admin/stats", headers=admin_headers).json()
    assert stats["users_count"] == 3
    assert stats["students_count"] == 1
    assert stats["teachers_count"] == 1
    assert stats["courses_count"] == 3
    assert stats["published_courses_count"] == 2
    assert stats["enrollments_count"] == 2
    assert stats["revenue_total"] == 300000
    assert stats["revenue_last_30_days"] == 300000
    assert len(stats["recent_payments"]) == 1
    assert len(stats["monthly_revenue"]) == 6
    assert stats["monthly_revenue"][-1]["revenue"] == 300000
    assert stats["monthly_revenue"][-1]["payments_count"] == 1
    assert sum(month["revenue"] for month in stats["monthly_revenue"][:-1]) == 0
    top = [course["slug"] for course in stats["top_courses"]]
    assert set(top[:2]) == {"bepul-kurs", "pullik-kurs"}
    assert top[2] == "qoralama"


def test_admin_users_and_role_change(client: TestClient, db, admin, student, admin_headers) -> None:
    listed = client.get(
        "/api/admin/users", params={"role": "student"}, headers=admin_headers
    ).json()
    assert listed["total"] == 1
    assert listed["items"][0]["email"] == student.email
    searched = client.get("/api/admin/users", params={"q": "talaba"}, headers=admin_headers).json()
    assert searched["total"] == 1

    promoted = client.patch(
        f"/api/admin/users/{student.id}", json={"role": "teacher"}, headers=admin_headers
    )
    assert promoted.status_code == 200
    assert promoted.json()["role"] == "teacher"
    new_teacher_headers = login(client, student.email)
    assert client.get("/api/teacher/stats", headers=new_teacher_headers).status_code == 200

    blocked = client.patch(
        f"/api/admin/users/{student.id}", json={"is_active": False}, headers=admin_headers
    )
    assert blocked.json()["is_active"] is False
    assert client.get("/api/auth/me", headers=new_teacher_headers).status_code == 403

    assert (
        client.patch(
            f"/api/admin/users/{admin.id}", json={"role": "student"}, headers=admin_headers
        ).status_code
        == 400
    )
    assert client.delete(f"/api/admin/users/{admin.id}", headers=admin_headers).status_code == 400
    assert client.delete(f"/api/admin/users/{student.id}", headers=admin_headers).status_code == 204
    assert client.delete(f"/api/admin/users/{student.id}", headers=admin_headers).status_code == 404


def test_admin_courses_and_payments(
    client: TestClient, db, teacher, student, admin_headers, student_headers
) -> None:
    course = create_course(db, teacher, title="Pullik kurs", price=120000)
    create_course(db, teacher, title="Qoralama", published=False)
    all_courses = client.get("/api/admin/courses", headers=admin_headers).json()
    assert all_courses["total"] == 2
    drafts = client.get(
        "/api/admin/courses", params={"is_published": "false"}, headers=admin_headers
    ).json()
    assert [item["slug"] for item in drafts["items"]] == ["qoralama"]

    payment = client.post(
        "/api/payments", json={"course_id": course.id}, headers=student_headers
    ).json()
    pending = client.get(
        "/api/admin/payments", params={"status": "pending"}, headers=admin_headers
    ).json()
    assert pending["total"] == 1

    paid = client.patch(
        f"/api/admin/payments/{payment['id']}", json={"status": "paid"}, headers=admin_headers
    )
    assert paid.status_code == 200
    assert paid.json()["status"] == "paid"
    assert paid.json()["paid_at"] is not None
    assert (
        client.get("/api/courses/pullik-kurs", headers=student_headers).json()["is_enrolled"]
        is True
    )

    refunded = client.patch(
        f"/api/admin/payments/{payment['id']}", json={"status": "refunded"}, headers=admin_headers
    )
    assert refunded.json()["status"] == "refunded"
    assert (
        client.get("/api/courses/pullik-kurs", headers=student_headers).json()["is_enrolled"]
        is False
    )
    assert (
        client.get(
            "/api/admin/payments", params={"status": "refunded"}, headers=admin_headers
        ).json()["total"]
        == 1
    )
