from unittest.mock import patch

from backend.pipeline.verifier import verify_claim


def test_empty_evidence_returns_unverified_without_gemini():
    with patch(
        "backend.pipeline.verifier.retrieve_evidence",
        return_value=[],
    ), patch(
        "backend.pipeline.verifier.get_gemini_client"
    ) as mock_gemini:

        result = verify_claim(
            "claim-test-1",
            "Our product costs $29 per month.",
        )

    assert result.status == "unverified"
    assert result.confidence == 0.0
    assert result.evidence_passage_ids == []
    assert result.needs_human_decision is True

    # Gemini must not be called when there is no evidence.
    mock_gemini.assert_not_called()