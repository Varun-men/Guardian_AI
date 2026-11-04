
import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path

# Store database inside backend/data
BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "data" / "chroma_db"

DB_PATH.mkdir(parents=True, exist_ok=True)

# Initialize ChromaDB
client = chromadb.PersistentClient(path=str(DB_PATH))

# Initialize embedding model
embedding_function = (
    embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
)

# Create or access collection
collection = client.get_or_create_collection(
    name="guardian_evidence",
    embedding_function=embedding_function
)


def add_evidence(passage_id, text, source, version="v1"):
    """Store a passage of trusted evidence."""

    collection.upsert(
        ids=[passage_id],
        documents=[text],
        metadatas=[{
            "source": source,
            "version": version
        }]
    )

    print(f"Evidence stored: {passage_id}")


def search_evidence(query, top_k=3):
    """Find relevant evidence using semantic search."""

    results = collection.query(
        query_texts=[query],
        n_results=top_k
    )

    return results

if __name__ == "__main__":

    # Sample trusted evidence
    add_evidence(
        "passage_1",
        "Orbit is a productivity application designed for teams.",
        "Product Documentation"
    )

    add_evidence(
        "passage_2",
        "Orbit subscription plans start at $29 per month.",
        "Pricing Documentation"
    )

    add_evidence(
        "passage_3",
        "Orbit is currently used by 50,000 teams.",
        "Company Report"
    )

    print("\nPassages updated successfully!")

    # Test semantic search
    print("\nSearching Evidence...\n")

    results = search_evidence(
        "What is the starting price of Orbit?"
    )

    for i, document in enumerate(results["documents"][0]):
        print(f"Result {i + 1}: {document}")
        print(f"Metadata: {results['metadatas'][0][i]}")
        print()

