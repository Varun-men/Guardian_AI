"""
Deterministic change detection for Guardian AI monitoring.

This module does not access the database. It evaluates a claim,
its linked fact, and the associated source metadata.
"""


def detect_fact_change(ledger_entry, claim, fact):
    """
    Detect whether an approved ledger entry has become stale.

    Returns a list of monitoring issues.
    """
    issues = []

    if ledger_entry.status == "stale" or claim.status == "stale":
        issues.append({
            "type": "FACT_CHANGED",
            "reason": (
                f"Fact '{fact.name}' was updated or the approved "
                "claim was marked stale."
            ),
            "claim_id": claim.id,
            "fact_id": fact.id,
        })

    return issues


def detect_outdated_evidence(fact, source, passage_exists):
    """
    Detect whether the fact's supporting source is no longer current.
    """
    issues = []

    if source is None:
        return [{
            "type": "SOURCE_MISSING",
            "reason": "The fact's supporting source could not be found.",
            "fact_id": fact.id,
        }]

    if source.status != "active":
        issues.append({
            "type": "SOURCE_NOT_ACTIVE",
            "reason": (
                f"Supporting source '{source.filename}' is "
                f"currently '{source.status}'."
            ),
            "fact_id": fact.id,
        })

    if fact.source_version != source.version:
        issues.append({
            "type": "EVIDENCE_OUTDATED",
            "reason": (
                f"Fact uses source version {fact.source_version}, "
                f"but the current source version is {source.version}."
            ),
            "fact_id": fact.id,
        })

    if not passage_exists:
        issues.append({
            "type": "EVIDENCE_MISSING",
            "reason": (
                f"No stored passage exists for source "
                f"'{source.filename}' version {fact.source_version}."
            ),
            "fact_id": fact.id,
        })

    return issues