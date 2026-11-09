"""Guruhlar CRUD."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import schemas
from auth import get_current_user, require_perm, teacher_scope
from database import get_db
from models import Group, Teacher
from utils import same_slot

router = APIRouter(prefix="/groups", tags=["Guruhlar"], dependencies=[Depends(get_current_user)])


def to_out(g: Group) -> dict:
    return {
        **schemas.GroupOut.model_validate(g).model_dump(),
        "student_count": sum(1 for s in g.students if s.status == "active"),
    }


def check_teacher_free(db: Session, data: schemas.GroupIn, group_id: Optional[int] = None):
    """Bitta ustoz bir vaqtda ikki guruhda dars bera olmaydi.
    (Bir xil kurs va vaqtda turli ustozlar bilan bir nechta guruh esa bemalol bo'lishi mumkin.)"""
    if not data.teacher_id:
        return
    if not db.get(Teacher, data.teacher_id):
        raise HTTPException(404, "Ustoz topilmadi")
    others = db.query(Group).filter(Group.teacher_id == data.teacher_id, Group.id != (group_id or 0)).all()
    for other in others:
        if same_slot(data, other):
            raise HTTPException(
                400,
                f"Bu ustoz shu vaqtda ({other.days}, {other.time}) \"{other.name}\" guruhida dars beradi",
            )


@router.get("", response_model=List[schemas.GroupOut])
def list_groups(
    branch_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    query = db.query(Group)
    teacher_id = teacher_scope(user) or teacher_id  # ustoz akkaunti faqat o'z guruhlarini ko'radi
    if branch_id:
        query = query.filter(Group.branch_id == branch_id)
    if teacher_id:
        query = query.filter(Group.teacher_id == teacher_id)
    return [to_out(g) for g in query.order_by(Group.time, Group.id).all()]


@router.post("", response_model=schemas.GroupOut)
def create_group(data: schemas.GroupIn, db: Session = Depends(get_db), _=Depends(require_perm("groups.manage"))):
    check_teacher_free(db, data)
    group = Group(**data.model_dump())
    db.add(group)
    db.commit()
    db.refresh(group)
    return to_out(group)


@router.put("/{group_id}", response_model=schemas.GroupOut)
def update_group(group_id: int, data: schemas.GroupIn, db: Session = Depends(get_db), _=Depends(require_perm("groups.manage"))):
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(404, "Guruh topilmadi")
    check_teacher_free(db, data, group_id)
    for key, value in data.model_dump().items():
        setattr(group, key, value)
    db.commit()
    return to_out(group)


@router.delete("/{group_id}")
def delete_group(group_id: int, db: Session = Depends(get_db), _=Depends(require_perm("groups.manage"))):
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(404, "Guruh topilmadi")
    # O'quvchilar o'chmaydi, faqat guruhsiz qoladi
    for s in group.students:
        s.group_id = None
    db.delete(group)
    db.commit()
    return {"ok": True}
