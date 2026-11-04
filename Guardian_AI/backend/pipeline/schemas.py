
from pydantic import BaseModel
from typing import List


class Claim(BaseModel):
    claim_id: str
    claim_text: str


class ClaimResponse(BaseModel):
    claims: List[Claim]
