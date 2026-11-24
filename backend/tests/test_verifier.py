from backend.pipeline.verifier import verify_claim


def test_empty_evidence_returns_unverified():
    result = verify_claim(
        claim_id="claim-test-1",
        claim_text="Our product costs $29 per month.",
        evidence=[],
    )

    assert result.status == "UNVERIFIED"
    assert result.confidence == 0.40
    assert result.evidence_passage_ids == []
    assert result.claim_id == "claim-test-1"