"""Test vazifalar: ustoz o'z guruhiga test qo'shadi, o'quvchilar Telegram botda bajaradi."""
import json
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

import schemas
import telegram_bot
from auth import require_perm, teacher_scope
from database import get_db
from models import Group, Student, Test, TestQuestion

router = APIRouter(prefix="/tests", tags=["Test vazifalar"])


def check_group(db: Session, group_id: int, user) -> Group:
    group = db.get(Group, group_id)
    if not group:
        raise HTTPException(404, "Guruh topilmadi")
    if teacher_scope(user) and group.teacher_id != teacher_scope(user):
        raise HTTPException(403, "Bu guruh sizniki emas")
    return group


def get_test(db: Session, test_id: int, user) -> Test:
    test = db.get(Test, test_id)
    if not test:
        raise HTTPException(404, "Test topilmadi")
    check_group(db, test.group_id, user)
    return test


def to_out(t: Test, questions=False) -> dict:
    out = {
        "id": t.id, "group_id": t.group_id, "group_name": t.group_name, "title": t.title,
        "author_name": t.author_name, "created_at": t.created_at.isoformat(),
        "question_count": len(t.questions),
        "finished_count": sum(1 for a in t.attempts if a.finished_at),
    }
    if questions:
        out["questions"] = [
            {"id": q.id, "text": q.text, "options": q.option_list, "correct_index": q.correct_index}
            for q in t.questions
        ]
    return out


def set_questions(test: Test, data: schemas.TestIn):
    test.questions = [
        TestQuestion(position=i, text=q.text, options=json.dumps(q.options, ensure_ascii=False), correct_index=q.correct_index)
        for i, q in enumerate(data.questions)
    ]


@router.get("")
def list_tests(group_id: int, db: Session = Depends(get_db), user=Depends(require_perm("tests.manage"))):
    group = check_group(db, group_id, user)
    active = [s for s in group.students if s.status == "active"]
    tests = db.query(Test).filter(Test.group_id == group_id).order_by(Test.created_at.desc()).all()
    return {
        "student_count": len(active),
        "telegram_count": sum(1 for s in active if s.telegram_chat_id),
        "bot_enabled": bool(telegram_bot.token()),
        "tests": [to_out(t) for t in tests],
    }


@router.get("/{test_id}")
def get_one(test_id: int, db: Session = Depends(get_db), user=Depends(require_perm("tests.manage"))):
    return to_out(get_test(db, test_id, user), questions=True)


@router.post("")
def create_test(data: schemas.TestIn, background: BackgroundTasks, db: Session = Depends(get_db),
                user=Depends(require_perm("tests.manage"))):
    check_group(db, data.group_id, user)
    test = Test(group_id=data.group_id, title=data.title, created_by=user.id)
    set_questions(test, data)
    db.add(test)
    db.commit()
    db.refresh(test)
    background.add_task(telegram_bot.notify_new_test, test.id)  # o'quvchilarga Telegramda xabar
    return to_out(test)


@router.put("/{test_id}")
def update_test(test_id: int, data: schemas.TestIn, db: Session = Depends(get_db), user=Depends(require_perm("tests.manage"))):
    test = get_test(db, test_id, user)
    if data.group_id != test.group_id:
        raise HTTPException(400, "Testni boshqa guruhga ko'chirib bo'lmaydi")
    if test.attempts:
        raise HTTPException(400, "O'quvchilar bu testni boshlagan — endi tahrirlab bo'lmaydi")
    test.title = data.title
    set_questions(test, data)
    db.commit()
    return to_out(test)


@router.delete("/{test_id}")
def delete_test(test_id: int, db: Session = Depends(get_db), user=Depends(require_perm("tests.manage"))):
    db.delete(get_test(db, test_id, user))
    db.commit()
    return {"ok": True}


@router.get("/{test_id}/results")
def results(test_id: int, db: Session = Depends(get_db), user=Depends(require_perm("tests.manage"))):
    """Guruhdagi har bir o'quvchi: bajardimi, nechta to'g'ri / xato va har bir savolga javobi."""
    test = get_test(db, test_id, user)
    attempts = {a.student_id: a for a in test.attempts}
    students = (
        db.query(Student)
        .filter((Student.group_id == test.group_id) | Student.id.in_(attempts.keys()))
        .filter(Student.status == "active")
        .order_by(Student.full_name).all()
    )
    total = len(test.questions)
    rows = []
    for s in students:
        a = attempts.get(s.id)
        answers = a.answer_list if a else []
        status = "done" if a and a.finished_at else ("started" if a else "pending")
        rows.append({
            "student_id": s.id, "full_name": s.full_name, "phone": s.phone, "parent_phone": s.parent_phone,
            "telegram": bool(s.telegram_chat_id), "status": status,
            "correct": a.correct_count if status == "done" else sum(
                1 for q, x in zip(test.questions, answers) if q.correct_index == x),
            "answered": len(answers),
            "total": total,
            "finished_at": a.finished_at.isoformat() if a and a.finished_at else None,
            # har bir savol: tanlangan variant (yoki None) va to'g'rimi
            "answers": [
                {"choice": answers[i] if i < len(answers) else None,
                 "correct": i < len(answers) and answers[i] == q.correct_index}
                for i, q in enumerate(test.questions)
            ],
        })
    return {"test": to_out(test, questions=True), "results": rows}
