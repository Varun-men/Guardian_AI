from types import SimpleNamespace

from backend.rules.change_detector import (
    detect_fact_change,
    detect_outdated_evidence,
)


def test_detect_stale_fact():
    ledger = SimpleNamespace(status="stale")
    claim = SimpleNamespace(id="claim-1", status="stale")
    fact = SimpleNamespace(id="fact-1", name="Orbit Pro Price")

    issues = detect_fact_change(ledger, claim, fact)

    assert len(issues) == 1
    assert issues[0]["type"] == "FACT_CHANGED"


def test_unchanged_ledger_has_no_change():
    ledger = SimpleNamespace(status="approved")
    claim = SimpleNamespace(id="claim-1", status="approved")
    fact = SimpleNamespace(id="fact-1", name="Orbit Pro Price")

    issues = detect_fact_change(ledger, claim, fact)

    assert issues == []


def test_detect_outdated_source_version():
    fact = SimpleNamespace(id="fact-1", source_version=1)
    source = SimpleNamespace(
        id="source-1",
        filename="pricing.pdf",
        version=2,
        status="active",
    )

    issues = detect_outdated_evidence(
        fact,
        source,
        passage_exists=True,
    )

    assert any(
        issue["type"] == "EVIDENCE_OUTDATED"
        for issue in issues
    )


def test_detect_missing_passage():
    fact = SimpleNamespace(id="fact-1", source_version=1)
    source = SimpleNamespace(
        id="source-1",
        filename="pricing.pdf",
        version=1,
        status="active",
    )

    issues = detect_outdated_evidence(
        fact,
        source,
        passage_exists=False,
    )

    assert any(
        issue["type"] == "EVIDENCE_MISSING"
        for issue in issues
    )