from sqlalchemy import inspect

from backend.db.database import Base, engine
from backend.db import models


def initialize_database():
    print("Initializing Guardian AI database...")

    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    tables = inspector.get_table_names()

    print(f"Database initialized successfully.")
    print(f"Tables created or already present: {len(tables)}")

    for table in tables:
        print(f" - {table}")


if __name__ == "__main__":
    initialize_database()
