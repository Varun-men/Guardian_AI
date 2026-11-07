
import chromadb
from pathlib import Path

# Store database inside backend/data
BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "data" / "chroma_db"
DB_PATH.mkdir(parents=True, exist_ok=True)

# Initialize ChromaDB without loading an embedding model.
client = chromadb.PersistentClient(path=str(DB_PATH))

collection = client.get_or_create_collection(
    name="guardian_evidence",
    embedding_function=None,
)

# Load the heavy embedding model only when it is actually needed.
_embedding_function = None


def get_embedding_function():
    global _embedding_function

    if _embedding_function is None:
        from chromadb.utils.embedding_functions import (
            SentenceTransformerEmbeddingFunction,
        )

        _embedding_function = SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )

    return _embedding_function


def add_evidence(passage_id, text, source, version="v1"):
    """Store a trusted evidence passage."""

    embeddings = get_embedding_function()([text])

    collection.upsert(
        ids=[passage_id],
        embeddings=embeddings,
        documents=[text],
        metadatas=[{
            "source": source,
            "version": version,
        }],
    )

    print(f"Evidence stored: {passage_id}")


def search_evidence(query, top_k=3):
    """Search trusted evidence without loading a model for an empty store."""

    total_records = collection.count()

    if total_records == 0:
        return {
            "ids": [[]],
            "documents": [[]],
            "metadatas": [[]],
            "distances": [[]],
        }

    query_embeddings = get_embedding_function()([query])

    return collection.query(
        query_embeddings=query_embeddings,
        n_results=min(top_k, total_records),
    )


if __name__ == "__main__":
    print("Evidence collection count:", collection.count())

    # Sample data is deliberately not inserted automatically.
    print("Evidence store ready.")
