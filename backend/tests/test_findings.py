import uuid

from backend.auth.dependencies import get_db
from backend.auth.security import create_access_token
from backend.db.models import (
    User,
    Draft,
    Review,
    Finding,
    Source,
    SourcePassage,
    Fact,
)


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


def setup_association_finding(client, fact_version=1):
    client.post("/api/auth/register", json={
        "username": "associateadmin",
        "email": "associateadmin@example.com",
        "password": "password123"
    })

    client.post("/api/auth/register", json={
        "username": "associatereviewer",
        "email": "associatereviewer@example.com",
        "password": "password123"
    })

    generator = client.app.dependency_overrides[get_db]()
    db = next(generator)

    try:
        admin = db.query(User).filter_by(
            username="associateadmin"
        ).first()
        reviewer = db.query(User).filter_by(
            username="associatereviewer"
        ).first()

        admin.role = "admin"
        reviewer.role = "reviewer"

        source = Source(
            id=str(uuid.uuid4()),
            filename="pricing.txt",
            file_type="txt",
            version=1,
            status="active",
        )
        db.add(source)
        db.flush()

        passage = SourcePassage(
            id=str(uuid.uuid4()),
            source_id=source.id,
            source_version=1,
            chunk_index=0,
            page_number=None,
            content="The product costs $39 per month.",
            embedding=[0.0] * 768,
            embedding_model="test-model",
        )
        db.add(passage)

        fact = Fact(
            id=str(uuid.uuid4()),
            name="Monthly price",
            value="$39 per month",
            source_id=source.id,
            source_version=fact_version,
        )
        db.add(fact)

        draft = Draft(
            id=str(uuid.uuid4()),
            content="The product costs $39 per month."
        )
        db.add(draft)
        db.flush()

        review = Review(
            id=str(uuid.uuid4()),
            draft_id=draft.id,
            submitted_text="The product costs $39 per month."
        )
        db.add(review)
        db.flush()

        finding = Finding(
            id=str(uuid.uuid4()),
            review_id=review.id,
            finding_type="unsupported_claim",
            severity="high",
            explanation="Verify the product price.",
            evidence=[{
                "passage_id": passage.id,
                "source_version": 1,
                "cited_evidence": "The product costs $39 per month.",
            }],
        )
        db.add(finding)
        db.commit()

        return {
            "finding_id": finding.id,
            "fact_id": fact.id,
            "passage_id": passage.id,
            "source_id": source.id,
            "admin_token": create_access_token({
                "sub": admin.id,
                "role": "admin"
            }),
            "reviewer_token": create_access_token({
                "sub": reviewer.id,
                "role": "reviewer"
            }),
            "reviewer_id": reviewer.id,
        }

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


def test_associate_fact_with_valid_evidence(client):
    data = setup_association_finding(client)

    response = client.patch(
        f"/api/findings/{data['finding_id']}/associate-fact",
        json={
            "fact_id": data["fact_id"],
            "passage_id": data["passage_id"],
        },
        headers={
            "Authorization": f"Bearer {data['admin_token']}"
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["fact_id"] == data["fact_id"]
    assert result["passage_id"] == data["passage_id"]
    assert result["source_id"] == data["source_id"]
    assert result["source_version"] == 1


def test_associate_fact_rejects_unattached_passage(client):
    data = setup_association_finding(client)

    generator = client.app.dependency_overrides[get_db]()
    db = next(generator)

    try:
        other_passage = SourcePassage(
            id=str(uuid.uuid4()),
            source_id=data["source_id"],
            source_version=1,
            chunk_index=1,
            page_number=None,
            content="A different passage.",
            embedding=[0.0] * 768,
            embedding_model="test-model",
        )
        db.add(other_passage)
        db.commit()
        other_passage_id = other_passage.id
    finally:
        generator.close()

    response = client.patch(
        f"/api/findings/{data['finding_id']}/associate-fact",
        json={
            "fact_id": data["fact_id"],
            "passage_id": other_passage_id,
        },
        headers={
            "Authorization": f"Bearer {data['admin_token']}"
        },
    )

    assert response.status_code == 400


def test_associate_fact_rejects_source_version_mismatch(client):
    data = setup_association_finding(
        client,
        fact_version=2,
    )

    response = client.patch(
        f"/api/findings/{data['finding_id']}/associate-fact",
        json={
            "fact_id": data["fact_id"],
            "passage_id": data["passage_id"],
        },
        headers={
            "Authorization": f"Bearer {data['admin_token']}"
        },
    )

    assert response.status_code == 400


def test_unassigned_reviewer_cannot_associate_fact(client):
    data = setup_association_finding(client)

    response = client.patch(
        f"/api/findings/{data['finding_id']}/associate-fact",
        json={
            "fact_id": data["fact_id"],
            "passage_id": data["passage_id"],
        },
        headers={
            "Authorization": f"Bearer {data['reviewer_token']}"
        },
    )

    assert response.status_code == 403
