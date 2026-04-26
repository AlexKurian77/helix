"""
Initialize database tables.
Run: python scripts/init_db.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import DATABASE_URL
from models.database import init_engine, create_tables


def init():
    if not DATABASE_URL:
        print("[DB] No DATABASE_URL configured. Set it in .env")
        return

    print(f"[DB] Connecting to database...")
    init_engine(DATABASE_URL)
    create_tables()
    print("[DB] All tables created successfully!")


if __name__ == "__main__":
    init()
