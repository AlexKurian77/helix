"""
Database service — handles persistence to Supabase PostgreSQL.
v2 — saves to the new 9-table schema (experiments + plan_versions + retrieval_trace).
Also maintains backward compatibility with legacy tables.
Gracefully degrades if database is not configured.
"""
import json
import hashlib
from config import GROQ_MODEL
from models.database import (
    get_session,
    # Legacy
    QueryRecord, PlanRecord,
    # v2
    Experiment, ExperimentPlanVersion, RetrievalTrace,
)


# ---------------------------------------------------------------------------
# Legacy persistence (kept for backward compat)
# ---------------------------------------------------------------------------

def save_query(query_text: str) -> int | None:
    """Save a user query and return its ID. Returns None if DB is unavailable."""
    session = get_session()
    if session is None:
        return None
    try:
        record = QueryRecord(query_text=query_text)
        session.add(record)
        session.commit()
        session.refresh(record)
        return record.id
    except Exception as e:
        session.rollback()
        print(f"[DB] Error saving query: {e}")
        return None
    finally:
        session.close()


def save_plan(query_id: int | None, plan_json: dict, literature_qc_json: dict = None) -> int | None:
    """Save a generated experiment plan (legacy). Returns plan ID or None."""
    if query_id is None:
        return None
    session = get_session()
    if session is None:
        return None
    try:
        record = PlanRecord(
            query_id=query_id,
            plan_json=plan_json,
            literature_qc_json=literature_qc_json,
        )
        session.add(record)
        session.commit()
        session.refresh(record)
        return record.id
    except Exception as e:
        session.rollback()
        print(f"[DB] Error saving plan: {e}")
        return None
    finally:
        session.close()


# ---------------------------------------------------------------------------
# v2 persistence — experiments + plan versions + retrieval trace
# ---------------------------------------------------------------------------

def save_experiment(hypothesis: str, lab_id: str = None) -> str | None:
    """Create a new experiment record. Returns experiment UUID or None."""
    session = get_session()
    if session is None:
        return None
    try:
        experiment = Experiment(
            hypothesis=hypothesis,
            lab_id=lab_id,
            status="draft",
        )
        session.add(experiment)
        session.commit()
        session.refresh(experiment)
        return experiment.id
    except Exception as e:
        session.rollback()
        print(f"[DB] Error saving experiment: {e}")
        return None
    finally:
        session.close()


def save_plan_version(
    experiment_id: str,
    generation_result: dict,
    context: list[dict],
    version_number: int = 1,
) -> str | None:
    """
    Save a full experiment plan version with context snapshot.
    Returns plan version UUID or None.
    """
    session = get_session()
    if session is None:
        return None
    try:
        plan = generation_result["experiment_plan"]
        plan_dict = plan.model_dump() if hasattr(plan, "model_dump") else plan

        novelty = generation_result.get("novelty_assessment")
        confidence = generation_result.get("confidence")
        risks = generation_result.get("risks", [])
        assumptions = generation_result.get("assumptions", [])
        feasibility = generation_result.get("feasibility")

        # Build context snapshot for reproducibility
        context_snapshot = {
            "retrieved": context,
            "model": GROQ_MODEL,
        }
        context_hash = hashlib.sha256(
            json.dumps(context_snapshot, sort_keys=True, default=str).encode()
        ).hexdigest()[:16]

        version = ExperimentPlanVersion(
            experiment_id=experiment_id,
            version_number=version_number,
            novelty_label=novelty.label if novelty else None,
            novelty_justification=novelty.justification if novelty else None,
            protocol_steps=plan_dict.get("protocol"),
            materials=plan_dict.get("materials"),
            budget=plan_dict.get("budget"),
            timeline=plan_dict.get("timeline"),
            validation_methods=plan_dict.get("validation_method"),
            risks=[r.model_dump() if hasattr(r, "model_dump") else r for r in risks],
            assumptions=[a.model_dump() if hasattr(a, "model_dump") else a for a in assumptions],
            feasibility=feasibility.model_dump() if hasattr(feasibility, "model_dump") else feasibility,
            confidence=confidence.model_dump() if hasattr(confidence, "model_dump") else confidence,
            context_snapshot=context_snapshot,
            context_hash=context_hash,
            model_name=GROQ_MODEL,
        )
        session.add(version)
        session.commit()
        session.refresh(version)
        return version.id
    except Exception as e:
        session.rollback()
        print(f"[DB] Error saving plan version: {e}")
        return None
    finally:
        session.close()


def save_retrieval_trace(
    experiment_id: str,
    query_text: str,
    retrieved: list[dict],
) -> str | None:
    """Save the retrieval trace for explainability. Returns trace UUID or None."""
    session = get_session()
    if session is None:
        return None
    try:
        trace = RetrievalTrace(
            experiment_id=experiment_id,
            query_text=query_text,
            similarity_scores={
                r["id"]: r["score"] for r in retrieved
            },
            why_selected={
                r["id"]: {
                    "title": r["title"],
                    "type": r.get("type"),
                    "domain": r.get("domain"),
                    "score": r["score"],
                }
                for r in retrieved
            },
        )
        session.add(trace)
        session.commit()
        session.refresh(trace)
        return trace.id
    except Exception as e:
        session.rollback()
        print(f"[DB] Error saving retrieval trace: {e}")
        return None
    finally:
        session.close()


# ---------------------------------------------------------------------------
# History (reads from both legacy and v2 tables)
# ---------------------------------------------------------------------------

def get_history(limit: int = 20) -> list[dict]:
    """Retrieve recent queries and their plans."""
    session = get_session()
    if session is None:
        return []
    try:
        records = (
            session.query(QueryRecord)
            .order_by(QueryRecord.created_at.desc())
            .limit(limit)
            .all()
        )
        results = []
        for r in records:
            plans = [{"id": p.id, "plan": p.plan_json, "created_at": str(p.created_at)} for p in r.plans]
            results.append({
                "id": r.id,
                "query": r.query_text,
                "created_at": str(r.created_at),
                "plans": plans,
            })
        return results
    except Exception as e:
        print(f"[DB] Error fetching history: {e}")
        return []
    finally:
        session.close()


def search_past_experiments(query: str, limit: int = 5) -> list[dict]:
    """Search for similar past experiments using keyword matching."""
    session = get_session()
    if session is None:
        return []
    try:
        from models.database import Experiment
        # Simple keyword matching for MVP
        keywords = query.lower().split()
        
        # Naive keyword matching for local experiments
        experiments = session.query(Experiment).all()
        results = []
        for e in experiments:
            score = 0
            h = e.hypothesis.lower()
            for kw in keywords:
                if len(kw) > 3 and kw in h:
                    score += 0.2
            
            if score > 0:
                results.append({
                    "id": str(e.id),
                    "score": min(0.9, score),
                    "title": e.hypothesis,
                    "type": "past_experiment",
                    "domain": "laboratory",
                    "text": f"Status: {e.status}. Hypothesis: {e.hypothesis}",
                    "url": None
                })
        
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]
    except Exception as e:
        print(f"[DB] Error searching experiments: {e}")
        return []
    finally:
        session.close()
