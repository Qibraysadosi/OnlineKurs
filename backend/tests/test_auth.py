from fastapi.testclient import TestClient

from tests.conftest import PASSWORD, login

REGISTER = {"full_name": "Yangi Foydalanuvchi", "email": "yangi@test.uz", "password": PASSWORD}


def test_register_login_refresh_me(client: TestClient) -> None:
    response = client.post("/api/auth/register", json=REGISTER)
    assert response.status_code == 201
    tokens = response.json()
    assert tokens["token_type"] == "bearer"
    assert tokens["user"]["role"] == "student"
    assert tokens["user"]["email"] == "yangi@test.uz"

    login_response = client.post(
        "/api/auth/login", json={"email": "yangi@test.uz", "password": PASSWORD}
    )
    assert login_response.status_code == 200
    access = login_response.json()["access_token"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert me.status_code == 200
    assert me.json()["full_name"] == "Yangi Foydalanuvchi"
    assert me.json()["created_at"].endswith("Z")

    refreshed = client.post("/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert refreshed.status_code == 200
    assert refreshed.json()["user"]["id"] == tokens["user"]["id"]

    wrong_type = client.post("/api/auth/refresh", json={"refresh_token": access})
    assert wrong_type.status_code == 401


def test_register_duplicate_email_conflicts(client: TestClient) -> None:
    assert client.post("/api/auth/register", json=REGISTER).status_code == 201
    duplicate = client.post("/api/auth/register", json={**REGISTER, "email": "YANGI@test.uz"})
    assert duplicate.status_code == 409
    assert "email" in duplicate.json()["detail"].lower()


def test_register_validation_returns_uzbek_detail(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register", json={"full_name": "A", "email": "x", "password": "123"}
    )
    assert response.status_code == 422
    body = response.json()
    assert isinstance(body["detail"], str)
    assert "full_name" in body["detail"]
    assert {error["field"] for error in body["errors"]} == {"full_name", "email", "password"}


def test_login_bad_credentials(client: TestClient, student) -> None:
    response = client.post("/api/auth/login", json={"email": student.email, "password": "notog'ri"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Email yoki parol noto'g'ri"


def test_me_requires_token_and_rejects_bad_token(client: TestClient) -> None:
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer abc"}).status_code == 401


def test_inactive_user_gets_403(client: TestClient, db, student) -> None:
    headers = login(client, student.email)
    student.is_active = False
    db.commit()
    assert client.get("/api/auth/me", headers=headers).status_code == 403
    assert (
        client.post(
            "/api/auth/login", json={"email": student.email, "password": PASSWORD}
        ).status_code
        == 403
    )


def test_update_profile_and_password(client: TestClient, student_headers: dict[str, str]) -> None:
    updated = client.patch(
        "/api/auth/me",
        json={"full_name": "Aziz Toshmatov", "bio": "Salom"},
        headers=student_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["full_name"] == "Aziz Toshmatov"
    assert updated.json()["bio"] == "Salom"

    wrong = client.post(
        "/api/auth/me/password",
        json={"current_password": "xato-parol", "new_password": "YangiParol123"},
        headers=student_headers,
    )
    assert wrong.status_code == 400

    ok = client.post(
        "/api/auth/me/password",
        json={"current_password": PASSWORD, "new_password": "YangiParol123"},
        headers=student_headers,
    )
    assert ok.status_code == 200
    issued = ok.json()
    assert issued["token_type"] == "bearer"
    assert issued["user"]["email"] == "student@test.uz"
    # The caller stays signed in with the pair returned by the change itself.
    assert client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {issued['access_token']}"}
    ).status_code == 200
    assert (
        client.post("/api/auth/refresh", json={"refresh_token": issued["refresh_token"]}).status_code
        == 200
    )
    relogin = client.post(
        "/api/auth/login", json={"email": "student@test.uz", "password": "YangiParol123"}
    )
    assert relogin.status_code == 200
    # Sessions issued before the password change are revoked.
    assert client.get("/api/auth/me", headers=student_headers).status_code == 401
    fresh = relogin.json()
    assert client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {fresh['access_token']}"}
    ).status_code == 200


def test_password_change_revokes_old_refresh_token(client: TestClient, student) -> None:
    tokens = client.post(
        "/api/auth/login", json={"email": student.email, "password": PASSWORD}
    ).json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    changed = client.post(
        "/api/auth/me/password",
        json={"current_password": PASSWORD, "new_password": "YangiParol123"},
        headers=headers,
    )
    assert changed.status_code == 200
    stale = client.post("/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert stale.status_code == 401
    renewed = client.post(
        "/api/auth/refresh", json={"refresh_token": changed.json()["refresh_token"]}
    )
    assert renewed.status_code == 200


def test_password_length_is_validated_in_bytes(client: TestClient) -> None:
    too_long = client.post(
        "/api/auth/register",
        json={"full_name": "Kirill Test", "email": "kirill@test.uz", "password": "ё" * 40},
    )
    assert too_long.status_code == 422
    assert "72 bayt" in too_long.json()["detail"]
    fits = client.post(
        "/api/auth/register",
        json={"full_name": "Kirill Test", "email": "kirill@test.uz", "password": "ё" * 36},
    )
    assert fits.status_code == 201


def test_avatar_upload_rejects_non_image(
    client: TestClient, student_headers: dict[str, str]
) -> None:
    response = client.post(
        "/api/auth/me/avatar",
        files={"file": ("virus.exe", b"MZ....", "application/octet-stream")},
        headers=student_headers,
    )
    assert response.status_code == 400


def test_avatar_upload_accepts_image(client: TestClient, student_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/auth/me/avatar",
        files={"file": ("me.png", b"\x89PNG\r\n\x1a\n" + b"0" * 64, "image/png")},
        headers=student_headers,
    )
    assert response.status_code == 200
    avatar_url = response.json()["avatar_url"]
    assert avatar_url.startswith("http://testserver/uploads/avatars/")
    assert client.get(avatar_url.replace("http://testserver", "")).status_code == 200
