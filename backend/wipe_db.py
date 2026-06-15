import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import DATABASE_URL
from models.database import init_engine, Base, get_session
from sqlalchemy import text

if __name__ == "__main__":
    if not DATABASE_URL:
        print("DATABASE_URL is not set.")
        sys.exit(1)
        
    engine = init_engine(DATABASE_URL)
    print("Dropping schema public cascade...")
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.commit()
    print("Recreating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Database wiped and recreated successfully.")
