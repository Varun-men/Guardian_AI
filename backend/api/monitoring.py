
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_db, require_role
from backend.db.models import Alert, Claim, Draft, Review, User
from backend.rules.monitoring import run_monitoring

router = APIRouter(
    prefix="/api/monitoring",
    tags=["Continuous Monitoring"]
)


@router.post("/run")
def run_monitoring_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """Manually run continuous monitoring."""
    try:
        return run_monitoring(db)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Monitoring failed: {str(e)}"
        )


@router.get("/alerts")
def list_monitoring_alerts(
    status: str = "open",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "reviewer"))
):
    """List monitoring alerts."""
    query = db.query(Alert)

    if status:
        query = query.filter(Alert.status == status)

    alerts = query.order_by(Alert.created_at.desc()).all()

    return {
        "total": len(alerts),
        "alerts": [
            {
                "id": alert.id,
                "claim_id": alert.claim_id,
                "fact_id": alert.fact_id,
                "message": alert.message,
                "status": alert.status,
                "created_at": alert.created_at
            }
            for alert in alerts
        ]
    }


@router.post("/alerts/{alert_id}/reopen")
def reopen_monitoring_review(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "reviewer"))
):
    """Reopen the review associated with a monitoring alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    claim = db.query(Claim).filter(
        Claim.id == alert.claim_id
    ).first()

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    review = db.query(Review).filter(
        Review.id == claim.review_id
    ).first()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    draft = db.query(Draft).filter(
        Draft.id == review.draft_id
    ).first()

    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    review.status = "pending"
    draft.status = "in_review"
    claim.status = "stale"

    db.commit()

    return {
        "message": "Review reopened successfully",
        "alert_id": alert.id,
        "claim_id": claim.id,
        "review_id": review.id,
        "draft_id": draft.id,
        "review_status": review.status,
        "draft_status": draft.status
    }
