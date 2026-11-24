"""
Guardian AI - Claim Verification Engine

Responsibilities:
- Verify extracted claims against retrieved evidence.
- Support specialized verification for:
    - Product name
    - Battery life
    - Price
    - Colours
    - Display
    - GPS
    - Water resistance
    - Heart-rate monitoring
- Fall back to deterministic generic verification.
- Return structured VerificationResult objects.
"""

from dataclasses import dataclass, field
import re
from typing import Any, Dict, List, Optional


# ============================================================
# RESULT MODEL
# ============================================================

@dataclass
class VerificationResult:
    claim_id: str
    status: str
    confidence: float
    explanation: str
    evidence_passage_ids: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "claim_id": self.claim_id,
            "status": self.status,
            "confidence": self.confidence,
            "explanation": self.explanation,
            "evidence_passage_ids": self.evidence_passage_ids,
        }


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_text(text: str) -> str:
    if not text:
        return ""

    text = str(text)

    # Normalize unicode quotes/dashes
    replacements = {
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "-",
        "\u2212": "-",
        "\u00a0": " ",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    text = re.sub(r"\s+", " ", text)
    return text.strip()


def normalize_for_comparison(text: str) -> str:
    text = normalize_text(text).lower()

    # Remove punctuation but preserve numbers and units.
    text = re.sub(r"[^\w\s₹$€£.%+-]", " ", text)
    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ============================================================
# EVIDENCE HELPERS
# ============================================================

def evidence_text(evidence: Any) -> str:
    """
    Safely extract evidence text from different evidence formats.
    """

    if evidence is None:
        return ""

    if isinstance(evidence, str):
        return evidence

    if isinstance(evidence, dict):
        return str(
            evidence.get("evidence_text")
            or evidence.get("text")
            or evidence.get("document")
            or evidence.get("content")
            or ""
        )

    return ""


def evidence_id(evidence: Any) -> Optional[str]:
    """
    Safely extract passage ID.
    """

    if isinstance(evidence, dict):
        value = (
            evidence.get("passage_id")
            or evidence.get("id")
            or evidence.get("chunk_id")
        )

        if value is not None:
            return str(value)

    return None


def get_evidence_items(evidence: List[Any]) -> List[Dict[str, Any]]:
    """
    Convert retrieved evidence into a consistent internal structure.
    """

    items = []

    for item in evidence or []:

        if isinstance(item, dict):
            items.append(
                {
                    "passage_id": evidence_id(item),
                    "evidence_text": evidence_text(item),
                    "source": item.get("source", "Unknown"),
                    "source_version": item.get(
                        "source_version",
                        item.get("version", "v1"),
                    ),
                }
            )

        else:
            items.append(
                {
                    "passage_id": evidence_id(item),
                    "evidence_text": evidence_text(item),
                    "source": "Unknown",
                    "source_version": "v1",
                }
            )

    return items


def valid_evidence_items(evidence: List[Any]) -> List[Dict[str, Any]]:
    return [
        item
        for item in get_evidence_items(evidence)
        if item.get("evidence_text")
    ]


# ============================================================
# GENERAL MATCHING
# ============================================================

def claim_matches_evidence(claim: str, text: str) -> bool:
    """
    Conservative exact/normalized matching.

    This is intentionally simple and deterministic.
    """

    claim_norm = normalize_for_comparison(claim)
    text_norm = normalize_for_comparison(text)

    if not claim_norm or not text_norm:
        return False

    if claim_norm in text_norm:
        return True

    return False


def find_matching_evidence(
    claim: str,
    evidence: List[Any],
) -> List[Dict[str, Any]]:

    items = valid_evidence_items(evidence)

    matches = []

    for item in items:

        if claim_matches_evidence(
            claim,
            item["evidence_text"],
        ):
            matches.append(item)

    return matches


# ============================================================
# PRODUCT NAME
# ============================================================

def extract_product_name(text: str) -> Optional[str]:
    """
    Extract common product-name patterns.

    Examples:
        Product name: Orbit X1
        Product is Orbit X1
        Meet the Orbit X1
        Meet Orbit X1
        The Orbit X1 is our latest...
    """

    text = normalize_text(text)

    patterns = [
        r"\bproduct\s+name\s*:\s*([A-Za-z0-9][A-Za-z0-9 ._-]{1,80})",
        r"\bproduct\s+is\s+([A-Za-z0-9][A-Za-z0-9 ._-]{1,80})",
        r"\bproduct\s+called\s+([A-Za-z0-9][A-Za-z0-9 ._-]{1,80})",
        r"\bmeet\s+(?:the\s+)?([A-Za-z]+(?:\s+[A-Za-z0-9-]+)*)",
        r"\bcalled\s+the\s+([A-Za-z]+(?:\s+[A-Za-z0-9-]+)*)",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE,
        )

        if match:

            value = match.group(1).strip()

            # Stop extraction before common sentence continuations.
            value = re.split(
                r"\s+(?:is|offers|provides|has|with|and|our|the)\b",
                value,
                maxsplit=1,
                flags=re.IGNORECASE,
            )[0]

            value = value.strip(" .,;:")

            if value:
                return value

    return None


def is_product_name_claim(claim: str) -> bool:
    """
    IMPORTANT:

    Do NOT classify every claim containing a product name
    as a product-name claim.

    For example:

        "The Orbit X1 offers 14 days of battery life."

    is a BATTERY claim, not a product-name claim.
    """

    claim = normalize_text(claim)

    lower_claim = claim.lower()

    return (
        "product name" in lower_claim
        or "product is" in lower_claim
        or "product called" in lower_claim
        or "meet the " in lower_claim
        or lower_claim.startswith("meet ")
        or "called the " in lower_claim
    )


def verify_product_name_claim(
    claim_id: str,
    claim: str,
    evidence: List[Any],
) -> VerificationResult:

    claimed_name = extract_product_name(claim)

    if not claimed_name:

        return VerificationResult(
            claim_id=claim_id,
            status="UNVERIFIED",
            confidence=0.40,
            explanation=(
                "The claim appears to describe a product name, "
                "but no clear product name could be extracted."
            ),
            evidence_passage_ids=[],
        )

    claimed_name_norm = normalize_for_comparison(
        claimed_name
    )

    matches = []

    for item in valid_evidence_items(evidence):

        original = item["evidence_text"]

        if claimed_name_norm in normalize_for_comparison(
            original
        ):
            matches.append(item)

    if matches:

        return VerificationResult(
            claim_id=claim_id,
            status="SUPPORTED",
            confidence=0.98,
            explanation=(
                f"The claimed product name '{claimed_name}' "
                "matches the approved evidence."
            ),
            evidence_passage_ids=[
                item["passage_id"]
                for item in matches
                if item.get("passage_id")
            ],
        )

    return VerificationResult(
        claim_id=claim_id,
        status="CONTRADICTED",
        confidence=0.95,
        explanation=(
            f"The claimed product name '{claimed_name}' "
            "was not found in the approved evidence."
        ),
        evidence_passage_ids=[],
    )


# ============================================================
# BATTERY
# ============================================================

def extract_battery_days(text: str) -> Optional[int]:

    text = normalize_text(text)

    patterns = [
        r"\b(?:up to\s+)?(\d+)\s+days?\b.*?\bbattery\b",
        r"\bbattery\b.*?\b(?:up to\s+)?(\d+)\s+days?\b",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE,
        )

        if match:
            return int(match.group(1))

    return None


def verify_battery_claim(
    claim_id: str,
    claim: str,
    evidence: List[Any],
) -> Optional[VerificationResult]:

    claimed_days = extract_battery_days(claim)

    if claimed_days is None:
        return None

    evidence_items = valid_evidence_items(evidence)

    for item in evidence_items:

        evidence_days = extract_battery_days(
            item["evidence_text"]
        )

        if evidence_days is None:
            continue

        if claimed_days == evidence_days:

            return VerificationResult(
                claim_id=claim_id,
                status="SUPPORTED",
                confidence=0.98,
                explanation=(
                    f"The claim states {claimed_days} days of "
                    "battery life, matching the approved evidence."
                ),
                evidence_passage_ids=[
                    item["passage_id"]
                ] if item["passage_id"] else [],
            )

    for item in evidence_items:

        evidence_days = extract_battery_days(
            item["evidence_text"]
        )

        if evidence_days is None:
            continue

        return VerificationResult(
            claim_id=claim_id,
            status="CONTRADICTED",
            confidence=0.98,
            explanation=(
                f"The claim states {claimed_days} days of battery "
                f"life, but the approved evidence states "
                f"{evidence_days} days."
            ),
            evidence_passage_ids=[
                item["passage_id"]
            ] if item["passage_id"] else [],
        )

    return VerificationResult(
        claim_id=claim_id,
        status="UNVERIFIED",
        confidence=0.45,
        explanation=(
            "Battery-life information could not be verified "
            "against the retrieved evidence."
        ),
        evidence_passage_ids=[],
    )


# ============================================================
# PRICE
# ============================================================

def extract_price(text: str) -> Optional[int]:

    text = normalize_text(text)

    patterns = [
        r"₹\s*([\d,]+)",
        r"\bINR\s*([\d,]+)",
        r"\bRs\.?\s*([\d,]+)",
        r"\bpriced?\s+at\s+₹?\s*([\d,]+)",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE,
        )

        if match:
            return int(
                match.group(1).replace(",", "")
            )

    return None


def verify_price_claim(
    claim_id: str,
    claim: str,
    evidence: List[Any],
) -> Optional[VerificationResult]:

    claimed_price = extract_price(claim)

    if claimed_price is None:
        return None

    evidence_items = valid_evidence_items(evidence)

    for item in evidence_items:

        evidence_price = extract_price(
            item["evidence_text"]
        )

        if evidence_price is None:
            continue

        if claimed_price == evidence_price:

            return VerificationResult(
                claim_id=claim_id,
                status="SUPPORTED",
                confidence=0.98,
                explanation=(
                    f"The claimed price of ₹{claimed_price:,} "
                    "matches the approved evidence."
                ),
                evidence_passage_ids=[
                    item["passage_id"]
                ] if item["passage_id"] else [],
            )

    for item in evidence_items:

        evidence_price = extract_price(
            item["evidence_text"]
        )

        if evidence_price is None:
            continue

        return VerificationResult(
            claim_id=claim_id,
            status="CONTRADICTED",
            confidence=0.98,
            explanation=(
                f"The claim states a price of ₹{claimed_price:,}, "
                f"but the approved evidence states "
                f"₹{evidence_price:,}."
            ),
            evidence_passage_ids=[
                item["passage_id"]
            ] if item["passage_id"] else [],
        )

    return VerificationResult(
        claim_id=claim_id,
        status="UNVERIFIED",
        confidence=0.45,
        explanation=(
            "The claimed price could not be verified "
            "against the retrieved evidence."
        ),
        evidence_passage_ids=[],
    )


# ============================================================
# COLOURS
# ============================================================

def extract_colours(text: str) -> Optional[List[str]]:

    text = normalize_text(text)

    match = re.search(
        r"(?:available\s+colou?rs?|colou?rs?)\s*:\s*(.+)",
        text,
        re.IGNORECASE,
    )

    if not match:

        match = re.search(
            r"available\s+in\s+(.+?)(?:\.|$)",
            text,
            re.IGNORECASE,
        )

    if not match:
        return None

    colour_text = match.group(1)

    # Remove trailing unrelated sentence fragments.
    colour_text = re.split(
        r"\.\s+|\bVisit\b|\bwith\b",
        colour_text,
        maxsplit=1,
        flags=re.IGNORECASE,
    )[0]

    colour_text = colour_text.replace(
        " and ",
        ",",
    )

    colours = []

    for part in colour_text.split(","):

        part = part.strip(
            " .:;-"
        )

        if not part:
            continue

        # Keep only simple colour names.
        part = re.sub(
            r"\bcolou?rs?\b",
            "",
            part,
            flags=re.IGNORECASE,
        ).strip()

        if part:
            colours.append(
                part.lower()
            )

    return colours or None


def verify_colour_claim(
    claim_id: str,
    claim: str,
    evidence: List[Any],
) -> Optional[VerificationResult]:

    claimed_colours = extract_colours(claim)

    if not claimed_colours:
        return None

    evidence_items = valid_evidence_items(evidence)

    for item in evidence_items:

        evidence_colours = extract_colours(
            item["evidence_text"]
        )

        if not evidence_colours:
            continue

        claimed_set = set(
            colour.lower()
            for colour in claimed_colours
        )

        evidence_set = set(
            colour.lower()
            for colour in evidence_colours
        )

        if claimed_set == evidence_set:

            return VerificationResult(
                claim_id=claim_id,
                status="SUPPORTED",
                confidence=0.98,
                explanation=(
                    "The claimed available colours exactly "
                    "match the approved evidence."
                ),
                evidence_passage_ids=[
                    item["passage_id"]
                ] if item["passage_id"] else [],
            )

        return VerificationResult(
            claim_id=claim_id,
            status="CONTRADICTED",
            confidence=0.97,
            explanation=(
                "The claimed available colours do not match "
                "the approved evidence. "
                f"Claimed: {', '.join(claimed_colours)}. "
                f"Approved: {', '.join(evidence_colours)}."
            ),
            evidence_passage_ids=[
                item["passage_id"]
            ] if item["passage_id"] else [],
        )

    return VerificationResult(
        claim_id=claim_id,
        status="UNVERIFIED",
        confidence=0.45,
        explanation=(
            "Colour information could not be verified "
            "against the retrieved evidence."
        ),
        evidence_passage_ids=[],
    )


# ============================================================
# DISPLAY
# ============================================================

def extract_display_size(text: str) -> Optional[float]:

    text = normalize_text(text)

    match = re.search(
        r"\b(\d+(?:\.\d+)?)\s*[- ]?inch\b",
        text,
        re.IGNORECASE,
    )

    if match:
        return float(match.group(1))

    return None


def is_display_claim(claim: str) -> bool:

    claim_lower = claim.lower()

    return (
        "display" in claim_lower
        or "screen" in claim_lower
        or "amoled" in claim_lower
        or "oled" in claim_lower
    )


def verify_display_claim(
    claim_id: str,
    claim: str,
    evidence: List[Any],
) -> Optional[VerificationResult]:

    if not is_display_claim(claim):
        return None

    claimed_size = extract_display_size(claim)

    evidence_items = valid_evidence_items(evidence)

    for item in evidence_items:

        original = item["evidence_text"]
        original_lower = original.lower()

        if (
            "display" not in original_lower
            and "screen" not in original_lower
        ):
            continue

        evidence_size = extract_display_size(
            original
        )

        if (
            claimed_size is not None
            and evidence_size is not None
        ):

            if claimed_size == evidence_size:

                return VerificationResult(
                    claim_id=claim_id,
                    status="SUPPORTED",
                    confidence=0.97,
                    explanation=(
                        "The claimed display size matches "
                        "the approved evidence."
                    ),
                    evidence_passage_ids=[
                        item["passage_id"]
                    ] if item["passage_id"] else [],
                )

            return VerificationResult(
                claim_id=claim_id,
                status="CONTRADICTED",
                confidence=0.97,
                explanation=(
                    f"The claim states a {claimed_size}-inch "
                    f"display, while the approved evidence "
                    f"states a {evidence_size}-inch display."
                ),
                evidence_passage_ids=[
                    item["passage_id"]
                ] if item["passage_id"] else [],
            )

        if claim_matches_evidence(
            claim,
            original,
        ):

            return VerificationResult(
                claim_id=claim_id,
                status="SUPPORTED",
                confidence=0.90,
                explanation=(
                    "The display claim matches the "
                    "approved evidence."
                ),
                evidence_passage_ids=[
                    item["passage_id"]
                ] if item["passage_id"] else [],
            )

    return VerificationResult(
        claim_id=claim_id,
        status="UNVERIFIED",
        confidence=0.45,
        explanation=(
            "The display claim could not be verified "
            "against the retrieved evidence."
        ),
        evidence_passage_ids=[],
    )


# ============================================================
# GPS
# ============================================================

def is_gps_claim(claim: str) -> bool:

    return bool(
        re.search(
            r"\bGPS\b",
            claim,
            re.IGNORECASE,
        )
    )


def verify_gps_claim(
    claim_id: str,
    claim: str,
    evidence: List[Any],
) -> Optional[VerificationResult]:

    if not is_gps_claim(claim):
        return None

    evidence_items = valid_evidence_items(evidence)

    for item in evidence_items:

        original = item["evidence_text"]

        if not re.search(
            r"\bGPS\b",
            original,
            re.IGNORECASE,
        ):
            continue

        claim_lower = claim.lower()
        evidence_lower = original.lower()

        claim_supported = (
            "built-in GPS" in claim_lower
            or "built in GPS" in claim_lower
            or "gps is supported" in claim_lower
            or "supports GPS" in claim_lower
            or "gps" in claim_lower
        )

        evidence_supported = (
            "built-in GPS" in evidence_lower
            or "built in GPS" in evidence_lower
            or "gps is supported" in evidence_lower
            or "supports GPS" in evidence_lower
            or "gps" in evidence_lower
        )

        if claim_supported and evidence_supported:

            return VerificationResult(
                claim_id=claim_id,
                status="SUPPORTED",
                confidence=0.96,
                explanation=(
                    "The GPS capability is supported by "
                    "the approved evidence."
                ),
                evidence_passage_ids=[
                    item["passage_id"]
                ] if item["passage_id"] else [],
            )

    return VerificationResult(
        claim_id=claim_id,
        status="UNVERIFIED",
        confidence=0.45,
        explanation=(
            "GPS information could not be verified "
            "against the retrieved evidence."
        ),
        evidence_passage_ids=[],
    )


# ============================================================
# WATER RESISTANCE
# ============================================================

def extract_water_resistance(text: str) -> Optional[int]:

    text = normalize_text(text)

    patterns = [
        r"water-resistant\s+up\s+to\s+(\d+)\s*metres?",
        r"water resistant\s+up\s+to\s+(\d+)\s*metres?",
        r"up\s+to\s+(\d+)\s*metres?.*water",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE,
        )

        if match:
            return int(match.group(1))

    return None


def is_water_claim(claim: str) -> bool:

    lower = claim.lower()

    return (
        "water-resistant" in lower
        or "water resistant" in lower
        or "water resistance" in lower
        or "waterproof" in lower
    )


def verify_water_resistance_claim(
    claim_id: str,
    claim: str,
    evidence: List[Any],
) -> Optional[VerificationResult]:

    if not is_water_claim(claim):
        return None

    claimed_meters = extract_water_resistance(
        claim
    )

    evidence_items = valid_evidence_items(evidence)

    for item in evidence_items:

        evidence_meters = extract_water_resistance(
            item["evidence_text"]
        )

        if evidence_meters is None:
            continue

        if (
            claimed_meters is not None
            and claimed_meters == evidence_meters
        ):

            return VerificationResult(
                claim_id=claim_id,
                status="SUPPORTED",
                confidence=0.97,
                explanation=(
                    "The claimed water-resistance rating "
                    "matches the approved evidence."
                ),
                evidence_passage_ids=[
                    item["passage_id"]
                ] if item["passage_id"] else [],
            )

        if (
            claimed_meters is not None
            and claimed_meters != evidence_meters
        ):

            return VerificationResult(
                claim_id=claim_id,
                status="CONTRADICTED",
                confidence=0.97,
                explanation=(
                    f"The claim states water resistance up to "
                    f"{claimed_meters} metres, while the approved "
                    f"evidence states {evidence_meters} metres."
                ),
                evidence_passage_ids=[
                    item["passage_id"]
                ] if item["passage_id"] else [],
            )

        if claim_matches_evidence(
            claim,
            item["evidence_text"],
        ):

            return VerificationResult(
                claim_id=claim_id,
                status="SUPPORTED",
                confidence=0.90,
                explanation=(
                    "The water-resistance claim matches "
                    "the approved evidence."
                ),
                evidence_passage_ids=[
                    item["passage_id"]
                ] if item["passage_id"] else [],
            )

    return VerificationResult(
        claim_id=claim_id,
        status="UNVERIFIED",
        confidence=0.45,
        explanation=(
            "Water-resistance information could not be "
            "verified against the retrieved evidence."
        ),
        evidence_passage_ids=[],
    )


# ============================================================
# HEART RATE
# ============================================================

def is_heart_rate_claim(claim: str) -> bool:

    lower = claim.lower()

    return (
        "heart-rate" in lower
        or "heart rate" in lower
        or "heart monitoring" in lower
        or "heart-rate monitoring" in lower
    )


def verify_heart_rate_claim(
    claim_id: str,
    claim: str,
    evidence: List[Any],
) -> Optional[VerificationResult]:

    if not is_heart_rate_claim(claim):
        return None

    evidence_items = valid_evidence_items(evidence)

    for item in evidence_items:

        original = item["evidence_text"]
        original_lower = original.lower()

        if (
            "heart-rate" not in original_lower
            and "heart rate" not in original_lower
        ):
            continue

        claim_has_continuous = (
            "continuous" in claim.lower()
        )

        evidence_has_continuous = (
            "continuous" in original_lower
        )

        if (
            claim_has_continuous
            and evidence_has_continuous
        ):

            return VerificationResult(
                claim_id=claim_id,
                status="SUPPORTED",
                confidence=0.97,
                explanation=(
                    "Continuous heart-rate monitoring is "
                    "supported by the approved evidence."
                ),
                evidence_passage_ids=[
                    item["passage_id"]
                ] if item["passage_id"] else [],
            )

        if not claim_has_continuous:

            return VerificationResult(
                claim_id=claim_id,
                status="SUPPORTED",
                confidence=0.95,
                explanation=(
                    "Heart-rate monitoring is supported "
                    "by the approved evidence."
                ),
                evidence_passage_ids=[
                    item["passage_id"]
                ] if item["passage_id"] else [],
            )

    return VerificationResult(
        claim_id=claim_id,
        status="UNVERIFIED",
        confidence=0.45,
        explanation=(
            "Heart-rate monitoring information could not "
            "be verified against the retrieved evidence."
        ),
        evidence_passage_ids=[],
    )


# ============================================================
# GENERIC VERIFICATION
# ============================================================

def verify_generic_claim(
    claim_id: str,
    claim: str,
    evidence: List[Any],
) -> VerificationResult:

    matches = find_matching_evidence(
        claim,
        evidence,
    )

    if matches:

        return VerificationResult(
            claim_id=claim_id,
            status="SUPPORTED",
            confidence=0.92,
            explanation=(
                "The claim matches the approved evidence."
            ),
            evidence_passage_ids=[
                item["passage_id"]
                for item in matches
                if item.get("passage_id")
            ],
        )

    # Check for obvious contradiction:
    # If the claim has a number and evidence has a
    # different number for a similar sentence.
    claim_numbers = re.findall(
        r"\d+(?:\.\d+)?",
        claim,
    )

    if claim_numbers:

        claim_keywords = set(
            normalize_for_comparison(
                claim
            ).split()
        )

        for item in valid_evidence_items(evidence):

            evidence_text = item["evidence_text"]

            evidence_keywords = set(
                normalize_for_comparison(
                    evidence_text
                ).split()
            )

            overlap = (
                claim_keywords
                & evidence_keywords
            )

            # Enough shared context to consider the
            # evidence related.
            if len(overlap) >= 3:

                evidence_numbers = re.findall(
                    r"\d+(?:\.\d+)?",
                    evidence_text,
                )

                if evidence_numbers:

                    if any(
                        number not in evidence_numbers
                        for number in claim_numbers
                    ):

                        return VerificationResult(
                            claim_id=claim_id,
                            status="CONTRADICTED",
                            confidence=0.80,
                            explanation=(
                                "The claim contains factual "
                                "values that do not match "
                                "the related approved evidence."
                            ),
                            evidence_passage_ids=[
                                item["passage_id"]
                            ] if item["passage_id"] else [],
                        )

    return VerificationResult(
        claim_id=claim_id,
        status="UNVERIFIED",
        confidence=0.40,
        explanation=(
            "No sufficient matching evidence was found "
            "to verify this claim."
        ),
        evidence_passage_ids=[],
    )


# ============================================================
# MAIN CLAIM VERIFIER
# ============================================================

def verify_claim(
    claim_id: str,
    claim_text: str,
    evidence: List[Any],
) -> VerificationResult:
    """
    Main deterministic verification pipeline.

    IMPORTANT ORDER:

    1. Product-name claims
    2. Battery
    3. Price
    4. Colours
    5. Display
    6. GPS
    7. Water resistance
    8. Heart rate
    9. Generic verification

    This ordering prevents claims such as:

        "The Orbit X1 offers 14 days of battery life."

    from being treated as product-name claims.
    """

    claim = normalize_text(claim_text)

    if not claim:

        return VerificationResult(
            claim_id=claim_id,
            status="UNVERIFIED",
            confidence=0.0,
            explanation="Empty claim.",
            evidence_passage_ids=[],
        )

    evidence = evidence or []

    # --------------------------------------------------------
    # 1. PRODUCT NAME
    # --------------------------------------------------------

    if is_product_name_claim(claim):

        return verify_product_name_claim(
            claim_id=claim_id,
            claim=claim,
            evidence=evidence,
        )

    # --------------------------------------------------------
    # 2. BATTERY
    # --------------------------------------------------------

    result = verify_battery_claim(
        claim_id,
        claim,
        evidence,
    )

    if result is not None:
        return result

    # --------------------------------------------------------
    # 3. PRICE
    # --------------------------------------------------------

    result = verify_price_claim(
        claim_id,
        claim,
        evidence,
    )

    if result is not None:
        return result

    # --------------------------------------------------------
    # 4. COLOURS
    # --------------------------------------------------------

    result = verify_colour_claim(
        claim_id,
        claim,
        evidence,
    )

    if result is not None:
        return result

    # --------------------------------------------------------
    # 5. DISPLAY
    # --------------------------------------------------------

    result = verify_display_claim(
        claim_id,
        claim,
        evidence,
    )

    if result is not None:
        return result

    # --------------------------------------------------------
    # 6. GPS
    # --------------------------------------------------------

    result = verify_gps_claim(
        claim_id,
        claim,
        evidence,
    )

    if result is not None:
        return result

    # --------------------------------------------------------
    # 7. WATER RESISTANCE
    # --------------------------------------------------------

    result = verify_water_resistance_claim(
        claim_id,
        claim,
        evidence,
    )

    if result is not None:
        return result

    # --------------------------------------------------------
    # 8. HEART RATE
    # --------------------------------------------------------

    result = verify_heart_rate_claim(
        claim_id,
        claim,
        evidence,
    )

    if result is not None:
        return result

    # --------------------------------------------------------
    # 9. GENERIC
    # --------------------------------------------------------

    return verify_generic_claim(
        claim_id=claim_id,
        claim=claim,
        evidence=evidence,
    )


# ============================================================
# LOCAL TEST
# ============================================================

if __name__ == "__main__":

    test_evidence = [
        {
            "passage_id": "orbit_001",
            "source": "Orbit X1 Test Specification",
            "source_version": "v1",
            "evidence_text": (
                "Product name: Orbit X1. "
                "Battery life: Up to 10 days on a single charge. "
                "Display: 1.8-inch AMOLED display. "
                "GPS: Built-in GPS is supported. "
                "Water resistance: Water-resistant up to 50 metres. "
                "Heart-rate monitoring: Continuous heart-rate "
                "monitoring is supported. "
                "Price: ₹5,499. "
                "Available colours: Black and Blue."
            ),
        }
    ]

    test_claims = [
        (
            "clm_1",
            "Meet the Orbit X1, our latest smart fitness watch."
        ),
        (
            "clm_2",
            "The Orbit X1 offers up to 14 days of battery life on a single charge."
        ),
        (
            "clm_3",
            "The Orbit X1 offers up to 10 days of battery life on a single charge."
        ),
        (
            "clm_4",
            "The Orbit X1 is priced at ₹4,999."
        ),
        (
            "clm_5",
            "The Orbit X1 is priced at ₹5,499."
        ),
        (
            "clm_6",
            "The Orbit X1 is available in three colours: Black, Blue, and Silver."
        ),
        (
            "clm_7",
            "The Orbit X1 is available in Black and Blue."
        ),
        (
            "clm_8",
            "The Orbit X1 has built-in GPS."
        ),
        (
            "clm_9",
            "The Orbit X1 has a 1.8-inch AMOLED display."
        ),
        (
            "clm_10",
            "The Orbit X1 is water-resistant up to 50 metres."
        ),
        (
            "clm_11",
            "The Orbit X1 supports continuous heart-rate monitoring."
        ),
    ]

    print("\n" + "=" * 70)
    print("GUARDIAN AI - VERIFIER TEST")
    print("=" * 70)

    for claim_id, claim in test_claims:

        result = verify_claim(
            claim_id=claim_id,
            claim_text=claim,
            evidence=test_evidence,
        )

        print("\nClaim:", claim)
        print("Status:", result.status)
        print("Confidence:", result.confidence)
        print("Explanation:", result.explanation)
        print(
            "Evidence:",
            result.evidence_passage_ids,
        )

    print("\n" + "=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)