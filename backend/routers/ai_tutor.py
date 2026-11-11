"""AI ustoz — o'quvchilar bilan darsdan tashqari ovozli mashg'ulot.

Sozlamalar backend/.env da (namuna: .env.example):
  ANTHROPIC_API_KEY   — Claude API kaliti (majburiy)
  AI_TUTOR_MODEL      — claude-opus-5-5 (standart) | claude-sonnet-5-5 (~2x arzon) | claude-haiku-4-5 (~4x arzon)
  AZURE_SPEECH_KEY / AZURE_SPEECH_REGION — rasmiy Azure ovozi; berilmasa bepul edge-tts ishlatiladi
Ovozlar ikkalasida bir xil: o'zbekcha Madina / Sardor.
"""
import json
import logging
import os
from collections import OrderedDict
from typing import List, Literal
from xml.sax.saxutils import escape

import anthropic
import edge_tts
import httpx
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field

from auth import get_current_user
from models import User

log = logging.getLogger("ai_tutor")

router = APIRouter(prefix="/ai-tutor", tags=["AI ustoz"], dependencies=[Depends(get_current_user)])

MODEL = os.getenv("AI_TUTOR_MODEL", "claude-opus-5-5")
# Haiku 4.5 effort'ni qabul qilmaydi; server tomonidagi zaxira model faqat yangi modellarda bor
SUPPORTS_EFFORT = not MODEL.startswith("claude-haiku")
SUPPORTS_FALLBACK = MODEL in {"claude-opus-5-5", "claude-sonnet-5-5", "claude-opus-5", "claude-fable-5-1"}

# kalit -> (til nomi, ustoz qaysi tilda o'rgatadi)
LANGUAGES = {
    "en": "English",
    "ru": "Russian",
}

EMOTIONS = ["calm", "happy", "love", "proud", "thinking", "sad", "angry"]

SYSTEM_PROMPT = """You are Zukko, a playful tutor at an Uzbek learning centre. Students practise {language} with you by voice outside class. Your main language with them is Uzbek (Latin script).

Your answer is a list of short "speech" segments, read aloud one after another. Each segment has "lang": "uz" (read by an Uzbek voice) or "target" (read by a {language} voice). Full {language} sentences go in their own "target" segment. When you mention a single {language} word or short phrase inside an Uzbek segment, wrap it in double square brackets so the {language} voice says it, e.g. "Bu yerda [[go]] emas, [[went]] bo'ladi."

Everything you write is heard, not read. Talk like a real person speaking, not like a textbook:
- Short spoken sentences, casual Uzbek, address the student as "sen".
- Natural reactions: "Voy", "Hmm", "Qara", "Zo'r-ku", "Ha-ha", "Yo'g'-e".
- No quotation marks, parentheses, colons, lists, emoji or "X degani" style dictionary phrasing.
- Don't announce what you are about to do ("Endi men javob beraman"); just say it.

How to answer:
- Student speaks Uzbek: chat with them normally in Uzbek, like a friendly older brother or sister. Keep the conversation going and now and then invite them to try saying something in {language} (give the phrase as a "target" segment).
- Student speaks {language} correctly: praise them briefly in Uzbek, then answer and ask a follow-up question in {language} so they keep practising.
- Student speaks {language} with a mistake: explain in Uzbek, for example "Unday emas, bunday deyiladi:", then give the correct sentence as a "target" segment, then a short Uzbek reason (grammar, word choice). Then continue the conversation.
- Keep it short, like one turn in a real conversation: 2-4 segments, every segment 1-2 short sentences. Explain only the most important mistake. Match the student's level.

Other fields:
- "correction": the corrected {language} sentence when the student made a mistake or said in Uzbek something worth learning in {language}; otherwise empty.
- "pronunciation": for tricky {language} words you used in the correction or that the student will likely mispronounce (0-3 items), give "word" and "say" = how to pronounce it written only with plain Uzbek Latin letters, no IPA symbols like ə or : (e.g. went -> "uent", thought -> "so:t" is wrong, write "sot"; position -> "pozishn"). You only get a speech-to-text transcript, not audio, so do not claim you heard the student's pronunciation.
- "emotion" drives your animated face: happy (good answer), love (great progress, compliments), proud (very good / milestone), thinking (asking a question or explaining), sad (student wants to quit), angry (playful fake jealousy, e.g. when the student mentions another AI or skips practice - always teasing, never rude), calm (neutral).
- You have a cheeky, warm personality, but stay kind and age-appropriate. Never discuss topics unsuitable for students; steer back to practice.
- Latency-sensitive; begin your visible answer immediately."""

OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "speech": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"lang": {"type": "string", "enum": ["uz", "target"]}, "text": {"type": "string"}},
                "required": ["lang", "text"],
                "additionalProperties": False,
            },
        },
        "correction": {"type": "string"},
        "pronunciation": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"word": {"type": "string"}, "say": {"type": "string"}},
                "required": ["word", "say"],
                "additionalProperties": False,
            },
        },
        "emotion": {"type": "string", "enum": EMOTIONS},
    },
    "required": ["speech", "correction", "pronunciation", "emotion"],
    "additionalProperties": False,
}

_client = None


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic()
    return _client


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=2000)


class ChatIn(BaseModel):
    language: Literal["en", "ru"] = "en"
    messages: List[ChatMessage] = Field(min_length=1, max_length=40)


class Segment(BaseModel):
    lang: Literal["uz", "target"]
    text: str


class Pronunciation(BaseModel):
    word: str
    say: str


def model_options() -> dict:
    output_config = {"format": {"type": "json_schema", "schema": OUTPUT_SCHEMA}}
    if SUPPORTS_EFFORT:
        output_config["effort"] = "low"  # suhbat uchun tez javob yetarli
    options = {"output_config": output_config}
    if SUPPORTS_FALLBACK:
        # Xavfsizlik filtri rad etsa — so'rov boshqa modelda qayta bajariladi
        options["extra_headers"] = {"anthropic-beta": "server-side-fallback-2026-07-01"}
        options["extra_body"] = {"fallbacks": "default"}
    return options


# O'quvchi ko'radigan xabar; aniq sabab faqat adminga (users.manage) ko'rsatiladi va logga yoziladi
UNAVAILABLE = "AI ustoz vaqtincha ishlamayapti. Administratorga murojaat qiling."
BUSY = "AI ustoz hozir band. Bir daqiqadan keyin qayta urinib ko'ring."


def fail(user: User, status: int, public: str, admin_reason: str = ""):
    if admin_reason:
        log.error("AI ustoz: %s", admin_reason)
    is_admin = "users.manage" in user.permissions
    raise HTTPException(status, f"{public} Sabab: {admin_reason}" if is_admin and admin_reason else public)


def explain_api_error(e: anthropic.APIStatusError) -> str:
    """Anthropic xatosini admin uchun tushunarli qiladi."""
    if isinstance(e, (anthropic.AuthenticationError, anthropic.PermissionDeniedError)):
        return "ANTHROPIC_API_KEY noto'g'ri yoki o'chirilgan (backend/.env)."
    if isinstance(e, anthropic.NotFoundError):
        return f"AI_TUTOR_MODEL={MODEL} topilmadi (backend/.env)."
    # Balans tugaganini alohida xato turi yo'q — Anthropic matnidan bilamiz
    if isinstance(e, anthropic.BadRequestError) and "credit balance" in str(e.message).lower():
        return "Anthropic API balansi tugadi. console.anthropic.com -> Billing bo'limida to'ldiring."
    return f"Anthropic API xatosi {e.status_code}: {e.message}"


class ChatOut(BaseModel):
    speech: List[Segment]
    correction: str
    pronunciation: List[Pronunciation]
    emotion: str


