import uuid

from backend.auth.dependencies import get_db
from backend.auth.security import create_access_token
from backend.db.models import User, Draft, Review, Claim


def setup_review(client):
    client.post("/api/auth/register", json={
        "username": "adminuser",
        "email": "admin@example.com",
        "password": "password123"
    })

    client.post("/api/auth/register", json={
        "username": "reviewuser",
        "email": "review@example.com",
        "password": "password123"
    })

    db_generator = client.app.dependency_overrides[get_db]()
    db = next(db_generator)

    try:
        admin_user = db.query(User).filter_by(username="adminuser").first()
        reviewer_user = db.query(User).filter_by(username="reviewuser").first()

        admin_user.role = "admin"
        reviewer_user.role = "reviewer"

        draft = Draft(id=str(uuid.uuid4()), content="Test draft")
        db.add(draft)
        db.flush()

        review = Review(
            id=str(uuid.uuid4()),
            draft_id=draft.id,
            submitted_text="Test review"
        )
        db.add(review)
        db.flush()

        claim = Claim(
            id=str(uuid.uuid4()),
            review_id=review.id,
            claim_text="Test claim"
        )
        db.add(claim)
        db.commit()

        admin_token = create_access_token({"sub": admin_user.id, "role": "admin"})
        reviewer_token = create_access_token({"sub": reviewer_user.id, "role": "reviewer"})

        return review.id, claim.id, reviewer_user.id, admin_token, reviewer_token

    finally:
        db_generator.close()


def test_assign_reviewer(client):
    review_id, claim_id, reviewer_id, admin_token, reviewer_token = setup_review(client)

    response = client.patch(
        f"/api/reviews/{review_id}/assign",
        json={"reviewer_id": reviewer_id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200


def test_reviewer_approves_claim(client):
    review_id, claim_id, reviewer_id, admin_token, reviewer_token = setup_review(client)

    client.patch(
        f"/api/reviews/{review_id}/assign",
        json={"reviewer_id": reviewer_id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    response = client.patch(
        f"/api/reviews/{review_id}/claims/{claim_id}/decision",
        json={"decision": "approved"},
        headers={"Authorization": f"Bearer {reviewer_token}"}
    )

    assert response.status_code == 200
    assert response.json()["status"] == "approved"
