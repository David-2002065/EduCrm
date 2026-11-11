"""Bazadagi jadvallar.

Filial -> Guruh -> O'quvchi
O'quvchi -> Davomat (kunlik), To'lov (oylik)
"""
import json
from datetime import date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from database import Base
from permissions import ALL as ALL_PERMISSIONS


def split_perms(text):
    return [p for p in (text or "").split(",") if p]


class Role(Base):
    """Rol: ruxsatlar to'plami (masalan: Kassir, Ustoz, Reception)."""
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    permissions = Column(Text, default="")  # "students.view,payments.create"
    is_system = Column(Boolean, default=False)  # Bosh admin — o'zgartirilmaydi, hamma ruxsat

    users = relationship("User", back_populates="role_obj")

    @property
    def permission_list(self):
        return list(ALL_PERMISSIONS) if self.is_system else split_perms(self.permissions)


class User(Base):
    """Tizim foydalanuvchisi. Ruxsatlari = rol ruxsatlari + qo'shimcha ruxsatlar."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    password_enc = Column(Text, nullable=True)  # bosh admin ko'rishi uchun shifrlangan parol (auth.encrypt_secret)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="")  # eski ustun (v3 gacha), endi role_id ishlatiladi
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    extra_permissions = Column(Text, default="")
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)  # ustoz akkaunti — faqat o'z guruhlari
    created_at = Column(DateTime, default=datetime.utcnow)

    role_obj = relationship("Role", back_populates="users")
    teacher = relationship("Teacher")

    @property
    def role_name(self):
        return self.role_obj.name if self.role_obj else "—"

    @property
    def is_superadmin(self):
        return bool(self.role_obj and self.role_obj.is_system)

    @property
    def extra_permission_list(self):
        return split_perms(self.extra_permissions)

    @property
    def permissions(self):
        """Foydalanuvchining barcha ruxsatlari (rol + qo'shimcha)."""
        own = set(self.role_obj.permission_list if self.role_obj else []) | set(self.extra_permission_list)
        return [p for p in ALL_PERMISSIONS if p in own]

    @property
    def teacher_name(self):
        return self.teacher.full_name if self.teacher else None


class Branch(Base):
    """Filial."""
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    address = Column(String(200), default="")
    phone = Column(String(30), default="")

    groups = relationship("Group", back_populates="branch")
    students = relationship("Student", back_populates="branch")


class Teacher(Base):
    """Ustoz. Bitta ustoz bir nechta guruhda dars berishi mumkin (lekin bir vaqtda emas)."""
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(30), default="")
    subject = Column(String(100), default="")  # qaysi fandan dars beradi
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)

    branch = relationship("Branch")
    groups = relationship("Group", back_populates="teacher")

    @property
    def branch_name(self):
        return self.branch.name if self.branch else None


class Group(Base):
    """Guruh. Bir xil kurs va vaqtda turli ustozlar bilan bir nechta guruh bo'lishi mumkin."""
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    course = Column(String(100), default="")
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    days = Column(String(50), default="")   # masalan: "Du, Chor, Ju"
    time = Column(String(20), default="")   # masalan: "14:00"
    monthly_fee = Column(Integer, default=0)  # oylik to'lov (so'm)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)

    branch = relationship("Branch", back_populates="groups")
    teacher = relationship("Teacher", back_populates="groups")
    students = relationship("Student", back_populates="group")

    @property
    def branch_name(self):
        return self.branch.name if self.branch else None

    @property
    def teacher_name(self):
        return self.teacher.full_name if self.teacher else ""


class Student(Base):
    """O'quvchi va uning ota-onasi haqida ma'lumot."""
    __tablename__ = "students"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(30), default="")
    birth_date = Column(Date, nullable=True)
    address = Column(String(200), default="")
    parent_name = Column(String(100), default="")
    parent_phone = Column(String(30), default="")
    status = Column(String(20), default="active")  # "active" yoki "left"
    note = Column(Text, default="")
    joined_at = Column(Date, default=date.today)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    telegram_chat_id = Column(String(30), nullable=True)  # Telegram botda ro'yxatdan o'tgan bo'lsa

    branch = relationship("Branch", back_populates="students")
    group = relationship("Group", back_populates="students")
    payments = relationship("Payment", back_populates="student", cascade="all, delete-orphan")
    attendance = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")

    @property
    def branch_name(self):
        return self.branch.name if self.branch else None

    @property
    def group_name(self):
        return self.group.name if self.group else None

    @property
    def monthly_fee(self):
        return self.group.monthly_fee if self.group else 0


class Attendance(Base):
    """Davomat: o'quvchi ma'lum kuni keldimi yoki yo'qmi."""
    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("student_id", "date"),)

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)  # "present", "absent", "late"

    student = relationship("Student", back_populates="attendance")


class Payment(Base):
    """To'lov: o'quvchi qaysi oy uchun qancha to'lagani."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    month = Column(String(7), nullable=False)  # "2026-10" ko'rinishida
    amount = Column(Integer, nullable=False)
    method = Column(String(20), default="naqd")  # "naqd", "karta", "click"
    note = Column(String(200), default="")
    paid_at = Column(DateTime, default=datetime.now)
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # to'lovni kim qabul qildi

    student = relationship("Student", back_populates="payments")
    cashier = relationship("User")

    @property
    def cashier_name(self):
        return self.cashier.full_name if self.cashier else None

    @property
    def student_name(self):
        return self.student.full_name if self.student else None

    @property
    def group_name(self):
        return self.student.group_name if self.student else None


class Test(Base):
    """Test vazifa: ustoz guruhiga qo'shadi, o'quvchilar Telegram botda bajaradi."""
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    title = Column(String(200), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    group = relationship("Group")
    author = relationship("User")
    questions = relationship("TestQuestion", back_populates="test", cascade="all, delete-orphan",
                             order_by="TestQuestion.position")
    attempts = relationship("TestAttempt", back_populates="test", cascade="all, delete-orphan")

    @property
    def group_name(self):
        return self.group.name if self.group else None

    @property
    def author_name(self):
        return self.author.full_name if self.author else None


class TestQuestion(Base):
    """Savol va javob variantlari (A, B, C, ...). correct_index — to'g'ri variant tartib raqami (0 dan)."""
    __tablename__ = "test_questions"

    id = Column(Integer, primary_key=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    position = Column(Integer, default=0)
    text = Column(Text, nullable=False)
    options = Column(Text, nullable=False)  # JSON: ["javob A", "javob B", "javob C"]
    correct_index = Column(Integer, nullable=False)

    test = relationship("Test", back_populates="questions")

    @property
    def option_list(self):
        return json.loads(self.options or "[]")


class TestAttempt(Base):
    """O'quvchining testni bajarishi. finished_at bo'sh bo'lsa — hali tugatmagan."""
    __tablename__ = "test_attempts"
    __table_args__ = (UniqueConstraint("test_id", "student_id"),)

    id = Column(Integer, primary_key=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    answers = Column(Text, default="[]")  # JSON: tanlangan variantlar [0, 2, 1, ...]
    correct_count = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.now)
    finished_at = Column(DateTime, nullable=True)

    test = relationship("Test", back_populates="attempts")
    student = relationship("Student")

    @property
    def answer_list(self):
        return json.loads(self.answers or "[]")
