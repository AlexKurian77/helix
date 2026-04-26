"""
Seed Pinecone with realistic scientific protocols and research summaries.
Run: python scripts/seed_pinecone.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pinecone import Pinecone, ServerlessSpec
from config import PINECONE_API_KEY, PINECONE_INDEX_NAME, PINECONE_CLOUD, PINECONE_REGION, EMBEDDING_DIMENSION
from services.embeddings import get_embeddings_batch
from services.retrieval import DEMO_PROTOCOLS


def seed():
    print("[Seed] Connecting to Pinecone...")
    pc = Pinecone(api_key=PINECONE_API_KEY)

    # Create index if it doesn't exist
    existing = [idx.name for idx in pc.list_indexes()]
    if PINECONE_INDEX_NAME not in existing:
        print(f"[Seed] Creating index '{PINECONE_INDEX_NAME}' (dim={EMBEDDING_DIMENSION})...")
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=EMBEDDING_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud=PINECONE_CLOUD, region=PINECONE_REGION),
        )
        print("[Seed] Index created. Waiting for it to be ready...")
    else:
        print(f"[Seed] Index '{PINECONE_INDEX_NAME}' already exists.")

    index = pc.Index(PINECONE_INDEX_NAME)

    # Generate embeddings for all protocols
    texts = [p["text"] for p in DEMO_PROTOCOLS]
    print(f"[Seed] Generating embeddings for {len(texts)} documents...")
    embeddings = get_embeddings_batch(texts, input_type="passage")

    # Upsert vectors with metadata
    vectors = []
    for proto, emb in zip(DEMO_PROTOCOLS, embeddings):
        vectors.append({
            "id": proto["id"],
            "values": emb,
            "metadata": {
                "title": proto["title"],
                "type": proto["type"],
                "domain": proto["domain"],
                "text": proto["text"],
            }
        })

    # Upsert in batches of 10
    batch_size = 10
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch)
        print(f"[Seed] Upserted batch {i // batch_size + 1}")

    print(f"[Seed] Done! {len(vectors)} vectors upserted to '{PINECONE_INDEX_NAME}'.")
    stats = index.describe_index_stats()
    print(f"[Seed] Index stats: {stats}")


if __name__ == "__main__":
    seed()
