from .claim_extractor import extract_claims
from .retriever import retrieve_evidence
from .verifier import verify_claim
from .citation_gate import verify_citation


def run_pipeline(content):
    """
    Run the complete Guardian AI pipeline.

    Flow:
    1. Extract claims
    2. Retrieve trusted evidence
    3. Verify claims against evidence
    4. Verify citations against the same evidence
    """

    final_results = []

    # ==================================================
    # STEP 1: CLAIM EXTRACTION
    # ==================================================

    print("\nSTEP 1: Extracting Claims...\n")

    claim_response = extract_claims(content)

    for claim in claim_response.claims:

        claim_id = claim.claim_id
        claim_text = claim.claim_text

        print(f"Claim: {claim_text}")

        # ==================================================
        # STEP 2: EVIDENCE RETRIEVAL
        # ==================================================

        print("\nRetrieving Evidence...\n")

        evidence = retrieve_evidence(
            claim_text,
            top_k=3
        )

        for item in evidence:
            print(
                f"  {item['passage_id']}: "
                f"{item['evidence_text']}"
            )

        # ==================================================
        # STEP 3: CLAIM VERIFICATION
        # ==================================================

        print("\nVerifying Claim...\n")

        verification = verify_claim(
            claim_id,
            claim_text,
            evidence=evidence
        )

        print(verification.model_dump())

        # ==================================================
        # STEP 4: CITATION GATE
        # ==================================================

        print("\nChecking Citation...\n")

        citation_result = None

        evidence_passage_ids = (
            verification.evidence_passage_ids
        )

        if evidence_passage_ids:

            # Use the first evidence passage selected
            # by the verifier.
            passage_id = evidence_passage_ids[0]

            matching_item = next(
                (
                    item
                    for item in evidence
                    if item["passage_id"] == passage_id
                ),
                None
            )

            if matching_item:

                citation_result = verify_citation(
                    passage_id=passage_id,
                    cited_quote=matching_item["evidence_text"],
                    evidence_items=evidence
                )

            else:

                citation_result = {
                    "valid": False,
                    "reason": (
                        "Verified evidence passage was not "
                        "found in retrieved evidence."
                    ),
                    "passage_id": passage_id
                }

        else:

            citation_result = {
                "valid": False,
                "reason": "No evidence passage was selected.",
                "passage_id": None
            }

        print(citation_result)

        # ==================================================
        # FINAL RESULT
        # ==================================================

        final_results.append(
            {
                "claim_id": claim_id,
                "claim_text": claim_text,
                "verification": verification.model_dump(),
                "citation": citation_result,
            }
        )

        print("\n" + "=" * 60)

    return final_results


# ==========================================================
# TEST
# ==========================================================

if __name__ == "__main__":

    test_content = """
    Meet Orbit, the planning app.

    Orbit is a productivity application designed for teams.

    Orbit subscription plans start at $29 per month.

    Orbit is currently used by 50,000 teams.
    """

    print("\n========== GUARDIAN AI PIPELINE ==========\n")

    results = run_pipeline(test_content)

    print("\n========== FINAL RESULTS ==========\n")

    for result in results:

        print(result)
        print("-" * 60)