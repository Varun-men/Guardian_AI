from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from starlette.requests import Request

import backend.pipeline.claim_extractor as claim_extractor
from backend.services import rate_limit


@pytest.fixture(autouse=True)
def _clear_limiter():
    """Keep the module-global bucket isolated between tests."""
    rate_limit._hits.clear()
    yield
    rate_limit._hits.clear()


def _fake_request(host: str = "1.2.3.4") -> Request:
    return Request(
        {"type": "http", "client": (host, 5000), "headers": []}
    )


def test_rate_limit_parsing(monkeypatch):
    monkeypatch.setenv("ANALYZE_RATE_LIMIT_PER_MINUTE", "abc")
    assert rate_limit.get_rate_limit_per_minute() == 0

    monkeypatch.setenv("ANALYZE_RATE_LIMIT_PER_MINUTE", "5")
    assert rate_limit.get_rate_limit_per_minute() == 5

    monkeypatch.setenv("ANALYZE_RATE_LIMIT_PER_MINUTE", "-3")
    assert rate_limit.get_rate_limit_per_minute() == 0


def test_rate_limit_disabled_allows_unlimited(monkeypatch):
    monkeypatch.setenv("ANALYZE_RATE_LIMIT_PER_MINUTE", "0")

    request = _fake_request()

    for _ in range(50):
        rate_limit.enforce_rate_limit(request)  # must never raise


def test_rate_limit_blocks_over_threshold(monkeypatch):
    monkeypatch.setenv("ANALYZE_RATE_LIMIT_PER_MINUTE", "2")

    request = _fake_request("9.9.9.9")

    rate_limit.enforce_rate_limit(request)
    rate_limit.enforce_rate_limit(request)

    with pytest.raises(HTTPException) as exc:
        rate_limit.enforce_rate_limit(request)

    assert exc.value.status_code == 429
    assert "Retry-After" in exc.value.headers


def test_rate_limit_is_per_client(monkeypatch):
    monkeypatch.setenv("ANALYZE_RATE_LIMIT_PER_MINUTE", "1")

    client_a = _fake_request("8.8.8.8")
    client_b = _fake_request("7.7.7.7")

    rate_limit.enforce_rate_limit(client_a)
    rate_limit.enforce_rate_limit(client_b)  # different client, still allowed

    with pytest.raises(HTTPException):
        rate_limit.enforce_rate_limit(client_a)


def test_analyze_endpoint_rejects_too_many_images(client):
    response = client.post(
        "/api/review/analyze",
        json={
            "content": "Our campaign is ready.",
            "has_image": True,
            "images": [
                {"filename": f"img-{i}.png", "alt": "descriptive alt"}
                for i in range(6)
            ],
        },
    )

    assert response.status_code == 422


def test_analyze_endpoint_rate_limited(client, monkeypatch):
    monkeypatch.setenv("ANALYZE_RATE_LIMIT_PER_MINUTE", "1")

    # Avoid Gemini/network dependency for this request-shaping test.
    monkeypatch.setattr(
        claim_extractor,
        "extract_claims",
        lambda content: SimpleNamespace(claims=[]),
    )

    body = {
        "content": "Our product offers guaranteed success.",
        "has_image": False,
    }

    first = client.post("/api/review/analyze", json=body)
    assert first.status_code == 200

    second = client.post("/api/review/analyze", json=body)
    assert second.status_code == 429
