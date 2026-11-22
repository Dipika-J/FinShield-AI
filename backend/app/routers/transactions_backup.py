from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from database.models import Transaction
from backend.app.services.fraud_service import analyze_transaction

router = APIRouter(
    prefix="/api/transactions",
    tags=["Transactions"]
)


class TransactionInput(BaseModel):
    amount: float
    hour: int
    frequency: int
    failed_attempts: int
    location: str
    device: str
    payment_method: str


@router.post("/analyze")
def analyze(
    transaction: TransactionInput,
    db: Session = Depends(get_db)
):
    result = analyze_transaction(transaction.model_dump())

    risk_score = result["risk_score"]
    risk_level = result["risk_level"]
    action = result["recommended_action"]

    if action == "APPROVE":
        status = "APPROVED"
    elif action in ["HOLD", "BLOCK"]:
        status = "AWAITING VERIFICATION"
    else:
        status = "AWAITING VERIFICATION"

    transaction_id = "TXN-FS-" + str(
        10000 + db.query(Transaction).count() + 1
    )

    db_transaction = Transaction(
        transaction_id=transaction_id,
        amount=transaction.amount,
        location=transaction.location,
        device=transaction.device,
        payment_method=transaction.payment_method,
        risk_score=risk_score,
        risk_level=risk_level,
        status=status
    )

    db.add(db_transaction)
    db.commit()

    return {
        "success": True,
        "transaction_id": transaction_id,
        "transaction": transaction.model_dump(),
        "analysis": result,
        "status": status,
        "customer_verification_required": action in ["HOLD", "BLOCK"]
    }
