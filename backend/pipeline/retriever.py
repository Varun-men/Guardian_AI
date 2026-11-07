import math


def retrieve_evidence(claim_text, top_k=3, db=None):
    """
    Retrieve evidence for a claim.

    When a database session is supplied, use approved and current
    PostgreSQL source passages.

    Without a database session, preserve the legacy ChromaDB
    retrieval behavior for backward compatibility.
    """

    if db is None:
        try:
            from .evidence_store import search_evidence
        except ImportError:
            from evidence_store import search_evidence

        results = search_evidence(claim_text, top_k)

        evidence_list = []

        if not results or not results.get("documents"):
            return evidence_list

        documents = results["documents"][0]
        ids = results["ids"][0]
        metadatas = results["metadatas"][0]
        distances = results.get("distances", [[]])[0]

        for i, document in enumerate(documents):
            metadata = metadatas[i] or {}

            evidence_list.append({
                "passage_id": ids[i],
                "evidence_text": document,
                "source": metadata.get("source", "Unknown"),
                "source_version": metadata.get("version", "v1"),
                "distance": distances[i] if distances else None,
            })

        return evidence_list

    # Database-backed retrieval.
    from backend.db.models import Source, SourcePassage
    from backend.pipeline.embeddings import embed_query

    if top_k <= 0:
        return []

    # Only passages belonging to active, current source versions.
    base_query = (
        db.query(SourcePassage, Source)
        .join(Source, Source.id == SourcePassage.source_id)
        .filter(
            Source.status == "active",
            Source.version == SourcePassage.source_version,
        )
    )

    # Avoid calling the embedding API when no trusted sources exist.
    if not base_query.first():
        return []

    query_vector = embed_query(claim_text)

    if len(query_vector) != 768:
        raise ValueError("Query embedding must contain 768 dimensions.")

    dialect = db.get_bind().dialect.name

    if dialect == "postgresql":
        distance = SourcePassage.embedding.cosine_distance(
            query_vector
        ).label("distance")

        rows = (
            db.query(SourcePassage, Source, distance)
            .join(Source, Source.id == SourcePassage.source_id)
            .filter(
                Source.status == "active",
                Source.version == SourcePassage.source_version,
            )
            .order_by(distance.asc())
            .limit(top_k)
            .all()
        )

        return [
            {
                "passage_id": passage.id,
                "evidence_text": passage.content,
                "source": source.filename,
                "source_version": f"v{passage.source_version}",
                "source_version_number": passage.source_version,
                "page_number": passage.page_number,
                "distance": float(distance_value),
            }
            for passage, source, distance_value in rows
        ]

    # SQLite fallback: calculate cosine distance in Python.
    rows = base_query.all()

    def cosine_distance(vector_a, vector_b):
        if len(vector_a) != len(vector_b):
            return 1.0

        dot_product = sum(
            a * b for a, b in zip(vector_a, vector_b)
        )

        norm_a = math.sqrt(sum(a * a for a in vector_a))
        norm_b = math.sqrt(sum(b * b for b in vector_b))

        if norm_a == 0 or norm_b == 0:
            return 1.0

        return 1.0 - (dot_product / (norm_a * norm_b))

    ranked = []

    for passage, source in rows:
        distance_value = cosine_distance(
            query_vector,
            passage.embedding,
        )

        ranked.append((distance_value, passage, source))

    ranked.sort(key=lambda item: item[0])

    return [
        {
            "passage_id": passage.id,
            "evidence_text": passage.content,
            "source": source.filename,
            "source_version": f"v{passage.source_version}",
            "source_version_number": passage.source_version,
            "page_number": passage.page_number,
            "distance": distance_value,
        }
        for distance_value, passage, source in ranked[:top_k]
    ]


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
