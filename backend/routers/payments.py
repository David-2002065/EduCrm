"""To'lovlar: kim to'ladi, kim to'lamadi."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

import os

import schemas
from auth import get_current_user, require_perm, teacher_scope
from database import get_db
from models import Payment, Student, User
from utils import current_month, paid_by_student, payment_status

router = APIRouter(prefix="/payments", tags=["To'lovlar"], dependencies=[Depends(get_current_user)])


@router.get("/status")
def monthly_status(
    month: Optional[str] = None,
    branch_id: Optional[int] = None,
    group_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(require_perm("payments.view")),
):
    """Har bir faol o'quvchi uchun: oylik summa, to'lagani, qarzi va holati."""
    month = month or current_month()
    query = db.query(Student).options(joinedload(Student.group), joinedload(Student.branch)).filter(Student.status == "active")
    if branch_id:
        query = query.filter(Student.branch_id == branch_id)
    if group_id:
        query = query.filter(Student.group_id == group_id)
    students = query.order_by(Student.full_name).all()

    paid = paid_by_student(db, month, [s.id for s in students])
    rows = []
    for s in students:
        p = paid.get(s.id, 0)
        rows.append({
            "student_id": s.id,
            "full_name": s.full_name,
            "parent_phone": s.parent_phone,
            "group_name": s.group_name,
            "branch_name": s.branch_name,
            "fee": s.monthly_fee,
            "paid": p,
            "debt": max(s.monthly_fee - p, 0),
            "status": payment_status(s.monthly_fee, p),
        })
    return {
        "month": month,
        "rows": rows,
        "summary": {
            "expected": sum(r["fee"] for r in rows),
            "collected": sum(r["paid"] for r in rows),
            "debt": sum(r["debt"] for r in rows),
            "paid_count": sum(1 for r in rows if r["status"] == "paid"),
            "unpaid_count": sum(1 for r in rows if r["status"] != "paid"),
        },
    }


@router.get("", response_model=List[schemas.PaymentOut])
def list_payments(month: Optional[str] = None, branch_id: Optional[int] = None, db: Session = Depends(get_db), _=Depends(require_perm("payments.view"))):
    """To'lovlar tarixi."""
    query = db.query(Payment).join(Student).options(joinedload(Payment.student).joinedload(Student.group))
    if month:
        query = query.filter(Payment.month == month)
    if branch_id:
        query = query.filter(Student.branch_id == branch_id)
    return query.order_by(Payment.paid_at.desc()).all()


@router.post("", response_model=schemas.PaymentOut)
def create_payment(data: schemas.PaymentIn, db: Session = Depends(get_db), user: User = Depends(require_perm("payments.create"))):
    if not db.get(Student, data.student_id):
        raise HTTPException(404, "O'quvchi topilmadi")
    if data.amount <= 0:
        raise HTTPException(400, "Summa noto'g'ri")
    payment = Payment(**data.model_dump(), cashier_id=user.id)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


# Chekdagi markaz nomi. O'zgartirish: CENTER_NAME="Bilim o'quv markazi" uvicorn main:app
CENTER_NAME = os.getenv("CENTER_NAME", "EduCRM o'quv markazi")


@router.get("/{payment_id}/receipt")
def receipt(payment_id: int, db: Session = Depends(get_db), _=Depends(require_perm("payments.view", "payments.create"))):
    """Chek uchun hamma ma'lumot: markaz, filial, o'quvchi, to'lov, qoldiq qarz, kassir."""
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(404, "To'lov topilmadi")
    student = payment.student
    group = student.group
    branch = student.branch
    fee = student.monthly_fee
    paid_total = paid_by_student(db, payment.month, [student.id]).get(student.id, 0)
    return {
        "number": f"{payment.id:06d}",
        "center_name": CENTER_NAME,
        "branch_name": branch.name if branch else "",
        "branch_address": branch.address if branch else "",
        "branch_phone": branch.phone if branch else "",
        "student_name": student.full_name,
        "group_name": group.name if group else "",
        "teacher_name": group.teacher_name if group else "",
        "month": payment.month,
        "amount": payment.amount,
        "method": payment.method,
        "note": payment.note,
        "paid_at": payment.paid_at.isoformat(),
        "monthly_fee": fee,
        "paid_total": paid_total,
        "debt": max(fee - paid_total, 0),
        "cashier_name": payment.cashier_name or "—",
    }


@router.delete("/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db), _=Depends(require_perm("payments.delete"))):
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(404, "To'lov topilmadi")
    db.delete(payment)
    db.commit()
    return {"ok": True}
