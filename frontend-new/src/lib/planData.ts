// Interfaces mapped to the Python backend models (schemas.py)
// v2 — includes novelty, risks, feasibility, and confidence from the LLM.

export interface Reference {
  title: string;
  domain: string;
  relevance_score: number;
  type: string;
  snippet: string;
  url: string | null;
}

export interface LiteratureQC {
  status: "not_found" | "similar_work_exists" | "exact_match";
  message: string;
  references: Reference[];
}

export interface ProtocolStep {
  step_number: number;
  title: string;
  description: string;
  duration: string;
  notes: string | null;
}

export interface MaterialItem {
  name: string;
  quantity: string;
  unit: string;
  estimated_cost: number;
}

export interface BudgetItem {
  category: string;
  item: string;
  cost: number;
}

export interface TimelinePhase {
  phase: string;
  duration: string;
  description: string;
}

export interface Citation {
  title: string;
  url: string | null;
}

export interface ExperimentPlan {
  title: string;
  objective: string;
  protocol: ProtocolStep[];
  materials: MaterialItem[];
  budget: BudgetItem[];
  total_budget: number;
  timeline: TimelinePhase[];
  total_duration: string;
  validation_method: string;
  citations: Citation[];
}

// --- v2: Novelty Assessment ---
export interface NoveltyAssessment {
  label: "exact" | "similar" | "new";
  justification: string;
  references: string[];
}

// --- v2: Risks ---
export interface Risk {
  id: string;
  severity: "critical" | "moderate" | "low";
  title: string;
  detail: string;
  mitigation: string;
}

// --- v2: Assumptions ---
export interface Assumption {
  text: string;
  confidence: "high" | "medium" | "low";
}

// --- v2: Feasibility ---
export interface FeasibilityResult {
  inventory_gaps: string[];
  recommended_substitutions: string[];
  constraint_violations: string[];
}

// --- v2: Confidence ---
export interface ConfidenceFactor {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  detail: string;
}

export interface ConfidenceScore {
  score: number;
  factors: ConfidenceFactor[];
}

// --- Issue (derived from risks for the Issues component) ---
export interface Issue {
  id: string;
  severity: "critical" | "moderate" | "suggestion";
  affects: string[];
  title: string;
  detail: string;
  fix: string;
}

// --- Context Item (v2 fusion layers) ---
export interface ContextItem {
  source: "lab-profile" | "literature" | "inferred" | "user" | string;
  label: string;
  value: string;
}

// --- Plan: full API response ---
export interface Plan {
  query: string;
  literature_qc: LiteratureQC;
  experiment_plan: ExperimentPlan;
  plan_id?: number | null;

  // v2 fields — natively from the backend
  novelty_assessment?: NoveltyAssessment | null;
  risks?: Risk[];
  assumptions?: Assumption[];
  feasibility?: FeasibilityResult | null;
  confidence?: ConfidenceScore | null;
  context: ContextItem[];

  // UI-derived fields (computed on the frontend)
  issues?: Issue[];
}
