"""
/lab endpoint — serves Lab State data (inventory, researchers, experiments).
Replaces hardcoded data in the frontend.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from models.database import get_session, InventoryItem, Researcher, Experiment

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
async def get_inventory():
    """Fetch all equipment from the lab's inventory."""
    session = get_session()
    if not session:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        items = session.query(InventoryItem).all()
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
async def get_researchers():
    """Fetch all researchers in the lab."""
    session = get_session()
    if not session:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        researchers = session.query(Researcher).all()
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
async def get_experiments():
    """Fetch past experiments."""
    session = get_session()
    if not session:
        raise HTTPException(status_code=500, detail="Database unavailable")
    
    try:
        experiments = session.query(Experiment).order_by(Experiment.created_at.desc()).all()
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
