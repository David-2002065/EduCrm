"""Eski bazani yangi tuzilishga moslash (ma'lumot yo'qolmaydi).

v1 -> v2: guruhlarda ustoz matn edi (teacher_name). Endi alohida "teachers" jadvali bor.
Eski ismlardan ustozlar yaratiladi va guruhlarga bog'lanadi.
"""
from sqlalchemy import inspect, text


def migrate(engine):
    add_teachers(engine)
    clean_phones(engine)
    add_column(engine, "payments", "cashier_id", "INTEGER REFERENCES users(id)")
    add_column(engine, "users", "role_id", "INTEGER REFERENCES roles(id)")
    add_column(engine, "users", "extra_permissions", "TEXT DEFAULT ''")
    add_column(engine, "users", "teacher_id", "INTEGER REFERENCES teachers(id)")
    add_column(engine, "students", "telegram_chat_id", "VARCHAR(30)")
    add_column(engine, "users", "password_enc", "TEXT")
    ensure_roles(engine)
    add_permissions(engine)


def ensure_roles(engine):
    """Standart rollarni yaratadi va eski 'role' matni bo'yicha foydalanuvchilarga rol beradi."""
    from permissions import DEFAULT_ROLES, LEGACY_ROLE_NAMES

    with engine.begin() as conn:
        existing = {name for (name,) in conn.execute(text("SELECT name FROM roles"))}
        if not existing:
            for name, perms, is_system in DEFAULT_ROLES:
                conn.execute(
                    text("INSERT INTO roles (name, permissions, is_system) VALUES (:n, :p, :s)"),
                    {"n": name, "p": ",".join(perms), "s": is_system},
                )
        ids = {name: rid for rid, name in conn.execute(text("SELECT id, name FROM roles"))}
        for user_id, legacy in conn.execute(text("SELECT id, role FROM users WHERE role_id IS NULL")).fetchall():
            role_id = ids.get(LEGACY_ROLE_NAMES.get(legacy or "", "Admin"))
            conn.execute(text("UPDATE users SET role_id = :r WHERE id = :u"), {"r": role_id, "u": user_id})


def add_permissions(engine):
    """Yangi ruxsatlarni eski rollarga BIR MARTA qo'shadi (keyin admin olib tashlasa — qaytib qo'shilmaydi)."""
    from permissions import ADDED_PERMISSIONS

    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE IF NOT EXISTS applied_permissions (name VARCHAR(50) PRIMARY KEY)"))
        done = {name for (name,) in conn.execute(text("SELECT name FROM applied_permissions"))}
        for perm, role_names in ADDED_PERMISSIONS.items():
            if perm in done:
                continue
            for role_id, name, perms in conn.execute(text("SELECT id, name, permissions FROM roles")).fetchall():
                current = [p for p in (perms or "").split(",") if p]
                if name in role_names and perm not in current:
                    conn.execute(text("UPDATE roles SET permissions = :p WHERE id = :id"),
                                 {"p": ",".join(current + [perm]), "id": role_id})
            conn.execute(text("INSERT INTO applied_permissions (name) VALUES (:n)"), {"n": perm})


def add_column(engine, table, column, ddl):
    """Jadvalda ustun bo'lmasa — qo'shadi (eski to'lovlarda kassir bo'sh qoladi)."""
    if column not in {c["name"] for c in inspect(engine).get_columns(table)}:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))


def clean_phones(engine):
    """v2 -> v3: telefonlar bazada probelsiz saqlanadi."""
    from utils import normalize_phone

    targets = {"students": ("phone", "parent_phone"), "teachers": ("phone",), "branches": ("phone",)}
    with engine.begin() as conn:
        for table, cols in targets.items():
            for col in cols:
                rows = conn.execute(text(f"SELECT id, {col} FROM {table} WHERE {col} LIKE '% %' OR {col} LIKE '%-%'")).fetchall()
                for row_id, value in rows:
                    conn.execute(text(f"UPDATE {table} SET {col} = :v WHERE id = :id"), {"v": normalize_phone(value), "id": row_id})


def add_teachers(engine):
    columns = {c["name"] for c in inspect(engine).get_columns("groups")}
    if "teacher_id" in columns:
        return
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE groups ADD COLUMN teacher_id INTEGER REFERENCES teachers(id)"))
        if "teacher_name" not in columns:
            return
        rows = conn.execute(text(
            "SELECT id, teacher_name, course, branch_id FROM groups WHERE teacher_name IS NOT NULL AND teacher_name != ''"
        )).fetchall()
        created = {}
        for group_id, name, course, branch_id in rows:
            if name not in created:
                result = conn.execute(
                    text("INSERT INTO teachers (full_name, phone, subject, branch_id) VALUES (:n, '', :s, :b)"),
                    {"n": name, "s": course or "", "b": branch_id},
                )
                created[name] = result.lastrowid
            conn.execute(text("UPDATE groups SET teacher_id = :t WHERE id = :g"), {"t": created[name], "g": group_id})
