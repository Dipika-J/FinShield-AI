from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers.transactions import router as transaction_router
from backend.app.routers.auth import router as auth_router
from backend.app.routers.customer import router as customer_router

app = FastAPI(
    title="FinShield AI",
    description="AI-Powered Financial Fraud Detection and Risk Prevention Platform",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(transaction_router)
app.include_router(customer_router)


@app.get("/")
def home():
    return {
        "message": "FinShield AI API is running",
        "status": "ACTIVE"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "ai_engine": "active",
        "transaction_monitoring": "active",
        "pre_authorization": "active"
    }
