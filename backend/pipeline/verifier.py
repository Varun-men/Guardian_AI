import os
import time
import logging
from pathlib import Path
from typing import Literal, List

from dotenv import load_dotenv
from pydantic import BaseModel
from google import genai
from google.genai import errors

try:
    from .retriever import retrieve_evidence
except ImportError:
    from retriever import retrieve_evidence


# ============================================================
# LOGGING
# ============================================================

logger = logging.getLogger("guardian-ai")
logging.basicConfig(level=logging.INFO)


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)


# ============================================================
# GEMINI CLIENT
# ============================================================

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY not found in .env"
        )

    return genai.Client(api_key=api_key)


# ============================================================
# VERIFICATION RESULT SCHEMA
# ============================================================

class VerificationResult(BaseModel):
    claim_id: str

    status: Literal[
        "supported",
        "contradicted",
        "unverified"
    ]

    explanation: str

    confidence: float

    evidence_passage_ids: List[str]

    needs_human_decision: bool


# ============================================================
# VERIFY CLAIM
# ============================================================

def verify_claim(
    claim_id,
    claim_text,
    evidence=None
):

    # --------------------------------------------------------
    # DEVELOPMENT MODE
    # --------------------------------------------------------
    # Set USE_GEMINI=false in .env to avoid Gemini API calls
    # while testing the rest of the pipeline.
    # --------------------------------------------------------

    use_gemini = os.getenv(
        "USE_GEMINI",
        "true"
    ).lower() == "true"


    # --------------------------------------------------------
    # RETRIEVE EVIDENCE
    # --------------------------------------------------------

    if evidence is None:
        evidence = retrieve_evidence(
            claim_text,
            top_k=3
        )


    # --------------------------------------------------------
    # NO EVIDENCE
    # --------------------------------------------------------

    if not evidence:

        logger.warning(
            "No trusted evidence found for claim %s.",
            claim_id
        )

        return VerificationResult(
            claim_id=claim_id,
            status="unverified",
            explanation=(
                "No trusted evidence is available in the "
                "evidence database. This claim requires "
                "human review."
            ),
            confidence=0.0,
            evidence_passage_ids=[],
            needs_human_decision=True
        )


    # ========================================================
    # LOCAL DEVELOPMENT FALLBACK
    # ========================================================

    if not use_gemini:

        logger.info(
            "Gemini disabled. Using local development "
            "verification for claim %s.",
            claim_id
        )

        evidence_passage_ids = [
            item["passage_id"]
            for item in evidence
        ]

        # Simple exact/substring evidence check
        claim_supported = False

        claim_lower = claim_text.lower()

        for item in evidence:

            evidence_text = item.get(
                "evidence_text",
                ""
            ).lower()

            # Check whether important words from the claim
            # appear in the evidence.
            claim_words = [
                word.strip(".,!?$%")
                for word in claim_lower.split()
                if len(word.strip(".,!?$%")) > 3
            ]

            if claim_words:

                matching_words = sum(
                    1
                    for word in claim_words
                    if word in evidence_text
                )

                similarity_ratio = (
                    matching_words /
                    len(claim_words)
                )

                if similarity_ratio >= 0.60:
                    claim_supported = True
                    break


        if claim_supported:

            return VerificationResult(
                claim_id=claim_id,
                status="supported",
                explanation=(
                    "The claim is supported by the "
                    "retrieved evidence."
                ),
                confidence=0.90,
                evidence_passage_ids=evidence_passage_ids,
                needs_human_decision=False
            )

        else:

            return VerificationResult(
                claim_id=claim_id,
                status="unverified",
                explanation=(
                    "Retrieved evidence was not sufficient "
                    "to confidently verify the claim."
                ),
                confidence=0.30,
                evidence_passage_ids=evidence_passage_ids,
                needs_human_decision=True
            )


    # ========================================================
    # GEMINI VERIFICATION
    # ========================================================

    evidence_text = ""

    for item in evidence:

        evidence_text += (
            f"\nPassage ID: {item['passage_id']}\n"
            f"Evidence: {item['evidence_text']}\n"
            f"Source: {item['source']}\n"
            f"Version: {item['source_version']}\n"
        )


    # --------------------------------------------------------
    # GROUNDED VERIFICATION PROMPT
    # --------------------------------------------------------

    prompt = f"""
You are a strict factual claim verification system.

Your job is to verify the claim using ONLY the supplied
evidence.

Do NOT use outside knowledge.

CLAIM:
{claim_text}

EVIDENCE:
{evidence_text}

RULES:

1. Mark "supported" only when the evidence directly
   supports the claim.

2. Mark "contradicted" only when the evidence clearly
   conflicts with the claim.

3. Mark "unverified" when evidence is missing,
   incomplete, ambiguous, or insufficient.

4. Never invent facts.

5. Never use outside knowledge.

6. Semantic similarity alone is NOT proof.

7. Include only passage IDs that were actually supplied
   in the evidence.

8. Set needs_human_decision to true when the evidence
   is insufficient or ambiguous.

9. Confidence must be between 0 and 1.

10. If you cannot confidently verify the claim,
    choose "unverified".

Return ONLY the structured verification result.
"""


    # --------------------------------------------------------
    # GEMINI CLIENT
    # --------------------------------------------------------

    client = get_gemini_client()


    # ========================================================
    # GEMINI RETRY
    # ========================================================

    for attempt in range(5):

        try:

            logger.info(
                "Sending claim %s to Gemini. Attempt %s/5.",
                claim_id,
                attempt + 1
            )

            response = client.models.generate_content(

                model="gemini-3.8-flash",

                contents=prompt,

                config={
                    "response_mime_type": "application/json",
                    "response_schema": VerificationResult
                }
            )


            # ------------------------------------------------
            # PARSED RESPONSE
            # ------------------------------------------------

            result = response.parsed
            logger.info(
                "Verifier response for claim %s: status=%s, passage_ids=%s",
                claim_id,
                getattr(result, "status", None),
                getattr(result, "evidence_passage_ids", None)
                )


            if result is None:

                raise RuntimeError(
                    "Gemini returned an empty verification result."
                )


            # Always preserve the original claim ID
            result.claim_id = claim_id


            # ------------------------------------------------
            # SAFETY CHECK
            # ------------------------------------------------

            supplied_ids = {
                item["passage_id"]
                for item in evidence
            }

            result.evidence_passage_ids = [
                passage_id
                for passage_id in result.evidence_passage_ids
                if passage_id in supplied_ids
            ]


            return result


        # ====================================================
        # TEMPORARY GEMINI API ERRORS
        # ====================================================

        except errors.APIError as exc:

            retryable_codes = (
                429,
                500,
                502,
                503,
                504
            )


            if (
                exc.code not in retryable_codes
                or attempt == 4
            ):

                raise


            delay = 2 ** (attempt + 1)


            logger.warning(
                "Gemini temporarily unavailable for claim %s. "
                "Retrying in %s seconds. Attempt %s/5.",
                claim_id,
                delay,
                attempt + 1
            )


            time.sleep(delay)


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    test_claim = (
        "Orbit subscription plans start at $29."
    )


    print(
        "\n========== VERIFIER TEST ==========\n"
    )


    result = verify_claim(
        "clm_2",
        test_claim
    )


    print(
        "\nVerification Result:\n"
    )


    print(
        result.model_dump()
    )