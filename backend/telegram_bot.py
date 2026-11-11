"""O'quvchilar uchun Telegram bot: ro'yxatdan o'tish (telefon raqam) va test vazifalarni bajarish.

Sozlash: backend/.env ga TELEGRAM_BOT_TOKEN=... yozing (@BotFather dan olinadi).
Server (uvicorn) ishga tushganda bot ham o'zi ishga tushadi (long polling).
Alohida ishga tushirish ham mumkin:  python telegram_bot.py

Oqim:
  /start -> "Raqamni yuborish" tugmasi -> raqam o'quvchi yoki ota-ona raqamiga mos kelsa, bog'lanadi.
           Bitta raqamda bir nechta o'quvchi bo'lsa (masalan aka-uka) — ism familiya bo'yicha tanlanadi.
  Ustoz test qo'shsa -> guruhdagi bog'langan o'quvchilarga xabar + "Boshlash" tugmasi.
  Savollar A / B / C tugmalari bilan, oxirida nechta to'g'ri / xato ekani chiqadi.
"""
import json
from html import escape as esc
import logging
import os
import threading
import time
from datetime import datetime

import httpx

from database import SessionLocal
from models import Student, Test, TestAttempt
from utils import normalize_phone

log = logging.getLogger("telegram_bot")
LETTERS = "ABCDEFGH"


def token():
    return os.getenv("TELEGRAM_BOT_TOKEN", "").strip()


def call(method, **params):
    """Telegram Bot API so'rovi. Xato bo'lsa None qaytaradi (server ishini to'xtatmaydi)."""
    if not token():
        return None
    try:
        res = httpx.post(f"https://api.telegram.org/bot{token()}/{method}", json=params, timeout=40)
        data = res.json()
        if not data.get("ok"):
            log.warning("Telegram %s: %s", method, data.get("description"))
            return None
        return data["result"]
    except (httpx.HTTPError, ValueError) as e:
        log.warning("Telegram %s: %s", method, e)
        return None


def inline(rows):
    """[[(matn, callback_data), ...], ...] -> inline klaviatura."""
    return {"inline_keyboard": [[{"text": t, "callback_data": d} for t, d in row] for row in rows]}


# ---------- Admin paneldan chaqiriladi ----------
def notify_new_test(test_id: int):
    """Yangi test haqida guruhdagi bog'langan o'quvchilarga xabar yuboradi (fonda)."""
    if not token():
        return
    with SessionLocal() as db:
        test = db.get(Test, test_id)
        if not test:
            return
        students = [s for s in test.group.students if s.status == "active" and s.telegram_chat_id]
        for s in students:
            call(
                "sendMessage",
                chat_id=s.telegram_chat_id,
                text=f"📝 Yangi test vazifa: <b>{esc(test.title)}</b>\n"
                     f"O'quvchi: {esc(s.full_name)}\nSavollar soni: {len(test.questions)}",
                parse_mode="HTML",
                reply_markup=inline([[("▶️ Boshlash", f"start:{test.id}:{s.id}")]]),
            )


# ---------- Bot ichki mantiqi ----------
def on_start(chat_id):
    call(
        "sendMessage",
        chat_id=chat_id,
        text="Assalomu alaykum! Test vazifalarni olish uchun o'quv markazda ro'yxatdan o'tgan "
             "telefon raqamingizni yuboring 👇",
        reply_markup={
            "keyboard": [[{"text": "📱 Raqamni yuborish", "request_contact": True}]],
            "resize_keyboard": True,
            "one_time_keyboard": True,
        },
    )


