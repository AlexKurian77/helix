"""
/lab endpoint — serves Lab State data (inventory, researchers, experiments).
Replaces hardcoded data in the frontend.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from models.database import get_session, InventoryItem, Researcher, Experiment, Lab, User
from core.security import get_current_user
from fastapi import Depends
from models.schemas import GenerateResponse

router = APIRouter(prefix="/lab")

# --- Pydantic Models ---

class EquipmentResponse(BaseModel):
    name: str
    category: str
    available: bool
    location: str

class ResearcherResponse(BaseModel):
    id: str
    name: str
    title: Optional[str]
    expertise: List[str]
    pastWork: Optional[str]
    availability: str
    hoursThisWeek: int

class ExperimentResponse(BaseModel):
    id: str
    title: str
    status: str
    date: str

# --- Endpoints ---

@router.get("/inventory", response_model=List[EquipmentResponse])
async def get_inventory(current_user: User = Depends(get_current_user)):
    """Fetch all equipment from the lab's inventory."""
    session = get_session()
    if not session:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        lab = session.query(Lab).filter(Lab.user_id == current_user.id).first()
        if not lab: return []
        items = session.query(InventoryItem).filter(InventoryItem.lab_id == lab.id).all()
        return [
            EquipmentResponse(
                name=i.item_name,
                category=i.category or "general",
                available=(i.availability_status == "in_stock"),
                location="Main Lab" # Simplified
            )
            for i in items
        ]
    finally:
        session.close()


@router.get("/researchers", response_model=List[ResearcherResponse])
async def get_researchers(current_user: User = Depends(get_current_user)):
    """Fetch all researchers in the lab."""
    session = get_session()
    if not session:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        lab = session.query(Lab).filter(Lab.user_id == current_user.id).first()
        if not lab: return []
        researchers = session.query(Researcher).filter(Researcher.lab_id == lab.id).all()
        return [
            ResearcherResponse(
                id=str(r.id),
                name=r.name,
                title=r.title,
                expertise=r.expertise,
                pastWork=r.past_work,
                availability=r.availability,
                hoursThisWeek=r.hours_this_week
            )
            for r in researchers
        ]
    finally:
        session.close()


@router.get("/experiments", response_model=List[ExperimentResponse])
async def get_experiments(current_user: User = Depends(get_current_user)):
    """Fetch past experiments."""
    session = get_session()
    if not session:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        from models.database import Experiment
        lab = session.query(Lab).filter(Lab.user_id == current_user.id).first()
        if not lab: return []
        experiments = session.query(Experiment).filter(Experiment.lab_id == lab.id).order_by(Experiment.created_at.desc()).all()
        return [
            ExperimentResponse(
                id=str(e.id),
                title=e.hypothesis,
                status=e.status,
                date=e.created_at.strftime("%Y-%m-%d") if e.created_at else "Unknown"
            )
            for e in experiments
        ]
    finally:
        session.close()


