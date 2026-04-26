import sys
import os

# Add the parent directory to sys.path to allow importing from backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import init_engine, create_tables, get_session, Lab, InventoryItem, Researcher, Experiment
from config import DATABASE_URL
from datetime import datetime

# --- Mock Data ---

RESEARCHERS = [
  {
    "name": "Dr. Anika Sharma",
    "title": "Senior Scientist · 9 yrs",
    "expertise": ["autophagy", "HepG2", "TFEB biology", "Western blot", "ELISA", "biosensors"],
    "past_work": "Led EXP-2017 (TFEB-lysosome) and EXP-1842 (bafilomycin dose-response). 14 prior HepG2 experiments.",
    "availability": "available",
    "hours_this_week": 18,
  },
  {
    "name": "Dr. Rohan Mehta",
    "title": "Postdoc · 4 yrs",
    "expertise": ["molecular biology", "siRNA", "qPCR", "starvation assays", "neuronal cultures"],
    "past_work": "Established the lab's HepG2 starvation protocol (EXP-2009). Authored 3 internal SOPs.",
    "availability": "limited",
    "hours_this_week": 8,
  },
  {
    "name": "Dr. Priya Patel",
    "title": "Research Associate · 6 yrs",
    "expertise": ["qPCR", "siRNA validation", "RNA workflows", "statistical analysis"],
    "past_work": "Owns the lab's knockdown validation pipeline (EXP-1987).",
    "availability": "available",
    "hours_this_week": 22,
  },
  {
    "name": "Dr. Sanjay Iyer",
    "title": "Principal Investigator",
    "expertise": ["CRISPR", "in vivo immunology", "tumor biology"],
    "past_work": "Currently leads EXP-1755. Limited bandwidth.",
    "availability": "busy",
    "hours_this_week": 3,
  },
  {
    "name": "Lin Wong",
    "title": "PhD Candidate · Yr 4",
    "expertise": ["microscopy", "ImageJ analysis", "cell culture"],
    "past_work": "Maintains shared antibody inventory; reciprocal sharing with Wong lab.",
    "availability": "available",
    "hours_this_week": 25,
  },
]

EQUIPMENT = [
  { "name": "Bio-Rad ChemiDoc MP", "category": "imaging", "available": True, "location": "Room 4B · Bench 2" },
  { "name": "Nikon Ti2 Eclipse", "category": "imaging", "available": True, "location": "Imaging Core" },
  { "name": "QuantStudio 5 qPCR", "category": "molecular", "available": True, "location": "Room 4B · Bench 5" },
  { "name": "BSL-2 Hood (Hood-3)", "category": "cell-culture", "available": True, "location": "Room 5A" },
  { "name": "BSL-2 Hood (Hood-4)", "category": "cell-culture", "available": False, "location": "Room 5A" },
  { "name": "Eppendorf 5810R Centrifuge", "category": "general", "available": True, "location": "Room 4B · Bench 1" },
  { "name": "NanoDrop One", "category": "analytical", "available": True, "location": "Room 4B · Bench 3" },
  { "name": "Mini-PROTEAN Tetra Cell", "category": "molecular", "available": True, "location": "Room 4B · Bench 2" },
]

EXPERIMENTS = [
  {
    "hypothesis": "TFEB overexpression in HepG2 — lysosomal biogenesis kinetics",
    "status": "completed",
    "created_at": datetime.strptime("2026-02-12", "%Y-%m-%d"),
  },
  {
    "hypothesis": "Glucose starvation timecourse — LC3-II accumulation in HepG2",
    "status": "completed",
    "created_at": datetime.strptime("2025-11-04", "%Y-%m-%d"),
  },
  {
    "hypothesis": "siRNA knockdown validation panel — qPCR vs Western for 12 targets",
    "status": "completed",
    "created_at": datetime.strptime("2025-09-22", "%Y-%m-%d"),
  },
  {
    "hypothesis": "Bafilomycin dose-response in hepatic autophagy",
    "status": "completed",
    "created_at": datetime.strptime("2025-07-18", "%Y-%m-%d"),
  },
  {
    "hypothesis": "PD-L1 CRISPR knockout — B16 melanoma immunogenicity",
    "status": "in-progress",
    "created_at": datetime.strptime("2025-05-30", "%Y-%m-%d"),
  },
  {
    "hypothesis": "DRP1 inhibition + oxidative stress in primary cortical neurons",
    "status": "inconclusive",
    "created_at": datetime.strptime("2025-03-11", "%Y-%m-%d"),
  },
]

def seed():
    print("Connecting to DB...")
    init_engine(DATABASE_URL)
    create_tables()

    session = get_session()
    if not session:
        print("Failed to get DB session.")
        return

    try:
        # Check if lab already exists
        lab = session.query(Lab).first()
        if not lab:
            print("Creating default lab...")
            lab = Lab(name="Main Hub Lab", domain="general science", capabilities=["molecular biology", "cell culture", "imaging"])
            session.add(lab)
            session.commit()
            session.refresh(lab)
        else:
            print(f"Lab '{lab.name}' already exists.")

        # Seed Researchers
        count = session.query(Researcher).count()
        if count == 0:
            print("Seeding researchers...")
            for r in RESEARCHERS:
                researcher = Researcher(
                    lab_id=lab.id,
                    name=r["name"],
                    title=r["title"],
                    expertise=r["expertise"],
                    past_work=r["past_work"],
                    availability=r["availability"],
                    hours_this_week=r["hours_this_week"]
                )
                session.add(researcher)
        else:
            print(f"Found {count} researchers, skipping seed.")

        # Seed Equipment
        count = session.query(InventoryItem).count()
        if count == 0:
            print("Seeding equipment...")
            for e in EQUIPMENT:
                item = InventoryItem(
                    lab_id=lab.id,
                    item_name=e["name"],
                    category=e["category"],
                    availability_status="in_stock" if e["available"] else "out_of_stock",
                    quantity=1
                )
                session.add(item)
        else:
            print(f"Found {count} inventory items, skipping seed.")

        # Seed Past Experiments
        count = session.query(Experiment).count()
        if count == 0:
            print("Seeding past experiments...")
            for e in EXPERIMENTS:
                exp = Experiment(
                    lab_id=lab.id,
                    hypothesis=e["hypothesis"],
                    status=e["status"],
                    created_at=e["created_at"]
                )
                session.add(exp)
        else:
            print(f"Found {count} experiments, skipping seed.")

        session.commit()
        print("Seed complete!")

    except Exception as e:
        session.rollback()
        print(f"Error seeding DB: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    seed()
