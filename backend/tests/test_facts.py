from backend.auth.dependencies import get_db
from backend.auth.security import create_access_token
from backend.db.models import (
    User,
    Source,
    SourcePassage,
    Fact,
    Draft,
    Review,
    Claim,
    ClaimLedger,
    Alert,
)

def setup_admin_source(client, status="active", add_passage=True):
    client.post("/api/auth/register", json={
        "username": "factadmin",
        "email": "factadmin@example.com",
        "password": "password123"
    })

    generator = client.app.dependency_overrides[get_db]()
    db = next(generator)

    try:
        admin = db.query(User).filter_by(username="factadmin").first()
        admin.role = "admin"

        source = Source(
            id="source-fact-test",
            filename="pricing.txt",
            file_type="txt",
            version=1,
            status=status,
        )
        db.add(source)

        if add_passage:
            db.add(SourcePassage(
                id="passage-fact-test",
                source_id=source.id,
                source_version=1,
                chunk_index=0,
                page_number=None,
                content="The product costs $39 per month.",
                embedding=[0.0] * 768,
                embedding_model="test-model",
            ))

        db.commit()

        token = create_access_token({
            "sub": admin.id,
            "role": "admin"
        })

        return token, source.id

    finally:
        generator.close()


def test_create_fact_from_active_source(client):
    token, source_id = setup_admin_source(client)

    response = client.post(
        "/api/facts/",
        json={
            "name": "Monthly price",
            "value": "$39 per month",
            "source_id": source_id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201

    data = response.json()["fact"]
    assert data["name"] == "Monthly price"
    assert data["value"] == "$39 per month"
    assert data["source_id"] == source_id
    assert data["source_version"] == 1


def test_create_fact_rejects_missing_source(client):
    token, _ = setup_admin_source(client)

    response = client.post(
        "/api/facts/",
        json={
            "name": "Monthly price",
            "value": "$39 per month",
            "source_id": "missing-source",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404


def test_create_fact_rejects_pending_source(client):
    token, source_id = setup_admin_source(
        client,
        status="pending",
    )

    response = client.post(
        "/api/facts/",
        json={
            "name": "Monthly price",
            "value": "$39 per month",
            "source_id": source_id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 409


def test_create_fact_rejects_source_without_passages(client):
    token, source_id = setup_admin_source(
        client,
        add_passage=False,
    )

    response = client.post(
        "/api/facts/",
        json={
            "name": "Monthly price",
            "value": "$39 per month",
            "source_id": source_id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 409


def test_create_fact_requires_authentication(client):
    response = client.post(
        "/api/facts/",
        json={
            "name": "Monthly price",
            "value": "$39 per month",
            "source_id": "source-fact-test",
        },
    )

    assert response.status_code == 401


def test_list_facts_for_admin(client):
    token, source_id = setup_admin_source(client)

    create_response = client.post(
        "/api/facts/",
        json={
            "name": "Monthly price",
            "value": "$39 per month",
            "source_id": source_id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert create_response.status_code == 201

    response = client.get(
        "/api/facts/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["facts"][0]["name"] == "Monthly price"


def test_update_fact_preserves_source_version(client):
    token, source_id = setup_admin_source(client)

    headers = {"Authorization": f"Bearer {token}"}

    # Create a fact linked to source version 1.
    create_response = client.post(
        "/api/facts/",
        json={
            "name": "Monthly price",
            "value": "$39 per month",
            "source_id": source_id,
        },
        headers=headers,
    )

    assert create_response.status_code == 201
    fact_id = create_response.json()["fact"]["id"]

    # Update the fact's value.
    update_response = client.patch(
        f"/api/facts/{fact_id}",
        json={
            "name": "Monthly price",
            "value": "$49 per month",
        },
        headers=headers,
    )

    assert update_response.status_code == 200

    # Confirm the fact still points to its original source version.
    generator = client.app.dependency_overrides[get_db]()
    db = next(generator)

    try:
        fact = db.query(
            __import__("backend.db.models", fromlist=["Fact"]).Fact
        ).filter_by(id=fact_id).first()

        assert fact is not None
        assert fact.value == "$49 per month"
        assert fact.source_version == 1
    finally:
        generator.close()



def test_update_fact_marks_linked_claim_stale_and_creates_alert(client):
    token, source_id = setup_admin_source(client)
    headers = {"Authorization": f"Bearer {token}"}

    # Create a fact linked to source version 1.
    create_response = client.post(
        "/api/facts/",
        json={
            "name": "Monthly price",
            "value": "$39 per month",
            "source_id": source_id,
        },
        headers=headers,
    )
    assert create_response.status_code == 201
    fact_id = create_response.json()["fact"]["id"]

    # Create an approved draft, review, claim and ledger entry.
    generator = client.app.dependency_overrides[get_db]()
    db = next(generator)

    try:
        fact = db.query(Fact).filter_by(id=fact_id).first()

        draft = Draft(
            id="draft-fact-monitor-test",
            content="The product costs $39 per month.",
            status="approved",
        )
        db.add(draft)
        db.flush()

        review = Review(
            id="review-fact-monitor-test",
            draft_id=draft.id,
            submitted_text="The product costs $39 per month.",
            status="approved",
        )
        db.add(review)
        db.flush()

        claim = Claim(
            id="claim-fact-monitor-test",
            review_id=review.id,
            claim_text="The product costs $39 per month.",
            status="approved",
        )
        db.add(claim)
        db.flush()

        ledger_entry = ClaimLedger(
            claim_id=claim.id,
            fact_id=fact.id,
            status="approved",
        )
        db.add(ledger_entry)
        db.commit()

    finally:
        generator.close()

    # Update the fact through the actual API.
    update_response = client.patch(
        f"/api/facts/{fact_id}",
        json={
            "name": "Monthly price",
            "value": "$49 per month",
        },
        headers=headers,
    )

    assert update_response.status_code == 200

    # Verify the complete cascade.
    generator = client.app.dependency_overrides[get_db]()
    db = next(generator)

    try:
        updated_fact = db.query(Fact).filter_by(id=fact_id).first()
        updated_claim = db.query(Claim).filter_by(
            id="claim-fact-monitor-test"
        ).first()
        updated_entry = db.query(ClaimLedger).filter_by(
            claim_id="claim-fact-monitor-test",
            fact_id=fact_id,
        ).first()
        updated_draft = db.query(Draft).filter_by(
            id="draft-fact-monitor-test"
        ).first()
        alerts = db.query(Alert).filter_by(
            claim_id="claim-fact-monitor-test",
            fact_id=fact_id,
            status="open",
        ).all()

        assert updated_fact.value == "$49 per month"
        assert updated_fact.source_version == 1

        assert updated_claim.status == "stale"
        assert updated_entry.status == "stale"
        assert updated_draft.status == "stale"

        assert len(alerts) >= 1
        assert "updated" in alerts[0].message.lower()

    finally:
        generator.close()
