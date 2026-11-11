
import re
import time
import uuid

from backend.rules.config import get_brand_rules, get_pricing


def create_issue(
    category,
    severity,
    flagged_text,
    explanation,
    suggested_fix=None,
    passage_id="BRAND_RULES_V2",
    evidence="",
):
    return {
        "id": f"iss_{uuid.uuid4().hex[:8]}",
        "claim_id": None,
        "severity": severity,
        "category": category,
        "check_type": "RULE",
        "flagged_text": flagged_text,
        "passage_id": passage_id,
        "source_version": "v2",
        "cited_evidence": evidence,
        "explanation": explanation,
        "suggested_fix": suggested_fix,
        "confidence": 1.0,
        "needs_human_decision": False,
        "fact_id": None
    }


def check_banned_words(text, rules):
    issues = []

    for word in rules.get("banned_words", []):
        pattern = re.compile(
            rf"(?<!\w){re.escape(word)}(?!\w)",
            re.IGNORECASE
        )

        for match in pattern.finditer(text):
            issues.append(create_issue(
                category="BANNED_TERM",
                severity="HIGH",
                flagged_text=match.group(),
                explanation=f"'{word}' is a prohibited brand term.",
                evidence=f"Brand policy prohibits: {word}"
            ))

    return issues


def check_competitors(text, rules):
    issues = []

    for competitor in rules.get("competitors", []):
        pattern = re.compile(
            rf"(?<!\w){re.escape(competitor)}(?!\w)",
            re.IGNORECASE
        )

        for match in pattern.finditer(text):
            issues.append(create_issue(
                category="COMPETITOR_MENTION",
                severity="MEDIUM",
                flagged_text=match.group(),
                explanation=(
                    f"Competitor reference '{competitor}' "
                    "requires brand review."
                ),
                evidence=f"Restricted competitor: {competitor}"
            ))

    return issues



def check_pricing(text, pricing_data):
    issues = []

    for product in pricing_data.get("products", []):
        name = product["name"]
        approved_price = product["price"]
        approved_price_text = format(float(approved_price), "g")

        # Find sentences containing this product name.
        sentences = re.split(r"(?<=[.!?])\s+", text)

        for sentence in sentences:
            clean_sentence = sentence.strip()

            if not re.search(
                rf"\b{re.escape(name)}\b",
                clean_sentence,
                re.IGNORECASE
            ):
                continue

            # Find currency amounts while preserving their format.
            price_matches = re.finditer(
                r"(?P<currency>\$|USD\s*)\s*"
                r"(?P<amount>\d+(?:\.\d{1,2})?)",
                clean_sentence,
                re.IGNORECASE
            )

            for price_match in price_matches:
                mentioned_price = float(price_match.group("amount"))

                if mentioned_price != float(approved_price):
                    # Preserve the original currency symbol or USD prefix.
                    currency = price_match.group("currency")

                    corrected_sentence = (
                        clean_sentence[:price_match.start()]
                        + currency
                        + approved_price_text
                        + clean_sentence[price_match.end():]
                    )

                    issues.append(create_issue(
                        category="INCORRECT_PRICING",
                        severity="HIGH",
                        flagged_text=clean_sentence,
                        explanation=(
                            f"{name} price is incorrect. "
                            f"Approved price is ${approved_price}."
                        ),
                        suggested_fix=corrected_sentence,
                        passage_id="PRICING_V2",
                        evidence=(
                            f"{name}: ${approved_price}/"
                            f"{product['billing_period']} "
                            "according to Pricing Sheet v2."
                        )
                    ))

    return issues



def check_required_disclaimers(text, rules):
    issues = []

    for disclaimer in rules.get("required_disclaimers", []):
        if not re.search(
            re.escape(disclaimer),
            text,
            re.IGNORECASE
        ):
            issues.append(create_issue(
                category="MISSING_DISCLAIMER",
                severity="MEDIUM",
                flagged_text=text[:120],
                explanation=(
                    f"Required disclaimer is missing: {disclaimer}"
                ),
                suggested_fix=f"Add: {disclaimer}",
                evidence=f"Required disclaimer: {disclaimer}"
            ))

    return issues


def analyze_draft(text):
    start_time = time.perf_counter()

    rules = get_brand_rules()
    pricing = get_pricing()

    issues = []

    issues.extend(check_banned_words(text, rules))
    issues.extend(check_competitors(text, rules))
    issues.extend(check_pricing(text, pricing))
    issues.extend(check_required_disclaimers(text, rules))

    execution_time_ms = (
        time.perf_counter() - start_time
    ) * 1000

    return {
        "issues": issues,
        "execution_time_ms": round(execution_time_ms, 3),
        "total_issues": len(issues)
    }
