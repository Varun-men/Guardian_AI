from datetime import datetime, timedelta, timezone

from jose import jwt

from backend.auth import security


def _register(client, username="testuser"):
    return client.post("/api/auth/register", json={
        "username": username,
        "email": f"{username}@example.com",
        "password": "password123"
    })


def _login(client, username="testuser"):
    return client.post("/api/auth/login", json={
        "username": username,
        "password": "password123"
    })


def _csrf_header(client):
    token = client.cookies.get("guardian_csrf")
    assert token, "CSRF cookie was not set"
    return {"X-CSRF-Token": token}


def test_register_user(client):
    response = _register(client)

    assert response.status_code == 200
    assert response.json()["role"] == "creator"


def test_login_user(client):
    _register(client)

    response = _login(client)

    assert response.status_code == 200
    assert "access_token" in response.json()


def test_get_profile(client):
    _register(client)

    login = _login(client)

    token = login.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.json()["username"] == "testuser"


# --------------------------------------------------
# Refresh token / persistent session tests
# --------------------------------------------------

def test_login_sets_httponly_refresh_cookie(client):
    _register(client)
    _login(client)

    assert client.cookies.get("guardian_refresh")
    assert client.cookies.get("guardian_csrf")


def test_refresh_issues_new_access_token(client):
    _register(client)
    _login(client)

    response = client.post(
        "/api/auth/refresh",
        headers=_csrf_header(client),
    )

    assert response.status_code == 200
    assert "access_token" in response.json()

    # New access token must work against a protected route.
    me = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {response.json()['access_token']}"}
    )
    assert me.status_code == 200
    assert me.json()["username"] == "testuser"


def test_refresh_rotates_token_and_rejects_reuse(client):
    _register(client)
    _login(client)

    old_refresh = client.cookies.get("guardian_refresh")

    first = client.post(
        "/api/auth/refresh",
        headers=_csrf_header(client),
    )
    assert first.status_code == 200
    assert client.cookies.get("guardian_refresh") != old_refresh

    # Replaying the rotated-out token must be rejected.
    client.cookies.clear()
    client.cookies.set("guardian_refresh", old_refresh, domain="testserver", path="/")
    client.cookies.set("guardian_csrf", "replay", domain="testserver", path="/")
    replay = client.post(
        "/api/auth/refresh",
        headers={"X-CSRF-Token": "replay"},
    )
    assert replay.status_code == 401


def test_refresh_requires_csrf_token(client):
    _register(client)
    _login(client)

    response = client.post("/api/auth/refresh")

    assert response.status_code == 403


def test_refresh_rejects_tampered_csrf(client):
    _register(client)
    _login(client)

    response = client.post(
        "/api/auth/refresh",
        headers={"X-CSRF-Token": "forged-csrf-value"},
    )

    assert response.status_code == 403


def test_expired_access_token_still_refreshes(client):
    _register(client)
    _login(client)

    # Craft an already-expired access token.
    expired = jwt.encode(
        {
            "sub": "irrelevant",
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        },
        security.SECRET_KEY,
        algorithm=security.ALGORITHM,
    )

    me = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {expired}"},
    )
    assert me.status_code == 401

    # The refresh cookie still yields a valid session.
    refresh = client.post(
        "/api/auth/refresh",
        headers=_csrf_header(client),
    )
    assert refresh.status_code == 200


def test_logout_revokes_refresh_token(client):
    _register(client)
    _login(client)

    refresh_cookie = client.cookies.get("guardian_refresh")
    assert client.post("/api/auth/logout").status_code == 200

    # Even if the cookie value is replayed, the token is revoked.
    client.cookies.clear()
    client.cookies.set("guardian_refresh", refresh_cookie, domain="testserver", path="/")
    client.cookies.set("guardian_csrf", "x", domain="testserver", path="/")

    refresh = client.post(
        "/api/auth/refresh",
        headers={"X-CSRF-Token": "x"},
    )
    assert refresh.status_code == 401


def test_expired_refresh_token_rejected(client, monkeypatch):
    monkeypatch.setattr(security, "REFRESH_TOKEN_EXPIRE_DAYS", -1)

    _register(client)
    _login(client)

    response = client.post(
        "/api/auth/refresh",
        headers=_csrf_header(client),
    )

    assert response.status_code == 401


def test_invalid_refresh_token_rejected(client):
    client.cookies.clear()
    client.cookies.set("guardian_refresh", "not-a-real-token", domain="testserver", path="/")

    response = client.post(
        "/api/auth/refresh",
        headers={"X-CSRF-Token": "x"},
    )

    assert response.status_code == 401
