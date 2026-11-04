
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai

try:
    from .schemas import ClaimResponse
except ImportError:
    from schemas import ClaimResponse


# Load environment variables
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in .env file")

    return genai.Client(api_key=api_key)


def extract_claims(text):

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

    client = get_gemini_client()
    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": ClaimResponse
        }
    )

    return response.parsed


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
