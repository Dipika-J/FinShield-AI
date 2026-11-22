from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from database.models import Transaction

router = APIRouter(
    prefix="/api/customer",
    tags=["Customer Verification"]
)


class VerificationRequest(BaseModel):
    transaction_id: str
    verified: bool


@router.post("/verify")
def verify_transaction(
    request: VerificationRequest,
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

    if request.verified:
        transaction.status = "PROCESSED"
        message = "Transaction processed after customer verification."
    else:
        transaction.status = "BLOCKED"
        message = "Transaction rejected by customer and remains blocked."

    db.commit()

    return {
        "success": True,
        "transaction_id": request.transaction_id,
        "status": transaction.status,
        "message": message
    }



@router.get("/pending")
def get_pending_transactions(
    db: Session = Depends(get_db)
):
    transactions = db.query(Transaction).filter(
        Transaction.status == "AWAITING VERIFICATION"
    ).order_by(Transaction.created_at.desc()).all()

    return [
        {
            "transaction_id": t.transaction_id,
            "amount": t.amount,
            "location": t.location,
            "device": t.device,
            "payment_method": t.payment_method,
            "risk_score": t.risk_score,
            "risk_level": t.risk_level,
            "status": t.status
        }
        for t in transactions
    ]

@router.get("/transaction/{transaction_id}")
def get_customer_transaction(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id
    ).first()

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    return {
        "transaction_id": transaction.transaction_id,
        "amount": transaction.amount,
        "location": transaction.location,
        "device": transaction.device,
        "payment_method": transaction.payment_method,
        "risk_score": transaction.risk_score,
        "risk_level": transaction.risk_level,
        "status": transaction.status
    }


