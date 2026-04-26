# 🧠 GROUND RULES (before schema)

We are optimizing for:

* ✅ fast to build
* ✅ easy to query
* ✅ works with RAG
* ✅ demo-friendly

NOT:

* perfect normalization
* enterprise scaling

---

# ⚡ FINAL TABLE SET (LOCKED)

We’re building 9 tables:

```
labs
inventory
papers (vector)
protocol_templates (vector)
experiments
experiment_plan_versions
validation_results
retrieval_trace
plan_patches
```

---

# 🧩 1. LABS (core context)

```sql
CREATE TABLE labs (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,

    budget_limit NUMERIC(12,2),

    preferred_methods TEXT[],
    restricted_methods TEXT[],

    equipment TEXT[],
    capabilities TEXT[],

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

👉 Keep arrays. Don’t over-normalize. You’ll regret it mid-hackathon.

---

# 🧩 2. INVENTORY

```sql
CREATE TABLE inventory (
    id UUID PRIMARY KEY,
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,

    item_name TEXT NOT NULL,
    category TEXT,

    quantity NUMERIC,
    unit TEXT,

    availability_status TEXT CHECK (
        availability_status IN ('in_stock','low_stock','out_of_stock')
    ),

    estimated_unit_cost NUMERIC(12,2),

    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

👉 Keep it simple. This is for **feasibility signals**, not warehouse management.

---

# 🧩 3. PAPERS (VECTOR RAG)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE papers (
    id UUID PRIMARY KEY,
    title TEXT,
    abstract TEXT,

    domain TEXT,
    methods TEXT[],

    findings_summary TEXT,

    source_url TEXT,
    doi TEXT UNIQUE,

    embedding VECTOR(1536),

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 🔍 Index (IMPORTANT)

```sql
CREATE INDEX papers_embedding_idx
ON papers
USING ivfflat (embedding vector_cosine_ops);
```

---

# 🧩 4. PROTOCOL TEMPLATES (GROUNDING)

```sql
CREATE TABLE protocol_templates (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,

    domain TEXT,
    primary_method TEXT,

    steps JSONB,
    materials_template JSONB,

    typical_timeline_days INT,
    validation_methods TEXT[],

    embedding VECTOR(1536),

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 🧩 5. EXPERIMENTS (top-level entity)

```sql
CREATE TABLE experiments (
    id UUID PRIMARY KEY,
    lab_id UUID REFERENCES labs(id),

    hypothesis TEXT NOT NULL,

    status TEXT CHECK (
        status IN ('draft','planned','revised','approved','completed')
    ) DEFAULT 'draft',

    current_plan_version INT DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 🧩 6. EXPERIMENT PLAN VERSIONS (YOUR MVP CORE)

```sql
CREATE TABLE experiment_plan_versions (
    id UUID PRIMARY KEY,
    experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,

    version_number INT,

    novelty_label TEXT CHECK (
        novelty_label IN ('exact','similar','new')
    ),

    novelty_justification TEXT,

    protocol_steps JSONB,
    materials JSONB,

    budget JSONB,
    timeline JSONB,

    validation_methods JSONB,

    risks JSONB,
    assumptions JSONB,

    feasibility JSONB,

    confidence JSONB,

    context_snapshot JSONB,   -- 🔥 critical
    context_hash TEXT,        -- 🔥 optimization

    model_name TEXT,
    prompt_hash TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 🧩 7. VALIDATION RESULTS

```sql
CREATE TABLE validation_results (
    id UUID PRIMARY KEY,
    plan_version_id UUID REFERENCES experiment_plan_versions(id),

    budget_check_passed BOOLEAN,
    inventory_check_passed BOOLEAN,
    restriction_check_passed BOOLEAN,
    timeline_check_passed BOOLEAN,

    violations JSONB,
    adjustments JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 🧩 8. RETRIEVAL TRACE (THIS WINS TRUST)

```sql
CREATE TABLE retrieval_trace (
    id UUID PRIMARY KEY,

    experiment_id UUID REFERENCES experiments(id),

    query_text TEXT,

    retrieved_paper_ids UUID[],
    retrieved_protocol_ids UUID[],

    similarity_scores JSONB,

    why_selected JSONB,  -- 🔥 explainability

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 🧩 9. PLAN PATCHES (REFINEMENT ENGINE)

```sql
CREATE TABLE plan_patches (
    id UUID PRIMARY KEY,

    experiment_id UUID REFERENCES experiments(id),

    source_version INT,
    target_version INT,

    user_instruction TEXT,

    patch_type TEXT CHECK (
        patch_type IN (
            'reduce_cost',
            'shorten_timeline',
            'add_control',
            'improve_safety',
            'other'
        )
    ),

    changed_sections TEXT[],
    diff JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 🧠 RELATIONSHIP MAP (understand this properly)

```text
labs
 └── experiments
       └── experiment_plan_versions
             └── validation_results

experiments
 └── retrieval_trace
 └── plan_patches

labs
 └── inventory

RAG:
papers + protocol_templates (independent)
```

---

# ⚡ CRITICAL DESIGN DECISIONS (don’t overlook)

## 1. JSONB is your best friend

Why:

* flexible
* fast enough
* LLM-friendly

---

## 2. Versioning > overwriting

You NEVER overwrite plans.

👉 Always create new version.

---

## 3. Context snapshot = reproducibility

This lets you say:

> “This plan was generated using THIS context”

That’s huge.

---

## 4. Vector tables are isolated

No joins with them.

👉 Query → retrieve → inject

---

# ⚠️ WHAT YOU SHOULD NOT DO

* ❌ normalize materials into 5 tables
* ❌ create separate “steps” table
* ❌ over-index everything
* ❌ try to model chemistry perfectly

You’re not building PubChem 😭

---

# 🔥 WHAT THIS ENABLES (important for pitch)

With THIS schema, you can:

* generate plans
* validate against real constraints
* refine plans iteratively
* show traceability

👉 That’s EXACTLY what the brief wants 

---

# ⚡ NEXT MOVE (don’t drift now)

Now that DB is locked, you need to pick:

### 👉 “rag implementation”

(I’ll give exact queries + embedding strategy)

### 👉 “generation prompt”

(exact structured LLM prompts)

### 👉 “validation engine”

(how to compute feasibility properly)

---

Don’t sit on this.
Momentum dies fast in hackathons.
