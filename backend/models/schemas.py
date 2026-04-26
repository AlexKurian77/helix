"""
Pydantic models for API request/response validation.
Defines the structured format for experiment plans.

v2 — aligned with plan.md Context Bundle + databaseplan.md output contract.
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# --- Request ---
class GenerateRequest(BaseModel):
    query: str = Field(..., min_length=10, description="Scientific question or research goal")


# --- Literature QC (kept for backward compat) ---
class LiteratureStatus(str, Enum):
    NOT_FOUND = "not_found"
    SIMILAR_WORK_EXISTS = "similar_work_exists"
    EXACT_MATCH = "exact_match"


class Reference(BaseModel):
    title: str
    domain: str
    relevance_score: float
    type: str  # "protocol" or "paper"
    snippet: str
    url: Optional[str] = None


class LiteratureQC(BaseModel):
    status: LiteratureStatus
    message: str
    references: list[Reference]


# --- Experiment Plan Components ---
class ProtocolStep(BaseModel):
    step_number: int
    title: str
    description: str
    duration: str
    notes: Optional[str] = None


class MaterialItem(BaseModel):
    name: str
    quantity: str
    unit: str
    estimated_cost: float


class BudgetItem(BaseModel):
    category: str
    item: str
    cost: float


class TimelinePhase(BaseModel):
    phase: str
    duration: str
    description: Optional[str] = None


class Citation(BaseModel):
    title: str
    url: Optional[str] = None


# --- v2: Novelty Assessment ---
class NoveltyAssessment(BaseModel):
    label: str = Field(..., description="exact | similar | new")
    justification: str
    references: list[str] = []


# --- v2: Risk / Assumption ---
class Risk(BaseModel):
    id: str
    severity: str = Field(..., description="critical | moderate | low")
    title: str
    detail: str
    mitigation: str


class Assumption(BaseModel):
    text: str
    confidence: str = Field(default="medium", description="high | medium | low")


# --- v2: Feasibility ---
class FeasibilityResult(BaseModel):
    inventory_gaps: list[str] = []
    recommended_substitutions: list[str] = []
    constraint_violations: list[str] = []


# --- v2: Confidence ---
class ConfidenceFactor(BaseModel):
    factor: str
    impact: str = Field(..., description="positive | negative | neutral")
    detail: str


class ConfidenceScore(BaseModel):
    score: int = Field(..., ge=0, le=100)
    factors: list[ConfidenceFactor] = []


# --- v2: Context Item ---
class ContextItem(BaseModel):
    source: str = Field(..., description="lab-profile | literature | inferred | user")
    label: str
    value: str


# --- Core Experiment Plan ---
class ExperimentPlan(BaseModel):
    title: str
    objective: str
    protocol: list[ProtocolStep]
    materials: list[MaterialItem]
    budget: list[BudgetItem]
    total_budget: float
    timeline: list[TimelinePhase]
    total_duration: str
    validation_method: str
    citations: list[Citation] = []


# --- Full Generate Response (v2) ---
class GenerateResponse(BaseModel):
    query: str
    literature_qc: LiteratureQC
    experiment_plan: ExperimentPlan
    plan_id: Optional[int] = None

    # v2 fields — natively returned by the LLM
    answer: Optional[str] = None
    novelty_assessment: Optional[NoveltyAssessment] = None
    risks: list[Risk] = []
    assumptions: list[Assumption] = []
    feasibility: Optional[FeasibilityResult] = None
    confidence: Optional[ConfidenceScore] = None
    context: list[ContextItem] = []
