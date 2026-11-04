
try:
    from .claim_extractor import extract_claims
    from .retriever import retrieve_evidence
    from .verifier import verify_claim
    from .citation_gate import verify_citation
except ImportError:
    from claim_extractor import extract_claims
    from retriever import retrieve_evidence
    from verifier import verify_claim
    from citation_gate import verify_citation


def run_guardian_pipeline(content):

    print("\n========== GUARDIAN AI PIPELINE ==========\n")

    # 1. Extract claims
    print("STEP 1: Extracting Claims...\n")

    extracted = extract_claims(content)

    for claim in extracted.claims:
        print(claim.model_dump())

    # 2. Verify each claim
    print("\nSTEP 2: Verifying Claims...\n")

    for claim in extracted.claims:

        print("\nClaim:", claim.claim_text)

        verification = verify_claim(
            claim.claim_id,
            claim.claim_text
        )

        print("\nVerification:")
        print(verification.model_dump())

        # 3. Retrieve evidence for citation validation
        print("\nSTEP 3: Checking Citations...\n")

        evidence_list = retrieve_evidence(
            claim.claim_text,
            top_k=3
        )

        evidence_map = {
            item["passage_id"]: item
            for item in evidence_list
        }

        # 4. Validate cited passages
        for passage_id in verification.evidence_passage_ids:

            item = evidence_map.get(passage_id)

            if not item:
                print(f"Citation skipped: {passage_id} not retrieved")
                continue

            citation_result = verify_citation(
                passage_id,
                item["evidence_text"]
            )

            print("Citation Result:")
            print(citation_result)

        print("\n" + "=" * 55)


if __name__ == "__main__":

    sample_content = """
    Orbit is a productivity application designed for teams.
    Orbit subscription plans start at $29 per month.
    Orbit is currently used by 50,000 teams.
    """

    run_guardian_pipeline(sample_content)
