"""
/history endpoint — retrieves past queries and generated plans.
"""
from fastapi import APIRouter
from services.database_service import get_history

router = APIRouter()


@router.get("/history")
async def history(limit: int = 20):
    """Retrieve recent experiment planning history."""
    return {"history": get_history(limit=limit)}