def on_contact(db, chat_id, message):
    contact = message["contact"]
    if contact.get("user_id") != message["from"]["id"]:
        return call("sendMessage", chat_id=chat_id, text="Iltimos, o'zingizning raqamingizni yuboring.")
    phone = normalize_phone(contact["phone_number"])
    students = (
        db.query(Student)
        .filter(Student.status == "active", (Student.phone == phone) | (Student.parent_phone == phone))
        .order_by(Student.full_name).all()
    )
    if not students:
        return call("sendMessage", chat_id=chat_id, reply_markup={"remove_keyboard": True},
                    text="Bu raqam bazada topilmadi. O'quv markaz administratoriga murojaat qiling.")
    if len(students) == 1:
        return link_student(db, chat_id, students[0])
    call("sendMessage", chat_id=chat_id, reply_markup={"remove_keyboard": True}, text="Raqam topildi ✅")
    call(
        "sendMessage",
        chat_id=chat_id,
        text="Bu raqamda bir nechta o'quvchi bor. Ism familiyangizni tanlang:",
        reply_markup=inline([[(f"{s.full_name} · {s.group_name or '—'}", f"link:{s.id}:{phone}")] for s in students]),
    )


def link_student(db, chat_id, student):
    student.telegram_chat_id = str(chat_id)
    db.commit()
    call("sendMessage", chat_id=chat_id, reply_markup={"remove_keyboard": True},
         text=f"✅ {student.full_name} ({student.group_name or 'guruhsiz'}) ro'yxatdan o'tdi.\n"
              "Yangi test vazifalar shu yerga keladi. Hozirgi testlar: /tests")
    send_pending(db, chat_id)


def send_pending(db, chat_id):
    """Shu chatga bog'langan o'quvchilarning hali bajarilmagan testlari."""
    students = db.query(Student).filter(Student.telegram_chat_id == str(chat_id), Student.status == "active").all()
    if not students:
        return on_start(chat_id)
    rows = []
    for s in students:
        if not s.group_id:
            continue
        done = {a.test_id for a in db.query(TestAttempt).filter(TestAttempt.student_id == s.id,
                                                                TestAttempt.finished_at.isnot(None))}
        for t in db.query(Test).filter(Test.group_id == s.group_id).order_by(Test.created_at.desc()):
            if t.id not in done:
                label = t.title if len(students) == 1 else f"{s.full_name.split()[0]}: {t.title}"
                rows.append([(f"▶️ {label}", f"start:{t.id}:{s.id}")])
    if not rows:
        return call("sendMessage", chat_id=chat_id, text="Bajarilmagan test vazifa yo'q 🎉")
    call("sendMessage", chat_id=chat_id, text="Bajarilmagan testlar:", reply_markup=inline(rows))


def send_question(chat_id, test, attempt):
    index = len(attempt.answer_list)
    q = test.questions[index]
    options = q.option_list
    text = f"<b>{index + 1}/{len(test.questions)}.</b> {esc(q.text)}\n\n" + "\n".join(
        f"<b>{LETTERS[i]})</b> {esc(o)}" for i, o in enumerate(options)
    )
    buttons = [(LETTERS[i], f"ans:{attempt.id}:{index}:{i}") for i in range(len(options))]
    call("sendMessage", chat_id=chat_id, text=text, parse_mode="HTML", reply_markup=inline([buttons]))


