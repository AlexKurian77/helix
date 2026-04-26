"""
FastAPI application entry point.
AI-Powered Scientific Experiment Planning System.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import DATABASE_URL, DEMO_MODE, ALLOWED_ORIGINS
from models.database import init_engine, create_tables
from routers import generate, history, simplify, lab, chat

# --- Initialize FastAPI ---
app = FastAPI(
    title="AI Experiment Planner",
    description="RAG-powered scientific experiment planning system",
    version="2.0.0",
)

# --- CORS (allow Next.js frontend) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Mount routers ---
app.include_router(generate.router, tags=["Generation"])
app.include_router(history.router, tags=["History"])
app.include_router(simplify.router, tags=["Simplify"])
app.include_router(lab.router, tags=["Lab State"])
app.include_router(chat.router, tags=["Lab Mentor Chat"])


# --- Startup event ---
@app.on_event("startup")
async def startup():
    mode = "DEMO" if DEMO_MODE else "LIVE"
    print(f"\n{'='*50}")
    print(f"  AI Experiment Planner — {mode} MODE")
    print(f"{'='*50}\n")

    if DATABASE_URL:
        try:
            init_engine(DATABASE_URL)
            create_tables()
            print("[DB] Connected to PostgreSQL and tables created.")
        except Exception as e:
            print(f"[DB] Warning: Could not connect to database: {e}")
    else:
        print("[DB] No DATABASE_URL configured — running without persistence.")


# --- Health check ---
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "mode": "demo" if DEMO_MODE else "live",
        "version": "1.0.0",
    }
