import uuid

from backend.auth.dependencies import get_db
from backend.auth.security import create_access_token
from backend.db.models import User, Draft, Review, Finding


def setup_finding(client):
    client.post("/api/auth/register", json={
        "username": "adminfind",
        "email": "adminfind@example.com",
        "password": "password123"
    })

    client.post("/api/auth/register", json={
        "username": "reviewfind",
        "email": "reviewfind@example.com",
        "password": "password123"
    })

    generator = client.app.dependency_overrides[get_db]()
    db = next(generator)

    try:
        admin = db.query(User).filter_by(username="adminfind").first()
        reviewer = db.query(User).filter_by(username="reviewfind").first()

        admin.role = "admin"
        reviewer.role = "reviewer"

        draft = Draft(id=str(uuid.uuid4()), content="Finding test")
        db.add(draft)
        db.flush()

        review = Review(
            id=str(uuid.uuid4()),
            draft_id=draft.id,
            submitted_text="Finding review"
        )
        db.add(review)
        db.flush()

        finding = Finding(
            id=str(uuid.uuid4()),
            review_id=review.id,
            finding_type="unsupported_claim",
            severity="high",
            explanation="Evidence is missing"
        )
        db.add(finding)
        db.commit()

        return (
            finding.id,
            reviewer.id,
            create_access_token({"sub": admin.id, "role": "admin"}),
            create_access_token({"sub": reviewer.id, "role": "reviewer"})
        )
    finally:
        generator.close()


def test_assign_finding_reviewer(client):
    finding_id, reviewer_id, admin_token, reviewer_token = setup_finding(client)

    response = client.patch(
        f"/api/findings/{finding_id}/assign",
        json={"reviewer_id": reviewer_id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200


def test_verify_finding(client):
    finding_id, reviewer_id, admin_token, reviewer_token = setup_finding(client)

    client.patch(
        f"/api/findings/{finding_id}/assign",
        json={"reviewer_id": reviewer_id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    response = client.patch(
        f"/api/findings/{finding_id}/verify",
        json={"verification_status": "verified"},
        headers={"Authorization": f"Bearer {reviewer_token}"}
    )

    assert response.status_code == 200
    assert response.json()["verification_status"] == "verified"
