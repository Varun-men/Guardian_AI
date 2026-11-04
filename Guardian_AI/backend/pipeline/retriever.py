
try:
    # When imported as a package
    from .evidence_store import search_evidence
except ImportError:
    # When executed directly
    from evidence_store import search_evidence


def retrieve_evidence(claim_text, top_k=3):
    """
    Retrieve relevant evidence for an extracted claim.
    """

    results = search_evidence(claim_text, top_k)

    evidence_list = []

    if not results or not results.get("documents"):
        return evidence_list

    documents = results["documents"][0]
    ids = results["ids"][0]
    metadatas = results["metadatas"][0]
    distances = results.get("distances", [[]])[0]

    for i, document in enumerate(documents):
        evidence_list.append({
            "passage_id": ids[i],
            "evidence_text": document,
            "source": metadatas[i].get("source", "Unknown"),
            "source_version": metadatas[i].get("version", "v1"),
            "distance": distances[i] if distances else None
        })

    return evidence_list


if __name__ == "__main__":

    test_claim = "Orbit subscription plans start at $29."

    print("\nClaim:", test_claim)
    print("\nRetrieved Evidence:\n")

    evidence = retrieve_evidence(test_claim)

    for item in evidence:
        print("Passage ID:", item["passage_id"])
        print("Evidence:", item["evidence_text"])
        print("Source:", item["source"])
        print("Version:", item["source_version"])
        print("Distance:", item["distance"])
        print("-" * 50)
