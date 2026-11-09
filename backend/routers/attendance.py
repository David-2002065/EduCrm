"""Davomat: guruh bo'yicha kunlik belgilash."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import schemas
from auth import require_perm, teacher_scope
from database import get_db
from models import Attendance, Group, Student

router = APIRouter(prefix="/attendance", tags=["Davomat"])


def check_group(db: Session, group_id: int, user):
    """Guruh bor-yo'qligi va ustoz akkaunti bo'lsa — guruh unikimi."""
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(404, "Guruh topilmadi")
    if teacher_scope(user) and group.teacher_id != teacher_scope(user):
        raise HTTPException(403, "Bu guruh sizniki emas")
    return group


@router.get("")
def get_group_attendance(group_id: int, day: date, db: Session = Depends(get_db), user=Depends(require_perm("attendance.mark"))):
    """Guruhdagi faol o'quvchilar va ularning shu kungi holati (belgilanmagan bo'lsa None)."""
    check_group(db, group_id, user)
    students = (
        db.query(Student)
        .filter(Student.group_id == group_id, Student.status == "active")
        .order_by(Student.full_name).all()
    )
    marks = {
        a.student_id: a.status
        for a in db.query(Attendance).filter(
            Attendance.date == day,
            Attendance.student_id.in_([s.id for s in students]),
        )
    }
    return [
        {"student_id": s.id, "full_name": s.full_name, "phone": s.phone,
         "parent_phone": s.parent_phone, "status": marks.get(s.id)}
        for s in students
    ]


@router.post("")
def save_group_attendance(data: schemas.AttendanceBulkIn, db: Session = Depends(get_db), user=Depends(require_perm("attendance.mark"))):
    """Bir guruhning bir kunlik davomatini saqlaydi (bor bo'lsa yangilaydi)."""
    check_group(db, data.group_id, user)
    existing = {
        a.student_id: a
        for a in db.query(Attendance).filter(
            Attendance.date == data.date,
            Attendance.student_id.in_([i.student_id for i in data.items]),
        )
    }
    for item in data.items:
        if item.student_id in existing:
            existing[item.student_id].status = item.status
        else:
            db.add(Attendance(student_id=item.student_id, group_id=data.group_id,
                              date=data.date, status=item.status))
    db.commit()
    return {"ok": True, "saved": len(data.items)}