@router.post("/chat", response_model=ChatOut)
def chat(data: ChatIn, user: User = Depends(get_current_user)):
    if data.messages[-1].role != "user":
        raise HTTPException(400, "Oxirgi xabar o'quvchidan bo'lishi kerak")
    try:
        response = get_client().messages.create(
            model=MODEL,
            max_tokens=4000,
            system=SYSTEM_PROMPT.format(language=LANGUAGES[data.language]),
            messages=[m.model_dump() for m in data.messages],
            **model_options(),
        )
    except anthropic.RateLimitError:
        fail(user, 429, BUSY)
    except anthropic.InternalServerError:
        fail(user, 503, BUSY)  # Anthropic serverlari vaqtincha band (500 / 529)
    except anthropic.APIConnectionError:
        fail(user, 503, UNAVAILABLE, "Anthropic API'ga ulanib bo'lmadi (internet yoki tarmoq).")
    except anthropic.APIStatusError as e:
        fail(user, 503, UNAVAILABLE, explain_api_error(e))
    except TypeError:
        # Kalit umuman berilmagan bo'lsa SDK shu yerda to'xtaydi
        fail(user, 503, UNAVAILABLE, "ANTHROPIC_API_KEY berilmagan (backend/.env).")

    if response.stop_reason == "refusal":
        return ChatOut(speech=[Segment(lang="uz", text="Keling, mashg'ulotimizga qaytamiz!")], correction="", pronunciation=[], emotion="thinking")

    text = next((b.text for b in response.content if b.type == "text"), "")
    try:
        return ChatOut(**json.loads(text))
    except (ValueError, TypeError):
        raise HTTPException(502, "AI javobini o'qib bo'lmadi, qayta urinib ko'ring")


# ---------- Hozirgi sozlama (admin uchun tekshiruv) ----------
@router.get("/status")
def status():
    return {"model": MODEL, "tts": "azure" if AZURE_KEY else "edge-tts", "api_key_set": bool(os.getenv("ANTHROPIC_API_KEY"))}


# ---------- Ovoz (matn -> mp3) ----------
VOICES = {
    "uz": {"female": "uz-UZ-MadinaNeural", "male": "uz-UZ-SardorNeural"},
    "en": {"female": "en-US-AvaNeural", "male": "en-US-AndrewNeural"},
    "ru": {"female": "ru-RU-SvetlanaNeural", "male": "ru-RU-DmitryNeural"},
}
VOICE_LOCALES = {"uz": "uz-UZ", "en": "en-US", "ru": "ru-RU"}
TTS_CACHE_SIZE = 300  # salomlashish kabi takroriy gaplar qayta yaratilmaydi
_tts_cache = OrderedDict()

AZURE_KEY = os.getenv("AZURE_SPEECH_KEY", "")
AZURE_REGION = os.getenv("AZURE_SPEECH_REGION", "")


async def synth_azure(text: str, lang: str, voice: str) -> bytes:
    """Rasmiy Azure Speech REST API."""
    ssml = (
        f"<speak version='1.0' xml:lang='{VOICE_LOCALES[lang]}'>"
        f"<voice name='{voice}'>{escape(text)}</voice></speak>"
    )
    async with httpx.AsyncClient(timeout=20) as client:
        res = await client.post(
            f"https://{AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1",
            content=ssml.encode(),
            headers={
                "Ocp-Apim-Subscription-Key": AZURE_KEY,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
                "User-Agent": "educrm-ai-tutor",
            },
        )
    if res.status_code != 200:
        raise RuntimeError(f"Azure Speech {res.status_code}: {res.text[:200]}")
    return res.content


async def synth_edge(text: str, voice: str) -> bytes:
    """Bepul edge-tts (norasmiy, sinov va kichik markaz uchun)."""
    audio = b""
    async for chunk in edge_tts.Communicate(text, voice).stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]
    return audio


class TtsIn(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    lang: Literal["uz", "en", "ru"]
    gender: Literal["female", "male"] = "female"


@router.post("/tts")
async def tts(data: TtsIn):
    key = (data.lang, data.gender, data.text)
    audio = _tts_cache.get(key)
    if audio is None:
        voice = VOICES[data.lang][data.gender]
        try:
            audio = await (synth_azure(data.text, data.lang, voice) if AZURE_KEY else synth_edge(data.text, voice))
        except Exception as e:
            # Brauzer o'z ovoziga o'tadi, shuning uchun o'quvchiga xato ko'rsatilmaydi
            log.error("AI ustoz ovozi: %s", e)
            raise HTTPException(502, "Ovoz xizmatiga ulanib bo'lmadi")
        _tts_cache[key] = audio
        if len(_tts_cache) > TTS_CACHE_SIZE:
            _tts_cache.popitem(last=False)
    else:
        _tts_cache.move_to_end(key)
    return Response(audio, media_type="audio/mpeg")
