"""
/generate endpoint — orchestrates the full RAG pipeline:
Query → Embedding → Retrieval → Literature QC → LLM Generation → Persist → Response

v2 — saves to both legacy tables AND new v2 tables (experiments + plan_versions + retrieval_trace).
"""
from fastapi import APIRouter
from models.schemas import GenerateRequest, GenerateResponse, ContextItem
from services.retrieval import retrieve_context
from services.literature_qc import perform_literature_qc
from services.generation import generate_experiment_plan
from services.database_service import (
    save_query, save_plan,
    save_experiment, save_plan_version, save_retrieval_trace,
)

router = APIRouter()


@router.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    """
    Generate a complete experiment plan from a scientific question.

    Pipeline:
    1. Save query to database (legacy + v2)
    2. Retrieve relevant protocols/papers from Pinecone + OpenAlex
    3. Save retrieval trace for explainability
    4. Perform Literature QC on retrieval results
    5. Generate structured experiment plan via LLM
    6. Save plan version with context snapshot
    7. Return structured JSON response
    """
    query = request.query

    # Step 1: Persist the query (legacy)
    query_id = save_query(query)

    # Step 1b: Create experiment (v2)
    experiment_id = save_experiment(query)

    # Step 2: Retrieve relevant context
    retrieved = retrieve_context(query)

    # Step 2b: Save retrieval trace (v2)
    if experiment_id:
        save_retrieval_trace(experiment_id, query, retrieved)

    # Step 3: Literature Quality Control
    lit_qc = perform_literature_qc(retrieved)

    # Step 4: Generate experiment plan via LLM
    result = generate_experiment_plan(query, retrieved)
    plan = result["experiment_plan"]

    # Step 5: Persist (legacy)
    plan_id = save_plan(
        query_id,
        plan.model_dump(),
        lit_qc.model_dump(),
    )

    # Step 5b: Persist plan version (v2)
    if experiment_id:
        save_plan_version(experiment_id, result, retrieved)

    # Step 6: Map retrieval results to context items
    context_items = []
    for item in retrieved:
        # Map past experiments to lab-profile source
        source = "literature"
        if item.get("type") == "past_experiment":
            source = "lab-profile"
            
        context_items.append(ContextItem(
            source=source,
            label=item.get("type", "source").replace("_", " "),
            value=item.get("title", "Unknown")
        ))
    
    # Add some demo lab/inferred context if in demo mode
    from config import DEMO_MODE
    if DEMO_MODE:
        context_items.append(ContextItem(source="lab-profile", label="Lab Focus", value="Autophagy & Protein Trafficking"))
        context_items.append(ContextItem(source="lab-profile", label="Lead PI", value="Dr. Aris Thorne"))
        context_items.append(ContextItem(source="inferred", label="Cell Line", value="HepG2 (Liver Hepatoma)"))
        context_items.append(ContextItem(source="user", label="Constraint", value="Budget < $2,000"))

    # Step 7: Return structured response with v2 fields
    return GenerateResponse(
        query=query,
        literature_qc=lit_qc,
        experiment_plan=plan,
        plan_id=plan_id,
        novelty_assessment=result.get("novelty_assessment"),
        risks=result.get("risks", []),
        assumptions=result.get("assumptions", []),
        feasibility=result.get("feasibility"),
        confidence=result.get("confidence"),
        context=context_items,
    )
