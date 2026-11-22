from fastapi import APIRouter, Depends, HTTPException
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


class DecisionRequest(BaseModel):
    transaction_id: str
    decision: str


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
        "customer_verification_required": risk_level in ["HIGH", "CRITICAL"]
    }


@router.post("/decision")
def decision(
    request: DecisionRequest,
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(
        Transaction.transaction_id == request.transaction_id
    ).first()

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    decision_value = request.decision.upper()

    if decision_value == "APPROVE":
        transaction.status = "APPROVED"

    elif decision_value == "HOLD":
        transaction.status = "HOLD"

    elif decision_value == "BLOCK":
        transaction.status = "BLOCKED"

    elif decision_value == "VERIFY":
        transaction.status = "AWAITING VERIFICATION"

    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid decision"
        )

    db.commit()
    db.refresh(transaction)

    return {
        "success": True,
        "transaction_id": transaction.transaction_id,
        "status": transaction.status
    }
