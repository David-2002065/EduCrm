"""Filiallar CRUD."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import schemas
from auth import get_current_user, require_perm, teacher_scope
from database import get_db
from models import Branch

router = APIRouter(prefix="/branches", tags=["Filiallar"], dependencies=[Depends(get_current_user)])


def to_out(b: Branch) -> dict:
    return {
        **schemas.BranchOut.model_validate(b).model_dump(),
        "student_count": sum(1 for s in b.students if s.status == "active"),
        "group_count": len(b.groups),
    }


@router.get("", response_model=List[schemas.BranchOut])
def list_branches(db: Session = Depends(get_db)):
    return [to_out(b) for b in db.query(Branch).order_by(Branch.id).all()]


@router.post("", response_model=schemas.BranchOut)
def create_branch(data: schemas.BranchIn, db: Session = Depends(get_db), _=Depends(require_perm("branches.manage"))):
    branch = Branch(**data.model_dump())
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return to_out(branch)


@router.put("/{branch_id}", response_model=schemas.BranchOut)
def update_branch(branch_id: int, data: schemas.BranchIn, db: Session = Depends(get_db), _=Depends(require_perm("branches.manage"))):
    branch = db.get(Branch, branch_id)
    if not branch:
        raise HTTPException(404, "Filial topilmadi")
    for key, value in data.model_dump().items():
        setattr(branch, key, value)
    db.commit()
    return to_out(branch)


@router.delete("/{branch_id}")
def delete_branch(branch_id: int, db: Session = Depends(get_db), _=Depends(require_perm("branches.manage"))):
    branch = db.get(Branch, branch_id)
    if not branch:
        raise HTTPException(404, "Filial topilmadi")
    if branch.students or branch.groups:
        raise HTTPException(400, "Filialda guruh yoki o'quvchilar bor. Avval ularni o'chiring")
    db.delete(branch)
    db.commit()
    return {"ok": True}
