
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


logger = logging.getLogger("guardian-ai")

env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)


def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in .env")

    return genai.Client(api_key=api_key)


class VerificationResult(BaseModel):
    claim_id: str
    status: Literal["supported", "contradicted", "unverified"]
    explanation: str
    confidence: float
    evidence_passage_ids: List[str]
    needs_human_decision: bool


def verify_claim(claim_id, claim_text, evidence=None):
    """
    Verify a claim using supplied trusted evidence.

    If evidence is not supplied, retrieve it using the legacy
    retrieval path for backward compatibility.
    """

    if evidence is None:
        evidence = retrieve_evidence(claim_text, top_k=3)

    evidence_text = ""

    for item in evidence:
        evidence_text += (
            f"\nPassage ID: {item['passage_id']}\n"
            f"Evidence: {item['evidence_text']}\n"
            f"Source: {item['source']}\n"
            f"Version: {item['source_version']}\n"
        )

    if not evidence:
        logger.warning(
            "No trusted evidence found for claim %s. "
            "Returning unverified without calling Gemini.",
            claim_id,
        )

        return VerificationResult(
            claim_id=claim_id,
            status="unverified",
            explanation=(
                "No trusted evidence is available in the evidence "
                "database. This claim requires human review."
            ),
            confidence=0.0,
            evidence_passage_ids=[],
            needs_human_decision=True,
        )

    prompt = f"""
You are a strict factual claim verification system.

Verify the claim using ONLY the supplied evidence.

CLAIM:
{claim_text}

EVIDENCE:
{evidence_text}

RULES:
1. Mark supported only when evidence directly supports the claim.
2. Mark contradicted only when evidence clearly conflicts with the claim.
3. Mark unverified when evidence is missing, incomplete, or insufficient.
4. Never invent facts or use outside knowledge.
5. Do not treat semantic similarity alone as proof.
6. Include only passage IDs actually supplied above.
7. Set needs_human_decision to true when evidence is insufficient
   or the result is ambiguous.
8. Confidence must be between 0 and 1.

Return the structured verification result.
"""

    client = get_gemini_client()

    # Retry temporary API failures.
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": VerificationResult
                }
            )

            result = response.parsed

            if result is None:
                raise RuntimeError(
                    "Gemini returned an empty verification result."
                )

            result.claim_id = claim_id
            return result

        except errors.APIError as exc:

            retryable_codes = (429, 500, 502, 503, 504)

            if exc.code not in retryable_codes or attempt == 2:
                raise

            delay = 2 ** (attempt + 1)

            logger.warning(
                "Gemini temporarily unavailable for claim %s. "
                "Retrying in %s seconds. Attempt %s/3.",
                claim_id,
                delay,
                attempt + 1
            )

            time.sleep(delay)


if __name__ == "__main__":

    test_claim = "Orbit subscription plans start at $29."

    result = verify_claim("clm_2", test_claim)

    print("\nVerification Result:\n")
    print(result.model_dump())
