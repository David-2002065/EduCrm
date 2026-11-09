"""Namunaviy ma'lumotlar. Faqat baza bo'sh bo'lganda ishlaydi."""
import random
from datetime import date, datetime, timedelta

from auth import hash_password
from models import Attendance, Branch, Group, Payment, Role, Student, Teacher, User

FIRST = ["Aziz", "Jasur", "Madina", "Dilnoza", "Sardor", "Kamola", "Bekzod", "Nilufar", "Otabek",
         "Shahzoda", "Javohir", "Malika", "Sherzod", "Zarina", "Doniyor", "Gulnora", "Islom", "Sevara"]
LAST = ["Karimov", "Toshmatov", "Rahimov", "Yusupov", "Aliyev", "Nazarov", "Ergashev", "Qodirov"]
PARENTS = ["Akmal", "Baxtiyor", "Rustam", "Ulug'bek", "Farhod", "Shavkat", "Dilshod", "Anvar"]
STREETS = ["Amir Temur ko'chasi", "Navoiy ko'chasi", "Bobur ko'chasi", "Mustaqillik ko'chasi"]


def phone():
    return f"+9989{random.randint(0, 9)}{random.randint(1000000, 9999999)}"


def month_shift(d: date, back: int) -> str:
    y, m = d.year, d.month - back
    while m <= 0:
        y, m = y - 1, m + 12
    return f"{y}-{m:02d}"


def seed(db):
    if db.query(User).first():
        return
    random.seed(7)
    roles = {r.name: r.id for r in db.query(Role).all()}  # migrate.py yaratgan standart rollar
    db.add(User(username="admin", password_hash=hash_password("admin123"),
                full_name="Bosh admin", role_id=roles["Bosh admin"]))

    branches = [
        Branch(name="Chilonzor filiali", address="Toshkent, Chilonzor 9-kvartal", phone="+998712001010"),
        Branch(name="Yunusobod filiali", address="Toshkent, Yunusobod 4-mavze", phone="+998712002020"),
    ]
    db.add_all(branches)
    db.flush()

    t = {
        name: Teacher(full_name=name, phone=phone(), subject=subject, branch_id=branches[b].id)
        for name, subject, b in [
            ("Malika Saidova", "Ingliz tili", 0),
            ("Nodira Rasulova", "Ingliz tili", 0),
            ("Jamshid Karimov", "Ingliz tili", 0),
            ("Olim Rasulov", "Matematika", 1),
            ("Dilfuza Ahmedova", "Matematika", 1),
            ("Sanjar Aliyev", "Dasturlash", 1),
        ]
    }
    db.add_all(t.values())
    db.flush()

    # Namunaviy xodimlar: kassir va ustoz (ustoz faqat o'z guruhlarini ko'radi)
    db.add_all([
        User(username="kassir", password_hash=hash_password("kassir123"), full_name="Gulnoza Karimova",
             role_id=roles["Kassir"]),
        User(username="ustoz", password_hash=hash_password("ustoz123"), full_name="Malika Saidova",
             role_id=roles["Ustoz"], teacher_id=t["Malika Saidova"].id),
    ])

    # Bir xil kurs va vaqtda turli ustozlar bilan parallel guruhlar ham bor
    def group(name, course, teacher, days, time, fee, b):
        return Group(name=name, course=course, teacher_id=t[teacher].id, days=days, time=time,
                     monthly_fee=fee, branch_id=branches[b].id)

    groups = [
        group("English Beginner A", "Ingliz tili", "Malika Saidova", "Du, Chor, Ju", "14:00", 450_000, 0),
        group("English Beginner B", "Ingliz tili", "Nodira Rasulova", "Du, Chor, Ju", "14:00", 450_000, 0),
        group("IELTS 6.5+", "Ingliz tili", "Jamshid Karimov", "Se, Pay, Sha", "16:00", 650_000, 0),
        group("Matematika A1", "Matematika", "Olim Rasulov", "Du, Chor, Ju", "10:00", 400_000, 1),
        group("Matematika A2", "Matematika", "Dilfuza Ahmedova", "Du, Chor, Ju", "10:00", 400_000, 1),
        group("Frontend React", "Dasturlash", "Sanjar Aliyev", "Se, Pay, Sha", "18:00", 800_000, 1),
    ]
    db.add_all(groups)
    db.flush()

    today = date.today()
    students = []
    for i in range(40):
        g = groups[i % len(groups)]
        last = random.choice(LAST)
        s = Student(
            full_name=f"{random.choice(FIRST)} {last}",
            phone=phone(),
            birth_date=date(random.randint(2006, 2015), random.randint(1, 12), random.randint(1, 28)),
            address=f"Toshkent, {random.choice(STREETS)}, {random.randint(1, 120)}-uy",
            parent_name=f"{random.choice(PARENTS)} {last}",
            parent_phone=phone(),
            status="left" if i % 13 == 12 else "active",
            joined_at=today - timedelta(days=random.randint(30, 200)),
            branch_id=g.branch_id,
            group_id=g.id,
        )
        students.append(s)
    db.add_all(students)
    db.flush()

    # Oxirgi 14 kunlik davomat
    for back in range(14):
        day = today - timedelta(days=back)
        if day.weekday() == 6:  # yakshanba dam
            continue
        for s in students:
            if s.status != "active":
                continue
            status = random.choices(["present", "late", "absent"], [80, 8, 12])[0]
            db.add(Attendance(student_id=s.id, group_id=s.group_id, date=day, status=status))

    # Oxirgi 6 oy to'lovlari (joriy oyda ba'zilar to'lamagan)
    for back in range(6):
        month = month_shift(today, back)
        for s in students:
            fee = next(g.monthly_fee for g in groups if g.id == s.group_id)
            chance = 0.55 if back == 0 else 0.92
            if random.random() > chance:
                continue
            amount = fee if random.random() > 0.15 else fee // 2
            paid_at = datetime(int(month[:4]), int(month[5:]), random.randint(1, min(today.day, 28) if back == 0 else 28), 10, 0)
            db.add(Payment(student_id=s.id, month=month, amount=amount,
                           method=random.choice(["naqd", "karta", "click"]), paid_at=paid_at))
    db.commit()
