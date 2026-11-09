"""Ustozlar CRUD."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

import schemas
from auth import get_current_user, require_perm, teacher_scope
from database import get_db
from models import Group, Teacher

router = APIRouter(prefix="/teachers", tags=["Ustozlar"], dependencies=[Depends(get_current_user)])


def to_out(t: Teacher) -> dict:
    return {
        **schemas.TeacherOut.model_validate(t).model_dump(),
        "student_count": sum(1 for g in t.groups for s in g.students if s.status == "active"),
    }


@router.get("", response_model=List[schemas.TeacherOut])
def list_teachers(branch_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Teacher).options(joinedload(Teacher.groups).joinedload(Group.students))
    if branch_id:
        # Filialga biriktirilgan yoki filialsiz (hamma filialda ishlaydigan) ustozlar
        query = query.filter((Teacher.branch_id == branch_id) | (Teacher.branch_id.is_(None)))
    return [to_out(t) for t in query.order_by(Teacher.full_name).all()]


@router.post("", response_model=schemas.TeacherOut)
def create_teacher(data: schemas.TeacherIn, db: Session = Depends(get_db), _=Depends(require_perm("teachers.manage"))):
    teacher = Teacher(**data.model_dump())
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return to_out(teacher)


@router.put("/{teacher_id}", response_model=schemas.TeacherOut)
def update_teacher(teacher_id: int, data: schemas.TeacherIn, db: Session = Depends(get_db), _=Depends(require_perm("teachers.manage"))):
    teacher = db.get(Teacher, teacher_id)
    if not teacher:
        raise HTTPException(404, "Ustoz topilmadi")
    for key, value in data.model_dump().items():
        setattr(teacher, key, value)
    db.commit()
    return to_out(teacher)


@router.delete("/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db), _=Depends(require_perm("teachers.manage"))):
    teacher = db.get(Teacher, teacher_id)
    if not teacher:
        raise HTTPException(404, "Ustoz topilmadi")
    # Guruhlar o'chmaydi, faqat ustozsiz qoladi
    for g in teacher.groups:
        g.teacher_id = None
    db.delete(teacher)
    db.commit()
    return {"ok": True}
