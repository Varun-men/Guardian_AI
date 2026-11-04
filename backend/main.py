
from fastapi import FastAPI
from sqlalchemy import inspect, text
from backend.auth.routes import router as auth_router
from backend.db.database import engine

app = FastAPI(
    title="Guardian AI API",
    description="Backend API for Guardian AI - the Living Claim Ledger",
    version="1.0.0",
)
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to Guardian AI",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Guardian AI Backend"
    }


@app.get("/api/db-check")
def database_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        tables = inspect(engine).get_table_names()

        return {
            "status": "connected",
            "database": "Guardian AI",
            "tables_count": len(tables),
            "tables": tables
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

from backend.api.facts import router as facts_router
app.include_router(facts_router)
