
import logging
import os
import uuid
from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from backend.api.facts import router as facts_router
from backend.auth.routes import router as auth_router
from backend.api.sources import router as sources_router
from backend.db.database import engine, get_db
from backend.rules.integration import run_rule_checks
from backend.api.reviews import router as reviews_router


# ============================================================
# Logging configuration
# ============================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("guardian-ai")


# ============================================================
# FastAPI application
# ============================================================

app = FastAPI(
    title="Guardian AI API",
    description="Backend API for Guardian AI - the Living Claim Ledger",
    version="1.0.0",
)


# ============================================================
# Register API routers
# ============================================================

app.include_router(auth_router)
app.include_router(facts_router)
app.include_router(sources_router)


# ============================================================
# CORS configuration for Next.js frontend
# ============================================================

DEFAULT_FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

configured_origins = os.getenv("FRONTEND_ORIGINS", "")

frontend_origins = (
    [
        origin.strip().rstrip("/")
        for origin in configured_origins.split(",")
        if origin.strip()
    ]
    if configured_origins.strip()
    else DEFAULT_FRONTEND_ORIGINS
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Request schemas
# ============================================================

class ImageMetadata(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    alt: Optional[str] = None


class AnalyzeRequest(BaseModel):
    content: str = Field(min_length=1, max_length=50000)
    has_image: bool = False
    images: List[ImageMetadata] = Field(default_factory=list)


# ============================================================
# Issue response schema
# ============================================================

class Issue(BaseModel):
    id: str
    claim_id: Optional[str] = None

    severity: Literal[
        "HIGH",
        "MEDIUM",
        "SUPPORTED",
        "ACCESSIBILITY",
    ]

    category: str
    check_type: Literal["RULE", "AI"]
    flagged_text: str
    passage_id: str
    source_version: str
    cited_evidence: str
    explanation: str
    suggested_fix: Optional[str] = None
    confidence: float
    needs_human_decision: bool
    fact_id: Optional[str] = None


# ============================================================
# API response schema
# ============================================================

class AnalyzeResponse(BaseModel):
    draft_id: str
    content: str
    status: str
    issues: List[Issue]


# ============================================================
# Root endpoint
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Welcome to Guardian AI",
        "status": "running",
    }


# ============================================================
# Health endpoint
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Guardian AI Backend",
    }


