"""So'rov va javob shakllari (Pydantic)."""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_validator

from utils import normalize_phone


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PhoneMixin(BaseModel):
    """Telefon raqamlari bazaga probelsiz yoziladi: '+998 99 089 39 54' -> '+998990893954'."""

    @field_validator("phone", "parent_phone", check_fields=False)
    @classmethod
    def clean_phone(cls, v):
        return normalize_phone(v)


# ---------- Auth / Users ----------
class LoginIn(BaseModel):
    username: str
    password: str


class UserIn(BaseModel):
    username: str
    password: Optional[str] = None  # tahrirlashda bo'sh qoldirilsa — parol o'zgarmaydi
    full_name: str
    role_id: int
    extra_permissions: List[str] = []
    teacher_id: Optional[int] = None


class UserOut(ORM):
    id: int
    username: str
    full_name: str
    role_id: Optional[int] = None
    role_name: str = ""
    is_superadmin: bool = False
    extra_permissions: List[str] = []
    permissions: List[str] = []
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None

    @classmethod
    def of(cls, user):
        return cls(
            id=user.id, username=user.username, full_name=user.full_name,
            role_id=user.role_id, role_name=user.role_name, is_superadmin=user.is_superadmin,
            extra_permissions=user.extra_permission_list, permissions=user.permissions,
            teacher_id=user.teacher_id, teacher_name=user.teacher_name,
        ).model_dump()


class RoleIn(BaseModel):
    name: str
    permissions: List[str] = []


class RoleOut(ORM):
    id: int
    name: str
    is_system: bool
    permissions: List[str] = []
    user_count: int = 0


class TokenOut(BaseModel):
    token: str
    user: UserOut


# ---------- Filiallar ----------
class BranchIn(PhoneMixin):
    name: str
    address: str = ""
    phone: str = ""


class BranchOut(ORM):
    id: int
    name: str
    address: str
    phone: str
    student_count: int = 0
    group_count: int = 0


# ---------- Ustozlar ----------
class TeacherIn(PhoneMixin):
    full_name: str
    phone: str = ""
    subject: str = ""
    branch_id: Optional[int] = None


class TeacherGroup(ORM):
    id: int
    name: str
    days: str
    time: str


class TeacherOut(ORM):
    id: int
    full_name: str
    phone: str
    subject: str
    branch_id: Optional[int]
    branch_name: Optional[str] = None
    groups: List[TeacherGroup] = []
    student_count: int = 0


# ---------- Guruhlar ----------
class GroupIn(BaseModel):
    name: str
    course: str = ""
    teacher_id: Optional[int] = None
    days: str = ""
    time: str = ""
    monthly_fee: int = 0
    branch_id: int


class GroupOut(ORM):
    id: int
    name: str
    course: str
    teacher_id: Optional[int] = None
    teacher_name: str = ""
    days: str
    time: str
    monthly_fee: int
    branch_id: int
    branch_name: Optional[str] = None
    student_count: int = 0


# ---------- O'quvchilar ----------
class StudentIn(PhoneMixin):
    full_name: str
    phone: str = ""
    birth_date: Optional[date] = None
    address: str = ""
    parent_name: str = ""
    parent_phone: str = ""
    status: str = "active"
    note: str = ""
    branch_id: int
    group_id: Optional[int] = None


class StudentOut(ORM):
    id: int
    full_name: str
    phone: str
    birth_date: Optional[date]
    address: str
    parent_name: str
    parent_phone: str
    status: str
    note: str
    joined_at: Optional[date]
    branch_id: int
    group_id: Optional[int]
    branch_name: Optional[str] = None
    group_name: Optional[str] = None
    monthly_fee: int = 0
    paid_this_month: int = 0  # joriy oyda to'lagan summasi


# ---------- Davomat ----------
class AttendanceItem(BaseModel):
    student_id: int
    status: str  # present / absent / late


class AttendanceBulkIn(BaseModel):
    group_id: int
    date: date
    items: List[AttendanceItem]


class AttendanceOut(ORM):
    id: int
    student_id: int
    date: date
    status: str


# ---------- To'lovlar ----------
class PaymentIn(BaseModel):
    student_id: int
    month: str
    amount: int
    method: str = "naqd"
    note: str = ""


class PaymentOut(ORM):
    id: int
    student_id: int
    student_name: Optional[str] = None
    group_name: Optional[str] = None
    month: str
    amount: int
    method: str
    note: str
    paid_at: datetime
    cashier_name: Optional[str] = None
