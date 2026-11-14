
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth.dependencies import get_db, require_role
from backend.db.models import (
    Finding,
    Claim,
    ClaimLedger,
    Review,
    User,
    Fact,
    Source,
    SourcePassage,
    Draft,
)
from backend.services.audit import record_audit

router = APIRouter(prefix="/api/findings", tags=["Findings"])


class ReviewerAssignment(BaseModel):
    reviewer_id: str


class FindingVerification(BaseModel):
    verification_status: str


class FactAssociation(BaseModel):
    fact_id: str = Field(min_length=1)
    passage_id: str = Field(min_length=1)


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

        # Temporary diagnostic: verify the committed JSON using a fresh query
        db.expire(finding, ["evidence"])

        saved_finding = db.query(Finding).filter(
            Finding.id == finding_id
        ).populate_existing().first()

        print(
            "ASSOCIATION POST-COMMIT CHECK:",
            saved_finding.evidence
        )

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


@router.patch("/{finding_id}/verify")
def verify_finding(
    finding_id: str,
    payload: FindingVerification,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "reviewer")),
):
    allowed_statuses = ["verified", "unverified", "rejected"]

    if payload.verification_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid verification status"
        )

    finding = db.query(Finding).filter(
        Finding.id == finding_id
    ).first()

    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    if (
        current_user.role == "reviewer"
        and finding.assigned_reviewer_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Finding is not assigned to you"
        )

    old_value = {
        "verification_status": finding.verification_status
    }

    finding.verification_status = payload.verification_status

    record_audit(
        db=db,
        actor_user_id=current_user.id,
        action="finding.verified",
        entity_type="finding",
        entity_id=finding.id,
        old_value=old_value,
        new_value={
            "verification_status": payload.verification_status
        }
    )

    db.commit()
    db.refresh(finding)

    return {
        "message": "Finding verification status updated",
        "finding_id": finding.id,
        "verification_status": finding.verification_status
    }