# ============================================================
# Main draft analysis endpoint
# ============================================================
from backend.db.models import (
    Draft,
    Review,
    Claim as ClaimRecord,
    Finding,
)
@app.post(
    "/api/review/analyze",
    response_model=AnalyzeResponse,
)
def analyze_draft(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
):

    try:
        # Import pipeline modules only when analysis is requested.
        from backend.pipeline.claim_extractor import extract_claims
        from backend.pipeline.verifier import verify_claim
        from backend.pipeline.retriever import retrieve_evidence
        from backend.pipeline.citation_gate import verify_citation

        logger.info("Starting draft analysis")

        # ----------------------------------------------------
        # STEP 1: Extract factual claims
        # ----------------------------------------------------

        extraction = extract_claims(request.content)

        if extraction is None:
            raise RuntimeError(
                "Claim extraction returned no result."
            )

        claims = extraction.claims

        # ----------------------------------------------------
        # STEP 1.5: Run deterministic brand and pricing checks
        # ----------------------------------------------------

        rule_result = run_rule_checks(
            content=request.content,
            images=[
                image.model_dump()
                for image in request.images
            ],
        )

        issues = [
            Issue(**issue)
            for issue in rule_result["issues"]
        ]

        logger.info(
            "Deterministic checks completed: %s issues in %s ms",
            rule_result["total_issues"],
            rule_result["execution_time_ms"],
        )

        # ----------------------------------------------------
        # STEP 2: Retrieve and verify each extracted claim
        # ----------------------------------------------------

        for claim in claims:

            try:
                # --------------------------------------------
                # Retrieve trusted evidence ONCE per claim.
                # The retriever filters for active sources
                # and matching source versions.
                # --------------------------------------------

                evidence_items = retrieve_evidence(
                    claim.claim_text,
                    top_k=3,
                    db=db,
                )

                # --------------------------------------------
                # Verify using exactly the retrieved evidence.
                # No second retrieval occurs inside verifier.
                # --------------------------------------------

                verification = verify_claim(
                    claim.claim_id,
                    claim.claim_text,
                    evidence=evidence_items,
                )

            except Exception:

                logger.exception(
                    "Verification failed for claim %s",
                    claim.claim_id,
                )

                # Preserve the claim for manual review.
                issues.append(
                    Issue(
                        id=f"issue-{uuid.uuid4()}",
                        claim_id=claim.claim_id,
                        severity="MEDIUM",
                        category="FACTUAL_CLAIM",
                        check_type="AI",
                        flagged_text=claim.claim_text,
                        passage_id="NO_VERIFIED_CITATION",
                        source_version="unknown",
                        cited_evidence=(
                            "Verification could not be completed."
                        ),
                        explanation=(
                            "Automatic verification is temporarily "
                            "unavailable. Please review this claim manually."
                        ),
                        suggested_fix=None,
                        confidence=0.0,
                        needs_human_decision=True,
                        fact_id=None,
                    )
                )

                continue

            # ------------------------------------------------
            # STEP 3: Validate returned passage IDs
            # against the SAME retrieved evidence
            # ------------------------------------------------

            evidence_by_id = {
                item["passage_id"]: item
                for item in evidence_items
            }

            verified_evidence = []

            for passage_id in (
                verification.evidence_passage_ids or []
            ):

                item = evidence_by_id.get(passage_id)

                if not item:
                    logger.warning(
                        "Verifier returned passage ID %s "
                        "that was not retrieved for claim %s.",
                        passage_id,
                        claim.claim_id,
                    )
                    continue

                citation_result = verify_citation(
                    passage_id,
                    item["evidence_text"],
                    evidence_items=evidence_items,
                )

                if citation_result.get("valid"):
                    verified_evidence.append(
                        citation_result
                    )

            # Select the first citation that passes validation.
            citation = (
                verified_evidence[0]
                if verified_evidence
                else None
            )

            # ------------------------------------------------
            # STEP 4: Determine final verification status
            # ------------------------------------------------

            final_status = verification.status

            # A claim cannot be marked supported or
            # contradicted unless its citation passes validation.
            if not citation:
                final_status = "unverified"

            severity_map = {
                "supported": "SUPPORTED",
                "contradicted": "HIGH",
                "unverified": "MEDIUM",
            }

            severity = severity_map.get(
                final_status,
                "MEDIUM",
            )

            # ------------------------------------------------
            # STEP 5: Prepare evidence information
            # ------------------------------------------------

            if citation:

                passage_id = citation["passage_id"]
                source_version = citation["source_version"]
                cited_evidence = citation["cited_evidence"]

            else:

                passage_id = "NO_VERIFIED_CITATION"
                source_version = "unknown"

                cited_evidence = (
                    "No evidence passed exact-match "
                    "citation verification."
                )

            # ------------------------------------------------
            # STEP 6: Prepare explanation
            # ------------------------------------------------

            explanation = verification.explanation

            if not citation:
                explanation += (
                    " No citation passed the exact-match "
                    "verification gate."
                )

            # ------------------------------------------------
            # STEP 7: Normalize confidence
            # ------------------------------------------------

            confidence = max(
                0.0,
                min(
                    1.0,
                    float(verification.confidence),
                ),
            )

            # ------------------------------------------------
            # STEP 8: Build frontend-compatible AI issue
            # ------------------------------------------------

            issues.append(
                Issue(
                    id=f"issue-{uuid.uuid4()}",
                    claim_id=claim.claim_id,
                    severity=severity,
                    category="FACTUAL_CLAIM",
                    check_type="AI",
                    flagged_text=claim.claim_text,
                    passage_id=passage_id,
                    source_version=source_version,
                    cited_evidence=cited_evidence,
                    explanation=explanation,
                    suggested_fix=None,
                    confidence=confidence,
                    needs_human_decision=(
                        verification.needs_human_decision
                        or final_status != "supported"
                    ),
                    fact_id=None,
                )
            )

        # ----------------------------------------------------
        # Analysis completed
        # ----------------------------------------------------

        logger.info(
            "Analysis completed. Extracted %s claims "
            "and generated %s total issues.",
            len(claims),
            len(issues),
        )

        
        # ----------------------------------------------------
        # STEP 9: Persist analysis transactionally
        # ----------------------------------------------------

        draft_id = f"draft-{uuid.uuid4().hex[:12]}"
        review_id = f"review-{uuid.uuid4().hex[:12]}"

        # Map extractor IDs to unique database claim IDs.
        claim_id_map = {
            claim.claim_id: str(uuid.uuid4())
            for claim in claims
        }

        try:
            draft_record = Draft(
                id=draft_id,
                content=request.content,
                status="in_review",
            )

            review_record = Review(
                id=review_id,
                draft_id=draft_id,
                submitted_text=request.content,
                status="pending",
            )

            db.add(draft_record)
            db.add(review_record)

            # Save extracted claims.
            claim_records = []

            for extracted_claim in claims:
                claim_records.append(
                    ClaimRecord(
                        id=claim_id_map[extracted_claim.claim_id],
                        review_id=review_id,
                        claim_text=extracted_claim.claim_text,
                        status="pending",
                        source_version=1,
                    )
                )

            db.add_all(claim_records)

            # Save findings and update response claim IDs.
            finding_records = []

            for issue in issues:
                original_claim_id = issue.claim_id

                database_claim_id = (
                    claim_id_map.get(original_claim_id)
                    if original_claim_id
                    else None
                )

                issue.claim_id = database_claim_id

                if database_claim_id:
                    claim_status = (
                        "supported"
                        if issue.severity == "SUPPORTED"
                        else "contradicted"
                        if issue.severity == "HIGH"
                        else "unverified"
                    )

                    matching_claim = next(
                        (
                            record
                            for record in claim_records
                            if record.id == database_claim_id
                        ),
                        None,
                    )

                    if matching_claim:
                        matching_claim.status = claim_status

                evidence_data = [{
                    "passage_id": issue.passage_id,
                    "source_version": issue.source_version,
                    "cited_evidence": issue.cited_evidence,
                }]

                finding_records.append(
                    Finding(
                        id=issue.id,
                        review_id=review_id,
                        claim_id=database_claim_id,
                        finding_type=issue.category,
                        severity=issue.severity,
                        explanation=issue.explanation,
                        evidence=evidence_data,
                        suggested_edit=issue.suggested_fix,
                        confidence=issue.confidence,
                        verification_status=(
                            "supported"
                            if issue.severity == "SUPPORTED"
                            else "contradicted"
                            if issue.severity == "HIGH"
                            else "unverified"
                        ),
                    )
                )

            db.add_all(finding_records)
            db.commit()

            logger.info(
                "Persisted draft %s, review %s, %s claims and %s findings",
                draft_id,
                review_id,
                len(claim_records),
                len(finding_records),
            )

        except Exception:
            db.rollback()
            logger.exception("Failed to persist draft analysis")
            raise

        # ----------------------------------------------------
        # STEP 10: Return the existing API response contract
        # ----------------------------------------------------

        return AnalyzeResponse(
            draft_id=draft_id,
            content=request.content,
            status="in_review",
            issues=issues,
        )


    except ValueError as error:

        logger.warning(
            "Analysis configuration error: %s",
            error,
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Analysis service is not configured. "
                "Check the backend environment."
            ),
        )

    except Exception:

        logger.exception(
            "Draft analysis failed"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Draft analysis failed. "
                "Check the backend terminal for details."
            ),
        )


# ============================================================
# Database check endpoint
# ============================================================

@app.get("/api/db-check")
def database_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        tables = inspect(engine).get_table_names()

        return {
            "status": "connected",
            "database": "Guardian AI",
            "tables_count": len(tables),
            "tables": tables,
        }

    except Exception:

        logger.exception(
            "Database connectivity check failed"
        )

        raise HTTPException(
            status_code=503,
            detail="Database connection check failed.",
        )

app.include_router(reviews_router)