@router.delete("/experiments/{experiment_id}")
async def delete_experiment(experiment_id: str, current_user: User = Depends(get_current_user)):
    """Delete an experiment and all related data from the lab history."""
    session = get_session()
    if not session:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        from models.database import ExperimentPlanVersion, RetrievalTrace, PlanPatch, Experiment, Lab
        
        lab = session.query(Lab).filter(Lab.user_id == current_user.id).first()
        if not lab: raise HTTPException(status_code=403, detail="Unauthorized")
        
        experiment = session.query(Experiment).filter(Experiment.id == experiment_id, Experiment.lab_id == lab.id).first()
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")
        
        # Manually delete related data to ensure clean removal
        session.query(ExperimentPlanVersion).filter(ExperimentPlanVersion.experiment_id == experiment_id).delete()
        session.query(RetrievalTrace).filter(RetrievalTrace.experiment_id == experiment_id).delete()
        session.query(PlanPatch).filter(PlanPatch.experiment_id == experiment_id).delete()
        
        # Delete the main experiment record
        session.delete(experiment)
        session.commit()
        
        return {"status": "success", "message": f"Experiment {experiment_id} and related data deleted"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@router.get("/experiments/{experiment_id}/plan", response_model=GenerateResponse)
async def get_experiment_plan(experiment_id: str, current_user: User = Depends(get_current_user)):
    """Fetch the full plan/report for a specific experiment. Generates it if not present."""
    session = get_session()
    if not session:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        from models.database import Experiment, ExperimentPlanVersion, Lab
        from services.retrieval import retrieve_context
        from services.literature_qc import perform_literature_qc
        from services.generation import generate_experiment_plan
        from services.database_service import save_plan_version, save_retrieval_trace
        from models.schemas import GenerateResponse, LiteratureQC, Reference
        import json

        lab = session.query(Lab).filter(Lab.user_id == current_user.id).first()
        if not lab:
            raise HTTPException(status_code=403, detail="Unauthorized")
            
        experiment = session.query(Experiment).filter(
            Experiment.id == experiment_id,
            Experiment.lab_id == lab.id
        ).first()
        
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")
            
        # Check if version exists
        version = session.query(ExperimentPlanVersion).filter(
            ExperimentPlanVersion.experiment_id == experiment_id
        ).order_by(ExperimentPlanVersion.version_number.desc()).first()
        
        # If no version exists, generate it dynamically
        if not version:
            query = experiment.hypothesis
            retrieved = retrieve_context(query, exclude_id=experiment.id, lab_id=str(lab.id))
            save_retrieval_trace(experiment.id, query, retrieved)
            result = generate_experiment_plan(query, retrieved)
            save_plan_version(experiment.id, result, retrieved)
            
            # Retrieve the newly saved version
            version = session.query(ExperimentPlanVersion).filter(
                ExperimentPlanVersion.experiment_id == experiment_id
            ).first()
            
            if not version:
                raise HTTPException(status_code=500, detail="Failed to generate plan version")
        
        # Reconstruct literature QC from context snapshot or create dummy
        retrieved_items = version.context_snapshot.get("retrieved", []) if version.context_snapshot else []
        references = []
        for r in retrieved_items:
            references.append(
                Reference(
                    title=r.get("title", "Reference"),
                    domain=r.get("domain", "literature"),
                    relevance_score=r.get("score", 0.8),
                    type=r.get("type", "paper"),
                    snippet=r.get("text", "")[:200],
                    url=r.get("url")
                )
            )
            
        lit_qc = LiteratureQC(
            status="similar_work_exists" if references else "not_found",
            message="Retrieved grounded literature from laboratory history.",
            references=references
        )
        
        # Reconstruct ContextItems
        from models.schemas import ContextItem
        context_items = []
        for r in retrieved_items:
            source = "literature"
            if r.get("type") == "past_experiment":
                source = "lab-profile"
            context_items.append(
                ContextItem(
                    source=source,
                    label=r.get("type", "source").replace("_", " "),
                    value=r.get("title", "Unknown")
                )
            )
            
        # Reconstruct ExperimentPlan
        from models.schemas import ExperimentPlan, ProtocolStep, MaterialItem, BudgetItem, TimelinePhase, Citation
        
        total_budget = sum(float(b.get("cost", 0)) for b in (version.budget or []))
        
        # Map DB structures to schema objects
        protocol = [ProtocolStep(**s) for s in (version.protocol_steps or [])]
        materials = [MaterialItem(**m) for m in (version.materials or [])]
        budget = [BudgetItem(**b) for b in (version.budget or [])]
        timeline = [TimelinePhase(**t) for t in (version.timeline or [])]
        
        plan_details = ExperimentPlan(
            title=experiment.hypothesis,
            objective=f"Evaluate the hypothesis: {experiment.hypothesis}",
            protocol=protocol,
            materials=materials,
            budget=budget,
            total_budget=total_budget,
            timeline=timeline,
            total_duration="4 weeks", # Fallback
            validation_method=version.validation_methods or "Compare outcomes to historical runs.",
            citations=[]
        )
        
        # Reconstruct Novelty, Risks, Assumptions, Feasibility, Confidence
        from models.schemas import NoveltyAssessment, Risk, Assumption, FeasibilityResult, ConfidenceScore
        
        novelty = NoveltyAssessment(
            label=version.novelty_label or "similar",
            justification=version.novelty_justification or "Plan is reconstructed from past experiments.",
            references=[]
        )
        
        risks = [Risk(**r) for r in (version.risks or [])]
        assumptions = [Assumption(**a) for a in (version.assumptions or [])]
        
        feasibility = None
        if version.feasibility:
            feasibility = FeasibilityResult(**version.feasibility)
            
        confidence = None
        if version.confidence:
            confidence = ConfidenceScore(**version.confidence)
            
        return GenerateResponse(
            query=experiment.hypothesis,
            literature_qc=lit_qc,
            experiment_plan=plan_details,
            plan_id=None,
            answer="Successfully loaded the full experiment report from memory.",
            novelty_assessment=novelty,
            risks=risks,
            assumptions=assumptions,
            feasibility=feasibility,
            confidence=confidence,
            context=context_items
        )
    except Exception as e:
        import traceback
        print(f"[Lab Plan] Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()

