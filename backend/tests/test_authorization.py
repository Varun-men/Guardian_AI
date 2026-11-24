"""
Authorization and upload-validation tests.

Verifies that role-based access control is actually enforced:
- creators cannot reach admin-only or reviewer-only endpoints
- reviewers cannot reach admin-only endpoints
- unauthenticated requests are rejected
- file uploads validate type, size and emptiness
"""

import uuid

from backend.auth.dependencies import get_db
from backend.auth.security import create_access_token
from backend.db.models import User


def make_user_token(client, username: str, role: str) -> str:
    """Register a user, set its role directly, and return a valid token."""

    client.post(
        "/api/auth/register",
        json={
            "username": username,
            "email": f"{username}@example.com",
            "password": "password123",
        },
    )

    generator = client.app.dependency_overrides[get_db]()
    db = next(generator)

    try:
        user = db.query(User).filter_by(username=username).first()
        user.role = role
        db.commit()
        user_id = user.id
    finally:
        generator.close()

    return create_access_token({"sub": user_id, "role": role})


# ============================================================
# CREATOR — must not reach admin-only or reviewer-only APIs
# ============================================================

def test_creator_cannot_list_sources(client):
    token = make_user_token(client, "creator_sources", "creator")

    response = client.get(
        "/api/sources/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_creator_cannot_upload_source(client):
    token = make_user_token(client, "creator_upload", "creator")

    response = client.post(
        "/api/sources/upload",
        files={"file": ("notes.txt", b"Some trusted text.", "text/plain")},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_creator_cannot_create_fact(client):
    token = make_user_token(client, "creator_create_fact", "creator")

    response = client.post(
        "/api/facts/",
        json={"name": "Price", "value": "$1", "source_id": "src"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_creator_cannot_update_fact(client):
    token = make_user_token(client, "creator_update_fact", "creator")

    response = client.patch(
        "/api/facts/some-fact-id",
        json={"value": "$1"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_creator_cannot_run_monitoring(client):
    token = make_user_token(client, "creator_monitoring", "creator")

    response = client.post(
        "/api/monitoring/run",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_creator_cannot_read_audit_logs(client):
    token = make_user_token(client, "creator_audit", "creator")

    response = client.get(
        "/api/audit-logs/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


# ============================================================
# REVIEWER — must not reach admin-only APIs
# ============================================================

def test_reviewer_cannot_list_sources(client):
    token = make_user_token(client, "reviewer_sources", "reviewer")

    response = client.get(
        "/api/sources/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_reviewer_cannot_upload_source(client):
    token = make_user_token(client, "reviewer_upload", "reviewer")

    response = client.post(
        "/api/sources/upload",
        files={"file": ("notes.txt", b"Some trusted text.", "text/plain")},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_reviewer_cannot_create_fact(client):
    token = make_user_token(client, "reviewer_create_fact", "reviewer")

    response = client.post(
        "/api/facts/",
        json={"name": "Price", "value": "$1", "source_id": "src"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_reviewer_cannot_assign_reviewer(client):
    token = make_user_token(client, "reviewer_assign", "reviewer")

    response = client.patch(
        f"/api/reviews/{uuid.uuid4()}/assign",
        json={"reviewer_id": str(uuid.uuid4())},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_reviewer_can_list_monitoring_alerts(client):
    token = make_user_token(client, "reviewer_alerts", "reviewer")

    response = client.get(
        "/api/monitoring/alerts",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200


# ============================================================
# ALLOWED READ — creators keep their intended access
# ============================================================

def test_creator_can_list_facts(client):
    token = make_user_token(client, "creator_list_facts", "creator")

    response = client.get(
        "/api/facts/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200


# ============================================================
# AUTHENTICATION — protected endpoints reject anonymous access
# ============================================================

def test_protected_endpoints_require_authentication(client):
    assert client.get("/api/sources/").status_code in (401, 403)

    create_response = client.post(
        "/api/facts/",
        json={"name": "Price", "value": "$1", "source_id": "src"},
    )
    assert create_response.status_code in (401, 403)

    monitoring_response = client.post("/api/monitoring/run")
    assert monitoring_response.status_code in (401, 403)


def test_invalid_token_is_rejected(client):
    response = client.get(
        "/api/sources/",
        headers={"Authorization": "Bearer not-a-real-token"},
    )

    assert response.status_code == 401


# ============================================================
# UPLOAD VALIDATION — admin uploads are still validated
# ============================================================

def test_upload_rejects_unsupported_extension(client):
    token = make_user_token(client, "admin_bad_ext", "admin")

    response = client.post(
        "/api/sources/upload",
        files={"file": ("payload.exe", b"MZ binary", "application/octet-stream")},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400


def test_upload_rejects_empty_file(client):
    token = make_user_token(client, "admin_empty", "admin")

    response = client.post(
        "/api/sources/upload",
        files={"file": ("empty.txt", b"", "text/plain")},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400


def test_upload_rejects_oversized_file(client):
    token = make_user_token(client, "admin_oversize", "admin")

    oversize = b"a" * (15 * 1024 * 1024 + 1)

    response = client.post(
        "/api/sources/upload",
        files={"file": ("big.txt", oversize, "text/plain")},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 413
