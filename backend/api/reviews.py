from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_db, require_role
from backend.db.models import Review, User
from backend.services.audit import record_audit

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


class ReviewerAssignment(BaseModel):
    reviewer_id: str


@router.patch("/{review_id}/assign")
def assign_reviewer(
    review_id: str,
    payload: ReviewerAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    try:
        review = db.query(Review).filter(
            Review.id == review_id
        ).first()

        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        reviewer = db.query(User).filter(
            User.id == payload.reviewer_id
        ).first()

        if not reviewer:
            raise HTTPException(status_code=404, detail="Reviewer not found")

        if not reviewer.is_active:
            raise HTTPException(status_code=400, detail="Reviewer is inactive")

        if reviewer.role != "reviewer":
            raise HTTPException(
                status_code=400,
                detail="User does not have reviewer role"
            )

        old_value = {
            "assigned_reviewer_id": review.assigned_reviewer_id
        }

        review.assigned_reviewer_id = reviewer.id

        record_audit(
            db=db,
            actor_user_id=current_user.id,
            action="review.assigned",
            entity_type="review",
            entity_id=review.id,
            old_value=old_value,
            new_value={"assigned_reviewer_id": reviewer.id}
        )

        db.commit()
        db.refresh(review)

        return {
            "message": "Reviewer assigned successfully",
            "review_id": review.id,
            "reviewer_id": reviewer.id
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

from typing import Literal
from pydantic import BaseModel


class ClaimDecision(BaseModel):
    decision: Literal["approved", "rejected", "needs_revision"]


@router.patch("/{review_id}/claims/{claim_id}/decision")
def decide_claim(
    review_id: str,
    claim_id: str,
    payload: ClaimDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "reviewer")),
):
    from backend.db.models import Claim

    try:
        review = db.query(Review).filter(
            Review.id == review_id
        ).first()

        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        if current_user.role == "reviewer":
            if review.assigned_reviewer_id != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="Review is not assigned to you"
                )

        claim = db.query(Claim).filter(
            Claim.id == claim_id,
            Claim.review_id == review_id
        ).first()

        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")

        old_value = {"status": claim.status}
        claim.status = payload.decision

        record_audit(
            db=db,
            actor_user_id=current_user.id,
            action="claim.decision",
            entity_type="claim",
            entity_id=claim.id,
            old_value=old_value,
            new_value={"status": payload.decision}
        )

        db.commit()
        db.refresh(claim)

        return {
            "message": "Claim decision recorded successfully",
            "claim_id": claim.id,
            "status": claim.status
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
