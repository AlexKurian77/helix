"""
SQLAlchemy models for PostgreSQL (Supabase) persistence.
v2 — 9-table schema from databaseplan.md.

Tables:
  1. labs              — lab context (budget, equipment, restrictions)
  2. inventory         — reagent/equipment availability
  3. papers            — research papers (metadata only, vectors in Pinecone)
  4. protocol_templates — protocol templates (metadata only, vectors in Pinecone)
  5. experiments       — top-level entity per hypothesis
  6. experiment_plan_versions — versioned plans with context snapshots
  7. validation_results — budget/inventory/timeline checks
  8. retrieval_trace   — explainability log
  9. plan_patches      — refinement diffs
"""
import uuid
from sqlalchemy import (
    create_engine, Column, Integer, Text, DateTime, Float, Boolean,
    ForeignKey, Numeric, CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime, timezone

Base = declarative_base()


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# 1. LABS
# ---------------------------------------------------------------------------
class Lab(Base):
    __tablename__ = "labs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    name = Column(Text, nullable=False)
    domain = Column(Text, nullable=False)
    budget_limit = Column(Numeric(12, 2), nullable=True)
    preferred_methods = Column(ARRAY(Text), default=[])
    restricted_methods = Column(ARRAY(Text), default=[])
    equipment = Column(ARRAY(Text), default=[])
    capabilities = Column(ARRAY(Text), default=[])
    created_at = Column(DateTime, default=_now)

    # relationships
    inventory = relationship("InventoryItem", back_populates="lab")
    experiments = relationship("Experiment", back_populates="lab")
    researchers = relationship("Researcher", back_populates="lab")


# ---------------------------------------------------------------------------
# 2. INVENTORY
# ---------------------------------------------------------------------------
class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    lab_id = Column(UUID(as_uuid=False), ForeignKey("labs.id", ondelete="CASCADE"))
    item_name = Column(Text, nullable=False)
    category = Column(Text, nullable=True)
    quantity = Column(Numeric, nullable=True)
    unit = Column(Text, nullable=True)
    availability_status = Column(Text, nullable=True)  # in_stock, low_stock, out_of_stock
    estimated_unit_cost = Column(Numeric(12, 2), nullable=True)
    updated_at = Column(DateTime, default=_now)

    lab = relationship("Lab", back_populates="inventory")


# ---------------------------------------------------------------------------
# 3. RESEARCHERS
# ---------------------------------------------------------------------------
class Researcher(Base):
    __tablename__ = "researchers"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    lab_id = Column(UUID(as_uuid=False), ForeignKey("labs.id", ondelete="CASCADE"), nullable=True)
    name = Column(Text, nullable=False)
    title = Column(Text, nullable=True)
    expertise = Column(ARRAY(Text), default=[])
    past_work = Column(Text, nullable=True)
    availability = Column(Text, default="available")  # available, busy, limited
    hours_this_week = Column(Integer, default=40)
    created_at = Column(DateTime, default=_now)

    lab = relationship("Lab", back_populates="researchers")


# ---------------------------------------------------------------------------
# 4. PAPERS (metadata — vectors stored in Pinecone)
# ---------------------------------------------------------------------------
class Paper(Base):
    __tablename__ = "papers"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    title = Column(Text, nullable=True)
    abstract = Column(Text, nullable=True)
    domain = Column(Text, nullable=True)
    methods = Column(ARRAY(Text), default=[])
    findings_summary = Column(Text, nullable=True)
    source_url = Column(Text, nullable=True)
    doi = Column(Text, unique=True, nullable=True)
    created_at = Column(DateTime, default=_now)


# ---------------------------------------------------------------------------
# 4. PROTOCOL TEMPLATES (metadata — vectors stored in Pinecone)
# ---------------------------------------------------------------------------
class ProtocolTemplate(Base):
    __tablename__ = "protocol_templates"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    name = Column(Text, nullable=False)
    domain = Column(Text, nullable=True)
    primary_method = Column(Text, nullable=True)
    steps = Column(JSONB, nullable=True)
    materials_template = Column(JSONB, nullable=True)
    typical_timeline_days = Column(Integer, nullable=True)
    validation_methods = Column(ARRAY(Text), default=[])
    created_at = Column(DateTime, default=_now)


# ---------------------------------------------------------------------------
# 5. EXPERIMENTS (top-level entity)
# ---------------------------------------------------------------------------
class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    lab_id = Column(UUID(as_uuid=False), ForeignKey("labs.id"), nullable=True)
    hypothesis = Column(Text, nullable=False)
    status = Column(Text, default="draft")  # draft, planned, revised, approved, completed
    current_plan_version = Column(Integer, default=1)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now)

    lab = relationship("Lab", back_populates="experiments")
    plan_versions = relationship("ExperimentPlanVersion", back_populates="experiment")
    retrieval_traces = relationship("RetrievalTrace", back_populates="experiment")
    patches = relationship("PlanPatch", back_populates="experiment")


