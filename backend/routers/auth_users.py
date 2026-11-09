"""Login, foydalanuvchilar, rollar va ruxsatlar."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import schemas
from auth import create_token, get_current_user, hash_password, require_perm, verify_password
from database import get_db
from models import Role, Teacher, User
from permissions import PERMISSIONS, clean

router = APIRouter(tags=["Foydalanuvchilar"])
manage = Depends(require_perm("users.manage"))


# ---------- Kirish ----------
@router.post("/auth/login", response_model=schemas.TokenOut)
def login(data: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(400, "Login yoki parol noto'g'ri")
    return {"token": create_token(user.id), "user": schemas.UserOut.of(user)}


@router.get("/auth/me", response_model=schemas.UserOut)
def me(user: User = Depends(get_current_user)):
    return schemas.UserOut.of(user)


# ---------- Ruxsatlar katalogi ----------
@router.get("/permissions", dependencies=[manage])
def permission_catalog():
    """Bo'limlar bo'yicha guruhlangan ruxsatlar (rol/foydalanuvchi formasidagi belgilash uchun)."""
    groups = {}
    for key, group, label in PERMISSIONS:
        groups.setdefault(group, []).append({"key": key, "label": label})
    return [{"group": g, "items": items} for g, items in groups.items()]


# ---------- Rollar ----------
def role_out(r: Role) -> dict:
    return {"id": r.id, "name": r.name, "is_system": r.is_system,
            "permissions": r.permission_list, "user_count": len(r.users)}


@router.get("/roles", response_model=List[schemas.RoleOut], dependencies=[manage])
def list_roles(db: Session = Depends(get_db)):
    return [role_out(r) for r in db.query(Role).order_by(Role.is_system.desc(), Role.id).all()]


def save_role(role: Role, data: schemas.RoleIn, db: Session):
    name = data.name.strip()
    if not name:
        raise HTTPException(400, "Rol nomini kiriting")
    clash = db.query(Role).filter(Role.name == name, Role.id != (role.id or 0)).first()
    if clash:
        raise HTTPException(400, "Bunday nomli rol bor")
    role.name = name
    role.permissions = ",".join(clean(data.permissions))


@router.post("/roles", response_model=schemas.RoleOut, dependencies=[manage])
def create_role(data: schemas.RoleIn, db: Session = Depends(get_db)):
    role = Role()
    save_role(role, data, db)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role_out(role)


@router.put("/roles/{role_id}", response_model=schemas.RoleOut, dependencies=[manage])
def update_role(role_id: int, data: schemas.RoleIn, db: Session = Depends(get_db)):
    role = db.get(Role, role_id)
    if not role:
        raise HTTPException(404, "Rol topilmadi")
    if role.is_system:
        raise HTTPException(400, "Bosh admin rolini o'zgartirib bo'lmaydi")
    save_role(role, data, db)
    db.commit()
    return role_out(role)


@router.delete("/roles/{role_id}", dependencies=[manage])
def delete_role(role_id: int, db: Session = Depends(get_db)):
    role = db.get(Role, role_id)
    if not role:
        raise HTTPException(404, "Rol topilmadi")
    if role.is_system:
        raise HTTPException(400, "Bosh admin rolini o'chirib bo'lmaydi")
    if role.users:
        raise HTTPException(400, f"Bu rolda {len(role.users)} ta foydalanuvchi bor. Avval ularga boshqa rol bering")
    db.delete(role)
    db.commit()
    return {"ok": True}


# ---------- Foydalanuvchilar ----------
@router.get("/users", response_model=List[schemas.UserOut], dependencies=[manage])
def list_users(db: Session = Depends(get_db)):
    return [schemas.UserOut.of(u) for u in db.query(User).order_by(User.id).all()]


def save_user(user: User, data: schemas.UserIn, db: Session, creating: bool):
    username = data.username.strip()
    if not username:
        raise HTTPException(400, "Login kiriting")
    if db.query(User).filter(User.username == username, User.id != (user.id or 0)).first():
        raise HTTPException(400, "Bu login band")
    if not db.get(Role, data.role_id):
        raise HTTPException(400, "Rolni tanlang")
    if data.teacher_id and not db.get(Teacher, data.teacher_id):
        raise HTTPException(404, "Ustoz topilmadi")
    if creating or data.password:
        if not data.password or len(data.password) < 6:
            raise HTTPException(400, "Parol kamida 6 belgi bo'lsin")
        user.password_hash = hash_password(data.password)
    user.username = username
    user.full_name = data.full_name.strip()
    user.role_id = data.role_id
    user.extra_permissions = ",".join(clean(data.extra_permissions))
    user.teacher_id = data.teacher_id


@router.post("/users", response_model=schemas.UserOut, dependencies=[manage])
def create_user(data: schemas.UserIn, db: Session = Depends(get_db)):
    user = User()
    save_user(user, data, db, creating=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.UserOut.of(user)


@router.put("/users/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, data: schemas.UserIn, db: Session = Depends(get_db), me: User = Depends(require_perm("users.manage"))):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Foydalanuvchi topilmadi")
    save_user(user, data, db, creating=False)
    db.flush()
    db.refresh(user)
    # O'zini o'zi "qulflab" qo'ymasin
    if user.id == me.id and "users.manage" not in user.permissions:
        db.rollback()
        raise HTTPException(400, "O'zingizdan foydalanuvchilarni boshqarish ruxsatini olib bo'lmaydi")
    db.commit()
    return schemas.UserOut.of(user)


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), me: User = Depends(require_perm("users.manage"))):
    if user_id == me.id:
        raise HTTPException(400, "O'zingizni o'chira olmaysiz")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Topilmadi")
    db.delete(user)
    db.commit()
    return {"ok": True}
