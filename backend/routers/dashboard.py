"""Bosh sahifa statistikasi."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user, require_perm
from database import get_db
from models import Attendance, Branch, Group, Payment, Student
from utils import current_month, paid_by_student

router = APIRouter(prefix="/dashboard", tags=["Dashboard"], dependencies=[Depends(get_current_user)])


def last_months(count: int):
    """Oxirgi N oy: ['2026-05', ..., '2026-10']."""
    today = date.today()
    months = []
    y, m = today.year, today.month
    for _ in range(count):
        months.append(f"{y}-{m:02d}")
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    return list(reversed(months))


@router.get("")
def dashboard(branch_id: Optional[int] = None, db: Session = Depends(get_db), _=Depends(require_perm("dashboard.view"))):
    month = current_month()
    today = date.today()

    students_q = db.query(Student).filter(Student.status == "active")
    groups_q = db.query(Group)
    if branch_id:
        students_q = students_q.filter(Student.branch_id == branch_id)
        groups_q = groups_q.filter(Group.branch_id == branch_id)
    students = students_q.all()
    ids = [s.id for s in students]

    # Bugungi davomat
    today_marks = db.query(Attendance.status, func.count()).filter(
        Attendance.date == today, Attendance.student_id.in_(ids)
    ).group_by(Attendance.status).all()
    marks = dict(today_marks)

    # Shu oy to'lovlari va qarzdorlar
    paid = paid_by_student(db, month, ids)
    debtors = [
        {"student_id": s.id, "full_name": s.full_name, "group_name": s.group_name,
         "parent_phone": s.parent_phone, "debt": s.monthly_fee - paid.get(s.id, 0)}
        for s in students if s.monthly_fee > paid.get(s.id, 0)
    ]
    debtors.sort(key=lambda d: d["debt"], reverse=True)

    # Oxirgi 6 oy daromadi
    income_q = db.query(Payment.month, func.sum(Payment.amount)).join(Student)
    if branch_id:
        income_q = income_q.filter(Student.branch_id == branch_id)
    income = dict(income_q.group_by(Payment.month).all())
    chart = [{"month": m, "amount": int(income.get(m, 0))} for m in last_months(6)]

    # Oxirgi to'lovlar
    recent_q = db.query(Payment).join(Student)
    if branch_id:
        recent_q = recent_q.filter(Student.branch_id == branch_id)
    recent = [
        {"id": p.id, "student_name": p.student_name, "amount": p.amount,
         "month": p.month, "method": p.method, "paid_at": p.paid_at.isoformat()}
        for p in recent_q.order_by(Payment.paid_at.desc()).limit(6)
    ]

    return {
        "stats": {
            "students": len(students),
            "groups": groups_q.count(),
            "branches": db.query(Branch).count(),
            "income_month": sum(paid.values()),
            "expected_month": sum(s.monthly_fee for s in students),
            "debtors": len(debtors),
            "present_today": marks.get("present", 0) + marks.get("late", 0),
            "absent_today": marks.get("absent", 0),
        },
        "income_chart": chart,
        "debtors": debtors[:6],
        "recent_payments": recent,
    }
