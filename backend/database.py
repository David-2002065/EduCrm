"""Ma'lumotlar bazasi ulanishi (SQLite)."""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = "sqlite:///./oquv_markaz.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """Har bir so'rov uchun alohida sessiya ochib, oxirida yopadi."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
