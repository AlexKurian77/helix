"""
Centralized configuration — loads all settings from environment variables.
"""
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# --- API Keys ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PROTOCOLS_IO_TOKEN = os.getenv("PROTOCOLS_IO_TOKEN", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# --- Pinecone ---
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "experiment-protocols")
PINECONE_CLOUD = os.getenv("PINECONE_CLOUD", "aws")
PINECONE_REGION = os.getenv("PINECONE_REGION", "us-east-1")

# --- Supabase / PostgreSQL ---
DATABASE_URL = os.getenv("DATABASE_URL", "")

# --- Demo Mode ---
# When True, bypasses all external API calls and returns realistic mock data
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"

# --- Model Configs ---
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
EMBEDDING_MODEL = "multilingual-e5-large"
EMBEDDING_DIMENSION = 1024

# --- Retrieval ---
TOP_K = int(os.getenv("TOP_K", "5"))
OPENALEX_EMAIL = os.getenv("OPENALEX_EMAIL", "")

# --- CORS ---
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080").split(",")]

