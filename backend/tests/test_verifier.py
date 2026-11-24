from backend.pipeline.verifier import verify_claim


def test_empty_evidence_returns_unverified():
    result = verify_claim(
        claim_id="claim-test-1",
        claim_text="Our product costs $29 per month.",
        evidence=[],
    )

    assert result.status == "UNVERIFIED"
    assert result.confidence == 0.45
    assert result.evidence_passage_ids == []
    assert result.claim_id == "claim-test-1"


def test_usd_price_claim_supported_against_matching_evidence():
    evidence = [
        {
            "passage_id": "pricing-1",
            "source": "Pricing Sheet v2",
            "source_version": "v2",
            "evidence_text": "Orbit Starter plan costs $29 per month.",
        }
    ]

    result = verify_claim(
        claim_id="claim-usd-1",
        claim_text="Plans start at $29.",
        evidence=evidence,
    )

    assert result.status == "SUPPORTED"
    assert result.evidence_passage_ids == ["pricing-1"]


def test_usd_price_claim_contradicted_against_different_evidence():
    evidence = [
        {
            "passage_id": "pricing-2",
            "source": "Pricing Sheet v2",
            "source_version": "v2",
            "evidence_text": "Orbit Pro plan costs $49 per month.",
        }
    ]

    result = verify_claim(
        claim_id="claim-usd-2",
        claim_text="Orbit Pro costs $69 per month.",
        evidence=evidence,
    )

    assert result.status == "CONTRADICTED"
