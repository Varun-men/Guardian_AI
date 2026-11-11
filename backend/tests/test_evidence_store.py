from backend.pipeline import evidence_store


def test_empty_collection_search_does_not_load_embedding_model(monkeypatch):
    class EmptyCollection:
        def count(self):
            return 0

    monkeypatch.setattr(
        evidence_store,
        "collection",
        EmptyCollection(),
    )

    def unexpected_model_load():
        raise AssertionError(
            "Embedding model should not load for an empty collection"
        )

    monkeypatch.setattr(
        evidence_store,
        "get_embedding_function",
        unexpected_model_load,
    )

    result = evidence_store.search_evidence("test claim")

    assert result["ids"] == [[]]
    assert result["documents"] == [[]]
    assert result["metadatas"] == [[]]
    assert result["distances"] == [[]]