# ---------------------------------------------------------------------------
# 6. EXPERIMENT PLAN VERSIONS (MVP CORE)
# ---------------------------------------------------------------------------
class ExperimentPlanVersion(Base):
    __tablename__ = "experiment_plan_versions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    experiment_id = Column(UUID(as_uuid=False), ForeignKey("experiments.id", ondelete="CASCADE"))
    version_number = Column(Integer, default=1)

    novelty_label = Column(Text, nullable=True)  # exact, similar, new
    novelty_justification = Column(Text, nullable=True)

    protocol_steps = Column(JSONB, nullable=True)
    materials = Column(JSONB, nullable=True)
    budget = Column(JSONB, nullable=True)
    timeline = Column(JSONB, nullable=True)
    validation_methods = Column(JSONB, nullable=True)
    risks = Column(JSONB, nullable=True)
    assumptions = Column(JSONB, nullable=True)
    feasibility = Column(JSONB, nullable=True)
    confidence = Column(JSONB, nullable=True)

    # Context snapshot — critical for reproducibility
    context_snapshot = Column(JSONB, nullable=True)
    context_hash = Column(Text, nullable=True)

    model_name = Column(Text, nullable=True)
    prompt_hash = Column(Text, nullable=True)

    created_at = Column(DateTime, default=_now)

    experiment = relationship("Experiment", back_populates="plan_versions")
    validation_results = relationship("ValidationResult", back_populates="plan_version")


# ---------------------------------------------------------------------------
# 7. VALIDATION RESULTS
# ---------------------------------------------------------------------------
class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    plan_version_id = Column(UUID(as_uuid=False), ForeignKey("experiment_plan_versions.id"))

    budget_check_passed = Column(Boolean, nullable=True)
    inventory_check_passed = Column(Boolean, nullable=True)
    restriction_check_passed = Column(Boolean, nullable=True)
    timeline_check_passed = Column(Boolean, nullable=True)
    violations = Column(JSONB, nullable=True)
    adjustments = Column(JSONB, nullable=True)

    created_at = Column(DateTime, default=_now)

    plan_version = relationship("ExperimentPlanVersion", back_populates="validation_results")


# ---------------------------------------------------------------------------
# 8. RETRIEVAL TRACE (explainability)
# ---------------------------------------------------------------------------
class RetrievalTrace(Base):
    __tablename__ = "retrieval_trace"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    experiment_id = Column(UUID(as_uuid=False), ForeignKey("experiments.id"))

    query_text = Column(Text, nullable=True)
    retrieved_paper_ids = Column(ARRAY(UUID(as_uuid=False)), nullable=True)
    retrieved_protocol_ids = Column(ARRAY(UUID(as_uuid=False)), nullable=True)
    similarity_scores = Column(JSONB, nullable=True)
    why_selected = Column(JSONB, nullable=True)

    created_at = Column(DateTime, default=_now)

    experiment = relationship("Experiment", back_populates="retrieval_traces")


# ---------------------------------------------------------------------------
# 9. PLAN PATCHES (refinement engine)
# ---------------------------------------------------------------------------
class PlanPatch(Base):
    __tablename__ = "plan_patches"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    experiment_id = Column(UUID(as_uuid=False), ForeignKey("experiments.id"))

    source_version = Column(Integer, nullable=True)
    target_version = Column(Integer, nullable=True)
    user_instruction = Column(Text, nullable=True)
    patch_type = Column(Text, nullable=True)  # reduce_cost, shorten_timeline, add_control, improve_safety, other
    changed_sections = Column(ARRAY(Text), nullable=True)
    diff = Column(JSONB, nullable=True)

    created_at = Column(DateTime, default=_now)

    experiment = relationship("Experiment", back_populates="patches")


# ===== Legacy tables (kept for backward compatibility) =====

class QueryRecord(Base):
    """Legacy: stores each user query."""
    __tablename__ = "queries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    query_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=_now)
    plans = relationship("PlanRecord", back_populates="query")


class PlanRecord(Base):
    """Legacy: stores generated experiment plans as JSON."""
    __tablename__ = "experiment_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    query_id = Column(Integer, ForeignKey("queries.id"), nullable=False)
    plan_json = Column(JSONB, nullable=False)
    literature_qc_json = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=_now)
    query = relationship("QueryRecord", back_populates="plans")


# ---------------------------------------------------------------------------
# Engine & Session Factory
# ---------------------------------------------------------------------------
_engine = None
_SessionLocal = None


def init_engine(database_url: str):
    """Initialize the database engine and session factory."""
    global _engine, _SessionLocal
    if database_url:
        _engine = create_engine(database_url, pool_pre_ping=True)
        _SessionLocal = sessionmaker(bind=_engine)
    return _engine


def get_session():
    """Get a database session. Returns None if DB is not configured."""
    if _SessionLocal is None:
        return None
    return _SessionLocal()


def create_tables():
    """Create all tables in the database."""
    if _engine is not None:
        Base.metadata.create_all(bind=_engine)
