import logging
import os
import uuid
from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import inspect, text

from backend.api.facts import router as facts_router
from backend.auth.routes import router as auth_router
from backend.db.database import engine
from backend.rules.integration import run_rule_checks


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


# Register routers
app.include_router(auth_router)
app.include_router(facts_router)


# ============================================================
# CORS configuration for Next.js frontend
# ============================================================

# Configure production frontend origins using a comma-separated
# FRONTEND_ORIGINS environment variable.
DEFAULT_FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

configured_origins = os.getenv("FRONTEND_ORIGINS", "")

frontend_origins = (
    [origin.strip().rstrip("/") for origin in configured_origins.split(",") if origin.strip()]
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
# Request schema
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

@app.post(
    "/api/review/analyze",
    response_model=AnalyzeResponse,
)
def analyze_draft(request: AnalyzeRequest):

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

        # ----------------------------------------------------
        # STEP 1.5: Run deterministic brand and pricing checks
        # ----------------------------------------------------

        rule_result = run_rule_checks(
        content=request.content,
        images=[
            image.model_dump()
            for image in request.images
        ]
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
        # STEP 2: Verify each extracted claim
        # ----------------------------------------------------

        for claim in extraction.claims:

            try:
                verification = verify_claim(
                    claim.claim_id,
                    claim.claim_text,
                )

            except Exception:

                logger.exception(
                    "Verification failed for claim %s",
                    claim.claim_id,
                )

                # Keep the claim for manual review if
                # verification fails.
                issues.append(
                    Issue(
                        id=f"issue-{claim.claim_id}",
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
            # STEP 3: Retrieve evidence
            # ------------------------------------------------

            evidence_items = retrieve_evidence(
                claim.claim_text,
                top_k=3,
            )

            evidence_by_id = {
                item["passage_id"]: item
                for item in evidence_items
            }

            # ------------------------------------------------
            # STEP 4: Validate returned passage IDs
            # ------------------------------------------------

            verified_evidence = []

            for passage_id in (
                verification.evidence_passage_ids or []
            ):

                item = evidence_by_id.get(passage_id)

                if not item:
                    continue

                citation_result = verify_citation(
                    passage_id,
                    item["evidence_text"],
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

            final_status = verification.status

            # Do not mark a claim supported or contradicted
            # unless its evidence passes citation validation.
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
            # Evidence information
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
            # Explanation
            # ------------------------------------------------

            explanation = verification.explanation

            if not citation:
                explanation += (
                    " No citation passed the exact-match "
                    "verification gate."
                )

            # ------------------------------------------------
            # Confidence
            # ------------------------------------------------

            confidence = max(
                0.0,
                min(
                    1.0,
                    float(verification.confidence),
                ),
            )

            # ------------------------------------------------
            # STEP 5: Build frontend-compatible AI issue
            # ------------------------------------------------

            issues.append(
                Issue(
                    id=f"issue-{claim.claim_id}",
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
            len(extraction.claims),
            len(issues),
        )

        # ----------------------------------------------------
        # STEP 6: Return response
        # ----------------------------------------------------

        return AnalyzeResponse(
            draft_id=f"draft-{uuid.uuid4().hex[:12]}",
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
        logger.exception("Database connectivity check failed")

        raise HTTPException(
            status_code=503,
            detail="Database connection check failed.",
        )