
from pydantic import BaseModel
from typing import List, Literal


class Claim(BaseModel):
    claim_id: str
    claim_text: str


class ClaimResponse(BaseModel):
    claims: List[Claim]


class ClaimExtractionResult(BaseModel):
    """Claim extraction output tagged with how it was produced."""

    claims: List[Claim]
    extraction_method: Literal["gemini", "fallback"] = "gemini"
