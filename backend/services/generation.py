"""
LLM generation service — uses Groq API to generate structured experiment plans.

v2 — uses the Context Bundle contract from plan.md.
The LLM now natively returns novelty, risks, feasibility, and confidence.
"""
import json
from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL, DEMO_MODE
from models.schemas import (
    ExperimentPlan, NoveltyAssessment, Risk, Assumption,
    FeasibilityResult, ConfidenceScore, ConfidenceFactor,
)

_client = None

def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


# ---------------------------------------------------------------------------
# v2 System prompt — strict two-part prompt from plan.md
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are an experiment design expert. Return ONLY valid JSON.
Schema: {"answer": "str (conversational answer to user's question or refinement request)", "novelty_assessment":{"label":"exact|similar|new","justification":"str","references":["str"]},"plan":{"title":"str","objective":"str","protocol":[{"step_number":1,"title":"str","description":"str","duration":"str","notes":"str|null"}],"materials":[{"name":"str","quantity":"str","unit":"str","estimated_cost":0}],"budget":[{"category":"str","item":"str","cost":0}],"total_budget":0,"timeline":[{"phase":"str","duration":"str","description":"str"}],"total_duration":"str","validation_method":"str","citations":[{"title":"str"}]},"risks":[{"id":"r1","severity":"critical|moderate|low","title":"str","detail":"str","mitigation":"str"}],"assumptions":[{"text":"str","confidence":"high|medium|low"}],"feasibility":{"inventory_gaps":["str"],"recommended_substitutions":["str"],"constraint_violations":["str"]},"confidence":{"score":0,"factors":[{"factor":"str","impact":"positive|negative|neutral","detail":"str"}]}}
Rules: Use retrieved context as foundation. Include realistic quantities/costs in USD. Include 2-3 risks. Confidence 0-100 reflects literature support and rigor. No markdown."""


# ---------------------------------------------------------------------------
# v2 generation — returns a richer result dict
# ---------------------------------------------------------------------------

def generate_experiment_plan(query: str, context: list[dict]) -> dict:
    """
    Generate a structured experiment plan using Groq LLM.
    Returns a dict with: plan, novelty_assessment, risks, assumptions, feasibility, confidence
    """
    if DEMO_MODE:
        return _generate_demo_plan(query, context)

    # Build context string — limit to 5 items, truncate text to 300 chars each
    context_text = "\n".join([
        f"[{i+1}] {c['type'].upper()}: {c['title']}\n{c['text'][:300]}"
        for i, c in enumerate(context[:5])
    ])

    user_prompt = f"""SCIENTIFIC QUESTION: {query}

RETRIEVED CONTEXT (use as foundation):
{context_text}

