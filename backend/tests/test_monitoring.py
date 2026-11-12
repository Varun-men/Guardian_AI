import uuid

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


def setup_monitoring_case(
    client,
    source_version=1,
    fact_version=1,
    add_passage=True,
    mark_stale=False,
):
    client.post("/api/auth/register", json={
        "username": "monitoradmin",
        "email": "monitoradmin@example.com",
        "password": "password123",
    })

    client.post("/api/auth/register", json={
        "username": "monitorreviewer",
        "email": "monitorreviewer@example.com",
        "password": "password123",
    })

    generator = client.app.dependency_overrides[get_db]()
    db = next(generator)

    try:
        admin = db.query(User).filter_by(
            username="monitoradmin"
        ).first()

        reviewer = db.query(User).filter_by(
            username="monitorreviewer"
        ).first()

        admin.role = "admin"
        reviewer.role = "reviewer"

        source_id = str(uuid.uuid4())
        passage_id = str(uuid.uuid4())
        fact_id = str(uuid.uuid4())
        draft_id = str(uuid.uuid4())
        review_id = str(uuid.uuid4())
        claim_id = str(uuid.uuid4())

        source = Source(
            id=source_id,
            filename="monitor-pricing.txt",
            file_type="txt",
            version=source_version,
            status="active",
        )
        db.add(source)

        if add_passage:
            db.add(SourcePassage(
                id=passage_id,
                source_id=source_id,
                source_version=fact_version,
                chunk_index=0,
                page_number=None,
                content="The product costs $39 per month.",
                embedding=[0.0] * 768,
                embedding_model="test-model",
            ))

        fact = Fact(
            id=fact_id,
            name="Monthly price",
            value="$39 per month",
            source_id=source_id,
            source_version=fact_version,
        )
        db.add(fact)

        draft = Draft(
            id=draft_id,
            content="The product costs $39 per month.",
            status="stale" if mark_stale else "approved",
        )
        db.add(draft)
        db.flush()

        review = Review(
            id=review_id,
            draft_id=draft_id,
            submitted_text="The product costs $39 per month.",
            status="approved",
        )
        db.add(review)
        db.flush()

        claim = Claim(
            id=claim_id,
            review_id=review_id,
            claim_text="The product costs $39 per month.",
            status="stale" if mark_stale else "approved",
        )
        db.add(claim)
        db.flush()

        ledger_entry = ClaimLedger(
            claim_id=claim_id,
            fact_id=fact_id,
            status="stale" if mark_stale else "approved",
        )
        db.add(ledger_entry)

        db.commit()

        return {
            "source_id": source_id,
            "fact_id": fact_id,
            "draft_id": draft_id,
            "review_id": review_id,
            "claim_id": claim_id,
            "admin_token": create_access_token({
                "sub": admin.id,
                "role": "admin",
            }),
            "reviewer_token": create_access_token({
                "sub": reviewer.id,
                "role": "reviewer",
            }),
        }

    finally:
        generator.close()


def test_monitoring_healthy_claim_creates_no_alert(client):
    data = setup_monitoring_case(client)

    response = client.post(
        "/api/monitoring/run",
        headers={
            "Authorization": f"Bearer {data['admin_token']}"
        },
    )

    assert response.status_code == 200
    result = response.json()

    assert result["claims_checked"] == 1
    assert result["alerts_created"] == 0
    assert result["unchanged_claims"] == 1


def test_monitoring_detects_stale_fact(client):
    data = setup_monitoring_case(client, mark_stale=True)

    response = client.post(
        "/api/monitoring/run",
        headers={
            "Authorization": f"Bearer {data['admin_token']}"
        },
    )

    assert response.status_code == 200
    result = response.json()

    assert result["alerts_created"] == 1
    assert "FACT_CHANGED" in result["results"][0]["issues"]

    alerts_response = client.get(
        "/api/monitoring/alerts",
        headers={
            "Authorization": f"Bearer {data['admin_token']}"
        },
    )

    assert alerts_response.status_code == 200
    assert alerts_response.json()["total"] == 1


def test_monitoring_detects_outdated_source_version(client):
    data = setup_monitoring_case(
        client,
        source_version=2,
        fact_version=1,
    )

    response = client.post(
        "/api/monitoring/run",
        headers={
            "Authorization": f"Bearer {data['admin_token']}"
        },
    )

    assert response.status_code == 200
    result = response.json()

    assert result["alerts_created"] == 1
    assert "EVIDENCE_OUTDATED" in result["results"][0]["issues"]


def test_monitoring_detects_missing_passage(client):
    data = setup_monitoring_case(
        client,
        add_passage=False,
    )

    response = client.post(
        "/api/monitoring/run",
        headers={
            "Authorization": f"Bearer {data['admin_token']}"
        },
    )

    assert response.status_code == 200
    result = response.json()

    assert result["alerts_created"] == 1
    assert "EVIDENCE_MISSING" in result["results"][0]["issues"]


def test_monitoring_does_not_duplicate_open_alerts(client):
    data = setup_monitoring_case(client, mark_stale=True)
    headers = {
        "Authorization": f"Bearer {data['admin_token']}"
    }

    first_run = client.post(
        "/api/monitoring/run",
        headers=headers,
    )
    assert first_run.status_code == 200
    assert first_run.json()["alerts_created"] == 1

    second_run = client.post(
        "/api/monitoring/run",
        headers=headers,
    )
    assert second_run.status_code == 200
    assert second_run.json()["alerts_created"] == 0

    existing_results = second_run.json()["results"]
    assert existing_results[0]["status"] == "existing_alert"

    alerts_response = client.get(
        "/api/monitoring/alerts",
        headers=headers,
    )

    assert alerts_response.status_code == 200
    assert alerts_response.json()["total"] == 1


def test_monitoring_alert_can_reopen_review(client):
    data = setup_monitoring_case(client, mark_stale=True)
    headers = {
        "Authorization": f"Bearer {data['admin_token']}"
    }

    run_response = client.post(
        "/api/monitoring/run",
        headers=headers,
    )
    assert run_response.status_code == 200

    alerts_response = client.get(
        "/api/monitoring/alerts",
        headers=headers,
    )
    assert alerts_response.status_code == 200

    alert_id = alerts_response.json()["alerts"][0]["id"]

    reopen_response = client.post(
        f"/api/monitoring/alerts/{alert_id}/reopen",
        headers=headers,
    )

    assert reopen_response.status_code == 200
    assert reopen_response.json()["review_status"] == "pending"
    assert reopen_response.json()["draft_status"] == "in_review"

    generator = client.app.dependency_overrides[get_db]()
    db = next(generator)

    try:
        alert = db.query(Alert).filter_by(id=alert_id).first()
        claim = db.query(Claim).filter_by(
            id=data["claim_id"]
        ).first()

        assert alert is not None
        assert alert.status == "open"
        assert claim.status == "stale"

    finally:
        generator.close()


def test_reviewer_cannot_run_monitoring(client):
    data = setup_monitoring_case(client)

    response = client.post(
        "/api/monitoring/run",
        headers={
            "Authorization": f"Bearer {data['reviewer_token']}"
        },
    )

    assert response.status_code == 403
