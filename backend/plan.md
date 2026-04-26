Your feedback is accurate, and I’m applying it directly by tightening the design around the context pipeline instead of expanding infrastructure scope. I’ll give you the focused v2 blueprint now: minimal schema, context bundle contract, retrieval rules, and the exact prompt structure.Your critique is correct. The main risk was drifting from pipeline quality toward platform completeness.

Here is the tightened v2 that I would ship.

**Verdict**
1. Keep the strong core.
2. Trim non-essential relational depth.
3. Make context shaping a first-class component.
4. Prioritize explainability and replayability over breadth.

**Focused Schema (Hackathon-Winning)**
1. `labs`
2. `papers` + embedding
3. `protocol_templates` + embedding
4. `experiments` (summary + outcome fields)
5. `experiment_plan_versions` (with context snapshot)
6. `inventory`
7. `retrieval_trace`

Drop for now:
1. explicit experiment-paper link tables
2. supplier normalization
3. researcher assignment modeling
4. full multi-tenant/RLS implementation

**Critical Addition: Context Bundle Contract**
Use this as the only LLM-facing payload.

```json
{
  "hypothesis": {
    "text": "string",
    "domain": "string",
    "target": "string",
    "method_hint": "string|null",
    "outcome_metric": "string|null"
  },
  "lab_constraints": {
    "budget_limit": 0,
    "preferred_methods": [],
    "restricted_methods": [],
    "equipment": []
  },
  "retrieved": {
    "protocol_templates": [
      {
        "id": "uuid",
        "name": "string",
        "method": "string",
        "domain": "string",
        "why_selected": "string",
        "score": 0.0
      }
    ],
    "papers": [
      {
        "id": "uuid",
        "title": "string",
        "method_signals": [],
        "finding_summary": "string",
        "why_selected": "string",
        "score": 0.0
      }
    ],
    "similar_experiments": [
      {
        "id": "uuid",
        "hypothesis_summary": "string",
        "what_worked": "string",
        "what_failed": "string",
        "score": 0.0
      }
    ]
  },
  "inventory_summary": {
    "available": [],
    "missing": [],
    "substitutions": []
  }
}
```

**Top-k Retrieval Rules (Deterministic + Explainable)**
1. Parse hypothesis into domain, target, method_hint, outcome_metric.
2. Candidate pull:
- Protocol templates: top 20 vector matches.
- Papers: top 30 vector matches.
- Similar experiments: top 15 vector matches.
3. Hard filter:
- Domain match required.
- Method compatible with lab restrictions.
- Remove papers with weak method relevance.
4. Re-rank score:
- 50% semantic similarity
- 25% method match
- 15% lab feasibility
- 10% recency/evidence quality
5. Final bundle:
- Protocols: top 3
- Papers: top 3
- Similar experiments: top 2
6. Log everything in `retrieval_trace` with reasons.

**Generation Prompt Shape (Exact)**
Use a strict two-part prompt.

```text
SYSTEM:
You are a scientific planning assistant. Generate only executable, lab-feasible plans.
Do not use restricted methods. Keep output valid JSON matching schema exactly.

USER:
[ContextBundle JSON pasted verbatim]

TASK:
1) Assess novelty (exact/similar/new) from retrieved papers.
2) Generate experiment plan with protocol, materials, cost, timeline, validation, risks.
3) Include feasibility notes for inventory gaps and substitutions.
4) Return strict JSON only.
```

Expected output schema:

```json
{
  "novelty_assessment": {
    "label": "exact|similar|new",
    "justification": "string",
    "references": ["paper_id"]
  },
  "plan": {
    "protocol_steps": [],
    "materials": [{"name": "string", "qty": "string", "estimated_cost": 0}],
    "budget": {"subtotal": 0, "contingency_pct": 0, "total": 0},
    "timeline": [{"phase": "string", "duration_days": 0, "depends_on": []}],
    "validation_methods": [],
    "risks": [],
    "assumptions": []
  },
  "feasibility": {
    "inventory_gaps": [],
    "recommended_substitutions": [],
    "constraint_violations": []
  },
  "confidence": {
    "score": 0.0,
    "uncertainty_flags": []
  }
}
```

**Replayability Upgrade (Important)**
In `experiment_plan_versions`, store:
1. `prompt_hash`
2. `model_name`
3. `generation_config`
4. `input_context_snapshot` (full context bundle JSON)

This gives exact reproducibility in demos.

**What I think**
1. Your feedback is on point and strategically correct.
2. The winning move is now clear: context bundle quality + strict output contract + deterministic post-validation.
3. This version is stronger than the original plan for a judged demo.

If you want, next I can produce the exact SQL DDL for this trimmed v2 schema in migration order.