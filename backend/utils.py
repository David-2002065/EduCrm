"""Bir nechta joyda ishlatiladigan yordamchi funksiyalar."""
from datetime import date
from typing import Dict, List

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Payment


def normalize_phone(value: str) -> str:
    """Faqat raqamlar va boshidagi '+' qoladi: '+998 99 089-39-54' -> '+998990893954'."""
    if not value:
        return ""
    digits = "".join(ch for ch in value if ch.isdigit())
    return ("+" + digits) if digits else ""


def current_month() -> str:
    """Joriy oy: '2026-10'."""
    return date.today().strftime("%Y-%m")


def paid_by_student(db: Session, month: str, student_ids: List[int]) -> Dict[int, int]:
    """Berilgan oy uchun har bir o'quvchi qancha to'laganini qaytaradi."""
    if not student_ids:
        return {}
    rows = (
        db.query(Payment.student_id, func.sum(Payment.amount))
        .filter(Payment.month == month, Payment.student_id.in_(student_ids))
        .group_by(Payment.student_id)
        .all()
    )
    return {sid: int(total) for sid, total in rows}


def payment_status(fee: int, paid: int) -> str:
    """'paid' - to'liq, 'partial' - qisman, 'unpaid' - to'lamagan."""
    if fee <= 0 or paid >= fee:
        return "paid"
    return "partial" if paid > 0 else "unpaid"


# ---------- Dars jadvali ----------
ALL_DAYS = {"Du", "Se", "Chor", "Pay", "Ju", "Sha", "Yak"}


def parse_days(days: str) -> set:
    """'Du, Chor, Ju' -> {'Du', 'Chor', 'Ju'}. 'Har kuni' -> hafta kunlari."""
    if not days:
        return set()
    if days.strip().lower() == "har kuni":
        return ALL_DAYS - {"Yak"}
    return {d.strip() for d in days.split(",") if d.strip()}


def same_slot(a, b) -> bool:
    """Ikki guruh bir vaqtga to'g'ri keladimi: vaqti bir xil va kamida bitta kuni umumiy."""
    return bool(a.time) and a.time == b.time and bool(parse_days(a.days) & parse_days(b.days))
