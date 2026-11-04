
import os
from pathlib import Path
from typing import Literal, List

from dotenv import load_dotenv
from pydantic import BaseModel
from google import genai

try:
    from .retriever import retrieve_evidence
except ImportError:
    from retriever import retrieve_evidence


# Load environment variables
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env")

client = genai.Client(api_key=api_key)


# Structured verification response
class VerificationResult(BaseModel):
    claim_id: str
    status: Literal["supported", "contradicted", "unverified"]
    explanation: str
    confidence: float
    evidence_passage_ids: List[str]
    needs_human_decision: bool


def verify_claim(claim_id, claim_text):
    """
    Verify a claim using evidence retrieved from ChromaDB.
    """

    evidence = retrieve_evidence(claim_text, top_k=3)

    # Prepare evidence for Gemini
    evidence_text = ""

    for item in evidence:
        evidence_text += (
            f"\nPassage ID: {item['passage_id']}\n"
            f"Evidence: {item['evidence_text']}\n"
            f"Source: {item['source']}\n"
            f"Version: {item['source_version']}\n"
        )

    if not evidence:
        evidence_text = "No relevant evidence was found."

    prompt = f"""
You are a strict factual claim verification system.

Your task is to verify the given claim using ONLY the supplied evidence.

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

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": VerificationResult
        }
    )

    result = response.parsed

    # Always preserve the original claim ID
    result.claim_id = claim_id

    return result


if __name__ == "__main__":

    test_claim = "Orbit subscription plans start at $29."

    result = verify_claim("clm_2", test_claim)

    print("\nVerification Result:\n")
    print(result.model_dump())
