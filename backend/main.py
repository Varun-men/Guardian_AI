
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
from backend.api.reviews import router as reviews_router
from backend.api.monitoring import router as monitoring_router
from backend.api.findings import router as findings_router
from backend.api.audit import router as audit_router

from backend.db.database import engine, get_db
from backend.db.models import (
    Draft,
    Review,
    Claim as ClaimRecord,
    Finding,
)

from backend.rules.integration import run_rule_checks


# ============================================================
# LOGGING CONFIGURATION
# ============================================================

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger("guardian-ai")


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Guardian AI API",
    description=(
        "Backend API for Guardian AI - "
        "the Living Claim Ledger"
    ),
    version="1.0.0",
)


# ============================================================
# REGISTER API ROUTERS
# ============================================================

app.include_router(auth_router)
app.include_router(facts_router)
app.include_router(sources_router)
app.include_router(monitoring_router)
app.include_router(reviews_router)


# ============================================================
# CORS CONFIGURATION
# ============================================================

DEFAULT_FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

configured_origins = os.getenv(
    "FRONTEND_ORIGINS",
    ""
)

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
# REQUEST SCHEMAS
# ============================================================

class ImageMetadata(BaseModel):

    filename: str = Field(
        min_length=1,
        max_length=255
    )

    alt: Optional[str] = None


class AnalyzeRequest(BaseModel):

    content: str = Field(
        min_length=1,
        max_length=50000
    )

    has_image: bool = False

    images: List[ImageMetadata] = Field(
        default_factory=list
    )


# ============================================================
# ISSUE RESPONSE SCHEMA
# ============================================================

class Issue(BaseModel):

    id: str

    claim_id: Optional[str] = None

    # --------------------------------------------------------
    # VERIFICATION STATUS
    # --------------------------------------------------------

    status: Literal[
        "SUPPORTED",
        "CONTRADICTED",
        "UNVERIFIED",
    ]

    # --------------------------------------------------------
    # UI / REVIEW SEVERITY
    # --------------------------------------------------------

    severity: Literal[
        "NONE",
        "HIGH",
        "MEDIUM",
        "ACCESSIBILITY",
    ]

    category: str

    check_type: Literal[
        "RULE",
        "AI",
    ]

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
# API RESPONSE SCHEMA
# ============================================================

class AnalyzeResponse(BaseModel):

    draft_id: str

    content: str

    status: str

    issues: List[Issue]


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "Welcome to Guardian AI",
        "status": "running",
    }


# ============================================================
# HEALTH ENDPOINT
# ============================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "service": "Guardian AI Backend",
    }


# ============================================================
# MAIN DRAFT ANALYSIS ENDPOINT
# ============================================================

