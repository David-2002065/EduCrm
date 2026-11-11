"""Login, parol va token bilan ishlash."""
import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from models import User

SECRET_KEY = os.getenv("SECRET_KEY", "oquv-markaz-maxfiy-kalit-ozgartiring")
TOKEN_DAYS = 7

bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return salt.hex() + "$" + digest.hex()


def verify_password(password: str, stored: str) -> bool:
    salt_hex, digest_hex = stored.split("$")
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 100_000)
    return digest.hex() == digest_hex


def _keystream(nonce: bytes, length: int) -> bytes:
    out, counter = b"", 0
    while len(out) < length:
        out += hmac.new(SECRET_KEY.encode(), nonce + counter.to_bytes(4, "big"), hashlib.sha256).digest()
        counter += 1
    return out[:length]


def encrypt_secret(text: str) -> str:
    """Parolni bosh admin ko'rishi uchun qaytariladigan shifrda saqlash (kalit — SECRET_KEY)."""
    nonce, data = os.urandom(12), text.encode()
    cipher = bytes(a ^ b for a, b in zip(data, _keystream(nonce, len(data))))
    tag = hmac.new(SECRET_KEY.encode(), nonce + cipher, hashlib.sha256).digest()[:8]
    return base64.urlsafe_b64encode(nonce + tag + cipher).decode()


def decrypt_secret(token: str):
    """Shifrni ochadi. Kalit o'zgargan yoki ma'lumot buzilgan bo'lsa — None."""
    try:
        raw = base64.urlsafe_b64decode(token.encode())
        nonce, tag, cipher = raw[:12], raw[12:20], raw[20:]
        if not hmac.compare_digest(tag, hmac.new(SECRET_KEY.encode(), nonce + cipher, hashlib.sha256).digest()[:8]):
            return None
        return bytes(a ^ b for a, b in zip(cipher, _keystream(nonce, len(cipher)))).decode()
    except (ValueError, UnicodeDecodeError):
        return None


def create_token(user_id: int) -> str:
    payload = {"sub": str(user_id), "exp": datetime.utcnow() + timedelta(days=TOKEN_DAYS)}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    """Har bir himoyalangan so'rovda tokenni tekshiradi."""
    if not creds:
        raise HTTPException(401, "Tizimga kiring")
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Token yaroqsiz")
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(401, "Foydalanuvchi topilmadi")
    return user


def require_perm(*perms):
    """Endpoint uchun ruxsat tekshiruvi. Bir nechta berilsa — bittasi bo'lsa yetarli.
    Ishlatish: _=Depends(require_perm("payments.create"))"""

    def checker(user: User = Depends(get_current_user)) -> User:
        if not set(perms) & set(user.permissions):
            raise HTTPException(403, "Bu amal uchun ruxsat yo'q")
        return user

    return checker


def teacher_scope(user: User):
    """Ustoz akkaunti bo'lsa — uning teacher_id si (faqat o'z guruhlarini ko'radi), aks holda None."""
    return user.teacher_id
