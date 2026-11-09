"""O'quvchilar CRUD va o'quvchi haqida to'liq ma'lumot."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

import schemas
from auth import get_current_user, require_perm, teacher_scope
from database import get_db
from models import Attendance, Group, Payment, Student
from utils import current_month, paid_by_student, payment_status

router = APIRouter(prefix="/students", tags=["O'quvchilar"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[schemas.StudentOut])
def list_students(
    branch_id: Optional[int] = None,
    group_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(require_perm("students.view")),
):
    query = db.query(Student)
    if teacher_scope(user):  # ustoz — faqat o'z guruhlaridagi o'quvchilar
        query = query.join(Group, Student.group_id == Group.id).filter(Group.teacher_id == teacher_scope(user)).options(joinedload(Student.group), joinedload(Student.branch))
    if branch_id:
        query = query.filter(Student.branch_id == branch_id)
    if group_id:
        query = query.filter(Student.group_id == group_id)
    if status:
        query = query.filter(Student.status == status)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(
            Student.full_name.ilike(like),
            Student.phone.ilike(like),
            Student.parent_phone.ilike(like),
        ))
    students = query.order_by(Student.id.desc()).all()

    paid = paid_by_student(db, current_month(), [s.id for s in students])
    result = []
    for s in students:
        item = schemas.StudentOut.model_validate(s).model_dump()
        item["paid_this_month"] = paid.get(s.id, 0)
        result.append(item)
    return result


@router.get("/{student_id}")
def student_detail(student_id: int, db: Session = Depends(get_db), user=Depends(require_perm("students.view"))):
    """O'quvchi + to'lovlar tarixi + davomat statistikasi."""
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(404, "O'quvchi topilmadi")
    if teacher_scope(user) and (not student.group or student.group.teacher_id != teacher_scope(user)):
        raise HTTPException(403, "Bu o'quvchi sizning guruhingizda emas")
    can_see_money = "payments.view" in user.permissions

    payments = (
        db.query(Payment).filter(Payment.student_id == student_id)
        .order_by(Payment.paid_at.desc()).all()
    )
    attendance = (
        db.query(Attendance).filter(Attendance.student_id == student_id)
        .order_by(Attendance.date.desc()).limit(60).all()
    )
    month = current_month()
    paid = sum(p.amount for p in payments if p.month == month)

    return {
        "student": schemas.StudentOut.model_validate(student).model_dump() | {"paid_this_month": paid},
        "payment_status": payment_status(student.monthly_fee, paid),
        # To'lovlarni ko'rish ruxsati bo'lmasa (masalan ustoz) — pul ma'lumoti berilmaydi
        "payments": [schemas.PaymentOut.model_validate(p).model_dump() for p in payments] if can_see_money else [],
        "can_see_money": can_see_money,
        "attendance": [schemas.AttendanceOut.model_validate(a).model_dump() for a in attendance],
        "attendance_stats": {
            "present": sum(1 for a in attendance if a.status == "present"),
            "late": sum(1 for a in attendance if a.status == "late"),
            "absent": sum(1 for a in attendance if a.status == "absent"),
        },
    }


@router.post("", response_model=schemas.StudentOut)
def create_student(data: schemas.StudentIn, db: Session = Depends(get_db), _=Depends(require_perm("students.edit"))):
    student = Student(**data.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.put("/{student_id}", response_model=schemas.StudentOut)
def update_student(student_id: int, data: schemas.StudentIn, db: Session = Depends(get_db), _=Depends(require_perm("students.edit"))):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(404, "O'quvchi topilmadi")
    for key, value in data.model_dump().items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db), _=Depends(require_perm("students.delete"))):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(404, "O'quvchi topilmadi")
    db.delete(student)
    db.commit()
    return {"ok": True}
