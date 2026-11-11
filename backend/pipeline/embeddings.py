
import math
import os
from typing import Sequence

from google import genai
from google.genai import types


# ---------------------------------------
# CONFIGURATION
# ---------------------------------------

EMBEDDING_MODEL = "gemini-embedding-2"
EMBEDDING_DIMENSIONS = 768

DEFAULT_BATCH_SIZE = 16

_client = None


# ---------------------------------------
# GEMINI CLIENT
# ---------------------------------------

def get_gemini_client():
    """
    Lazily initialize the Gemini client.

    The API key must be available in GEMINI_API_KEY.
    """

    global _client

    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY environment variable is not configured."
            )

        _client = genai.Client(api_key=api_key)

    return _client


# ---------------------------------------
# INPUT FORMATTING
# ---------------------------------------

def format_document(text: str, title: str | None = None) -> str:
    """
    Format a trusted source passage for fact-checking retrieval.
    """

    if not isinstance(text, str) or not text.strip():
        raise ValueError("Document text cannot be empty.")

    clean_title = (title or "none").strip()

    return f"title: {clean_title} | text: {text.strip()}"


def format_query(claim: str) -> str:
    """
    Format a claim for fact-checking retrieval.
    """

    if not isinstance(claim, str) or not claim.strip():
        raise ValueError("Claim cannot be empty.")

    return f"task: fact checking | query: {claim.strip()}"


# ---------------------------------------
# CORE EMBEDDING FUNCTION
# ---------------------------------------

def _embed_formatted_texts(
    texts: Sequence[str],
    batch_size: int = DEFAULT_BATCH_SIZE,
) -> list[list[float]]:
    """
    Generate separate 768-dimensional embeddings.

    Each input is wrapped in its own Content object because
    Gemini Embedding 2 otherwise aggregates multiple inputs
    into a single embedding.
    """

    if batch_size < 1:
        raise ValueError("batch_size must be at least 1.")

    if not texts:
        return []

    client = get_gemini_client()
    all_embeddings = []

    for start in range(0, len(texts), batch_size):
        batch = texts[start:start + batch_size]

        contents = [
            types.Content(
                parts=[
                    types.Part.from_text(text=text)
                ]
            )
            for text in batch
        ]

        response = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=contents,
            config=types.EmbedContentConfig(
                output_dimensionality=EMBEDDING_DIMENSIONS
            ),
        )

        returned_embeddings = response.embeddings or []

        if len(returned_embeddings) != len(batch):
            raise RuntimeError(
                "Gemini returned an unexpected number of embeddings."
            )

        for item in returned_embeddings:
            if item.values is None:
                raise RuntimeError(
                    "Gemini returned an empty embedding."
                )

            vector = [float(value) for value in item.values]

            if len(vector) != EMBEDDING_DIMENSIONS:
                raise RuntimeError(
                    f"Expected {EMBEDDING_DIMENSIONS} dimensions, "
                    f"received {len(vector)}."
                )

            if not all(math.isfinite(value) for value in vector):
                raise RuntimeError(
                    "Embedding contains non-finite values."
                )

            all_embeddings.append(vector)

    return all_embeddings


# ---------------------------------------
# DOCUMENT EMBEDDINGS
# ---------------------------------------

def embed_documents(
    texts: Sequence[str],
    titles: Sequence[str | None] | None = None,
    batch_size: int = DEFAULT_BATCH_SIZE,
) -> list[list[float]]:
    """
    Embed source passages.

    Returns one vector per input passage.
    """

    if titles is None:
        titles = [None] * len(texts)

    if len(titles) != len(texts):
        raise ValueError(
            "The number of titles must match the number of documents."
        )

    formatted = [
        format_document(text, title)
        for text, title in zip(texts, titles)
    ]

    return _embed_formatted_texts(
        formatted,
        batch_size=batch_size,
    )


# ---------------------------------------
# CLAIM / QUERY EMBEDDINGS
# ---------------------------------------

def embed_queries(
    claims: Sequence[str],
    batch_size: int = DEFAULT_BATCH_SIZE,
) -> list[list[float]]:
    """
    Embed claims for evidence retrieval.

    Returns one vector per claim.
    """

    formatted = [
        format_query(claim)
        for claim in claims
    ]

    return _embed_formatted_texts(
        formatted,
        batch_size=batch_size,
    )


def embed_query(claim: str) -> list[float]:
    """
    Convenience function for embedding one claim.
    """

    return embed_queries([claim])[0]
