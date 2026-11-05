from types import SimpleNamespace

from fastapi.testclient import TestClient

from backend.main import app
import backend.pipeline.claim_extractor as claim_extractor


client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["status"] == "running"


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "Guardian AI Backend"
    }


def test_review_endpoint_includes_deterministic_rule_issues(monkeypatch):
    # Mock AI claim extraction so this test does not require
    # Gemini credentials or an external AI API.
    monkeypatch.setattr(
        claim_extractor,
        "extract_claims",
        lambda content: SimpleNamespace(claims=[])
    )

    response = client.post(
        "/api/review/analyze",
        json={
            "content": (
                "Our product offers guaranteed success. "
                "Orbit Starter costs $39 per month."
            ),
            "has_image": False
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "in_review"

    issues = data["issues"]

    rule_issues = [
        issue for issue in issues
        if issue["check_type"] == "RULE"
    ]

    detected_categories = {
        issue["category"] for issue in rule_issues
    }

    assert "BANNED_TERM" in detected_categories
    assert "INCORRECT_PRICING" in detected_categories

    assert len(rule_issues) >= 2

def test_review_endpoint_detects_missing_image_alt_text(monkeypatch):
    monkeypatch.setattr(
        claim_extractor,
        "extract_claims",
        lambda content: SimpleNamespace(claims=[])
    )

    response = client.post(
        "/api/review/analyze",
        json={
            "content": "Our campaign image is ready.",
            "has_image": True,
            "images": [
                {
                    "filename": "orbit-hero.png",
                    "alt": ""
                }
            ]
        }
    )

    assert response.status_code == 200

    data = response.json()

    accessibility_issues = [
        issue for issue in data["issues"]
        if issue["category"] == "MISSING_ALT_TEXT"
    ]

    assert len(accessibility_issues) == 1
    assert accessibility_issues[0]["flagged_text"] == "orbit-hero.png"
    assert accessibility_issues[0]["severity"] == "ACCESSIBILITY"
    assert accessibility_issues[0]["check_type"] == "RULE"