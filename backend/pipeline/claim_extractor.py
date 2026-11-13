
import logging
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from google import genai

try:
    from .schemas import Claim, ClaimResponse
except ImportError:
    from schemas import Claim, ClaimResponse

logger = logging.getLogger("guardian-ai.claim-extractor")

# Load environment variables
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)

CANDIDATE_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
]

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in .env file")

    return genai.Client(api_key=api_key)


def _fallback_extract_claims(text: str) -> ClaimResponse:
    """
    Deterministic fallback claim extraction if Gemini API is unavailable (e.g. 503).
    Splits text into meaningful sentence-level claims so analysis can always proceed.
    """
    sentences = re.split(r"(?<=[.!?\n])\s+", text.strip())
    claims = []
    idx = 1
    for s in sentences:
        s_clean = s.strip()
        # Skip empty or very short greetings
        if len(s_clean.split()) < 3:
            continue
        claims.append(Claim(claim_id=f"clm_{idx}", claim_text=s_clean))
        idx += 1

    if not claims and text.strip():
        claims.append(Claim(claim_id="clm_1", claim_text=text.strip()))

    logger.info("Used fallback claim extraction: extracted %d claims", len(claims))
    return ClaimResponse(claims=claims)


def extract_claims(text: str) -> ClaimResponse:

    prompt = f"""
    You are an expert factual claim extractor.

    Extract individual factual claims from the given content.

    Rules:
    1. Extract each factual claim separately.
    2. Ignore greetings and introductory sentences.
    3. Do not invent information.
    4. Preserve the original meaning.
    5. Assign unique claim IDs starting from clm_1.

    Content:
    {text}
    """

    try:
        client = get_gemini_client()
    except Exception as exc:
        logger.warning("Could not initialize Gemini client (%s). Using fallback extractor.", exc)
        return _fallback_extract_claims(text)

    # Try candidate models in order if any returns 503 or model error
    last_error = None
    for model_name in CANDIDATE_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": ClaimResponse,
                },
            )
            if response.parsed and getattr(response.parsed, "claims", None) is not None:
                return response.parsed
        except Exception as exc:
            last_error = exc
            logger.warning("Gemini model %s call failed (%s). Trying next candidate.", model_name, exc)
            continue

    logger.warning("All Gemini candidate models failed (last error: %s). Falling back to rule-based claim extraction.", last_error)
    return _fallback_extract_claims(text)


if __name__ == "__main__":

    content = """
    Meet Orbit, the planning app.
    Our app is 3x faster than any competitor.
    Plans start at $29.
    Join 50,000 teams today.
    """

    result = extract_claims(content)

    print("\nExtracted Claims:\n")

    for claim in result.claims:
        print(claim.model_dump())
