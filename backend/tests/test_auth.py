def test_register_user(client):
    response = client.post("/api/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    })

    assert response.status_code == 200
    assert response.json()["role"] == "creator"


def test_login_user(client):
    client.post("/api/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    })

    response = client.post("/api/auth/login", json={
        "username": "testuser",
        "password": "password123"
    })

    assert response.status_code == 200
    assert "access_token" in response.json()


def test_get_profile(client):
    client.post("/api/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    })

    login = client.post("/api/auth/login", json={
        "username": "testuser",
        "password": "password123"
    })

    token = login.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.json()["username"] == "testuser"
