
"""
Continuous Claim Monitoring service for Guardian AI.

Scans approved and previously stale ledger entries,
checks their facts and source evidence, and creates alerts.
"""

import uuid

from sqlalchemy.orm import Session

from backend.db.models import (
    Alert,
    Claim,
    ClaimLedger,
    Draft,
    Fact,
    Review,
    Source,
    SourcePassage,
)

from backend.rules.change_detector import (
    detect_fact_change,
    detect_outdated_evidence,
)


def run_monitoring(db: Session):
    """
    Scan ledger entries and create alerts for affected claims.

    Existing open alerts are reused to prevent duplicates.
    """

    entries = (
        db.query(ClaimLedger)
        .filter(ClaimLedger.status.in_(["approved", "stale"]))
        .all()
    )

    checked = 0
    alerts_created = 0
    unchanged = 0
    results = []

    for entry in entries:
        claim = db.query(Claim).filter(
            Claim.id == entry.claim_id
        ).first()

        fact = db.query(Fact).filter(
            Fact.id == entry.fact_id
        ).first()

        if not claim or not fact:
            continue

        # Only monitor claims that have been approved
        # or were previously approved and marked stale.
        if claim.status not in ("approved", "stale"):
            continue

        checked += 1

        issues = detect_fact_change(entry, claim, fact)

        source = db.query(Source).filter(
            Source.id == fact.source_id
        ).first()

        passage_exists = False

        if source:
            passage_exists = (
                db.query(SourcePassage.id)
                .filter(
                    SourcePassage.source_id == source.id,
                    SourcePassage.source_version == fact.source_version,
                )
                .first()
                is not None
            )

        issues.extend(
            detect_outdated_evidence(
                fact,
                source,
                passage_exists,
            )
        )

        if not issues:
            unchanged += 1
            continue

        # Avoid creating another alert while an alert
        # for this claim and fact is already open.
        existing_alert = (
            db.query(Alert)
            .filter(
                Alert.claim_id == claim.id,
                Alert.fact_id == fact.id,
                Alert.status == "open",
            )
            .first()
        )

        if existing_alert:
            results.append({
                "claim_id": claim.id,
                "fact_id": fact.id,
                "alert_id": existing_alert.id,
                "status": "existing_alert",
                "issues": [issue["type"] for issue in issues],
            })
            continue

        reasons = "; ".join(
            issue["reason"] for issue in issues
        )

        alert = Alert(
            id=str(uuid.uuid4()),
            claim_id=claim.id,
            fact_id=fact.id,
            message=reasons,
            status="open",
        )

        db.add(alert)

        # Mark the approved claim and ledger entry stale.
        claim.status = "stale"
        entry.status = "stale"

        review = db.query(Review).filter(
            Review.id == claim.review_id
        ).first()

        if review:
            draft = db.query(Draft).filter(
                Draft.id == review.draft_id
            ).first()

            if draft:
                draft.status = "stale"

        alerts_created += 1

        results.append({
            "claim_id": claim.id,
            "fact_id": fact.id,
            "status": "alert_created",
            "issues": [issue["type"] for issue in issues],
            "reason": reasons,
        })

    db.commit()

    return {
        "message": "Monitoring completed successfully",
        "claims_checked": checked,
        "alerts_created": alerts_created,
        "unchanged_claims": unchanged,
        "results": results,
    }
