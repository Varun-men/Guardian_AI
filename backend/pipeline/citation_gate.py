
try:
    from .evidence_store import collection
except ImportError:
    from evidence_store import collection


def verify_citation(passage_id, cited_quote):
    """
    Verify that a cited passage exists and the quote
    appears exactly in the stored evidence.
    """

    result = collection.get(
        ids=[passage_id],
        include=["documents", "metadatas"]
    )

    # Check whether passage exists
    if not result["ids"]:
        return {
            "valid": False,
            "reason": "Passage ID does not exist.",
            "passage_id": passage_id
        }

    original_text = result["documents"][0]
    metadata = result["metadatas"][0]

    # Check exact quote
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

    # Test 1: Valid citation
    result = verify_citation(
        "passage_2",
        "Orbit subscription plans start at $29 per month."
    )

    print("\nValid Citation Test:")
    print(result)

    # Test 2: Invalid citation
    result = verify_citation(
        "passage_2",
        "Orbit plans start at $10 per month."
    )

    print("\nInvalid Citation Test:")
    print(result)
