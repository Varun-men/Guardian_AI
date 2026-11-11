from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_db, require_role
from backend.db.models import Finding, User
from backend.services.audit import record_audit

router = APIRouter(prefix="/api/findings", tags=["Findings"])


class ReviewerAssignment(BaseModel):
    reviewer_id: str


@router.patch("/{finding_id}/assign")
def assign_finding_reviewer(
    finding_id: str,
    payload: ReviewerAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    try:
        finding = db.query(Finding).filter(
            Finding.id == finding_id
        ).first()

        if not finding:
            raise HTTPException(status_code=404, detail="Finding not found")

        reviewer = db.query(User).filter(
            User.id == payload.reviewer_id
        ).first()

        if not reviewer:
            raise HTTPException(status_code=404, detail="Reviewer not found")

        if not reviewer.is_active or reviewer.role != "reviewer":
            raise HTTPException(
                status_code=400,
                detail="User must be an active reviewer"
            )

        old_value = {
            "assigned_reviewer_id": finding.assigned_reviewer_id
        }

        finding.assigned_reviewer_id = reviewer.id

        record_audit(
            db=db,
            actor_user_id=current_user.id,
            action="finding.assigned",
            entity_type="finding",
            entity_id=finding.id,
            old_value=old_value,
            new_value={"assigned_reviewer_id": reviewer.id}
        )

        db.commit()
        db.refresh(finding)

        return {
            "message": "Reviewer assigned successfully",
            "finding_id": finding.id,
            "reviewer_id": reviewer.id
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

class FindingVerification(BaseModel):
    verification_status: str


@router.patch("/{finding_id}/verify")
def verify_finding(
    finding_id: str,
    payload: FindingVerification,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "reviewer")),
):
    allowed_statuses = ["verified", "unverified", "rejected"]

    if payload.verification_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid verification status")

    finding = db.query(Finding).filter(
        Finding.id == finding_id
    ).first()

    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    if current_user.role == "reviewer" and finding.assigned_reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Finding is not assigned to you")

    old_value = {"verification_status": finding.verification_status}
    finding.verification_status = payload.verification_status

    record_audit(
        db=db,
        actor_user_id=current_user.id,
        action="finding.verified",
        entity_type="finding",
        entity_id=finding.id,
        old_value=old_value,
        new_value={"verification_status": payload.verification_status}
    )

    db.commit()
    db.refresh(finding)

    return {
        "message": "Finding verification status updated",
        "finding_id": finding.id,
        "verification_status": finding.verification_status
    }
