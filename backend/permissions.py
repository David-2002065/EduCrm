"""Ruxsatlar katalogi va standart rollar — bitta joyda.

Yangi ruxsat qo'shish: PERMISSIONS ga qator qo'shing va endpointda require_perm("...") ishlating.
"""

# (kalit, bo'lim, tavsif)
PERMISSIONS = [
    ("dashboard.view", "Bosh sahifa", "Statistika va tushumni ko'rish"),
    ("students.view", "O'quvchilar", "Ro'yxat va ma'lumotlarni ko'rish"),
    ("students.edit", "O'quvchilar", "Qo'shish va tahrirlash"),
    ("students.delete", "O'quvchilar", "O'chirish"),
    ("groups.view", "Guruhlar", "Guruhlar va dars jadvalini ko'rish"),
    ("groups.manage", "Guruhlar", "Qo'shish, tahrirlash, o'chirish"),
    ("teachers.view", "Ustozlar", "Ustozlar ro'yxatini ko'rish"),
    ("teachers.manage", "Ustozlar", "Qo'shish, tahrirlash, o'chirish"),
    ("attendance.mark", "Davomat", "Davomat olish (keldi / kelmadi)"),
    ("tests.manage", "Test vazifalar", "Guruhga test qo'shish va natijalarni ko'rish"),
    ("payments.view", "To'lovlar", "Kim to'ladi / to'lamadi, to'lovlar tarixi"),
    ("payments.create", "To'lovlar", "To'lov qabul qilish va chek chiqarish"),
    ("payments.delete", "To'lovlar", "To'lovni o'chirish"),
    ("branches.manage", "Sozlamalar", "Filiallarni boshqarish"),
    ("users.manage", "Sozlamalar", "Foydalanuvchilar, rollar va ruxsatlar"),
]

ALL = [p[0] for p in PERMISSIONS]

# (nomi, ruxsatlar, tizim roli) — tizim roli (Bosh admin) o'zgartirilmaydi va hamma ruxsatga ega
DEFAULT_ROLES = [
    ("Bosh admin", ALL, True),
    ("Admin", [p for p in ALL if p != "users.manage"], False),
    ("Reception", ["dashboard.view", "students.view", "students.edit", "groups.view", "teachers.view",
                   "attendance.mark", "payments.view", "payments.create"], False),
    ("Kassir", ["students.view", "groups.view", "payments.view", "payments.create"], False),
    ("Ustoz", ["groups.view", "students.view", "attendance.mark", "tests.manage"], False),
]

# Keyinroq qo'shilgan ruxsatlar: eski bazadagi rollarga bir marta qo'shiladi (migrate.py)
ADDED_PERMISSIONS = {"tests.manage": ["Admin", "Ustoz"]}

# Eski bazadagi role matnidan yangi rolga
LEGACY_ROLE_NAMES = {"superadmin": "Bosh admin", "admin": "Admin", "reception": "Reception"}


def clean(perms):
    """Faqat mavjud ruxsatlar, tartib bilan."""
    perms = set(perms or [])
    return [p for p in ALL if p in perms]