def on_callback(db, cb):
    chat_id = cb["message"]["chat"]["id"]
    parts = cb.get("data", "").split(":")
    call("answerCallbackQuery", callback_query_id=cb["id"])

    if parts[0] == "link" and len(parts) == 3:
        student = db.get(Student, int(parts[1]))
        # Tanlangan o'quvchi rostdan shu raqamga tegishlimi
        if student and parts[2] in (student.phone, student.parent_phone):
            link_student(db, chat_id, student)
        return

    if parts[0] == "start" and len(parts) == 3:
        test, student = db.get(Test, int(parts[1])), db.get(Student, int(parts[2]))
        if not test or not student or student.telegram_chat_id != str(chat_id):
            return call("sendMessage", chat_id=chat_id, text="Test topilmadi.")
        if student.group_id != test.group_id or not test.questions:
            return call("sendMessage", chat_id=chat_id, text="Bu test sizning guruhingiz uchun emas.")
        attempt = db.query(TestAttempt).filter_by(test_id=test.id, student_id=student.id).first()
        if attempt and attempt.finished_at:
            return send_result(chat_id, test, attempt, again=True)
        if not attempt:
            attempt = TestAttempt(test_id=test.id, student_id=student.id, answers="[]")
            db.add(attempt)
            db.commit()
            call("sendMessage", chat_id=chat_id, parse_mode="HTML",
                 text=f"📝 <b>{esc(test.title)}</b> — {len(test.questions)} ta savol. Omad!")
        return send_question(chat_id, test, attempt)

    if parts[0] == "ans" and len(parts) == 4:
        attempt = db.get(TestAttempt, int(parts[1]))
        if not attempt or attempt.student.telegram_chat_id != str(chat_id) or attempt.finished_at:
            return
        index, choice = int(parts[2]), int(parts[3])
        answers = attempt.answer_list
        test = attempt.test
        if index != len(answers) or index >= len(test.questions):  # tugma ikki marta bosilgan yoki eski savol
            return
        q = test.questions[index]
        answers.append(choice)
        attempt.answers = json.dumps(answers)
        # Javob berilgan savoldan tugmalarni olib, tanlovni yozib qo'yamiz
        call("editMessageText", chat_id=chat_id, message_id=cb["message"]["message_id"], parse_mode="HTML",
             text=f"{esc(cb['message'].get('text', ''))}\n\nSizning javobingiz: <b>{LETTERS[choice]}</b>")
        if len(answers) < len(test.questions):
            db.commit()
            return send_question(chat_id, test, attempt)
        attempt.correct_count = sum(1 for qq, a in zip(test.questions, answers) if qq.correct_index == a)
        attempt.finished_at = datetime.now()
        db.commit()
        send_result(chat_id, test, attempt)


def send_result(chat_id, test, attempt, again=False):
    total = len(test.questions)
    wrong = [i for i, (q, a) in enumerate(zip(test.questions, attempt.answer_list)) if q.correct_index != a]
    lines = [
        "Siz bu testni avval bajargansiz." if again else "🏁 Test tugadi!",
        f"<b>{esc(test.title)}</b>",
        f"✅ To'g'ri: {attempt.correct_count}",
        f"❌ Xato: {total - attempt.correct_count}",
    ]
    if wrong:
        lines.append("\nXato savollar: " + ", ".join(
            f"{i + 1} (to'g'risi {LETTERS[test.questions[i].correct_index]})" for i in wrong))
    call("sendMessage", chat_id=chat_id, text="\n".join(lines), parse_mode="HTML")


def handle_update(update):
    with SessionLocal() as db:
        if "callback_query" in update:
            return on_callback(db, update["callback_query"])
        message = update.get("message")
        if not message:
            return
        chat_id = message["chat"]["id"]
        if "contact" in message:
            return on_contact(db, chat_id, message)
        text = (message.get("text") or "").strip()
        if text.startswith("/tests"):
            return send_pending(db, chat_id)
        linked = db.query(Student).filter(Student.telegram_chat_id == str(chat_id)).count()
        return send_pending(db, chat_id) if linked and not text.startswith("/start") else on_start(chat_id)


def run_polling(stop_event=None):
    log.info("Telegram bot ishga tushdi")
    call("setMyCommands", commands=[{"command": "start", "description": "Ro'yxatdan o'tish"},
                                    {"command": "tests", "description": "Bajarilmagan testlar"}])
    offset = 0
    while not (stop_event and stop_event.is_set()):
        updates = call("getUpdates", offset=offset, timeout=30, allowed_updates=["message", "callback_query"])
        if updates is None:
            time.sleep(5)
            continue
        for update in updates:
            offset = update["update_id"] + 1
            try:
                handle_update(update)
            except Exception:  # bitta xabardagi xato botni to'xtatmasin
                log.exception("Update %s", update.get("update_id"))


def start_in_background():
    """Server ishga tushganda chaqiriladi. Token bo'lmasa — hech narsa qilmaydi."""
    if not token():
        log.info("TELEGRAM_BOT_TOKEN yo'q — bot ishga tushmadi")
        return None
    stop = threading.Event()
    threading.Thread(target=run_polling, args=(stop,), daemon=True, name="telegram-bot").start()
    return stop


if __name__ == "__main__":
    from pathlib import Path

    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env")
    logging.basicConfig(level=logging.INFO)
    run_polling()