@router.patch("/{finding_id}/associate-fact")
def associate_finding_with_fact(
    finding_id: str,
    payload: FactAssociation,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "reviewer")),
):
    try:
        # 1. Find the finding
        finding = db.query(Finding).filter(
            Finding.id == finding_id
        ).first()

        if not finding:
            raise HTTPException(
                status_code=404,
                detail="Finding not found"
            )

        # 2. Reviewers can only modify findings assigned to them
        if (
            current_user.role == "reviewer"
            and finding.assigned_reviewer_id != current_user.id
        ):
            raise HTTPException(
                status_code=403,
                detail="Finding is not assigned to you"
            )

        # 3. Find the selected fact
        fact = db.query(Fact).filter(
            Fact.id == payload.fact_id
        ).first()

        if not fact:
            raise HTTPException(
                status_code=404,
                detail="Fact not found"
            )

        # 4. Check that the fact's source exists and is active
        source = db.query(Source).filter(
            Source.id == fact.source_id
        ).first()

        if not source or source.status != "active":
            raise HTTPException(
                status_code=400,
                detail="Fact must belong to an active source"
            )

        # 5. Find the passage selected by the reviewer
        passage = db.query(SourcePassage).filter(
            SourcePassage.id == payload.passage_id
        ).first()

        if not passage:
            raise HTTPException(
                status_code=404,
                detail="Evidence passage not found"
            )

        # 6. Ensure the passage belongs to the fact's source
        if passage.source_id != fact.source_id:
            raise HTTPException(
                status_code=400,
                detail="Evidence passage does not belong to the fact's source"
            )

        # 7. Ensure the passage and fact refer to the same version
        if passage.source_version != fact.source_version:
            raise HTTPException(
                status_code=400,
                detail="Evidence passage version does not match fact version"
            )

        # 8. Find the matching evidence item on this finding
        evidence_items = finding.evidence or []

        if not isinstance(evidence_items, list):
            raise HTTPException(
                status_code=400,
                detail="Finding evidence has an invalid format"
            )

        matching_item = None

        for item in evidence_items:
            if (
                isinstance(item, dict)
                and item.get("passage_id") == payload.passage_id
            ):
                matching_item = item
                break

        if not matching_item:
            raise HTTPException(
                status_code=400,
                detail="Selected passage is not attached to this finding"
            )

        # 9. Verify the actual quotation against the passage content
        cited_quote = matching_item.get("cited_evidence")

        if (
            not isinstance(cited_quote, str)
            or not cited_quote.strip()
            or cited_quote not in passage.content
        ):
            raise HTTPException(
                status_code=400,
                detail="Cited quotation does not match the selected passage"
            )

                # 10. Build the updated evidence JSON
        updated_evidence = [
            dict(item) for item in evidence_items
        ]

        old_fact_id = matching_item.get("fact_id")

        for item in updated_evidence:
            if item.get("passage_id") == payload.passage_id:
                item["fact_id"] = fact.id
                item["source_id"] = source.id
                break

        # 11. Record the association
        record_audit(
            db=db,
            actor_user_id=current_user.id,
            action="finding.fact_associated",
            entity_type="finding",
            entity_id=finding.id,
            old_value={
                "fact_id": old_fact_id,
                "passage_id": payload.passage_id
            },
            new_value={
                "fact_id": fact.id,
                "passage_id": passage.id,
                "source_id": source.id,
                "source_version": passage.source_version
            }
        )

        # 12. Explicitly update the database JSON column
        updated_rows = db.query(Finding).filter(
            Finding.id == finding_id
        ).update(
            {Finding.evidence: updated_evidence},
            synchronize_session=False
        )

        if updated_rows != 1:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Could not save fact association"
            )

        db.commit()

        saved_finding = db.query(Finding).filter(
            Finding.id == finding_id
        ).populate_existing().first()

        if not any(
            isinstance(item, dict)
            and item.get("passage_id") == payload.passage_id
            and item.get("fact_id") == fact.id
            for item in (saved_finding.evidence or [])
        ):
            raise HTTPException(
                status_code=500,
                detail="Fact association was not persisted"
            )

        # 11. Record the change in the audit log
        record_audit(
            db=db,
            actor_user_id=current_user.id,
            action="finding.fact_associated",
            entity_type="finding",
            entity_id=finding.id,
            old_value={
                "fact_id": old_fact_id,
                "passage_id": payload.passage_id
            },
            new_value={
                "fact_id": fact.id,
                "passage_id": passage.id,
                "source_id": source.id,
                "source_version": passage.source_version
            }
        )

        db.commit()
        db.refresh(finding)

        db.expire(finding, ["evidence"])
        saved_finding = db.query(Finding).filter(
            Finding.id == finding_id
        ).populate_existing().first()

        print(
            "FACT ASSOCIATION SAVED:",
            saved_finding.evidence
        )

        return {
            "message": "Fact successfully associated with finding",
            "debug_saved_evidence": saved_finding.evidence,
            "finding_id": finding.id,
            "fact_id": fact.id,
            "passage_id": passage.id,
            "source_id": source.id,
            "source_version": passage.source_version
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


# --------------------------------------------------
# READ-ONLY: Retrieve findings and evidence for a draft
# --------------------------------------------------

@router.get("/draft/{draft_id}")
def get_draft_findings(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "reviewer", "creator")),
):
    draft = db.query(Draft).filter(
        Draft.id == draft_id
    ).first()

    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    results = []

    for review in draft.reviews:
        for finding in review.findings:
            evidence_results = []

            for item in (finding.evidence or []):
                passage = db.query(SourcePassage).filter(
                    SourcePassage.id == item.get("passage_id")
                ).first()

                evidence_results.append({
                    "passage_id": item.get("passage_id"),
                    "source_id": item.get("source_id"),
                    "source_version": item.get("source_version"),
                    "cited_evidence": item.get("cited_evidence"),
                    "fact_id": item.get("fact_id"),
                    "passage_content": passage.content if passage else None,
                    "database_passage_version": (
                        passage.source_version if passage else None
                    ),
                    "database_passage_source_id": (
                        passage.source_id if passage else None
                    ),
                })

            results.append({
                "finding_id": finding.id,
                "claim_id": finding.claim_id,
                "claim_text": (
                    finding.claim.claim_text
                    if finding.claim else None
                ),
                "review_id": finding.review_id,
                "finding_type": finding.finding_type,
                "verification_status": finding.verification_status,
                "explanation": finding.explanation,
                "evidence": evidence_results,
            })

    return {
        "draft_id": draft.id,
        "draft_status": draft.status,
        "draft_content": draft.content,
        "reviews": [
            {
                "review_id": review.id,
                "review_status": review.status,
            }
            for review in draft.reviews
        ],
        "total_findings": len(results),
        "findings": results,
    }

