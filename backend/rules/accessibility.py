
import uuid


def check_accessibility(images):
    issues = []

    for image in images:
        filename = image.get("filename", "unknown-image")
        alt_text = image.get("alt")

        if not isinstance(alt_text, str) or not alt_text.strip():

            issues.append({
                "id": f"iss_{uuid.uuid4().hex[:8]}",
                "claim_id": None,
                "severity": "ACCESSIBILITY",
                "category": "MISSING_ALT_TEXT",
                "check_type": "RULE",
                "flagged_text": filename,
                "passage_id": "WCAG_1_1_1",
                "source_version": "v1",
                "cited_evidence": (
                    "Images need a text alternative."
                ),
                "explanation": (
                    f"Image '{filename}' has missing or empty alt text."
                ),
                "suggested_fix": (
                    "Add a meaningful description of the image."
                ),
                "confidence": 1.0,
                "needs_human_decision": False,
                "fact_id": None
            })

    return issues
