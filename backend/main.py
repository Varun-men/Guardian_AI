from fastapi import FastAPI

app = FastAPI(
    title="Guardian AI API",
    description="Backend API for Guardian AI — the Living Claim Ledger",
    version="1.0.0",
)


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