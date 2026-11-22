from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import hashlib

from database.database import get_db
from database.models import Employee

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


class LoginRequest(BaseModel):
    email: str
    password: str


def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(
        Employee.email == request.email.strip().lower()
    ).first()

    if not employee:
        raise HTTPException(
            status_code=401,
            detail="Invalid employee credentials"
        )

    password_hash = hash_password(request.password)

    if employee.password != password_hash:
        raise HTTPException(
            status_code=401,
            detail="Invalid employee credentials"
        )

    return {
        "success": True,
        "message": "Login successful",
        "employee": {
            "id": employee.id,
            "name": employee.name,
            "email": employee.email,
            "employee_id": employee.employee_id
        }
    }
