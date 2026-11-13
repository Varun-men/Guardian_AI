import logging

logger = logging.getLogger("guardian-ai")


def verify_citation(
    passage_id,
    cited_quote,
    evidence_items=None
):
    """
    Verify that:
    1. The passage ID exists in the retrieved evidence.
    2. The cited quote exists exactly in that passage.

    This function is intentionally deterministic.
    It does not use Gemini.
    """

    # ============================================================
    # DATABASE / RETRIEVED EVIDENCE MODE
    # ============================================================

    if evidence_items is not None:

        matched_item = next(
            (
                item
                for item in evidence_items
                if str(item.get("passage_id")) == str(passage_id)
            ),
            None
        )

        if matched_item is None:

            logger.warning(
                "Citation failed: passage %s was not found "
                "in retrieved evidence.",
                passage_id
            )

            return {
                "valid": False,
                "reason": (
                    "Passage ID does not exist in the "
                    "retrieved evidence."
                ),
                "passage_id": passage_id
            }

        original_text = str(
            matched_item.get("evidence_text", "")
        )

        cited_quote = str(cited_quote or "")

        # Exact quote verification
        if not cited_quote.strip():

            return {
                "valid": False,
                "reason": "Cited quote is empty.",
                "passage_id": passage_id
            }

        if cited_quote not in original_text:

            logger.warning(
                "Citation failed: quote does not exactly "
                "match passage %s.",
                passage_id
            )

            return {
                "valid": False,
                "reason": (
                    "Cited quote does not match the "
                    "original passage."
                ),
                "passage_id": passage_id
            }

        logger.info(
            "Citation verified successfully for passage %s.",
            passage_id
        )

        return {
            "valid": True,
            "reason": "Citation verified successfully.",
            "passage_id": passage_id,
            "source": matched_item.get(
                "source",
                "Unknown"
            ),
            "source_version": matched_item.get(
                "source_version",
                "v1"
            ),
            "cited_evidence": cited_quote
        }

    # ============================================================
    # LEGACY CHROMADB FALLBACK
    # ============================================================

    try:

        from .evidence_store import collection

    except ImportError:

        from evidence_store import collection

    try:

        result = collection.get(
            ids=[passage_id],
            include=[
                "documents",
                "metadatas"
            ]
        )

    except Exception as exc:

        logger.exception(
            "Legacy citation lookup failed: %s",
            exc
        )

        return {
            "valid": False,
            "reason": "Unable to retrieve citation passage.",
            "passage_id": passage_id
        }

    if not result.get("ids"):

        return {
            "valid": False,
            "reason": "Passage ID does not exist.",
            "passage_id": passage_id
        }

    original_text = result["documents"][0]

    metadata = (
        result["metadatas"][0]
        if result.get("metadatas")
        else {}
    )

    cited_quote = str(cited_quote or "")

    if not cited_quote.strip():

        return {
            "valid": False,
            "reason": "Cited quote is empty.",
            "passage_id": passage_id
        }

    if cited_quote not in original_text:

        return {
            "valid": False,
            "reason": (
                "Cited quote does not match the "
                "original passage."
            ),
            "passage_id": passage_id
        }

    return {
        "valid": True,
        "reason": "Citation verified successfully.",
        "passage_id": passage_id,
        "source": metadata.get(
            "source",
            "Unknown"
        ),
        "source_version": metadata.get(
            "version",
            "v1"
        ),
        "cited_evidence": cited_quote
    }