"""O'quv markaz API.

Ishga tushirish:  uvicorn main:app --reload
Hujjatlar:        http://localhost:8000/docs
"""
import io
import zipfile
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

# backend/.env dagi maxfiy sozlamalar (ANTHROPIC_API_KEY va h.k.) — boshqa importlardan oldin
load_dotenv(Path(__file__).resolve().parent / ".env")

from database import Base, SessionLocal, engine
from migrate import migrate
import telegram_bot
from routers import ai_tutor, attendance, auth_users, branches, dashboard, groups, payments, students, teachers, tests
from seed import seed

Base.metadata.create_all(bind=engine)
migrate(engine)

app = FastAPI(title="O'quv markaz API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

AGENT_DIR = Path(__file__).resolve().parent.parent / "print-agent"


@app.get("/api/print-agent.zip", tags=["Chek printeri"])
def download_print_agent():
    """Kassa kompyuteri uchun chek agentini zip qilib beradi (Sozlamalar -> Chek printeri)."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as z:
        for f in AGENT_DIR.iterdir():
            if f.is_file():
                z.write(f, f"edu-print-agent/{f.name}")
    return Response(buffer.getvalue(), media_type="application/zip",
                    headers={"Content-Disposition": 'attachment; filename="edu-print-agent.zip"'})


for r in (auth_users, branches, teachers, groups, students, attendance, payments, dashboard, ai_tutor, tests):
    app.include_router(r.router, prefix="/api")


@app.on_event("startup")
def on_startup():
    # Baza bo'sh bo'lsa, namunaviy ma'lumot qo'shadi (admin / admin123)
    with SessionLocal() as db:
        seed(db)
    telegram_bot.start_in_background()  # TELEGRAM_BOT_TOKEN bo'lsa — o'quvchilar boti