from sqlalchemy.orm import Session


@router.post("/draft/{draft_id}/sync-ledger")
def sync_approved_draft_to_ledger(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    try:
        draft = db.query(Draft).filter(
            Draft.id == draft_id
        ).first()

        if not draft:
            raise HTTPException(
                status_code=404,
                detail="Draft not found."
            )

        if draft.status != "approved":
            raise HTTPException(
                status_code=409,
                detail="Only approved drafts can be synced."
            )

        reviews = db.query(Review).filter(
            Review.draft_id == draft_id,
            Review.status == "approved"
        ).all()

        if not reviews:
            raise HTTPException(
                status_code=409,
                detail="No approved review exists for this draft."
            )

        inserted = 0
        duplicates = 0
        skipped = []

        for review in reviews:
            findings = db.query(Finding).filter(
                Finding.review_id == review.id
            ).all()

            for finding in findings:
                if not finding.claim_id:
                    continue

                claim = db.query(Claim).filter(
                    Claim.id == finding.claim_id,
                    Claim.review_id == review.id
                ).first()

                if not claim:
                    skipped.append({
                        "finding_id": finding.id,
                        "reason": "Claim missing or belongs to another review."
                    })
                    continue

                for item in finding.evidence or []:
                    fact_id = item.get("fact_id")

                    if not fact_id:
                        continue

                    fact = db.query(Fact).filter(
                        Fact.id == fact_id
                    ).first()

                    if not fact:
                        skipped.append({
                            "finding_id": finding.id,
                            "reason": "Associated fact not found."
                        })
                        continue

                    source = db.query(Source).filter(
                        Source.id == fact.source_id
                    ).first()

                    passage_id = item.get("passage_id")
                    passage = db.query(SourcePassage).filter(
                        SourcePassage.id == passage_id
                    ).first() if passage_id else None

                    cited_evidence = (
                        item.get("cited_evidence") or ""
                    ).strip()

                    valid = (
                        source is not None
                        and source.status == "active"
                        and source.version == fact.source_version
                        and passage is not None
                        and passage.source_id == fact.source_id
                        and passage.source_version == fact.source_version
                        and bool(cited_evidence)
                        and cited_evidence in passage.content
                        and (
                            not item.get("source_id")
                            or item.get("source_id") == fact.source_id
                        )
                    )

                    if not valid:
                        skipped.append({
                            "finding_id": finding.id,
                            "fact_id": fact_id,
                            "reason": "Source, passage, version, or citation validation failed."
                        })
                        continue

                    existing = db.query(ClaimLedger).filter(
                        ClaimLedger.claim_id == claim.id,
                        ClaimLedger.fact_id == fact.id
                    ).first()

                    if existing:
                        duplicates += 1
                        continue

                    db.add(ClaimLedger(
                        claim_id=claim.id,
                        fact_id=fact.id,
                        status="approved"
                    ))
                    inserted += 1

        record_audit(
            db=db,
            actor_user_id=current_user.id,
            action="ledger.backfilled",
            entity_type="draft",
            entity_id=draft.id,
            new_value={
                "inserted": inserted,
                "duplicates": duplicates,
                "skipped": len(skipped)
            }
        )

        db.commit()

        return {
            "draft_id": draft.id,
            "status": "completed",
            "inserted": inserted,
            "duplicates": duplicates,
            "skipped_count": len(skipped),
            "skipped": skipped
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