@app.post(
    "/api/review/analyze",
    response_model=AnalyzeResponse,
)
def analyze_draft(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
):

    try:

        # ====================================================
        # IMPORT PIPELINE MODULES
        # ====================================================

        from backend.pipeline.claim_extractor import (
            extract_claims
        )

        from backend.pipeline.verifier import (
            verify_claim
        )

        from backend.pipeline.retriever import (
            retrieve_evidence
        )

        from backend.pipeline.citation_gate import (
            verify_citation
        )

        logger.info(
            "Starting draft analysis"
        )


        # ====================================================
        # STEP 1
        # EXTRACT FACTUAL CLAIMS
        # ====================================================

        extraction = extract_claims(
            request.content
        )

        if extraction is None:

            raise RuntimeError(
                "Claim extraction returned no result."
            )

        claims = extraction.claims


        # ====================================================
        # STEP 1.5
        # DETERMINISTIC RULE CHECKS
        # ====================================================

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
            "Deterministic checks completed: "
            "%s issues in %s ms",
            rule_result["total_issues"],
            rule_result["execution_time_ms"],
        )


        # ====================================================
        # STEP 2
        # RETRIEVE + VERIFY EACH CLAIM
        # ====================================================

        for claim in claims:

            try:

                # ------------------------------------------------
                # STEP 2A
                # RETRIEVE TRUSTED EVIDENCE
                # ------------------------------------------------

                evidence_items = retrieve_evidence(
                    claim.claim_text,
                    top_k=3,
                    db=db,
                )

                logger.info(
                    "Retrieved %s evidence passages "
                    "for claim %s",
                    len(evidence_items),
                    claim.claim_id,
                )


                # ------------------------------------------------
                # STEP 2B
                # VERIFY USING SAME EVIDENCE
                # ------------------------------------------------

                verification = verify_claim(
                    claim_id=claim.claim_id,
                    claim_text=claim.claim_text,
                    evidence=evidence_items,
                )

                logger.info(
                    "Verification completed for claim %s: "
                    "status=%s, passages=%s",
                    claim.claim_id,
                    verification.status,
                    verification.evidence_passage_ids,
                )


            except Exception:

                logger.exception(
                    "Verification failed for claim %s",
                    claim.claim_id,
                )


                # ------------------------------------------------
                # FALLBACK TO MANUAL REVIEW
                # ------------------------------------------------

                issues.append(
                    Issue(
                        id=f"issue-{uuid.uuid4()}",
                        claim_id=claim.claim_id,

                        status="UNVERIFIED",
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
                            "unavailable. Please review this claim "
                            "manually."
                        ),

                        suggested_fix=None,

                        confidence=0.0,

                        needs_human_decision=True,

                        fact_id=None,
                    )
                )

                continue


            # ====================================================
            # STEP 3
            # VALIDATE VERIFIER PASSAGE IDs
            # AGAINST SAME RETRIEVED EVIDENCE
            # ====================================================

            evidence_by_id = {
                str(item["passage_id"]): item
                for item in evidence_items
            }

            logger.info(
                "Retrieved evidence for claim %s: %s",
                claim.claim_id,
                [item["passage_id"] for item in evidence_items],
)

            logger.info(
                "Verifier selected passage IDs for claim %s: %s",
                claim.claim_id,
                verification.evidence_passage_ids,
            )

            verified_evidence = []


            # Safely read passage IDs from verifier.

            verifier_passage_ids = getattr(
                verification,
                "evidence_passage_ids",
                [],
            ) or []


            for passage_id in verifier_passage_ids:

                passage_id = str(
                    passage_id
                )


                item = evidence_by_id.get(
                    passage_id
                )


                if item is None:

                    logger.warning(
                        "Verifier returned passage ID %s "
                        "that was not retrieved for claim %s.",
                        passage_id,
                        claim.claim_id,
                    )

                    continue


                # ------------------------------------------------
                # EXACT-MATCH CITATION CHECK
                # ------------------------------------------------

                # Use the ORIGINAL evidence text returned
                # from PostgreSQL.

                # This verifies that the passage belongs to
                # the same evidence set used by the verifier.

                cited_quote = item.get(
                    "evidence_text",
                    ""
                )


                citation_result = verify_citation(
                    passage_id=passage_id,
                    cited_quote=cited_quote,
                    evidence_items=evidence_items,
                )


                logger.info(
                    "Citation verification for claim %s: %s",
                    claim.claim_id,
                    citation_result,
                )


                if citation_result.get(
                    "valid",
                    False
                ):

                    verified_evidence.append(
                        citation_result
                    )


            # ====================================================
            # STEP 3.5
            # SELECT VERIFIED CITATION
            # ====================================================

            citation = (
                verified_evidence[0]
                if verified_evidence
                else None
            )


            # ====================================================
            # STEP 4
            # DETERMINE FINAL STATUS
            # ====================================================

            # IMPORTANT:
            #
            # The verifier is the source of truth for the
            # factual status.
            #
            # Do NOT automatically convert a valid
            # SUPPORTED / CONTRADICTED result to UNVERIFIED
            # simply because the citation list is empty.
            #
            # The verifier has already used the same retrieved
            # evidence.

            final_status = str(
                getattr(
                    verification,
                    "status",
                    "unverified",
                )
            ).lower()


            # Only allow valid statuses.

            if final_status not in {
                "supported",
                "contradicted",
                "unverified",
            }:

                logger.warning(
                    "Unknown verifier status '%s' "
                    "for claim %s",
                    final_status,
                    claim.claim_id,
                )

                final_status = "unverified"


            # ------------------------------------------------
            # MAP VERIFICATION STATUS
            # TO FRONTEND STATUS + SEVERITY
            # ------------------------------------------------

            status_map = {
                "supported": "SUPPORTED",
                "contradicted": "CONTRADICTED",
                "unverified": "UNVERIFIED",
            }

            severity_map = {
                "supported": "NONE",
                "contradicted": "HIGH",
                "unverified": "MEDIUM",
            }


            status = status_map.get(
                final_status,
                "UNVERIFIED",
            )

            severity = severity_map.get(
                final_status,
                "MEDIUM",
            )


            # ====================================================
            # STEP 5
            # PREPARE EVIDENCE INFORMATION
            # ====================================================

            # First try to use the citation that passed
            # the exact-match gate.

            if citation:

                passage_id = citation.get(
                    "passage_id",
                    "NO_VERIFIED_CITATION",
                )

                source_version = citation.get(
                    "source_version",
                    "v1",
                )

                cited_evidence = citation.get(
                    "cited_evidence",
                    "",
                )


            else:

                # ------------------------------------------------
                # FALLBACK:
                # Use the passage selected by the verifier.
                # ------------------------------------------------

                selected_passage_id = None

                selected_item = None


                if verifier_passage_ids:

                    selected_passage_id = str(
                        verifier_passage_ids[0]
                    )

                    selected_item = evidence_by_id.get(
                        selected_passage_id
                    )


                if selected_item:

                    passage_id = selected_passage_id

                    source_version = selected_item.get(
                        "source_version",
                        "v1",
                    )

                    cited_evidence = selected_item.get(
                        "evidence_text",
                        "",
                    )


                else:

                    passage_id = (
                        "NO_VERIFIED_CITATION"
                    )

                    source_version = "unknown"

                    cited_evidence = (
                        "No approved evidence was selected."
                    )


            # ====================================================
            # STEP 6
            # PREPARE EXPLANATION
            # ====================================================

            explanation = getattr(
                verification,
                "explanation",
                "Verification could not be completed.",
            )


            # Keep the verifier's explanation unchanged.

            # This is important because the verifier already
            # explains whether the claim is supported or
            # contradicted.


            # ====================================================
            # STEP 7
            # NORMALIZE CONFIDENCE
            # ====================================================

            try:

                confidence = float(
                    getattr(
                        verification,
                        "confidence",
                        0.0,
                    )
                )

            except (
                TypeError,
                ValueError,
            ):

                confidence = 0.0


            confidence = max(
                0.0,
                min(
                    1.0,
                    confidence,
                ),
            )


            # ====================================================
            # STEP 8
            # HUMAN DECISION FLAG
            # ====================================================

            verifier_needs_human = getattr(
                verification,
                "needs_human_decision",
                final_status != "supported",
            )


            needs_human_decision = (
                bool(verifier_needs_human)
                or final_status != "supported"
            )


            # ====================================================
            # STEP 9
            # BUILD FRONTEND-COMPATIBLE ISSUE
            # ====================================================

            issues.append(
                Issue(
                    id=f"issue-{uuid.uuid4()}",
                    claim_id=claim.claim_id,

                    # NEW:
                    # Separate verification status
                    # from severity.
                    status=status,
                    severity=severity,

                    category="FACTUAL_CLAIM",
                    check_type="AI",

                    flagged_text=claim.claim_text,

                    passage_id=passage_id,

                    source_version=source_version,

                    cited_evidence=cited_evidence,

                    explanation=explanation,

                    suggested_fix=getattr(
                        verification,
                        "suggested_fix",
                        None,
                    ),

                    confidence=confidence,

                    needs_human_decision=(
                        needs_human_decision
                    ),

                    fact_id=None,
                )
            )


        # ====================================================
        # ANALYSIS COMPLETED
        # ====================================================

        logger.info(
            "Analysis completed. "
            "Extracted %s claims and generated "
            "%s total issues.",
            len(claims),
            len(issues),
        )


        # ====================================================
        # STEP 10
        # CREATE DRAFT + REVIEW IDs
        # ====================================================

        draft_id = (
            f"draft-{uuid.uuid4().hex[:12]}"
        )

        review_id = (
            f"review-{uuid.uuid4().hex[:12]}"
        )


        # ====================================================
        # STEP 11
        # MAP EXTRACTOR CLAIM IDs
        # TO DATABASE CLAIM IDs
        # ====================================================

        claim_id_map = {
            claim.claim_id: str(uuid.uuid4())
            for claim in claims
        }


        # ====================================================
        # STEP 12
        # PERSIST ANALYSIS TRANSACTIONALLY
        # ====================================================

        try:

            # ------------------------------------------------
            # CREATE DRAFT
            # ------------------------------------------------

            draft_record = Draft(
                id=draft_id,
                content=request.content,
                status="in_review",
            )


            # ------------------------------------------------
            # CREATE REVIEW
            # ------------------------------------------------

            review_record = Review(
                id=review_id,
                draft_id=draft_id,
                submitted_text=request.content,
                status="pending",
            )


            db.add(
                draft_record
            )

            db.add(
                review_record
            )


            # ------------------------------------------------
            # CREATE CLAIM RECORDS
            # ------------------------------------------------

            claim_records = []


            for extracted_claim in claims:

                database_claim_id = (
                    claim_id_map[
                        extracted_claim.claim_id
                    ]
                )


                claim_record = ClaimRecord(
                    id=database_claim_id,
                    review_id=review_id,
                    claim_text=(
                        extracted_claim.claim_text
                    ),
                    status="pending",
                    source_version=1,
                )


                claim_records.append(
                    claim_record
                )


            db.add_all(
                claim_records
            )


            # ====================================================
            # CREATE FINDING RECORDS
            # ====================================================

            finding_records = []


            for issue in issues:

                original_claim_id = (
                    issue.claim_id
                )


                database_claim_id = (
                    claim_id_map.get(
                        original_claim_id
                    )
                    if original_claim_id
                    else None
                )


                # ------------------------------------------------
                # Update API issue to database claim ID.
                # ------------------------------------------------

                issue.claim_id = (
                    database_claim_id
                )


                # ------------------------------------------------
                # Update corresponding claim status.
                # ------------------------------------------------

                if database_claim_id:

                    # IMPORTANT:
                    # Use issue.status, NOT severity.
                    #
                    # Previously:
                    #   SUPPORTED -> based on severity
                    #   HIGH      -> contradicted
                    #
                    # Now status is explicit.

                    claim_status = (
                        "supported"
                        if issue.status
                        == "SUPPORTED"
                        else "contradicted"
                        if issue.status
                        == "CONTRADICTED"
                        else "unverified"
                    )


                    matching_claim = next(
                        (
                            record
                            for record in claim_records
                            if record.id
                            == database_claim_id
                        ),
                        None,
                    )


                    if matching_claim:

                        matching_claim.status = (
                            claim_status
                        )


                # ------------------------------------------------
                # Store evidence information.
                # ------------------------------------------------

                evidence_data = [
                    {
                        "passage_id": issue.passage_id,

                        "source_version": (
                            issue.source_version
                        ),

                        "cited_evidence": (
                            issue.cited_evidence
                        ),
                    }
                ]


                # ------------------------------------------------
                # CREATE FINDING
                # ------------------------------------------------

                finding_records.append(
                    Finding(
                        id=issue.id,

                        review_id=review_id,

                        claim_id=database_claim_id,

                        finding_type=issue.category,

                        severity=issue.severity,

                        explanation=issue.explanation,

                        evidence=evidence_data,

                        suggested_edit=(
                            issue.suggested_fix
                        ),

                        confidence=issue.confidence,

                        verification_status=(
                            "supported"
                            if issue.status
                            == "SUPPORTED"
                            else "contradicted"
                            if issue.status
                            == "CONTRADICTED"
                            else "unverified"
                        ),
                    )
                )


            db.add_all(
                finding_records
            )


            # ------------------------------------------------
            # COMMIT
            # ------------------------------------------------

            db.commit()


            logger.info(
                "Persisted draft %s, review %s, "
                "%s claims and %s findings",
                draft_id,
                review_id,
                len(claim_records),
                len(finding_records),
            )


        except Exception:

            db.rollback()

            logger.exception(
                "Failed to persist draft analysis"
            )

            raise


        # ====================================================
        # STEP 13
        # RETURN API RESPONSE
        # ====================================================

        return AnalyzeResponse(
            draft_id=draft_id,
            content=request.content,
            status="in_review",
            issues=issues,
        )


    # ========================================================
    # CONFIGURATION ERROR
    # ========================================================

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


    # ========================================================
    # GENERAL ERROR
    # ========================================================

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
# DATABASE CHECK ENDPOINT
# ============================================================

@app.get("/api/db-check")
def database_check():

    try:

        with engine.connect() as connection:

            connection.execute(
                text("SELECT 1")
            )


        tables = inspect(
            engine
        ).get_table_names()


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


# Register remaining API routers
app.include_router(reviews_router)
app.include_router(findings_router)
app.include_router(audit_router)
