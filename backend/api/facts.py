
import uuid

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_db, require_role
from backend.db.models import (
    Fact,
    Claim,
    ClaimLedger,
    Review,
    Draft,
    Alert,
    Source,
    SourcePassage,
    User,
)
from backend.services.audit import record_audit


router = APIRouter(prefix="/api/facts", tags=["Facts"])


# --------------------------------------------------
# REQUEST SCHEMAS
# --------------------------------------------------

class FactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    value: str = Field(min_length=1)
    source_id: str = Field(min_length=1)


class FactUpdate(BaseModel):
    value: str = Field(min_length=1)
    name: str | None = None


# --------------------------------------------------
# CREATE FACT
# Admin only
# --------------------------------------------------

@router.post("/", status_code=201)
def create_fact(
    data: FactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    try:
        source = db.query(Source).filter(
            Source.id == data.source_id
        ).first()

        if not source:
            raise HTTPException(
                status_code=404,
                detail="Source not found",
            )

        if source.status != "active":
            raise HTTPException(
                status_code=409,
                detail="Only approved active sources can be used to register facts",
            )

        passage_count = db.query(SourcePassage).filter(
            SourcePassage.source_id == source.id,
            SourcePassage.source_version == source.version,
        ).count()

        if passage_count == 0:
            raise HTTPException(
                status_code=409,
                detail="No evidence passages exist for the current source version",
            )

        fact = Fact(
            id=str(uuid.uuid4()),
            name=data.name.strip(),
            value=data.value.strip(),
            source_id=source.id,
            source_version=source.version,
        )

        if not fact.name or not fact.value:
            raise HTTPException(
                status_code=400,
                detail="Fact name and value cannot be empty",
            )

        db.add(fact)

        record_audit(
            db=db,
            actor_user_id=current_user.id,
            action="fact.created",
            entity_type="fact",
            entity_id=fact.id,
            new_value={
                "name": fact.name,
                "value": fact.value,
                "source_id": fact.source_id,
                "source_version": fact.source_version,
            },
        )

        db.commit()
        db.refresh(fact)

        return {
            "message": "Fact registered successfully",
            "fact": {
                "id": fact.id,
                "name": fact.name,
                "value": fact.value,
                "source_id": fact.source_id,
                "source_name": source.filename,
                "source_version": fact.source_version,
            },
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


# --------------------------------------------------
# LIST FACTS
# Admin, reviewer and creator
# --------------------------------------------------

@router.get("/")
def list_facts(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin", "reviewer", "creator")
    ),
):
    facts = (
        db.query(Fact)
        .order_by(Fact.updated_at.desc())
        .all()
    )

    results = []

    for fact in facts:
        source = db.query(Source).filter(
            Source.id == fact.source_id
        ).first()

        results.append({
            "id": fact.id,
            "name": fact.name,
            "value": fact.value,
            "source_id": fact.source_id,
            "source_name": source.filename if source else None,
            "source_version": fact.source_version,
            "source_status": source.status if source else None,
            "updated_at": fact.updated_at,
        })

    return {
        "total": len(results),
        "facts": results,
    }


# --------------------------------------------------
# UPDATE FACT
# Admin only
# Existing stale-claim and alert logic preserved
# --------------------------------------------------

@router.patch("/{fact_id}")
def update_fact(
    fact_id: str,
    data: FactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    try:
        fact = db.query(Fact).filter(
            Fact.id == fact_id
        ).first()

        if not fact:
            raise HTTPException(
                status_code=404,
                detail="Fact not found",
            )

        old_value = {
            "name": fact.name,
            "value": fact.value,
            "source_version": fact.source_version,
        }

        fact.value = data.value.strip()

        if data.name is not None:
            fact.name = data.name.strip()

        if not fact.value or not fact.name:
            raise HTTPException(
                status_code=400,
                detail="Fact name and value cannot be empty",
            )

        stale_claim_ids = []
        stale_draft_ids = []
        alerts_created = 0

        entries = db.query(ClaimLedger).filter(
            ClaimLedger.fact_id == fact.id,
            ClaimLedger.status == "approved",
        ).all()

        for entry in entries:
            claim = db.query(Claim).filter(
                Claim.id == entry.claim_id
            ).first()

            # The approved ClaimLedger entry is the publication
            # record. Claim.status may still be "supported",
            # "contradicted", or "unverified" from Analyze.
            if not claim:
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
                message=(
                    f"Fact '{fact.name}' was updated. "
                    "Claim requires re-verification."
                ),
                status="open",
            )

            db.add(alert)
            alerts_created += 1

        new_value = {
            "name": fact.name,
            "value": fact.value,
            "source_version": fact.source_version,
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
                "stale_draft_ids": stale_draft_ids,
            },
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
            "alerts_created": alerts_created,
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