TASK:
1) Assess novelty (exact/similar/new) from retrieved papers and protocols.
2) Generate a complete experiment plan with protocol, materials, cost, timeline, validation.
3) Identify risks and assumptions.
4) Assess feasibility — note any inventory gaps or substitutions.
5) Provide an honest confidence score (0-100) with supporting factors.
6) Provide a direct answer to the user's question or explain your reasoning in the 'answer' field.
7) Return strict JSON only matching the required schema."""

    client = _get_client()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
        max_tokens=4096,
    )

    raw = json.loads(response.choices[0].message.content)

    # Extract plan section
    plan_data = raw.get("plan", raw)

    # Sanitize timeline and protocol for Pydantic validation
    if "timeline" in plan_data:
        for item in plan_data["timeline"]:
            if "description" not in item:
                item["description"] = f"Planned duration: {item.get('duration', 'N/A')}"
    
    if "protocol" in plan_data:
        for item in plan_data["protocol"]:
            if "description" not in item:
                item["description"] = "Execute as per standard laboratory SOP."

    # Map citations back to URLs from context
    final_citations = []
    raw_citations = plan_data.get("citations", [])
    if not raw_citations:
        for c in context[:3]:
            final_citations.append({"title": c["title"], "url": c.get("url")})
    else:
        for cite in raw_citations:
            title = cite.get("title") if isinstance(cite, dict) else str(cite)
            source_url = None
            for c in context:
                if title.lower() in c["title"].lower() or c["title"].lower() in title.lower():
                    source_url = c.get("url")
                    break
            final_citations.append({"title": title, "url": source_url})
    plan_data["citations"] = final_citations

    experiment_plan = ExperimentPlan(**plan_data)

    # Extract v2 fields
    novelty = None
    if "novelty_assessment" in raw:
        try:
            novelty = NoveltyAssessment(**raw["novelty_assessment"])
        except Exception:
            novelty = None

    risks = []
    for i, r in enumerate(raw.get("risks", [])):
        try:
            if "id" not in r:
                r["id"] = f"r{i+1}"
            risks.append(Risk(**r))
        except Exception:
            pass

    assumptions = []
    for a in raw.get("assumptions", []):
        try:
            if isinstance(a, str):
                assumptions.append(Assumption(text=a))
            else:
                assumptions.append(Assumption(**a))
        except Exception:
            pass

    feasibility = None
    if "feasibility" in raw:
        try:
            feasibility = FeasibilityResult(**raw["feasibility"])
        except Exception:
            feasibility = None

    confidence = None
    if "confidence" in raw:
        try:
            conf_raw = raw["confidence"]
            score = int(conf_raw.get("score", 75))
            factors = []
            for f in conf_raw.get("factors", conf_raw.get("uncertainty_flags", [])):
                if isinstance(f, dict):
                    factors.append(ConfidenceFactor(**f))
                elif isinstance(f, str):
                    factors.append(ConfidenceFactor(factor=f, impact="neutral", detail=f))
            confidence = ConfidenceScore(score=score, factors=factors)
        except Exception:
            confidence = None

    answer = raw.get("answer", "Plan updated successfully.")

    return {
        "answer": answer,
        "experiment_plan": experiment_plan,
        "novelty_assessment": novelty,
        "risks": risks,
        "assumptions": assumptions,
        "feasibility": feasibility,
        "confidence": confidence,
    }


# ---------------------------------------------------------------------------
# Demo plan — realistic fallback when DEMO_MODE=true
# ---------------------------------------------------------------------------

def _generate_demo_plan(query: str, context: list[dict]) -> dict:
    """Return a realistic demo experiment plan based on query keywords."""
    q = query.lower()

    if "protein" in q or "western" in q:
        title = "Quantitative Analysis of Target Protein Expression via Western Blot"
        objective = ("To detect and quantify the expression levels of the target protein in "
                     "treated vs. untreated cell lysates using optimized Western blot analysis, "
                     "providing insight into the molecular response to experimental conditions.")
    elif "crispr" in q or "knockout" in q or "gene edit" in q:
        title = "CRISPR-Cas9 Mediated Gene Knockout and Functional Validation"
        objective = ("To achieve targeted gene disruption using CRISPR-Cas9 in mammalian cells, "
                     "validate knockout efficiency at genomic and protein levels, and characterize "
                     "the phenotypic consequences of gene loss.")
    elif "bacteria" in q or "antibiotic" in q or "resistance" in q:
        title = "Characterization of Antibiotic Resistance Profiles in Bacterial Isolates"
        objective = ("To systematically evaluate antibiotic susceptibility patterns in clinical "
                     "bacterial isolates, identify resistance mechanisms through molecular analysis, "
                     "and assess the efficacy of combination therapy approaches.")
    elif "cancer" in q or "tumor" in q:
        title = "Multi-Modal Cancer Biomarker Discovery and Validation Study"
        objective = ("To identify and validate novel protein biomarkers for early cancer detection "
                     "using proteomic analysis of patient-derived samples, with the goal of developing "
                     "a clinically applicable diagnostic panel.")
    elif "cell" in q and ("viability" in q or "drug" in q or "toxic" in q):
        title = "In Vitro Drug Cytotoxicity and Cell Viability Assessment"
        objective = ("To evaluate the dose-dependent cytotoxic effects of candidate compounds on "
                     "target cell lines using MTT viability assays, determine IC50 values, and "
                     "characterize the mechanism of cell death.")
    else:
        title = f"Experimental Investigation: {query[:80]}"
        objective = (f"To systematically investigate the research question through a rigorous "
                     f"experimental approach combining established protocols with targeted analysis, "
                     f"generating reproducible and statistically significant results.")

    experiment_plan = ExperimentPlan(
        title=title,
        objective=objective,
        protocol=[
            {"step_number": 1, "title": "Sample Preparation",
             "description": "Prepare biological samples according to standard laboratory protocols. Ensure all reagents are at correct temperature and pH. Label all tubes and plates systematically.",
             "duration": "2-3 hours", "notes": "Work on ice when handling proteins or RNA."},
            {"step_number": 2, "title": "Primary Experimental Procedure",
             "description": "Execute the core experimental protocol as adapted from retrieved references. Follow manufacturer guidelines for all commercial kits. Include appropriate positive and negative controls in triplicate.",
             "duration": "4-6 hours", "notes": "Record all deviations from the standard protocol."},
            {"step_number": 3, "title": "Incubation and Processing",
             "description": "Allow reactions to proceed under controlled conditions (37°C, 5% CO2 for cell-based assays; specific temperatures for biochemical reactions). Monitor progress at defined time points.",
             "duration": "Overnight to 72 hours", "notes": "Check samples at 12h and 24h intervals."},
            {"step_number": 4, "title": "Data Collection and Measurement",
             "description": "Collect quantitative measurements using appropriate instrumentation (plate reader, microscope, qPCR machine, or gel documentation system). Capture raw data in standardized formats.",
             "duration": "2-4 hours", "notes": "Calibrate instruments before use."},
            {"step_number": 5, "title": "Analysis and Validation",
             "description": "Perform statistical analysis on collected data. Calculate means, standard deviations, and p-values. Validate key findings with orthogonal methods. Prepare figures and tables.",
             "duration": "1-2 days", "notes": "Use GraphPad Prism or R for statistical analysis."},
        ],
        materials=[
            {"name": "Cell culture media (DMEM + 10% FBS)", "quantity": "500", "unit": "mL", "estimated_cost": 45.00},
            {"name": "Primary antibody", "quantity": "100", "unit": "µL", "estimated_cost": 350.00},
            {"name": "Secondary antibody (HRP-conjugated)", "quantity": "200", "unit": "µL", "estimated_cost": 180.00},
            {"name": "Reagent kit (assay-specific)", "quantity": "1", "unit": "kit", "estimated_cost": 275.00},
            {"name": "Consumables (plates, tips, tubes)", "quantity": "1", "unit": "set", "estimated_cost": 120.00},
            {"name": "Chemical reagents (buffers, substrates)", "quantity": "1", "unit": "set", "estimated_cost": 95.00},
        ],
        budget=[
            {"category": "Reagents", "item": "Antibodies and detection kits", "cost": 805.00},
            {"category": "Consumables", "item": "Plasticware and disposables", "cost": 120.00},
            {"category": "Cell Culture", "item": "Media, serum, supplements", "cost": 95.00},
            {"category": "Equipment Usage", "item": "Instrument time and maintenance", "cost": 150.00},
            {"category": "Miscellaneous", "item": "PPE, waste disposal, shipping", "cost": 80.00},
        ],
        total_budget=1250.00,
        timeline=[
            {"phase": "Phase 1: Preparation", "duration": "3-5 days", "description": "Order reagents, prepare solutions, culture cells, optimize conditions."},
            {"phase": "Phase 2: Experimentation", "duration": "1-2 weeks", "description": "Execute core experiments with biological replicates (n≥3)."},
            {"phase": "Phase 3: Analysis", "duration": "3-5 days", "description": "Process data, perform statistical analysis, validate key results."},
            {"phase": "Phase 4: Reporting", "duration": "2-3 days", "description": "Compile results, generate figures, prepare documentation."},
        ],
        total_duration="3-4 weeks",
        validation_method=(
            "Success will be measured through multiple criteria: (1) Technical validation — "
            "reproducibility across ≥3 biological replicates with coefficient of variation <15%; "
            "(2) Statistical significance — key comparisons must achieve p<0.05 using appropriate "
            "tests (Student's t-test or ANOVA with post-hoc correction); (3) Positive controls must "
            "produce expected results within ±10% of published values; (4) Negative controls must show "
            "baseline/background levels only; (5) Results should be consistent with an orthogonal "
            "validation method (e.g., if measuring protein by Western blot, confirm with ELISA or "
            "mass spectrometry for key samples)."
        ),
    )

    # Demo v2 fields
    answer = "This is a demo answer resolving your request successfully."
    novelty = NoveltyAssessment(
        label="similar",
        justification="Similar protocols exist in the literature but no exact match for this specific hypothesis was found.",
        references=["proto-001", "paper-001"]
    )

    risks = [
        Risk(id="r1", severity="moderate", title="Reagent Batch Variability",
             detail="Antibody lot-to-lot variation may affect reproducibility.",
             mitigation="Include positive controls and validate each new lot before use."),
        Risk(id="r2", severity="low", title="Timeline Slippage",
             detail="Cell culture contamination could delay experiments by 1-2 weeks.",
             mitigation="Maintain strict aseptic technique and keep backup cultures."),
        Risk(id="r3", severity="critical", title="Insufficient Statistical Power",
             detail="Small sample sizes may lead to inconclusive results.",
             mitigation="Plan for n≥3 biological replicates per condition from the start."),
    ]

    assumptions = [
        Assumption(text="Cell lines are mycoplasma-free and at appropriate passage number.", confidence="high"),
        Assumption(text="Core facility instruments are available and calibrated.", confidence="medium"),
        Assumption(text="Budget covers all reagent costs at current market prices.", confidence="medium"),
    ]

    feasibility = FeasibilityResult(
        inventory_gaps=["Primary antibody may need to be ordered (2-3 week lead time)."],
        recommended_substitutions=["If HRP-conjugated secondary is unavailable, use fluorescent secondary with appropriate imaging system."],
        constraint_violations=[]
    )

    confidence = ConfidenceScore(
        score=82,
        factors=[
            ConfidenceFactor(factor="Literature Support", impact="positive", detail="Strong consensus across recent papers supports this experimental approach."),
            ConfidenceFactor(factor="Protocol Maturity", impact="positive", detail="Core protocol is well-established with multiple published optimizations."),
            ConfidenceFactor(factor="Resource Availability", impact="neutral", detail="Standard equipment available, but one reagent may require ordering."),
            ConfidenceFactor(factor="Timeline Risk", impact="negative", detail="Cell culture steps introduce variability that could extend the timeline."),
        ]
    )

    return {
        "answer": answer,
        "experiment_plan": experiment_plan,
        "novelty_assessment": novelty,
        "risks": risks,
        "assumptions": assumptions,
        "feasibility": feasibility,
        "confidence": confidence,
    }
