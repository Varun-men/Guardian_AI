from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_db, require_role
from backend.db.models import (
    Claim,
    ClaimLedger,
    Draft,
    Fact,
    Finding,
    Review,
    Source,
    User,
)

router = APIRouter(prefix="/api/ledger", tags=["Living Claim Ledger"])


@router.get("/")
def list_ledger_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin", "reviewer", "creator")
    ),
):
    """Return approved claims, their findings, and linked Registry facts."""

    rows = (
        db.query(
            Claim,
            Review,
            Draft,
            ClaimLedger,
            Fact,
            Source,
            Finding,
        )
        .join(Review, Review.id == Claim.review_id)
        .join(Draft, Draft.id == Review.draft_id)
        .outerjoin(
            Finding,
            (Finding.claim_id == Claim.id)
            & (Finding.review_id == Review.id),
        )
        .outerjoin(ClaimLedger, ClaimLedger.claim_id == Claim.id)
        .outerjoin(Fact, Fact.id == ClaimLedger.fact_id)
        .outerjoin(Source, Source.id == Fact.source_id)
        .filter(Draft.status == "approved")
        .order_by(Claim.created_at.desc())
        .all()
    )

    entries = []

    for claim, review, draft, ledger_entry, fact, source, finding in rows:

        finding_status = (
            finding.verification_status.lower()
            if finding and finding.verification_status
            else "unverified"
        )

        if ledger_entry and ledger_entry.status == "stale":
            status = "stale"
        elif ledger_entry and fact and finding_status == "contradicted":
            status = "contradicted"
        elif ledger_entry and fact and finding_status == "supported":
            status = "current"
        else:
            status = "unverified"

        entries.append({
            "id": (
                str(ledger_entry.id)
                if ledger_entry
                else f"unlinked-{claim.id}"
            ),
            "claim_id": claim.id,
            "draft_id": draft.id,
            "review_id": review.id,
            "title": f"Approved draft {draft.id[:8]}",
            "text": claim.claim_text,
            "draft_content": draft.content,
            "claim_status": claim.status,
            "finding_status": finding_status,
            "status": status,
            "ledger_status": (
                ledger_entry.status if ledger_entry else None
            ),
            "fact": (
                {
                    "id": fact.id,
                    "name": fact.name,
                    "value": fact.value,
                    "source_id": fact.source_id,
                    "source_name": source.filename if source else None,
                    "source_version": fact.source_version,
                }
                if fact
                else None
            ),
            "created_at": (
                claim.created_at.isoformat()
                if claim.created_at
                else None
            ),
        })

    registry_facts = (
        db.query(Fact, Source)
        .outerjoin(Source, Source.id == Fact.source_id)
        .order_by(Fact.updated_at.desc())
        .all()
    )

    facts = [
        {
            "id": fact.id,
            "label": fact.name,
            "value": fact.value,
            "version": fact.source_version,
            "source_id": fact.source_id,
            "source_name": source.filename if source else None,
        }
        for fact, source in registry_facts
    ]

    return {
        "total": len(entries),
        "entries": entries,
        "facts": facts,
    }
