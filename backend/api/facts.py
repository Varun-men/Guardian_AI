import uuid

from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_db, require_role
from backend.db.models import (
    Fact, Claim, ClaimLedger, Review, Draft, Alert, User
)
from backend.services.audit import record_audit


router = APIRouter(prefix="/api/facts", tags=["Facts"])


class FactUpdate(BaseModel):
    value: str
    name: str | None = None


@router.patch("/{fact_id}")
def update_fact(
    fact_id: str,
    data: FactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    try:
        fact = db.query(Fact).filter(Fact.id == fact_id).first()

        if not fact:
            raise HTTPException(status_code=404, detail="Fact not found")

        old_value = {
            "name": fact.name,
            "value": fact.value,
            "source_version": fact.source_version
        }

        fact.value = data.value
        fact.source_version += 1

        if data.name is not None:
            fact.name = data.name

        stale_claim_ids = []
        stale_draft_ids = []
        alerts_created = 0

        entries = db.query(ClaimLedger).filter(
            ClaimLedger.fact_id == fact.id,
            ClaimLedger.status == "approved"
        ).all()

        for entry in entries:
            claim = db.query(Claim).filter(
                Claim.id == entry.claim_id
            ).first()

            if not claim or claim.status != "approved":
                continue

            claim.status = "stale"
            entry.status = "stale"
            stale_claim_ids.append(claim.id)

            review = db.query(Review).filter(
                Review.id == claim.review_id
            ).first()

            if review:
                draft = db.query(Draft).filter(
                    Draft.id == review.draft_id
                ).first()

                if draft and draft.id not in stale_draft_ids:
                    draft.status = "stale"
                    stale_draft_ids.append(draft.id)

            alert = Alert(
                id=str(uuid.uuid4()),
                claim_id=claim.id,
                fact_id=fact.id,
                message=f"Fact '{fact.name}' was updated. Claim requires re-verification.",
                status="open"
            )
            db.add(alert)
            alerts_created += 1

        new_value = {
            "name": fact.name,
            "value": fact.value,
            "source_version": fact.source_version
        }

        record_audit(
            db=db,
            actor_user_id=current_user.id,
            action="fact.updated",
            entity_type="fact",
            entity_id=fact.id,
            old_value=old_value,
            new_value=new_value,
            evidence={
                "stale_claim_ids": stale_claim_ids,
                "stale_draft_ids": stale_draft_ids
            }
        )

        db.commit()
        db.refresh(fact)

        return {
            "message": "Fact updated successfully",
            "fact_id": fact.id,
            "old_value": old_value,
            "new_value": new_value,
            "stale_claim_ids": stale_claim_ids,
            "stale_draft_ids": stale_draft_ids,
            "alerts_created": alerts_created
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
