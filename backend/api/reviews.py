
import uuid

from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_db, require_role
from backend.db.models import (
    Draft,
    Review,
    Finding,
    ClaimLedger,
    Fact,
    AuditLog,
    User,
)
from backend.services.audit import record_audit

router = APIRouter(prefix="/api/review", tags=["Review"])


class FindingDecision(BaseModel):
    decision: str

class ApproveDraftRequest(BaseModel):
    content: str


@router.post("/findings/{finding_id}/decision")
def decide_finding(
    finding_id: str,
    data: FindingDecision,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "creator")),
):
    decision = data.decision.lower()

    if decision not in ("applied", "dismissed"):
        raise HTTPException(400, "Decision must be applied or dismissed")

    finding = db.query(Finding).filter(
        Finding.id == finding_id
    ).first()

    if not finding:
        raise HTTPException(404, "Finding not found")

    review = db.query(Review).filter(
        Review.id == finding.review_id
    ).first()

    if not review:
        raise HTTPException(404, "Review not found")

    draft = db.query(Draft).filter(
        Draft.id == review.draft_id
    ).first()

    if not draft or draft.status != "in_review":
        raise HTTPException(409, "Draft is not awaiting review")

    try:
        record_audit(
            db,
            actor_user_id=user.id,
            action=f"finding.{decision}",
            entity_type="finding",
            entity_id=finding.id,
            new_value={"decision": decision},
        )
        db.commit()

        return {
            "finding_id": finding.id,
            "decision": decision,
            "saved": True,
        }

    except Exception:
        db.rollback()
        raise


@router.get("/{draft_id}/decisions")
def get_decisions(
    draft_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "creator")),
):
    draft = db.query(Draft).filter(Draft.id == draft_id).first()

    if not draft:
        raise HTTPException(404, "Draft not found")

    review = db.query(Review).filter(
        Review.draft_id == draft_id
    ).order_by(Review.created_at.desc()).first()

    if not review:
        raise HTTPException(404, "Review not found")

    result = {}

    for finding in review.findings:
        audit = db.query(AuditLog).filter(
            AuditLog.entity_type == "finding",
            AuditLog.entity_id == finding.id,
            AuditLog.action.in_([
                "finding.applied",
                "finding.dismissed",
            ]),
        ).order_by(AuditLog.id.desc()).first()

        result[finding.id] = (
            audit.new_value.get("decision")
            if audit and audit.new_value
            else None
        )

    return {"draft_id": draft_id, "decisions": result}


@router.post("/{draft_id}/approve")
def approve_draft(
    draft_id: str,
    data: ApproveDraftRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "creator")),
):
    draft = db.query(Draft).filter(Draft.id == draft_id).first()

    if not draft:
        raise HTTPException(404, "Draft not found")

    if draft.status != "in_review":
        raise HTTPException(409, "Draft is not awaiting approval")

    review = db.query(Review).filter(
        Review.draft_id == draft_id
    ).order_by(Review.created_at.desc()).first()

    if not review:
        raise HTTPException(404, "Review not found")

    for finding in review.findings:
        if finding.severity == "SUPPORTED":
            continue

        audit = db.query(AuditLog).filter(
            AuditLog.entity_type == "finding",
            AuditLog.entity_id == finding.id,
            AuditLog.action.in_([
                "finding.applied",
                "finding.dismissed",
            ]),
        ).order_by(AuditLog.id.desc()).first()

        if not audit:
            raise HTTPException(
                409,
                f"Finding {finding.id} still needs a decision",
            )

    try:
        draft.content = data.content
        draft.status = "approved"
        review.status = "approved"

        # Only create ledger entries when a real fact association
        # exists in the finding evidence.
        for finding in review.findings:
            for item in finding.evidence or []:
                fact_id = item.get("fact_id")

                if not finding.claim_id or not fact_id:
                    continue

                fact = db.query(Fact).filter(
                    Fact.id == fact_id
                ).first()

                if not fact:
                    continue

                existing = db.query(ClaimLedger).filter(
                    ClaimLedger.claim_id == finding.claim_id,
                    ClaimLedger.fact_id == fact.id,
                ).first()

                if not existing:
                    db.add(ClaimLedger(
                        claim_id=finding.claim_id,
                        fact_id=fact.id,
                        status="approved",
                    ))

        record_audit(
            db,
            actor_user_id=user.id,
            action="draft.approved",
            entity_type="draft",
            entity_id=draft.id,
            new_value={"status": "approved"},
        )

        db.commit()

        return {
            "draft_id": draft.id,
            "status": "approved",
            "review_id": review.id,
        }

    except Exception:
        db.rollback()
        raise
