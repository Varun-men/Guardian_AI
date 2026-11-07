
def verify_citation(passage_id, cited_quote, evidence_items=None):
    """
    Verify that a cited passage exists and the quote appears
    exactly in the original evidence.

    If evidence_items are supplied, validate against the same
    database-retrieved passages used during claim verification.

    Otherwise, use the legacy ChromaDB collection.
    """

    # Database-backed evidence validation.
    if evidence_items is not None:

        matched_item = next(
            (
                item for item in evidence_items
                if item.get("passage_id") == passage_id
            ),
            None
        )

        if matched_item is None:
            return {
                "valid": False,
                "reason": "Passage ID does not exist in the retrieved evidence.",
                "passage_id": passage_id
            }

        original_text = matched_item.get("evidence_text", "")

        if cited_quote not in original_text:
            return {
                "valid": False,
                "reason": "Cited quote does not match the original passage.",
                "passage_id": passage_id
            }

        return {
            "valid": True,
            "reason": "Citation verified successfully.",
            "passage_id": passage_id,
            "source": matched_item.get("source", "Unknown"),
            "source_version": matched_item.get("source_version", "v1"),
            "cited_evidence": cited_quote
        }

    # Legacy ChromaDB fallback.
    try:
        from .evidence_store import collection
    except ImportError:
        from evidence_store import collection

    result = collection.get(
        ids=[passage_id],
        include=["documents", "metadatas"]
    )

    if not result["ids"]:
        return {
            "valid": False,
            "reason": "Passage ID does not exist.",
            "passage_id": passage_id
        }

    original_text = result["documents"][0]
    metadata = result["metadatas"][0] or {}

    if cited_quote not in original_text:
        return {
            "valid": False,
            "reason": "Cited quote does not match the original passage.",
            "passage_id": passage_id
        }

    return {
        "valid": True,
        "reason": "Citation verified successfully.",
        "passage_id": passage_id,
        "source": metadata.get("source", "Unknown"),
        "source_version": metadata.get("version", "v1"),
        "cited_evidence": cited_quote
    }


if __name__ == "__main__":

    # Test using supplied evidence.
    sample_evidence = [
        {
            "passage_id": "passage_2",
            "evidence_text": "Orbit subscription plans start at $29 per month.",
            "source": "test_source.txt",
            "source_version": "v1"
        }
    ]

    print("\nValid Citation Test:")
    print(
        verify_citation(
            "passage_2",
            "Orbit subscription plans start at $29 per month.",
            evidence_items=sample_evidence
        )
    )

    print("\nInvalid Citation Test:")
    print(
        verify_citation(
            "passage_2",
            "Orbit plans start at $10 per month.",
            evidence_items=sample_evidence
        )
    )
