"""
Embedding service — uses Pinecone Inference API to convert text to vectors.
No separate embedding API key needed; uses the same Pinecone API key.
"""
import hashlib
import random
from pinecone import Pinecone
from config import PINECONE_API_KEY, EMBEDDING_MODEL, EMBEDDING_DIMENSION, DEMO_MODE

_pc = None


def _get_client() -> Pinecone:
    global _pc
    if _pc is None:
        _pc = Pinecone(api_key=PINECONE_API_KEY)
    return _pc


def get_embedding(text: str) -> list[float]:
    """Convert a single text string into a 1024-dim embedding vector."""
    if DEMO_MODE:
        return _mock_embedding(text)

    pc = _get_client()
    result = pc.inference.embed(
        model=EMBEDDING_MODEL,
        inputs=[text],
        parameters={"input_type": "query", "truncate": "END"}
    )
    return result[0].values


def get_embeddings_batch(texts: list[str], input_type: str = "passage") -> list[list[float]]:
    """Convert multiple texts to embeddings in a single batch call."""
    if DEMO_MODE:
        return [_mock_embedding(t) for t in texts]

    pc = _get_client()
    result = pc.inference.embed(
        model=EMBEDDING_MODEL,
        inputs=texts,
        parameters={"input_type": input_type, "truncate": "END"}
    )
    return [r.values for r in result]


def _mock_embedding(text: str) -> list[float]:
    """Generate a deterministic pseudo-random embedding for demo mode."""
    hash_val = int(hashlib.md5(text.encode()).hexdigest(), 16)
    rng = random.Random(hash_val)
    return [rng.uniform(-1, 1) for _ in range(EMBEDDING_DIMENSION)]
