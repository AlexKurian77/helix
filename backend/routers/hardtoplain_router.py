from fastapi import APIRouter
from pydantic import BaseModel, Field
from hardtoplain import refine_scientific_hypothesis

router = APIRouter()

class RefineRequest(BaseModel):
    hypothesis: str = Field(..., min_length=5, description="Initial simple hypothesis")

class RefineResponse(BaseModel):
    original: str
    refined: str
    context_protocol: str = None

@router.post("/refine", response_model=RefineResponse)
async def refine_hypothesis(request: RefineRequest):
    """
    Directly uses the core logic from the root hardtoplain.py script.
    """
    result = refine_scientific_hypothesis(request.hypothesis)
    
    return RefineResponse(
        original=request.hypothesis,
        refined=result["refined"],
        context_protocol=result["context_protocol"]
    )
