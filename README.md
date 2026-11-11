# EduCRM — O'quv markaz boshqaruv tizimi

O'quvchilar, ota-onalar, ustozlar, guruhlar, filiallar, kunlik davomat va oylik to'lovlarni boshqarish.

Bir xil kurs va vaqtda turli ustozlar bilan bir nechta (parallel) guruh ochish mumkin. Bitta ustozni bir vaqtda ikki guruhga qo'yib bo'lmaydi — tizim tekshiradi.

- **Frontend:** React + Vite + Tailwind CSS (UI komponentlar o'zimizniki, tayyor kutubxonasiz)
- **Backend:** Python (FastAPI + SQLite)

## Ishga tushirish

### 1. Backend
```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn main:app --reload
```
API: http://localhost:8000 · Hujjatlar: http://localhost:8000/docs
Birinchi ishga tushganda namunaviy ma'lumot qo'shiladi. Login: **admin / admin123**

AI ustoz sozlamalari `backend/.env` faylida (namuna: `backend/.env.example`, nusxa: `cp .env.example .env`). `.env` GitHub'ga yuklanmaydi; o'zgartirgandan keyin backend'ni qayta ishga tushiring.
- `ANTHROPIC_API_KEY` — markazning o'z Claude API kaliti (console.anthropic.com → API Keys). Balans tugasa AI ustoz to'xtaydi, CRM'ning qolgani ishlayveradi.
- `AI_TUTOR_MODEL` — `claude-opus-5-5` (standart), `claude-sonnet-5-5` (~2x arzon), `claude-haiku-4-5` (~4x arzon).
- `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` — rasmiy Azure ovozi. Bo'sh qolsa bepul `edge-tts` ishlatiladi (norasmiy, sinov uchun).
- Joriy sozlamani tekshirish: `GET /api/ai-tutor/status`.

Chekdagi markaz nomini o'zgartirish:
```bash
CENTER_NAME="Bilim o'quv markazi" ./venv/bin/uvicorn main:app --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Ochish: http://localhost:5173

## Foydalanuvchilar, rollar va ruxsatlar

"Foydalanuvchilar" bo'limida (faqat Bosh admin):
- **Rollar** yaratiladi va har biriga ruxsatlar belgilanadi (Admin, Reception, Kassir, Ustoz — tayyor).
- **Foydalanuvchi** qo'shiladi, unga rol va kerak bo'lsa qo'shimcha ruxsat beriladi.
- Foydalanuvchini **ustozga bog'lash** mumkin — u faqat o'z guruhlari va o'quvchilarini ko'radi.

Ruxsatlar ro'yxati: `backend/permissions.py`.

## Chek printeri (avtomatik chop etish)

Brauzer printerga oynasiz yubora olmaydi, shuning uchun kassa kompyuterida kichik **print agent** ishlaydi
(`print-agent/`). U chekni ESC/POS bilan to'g'ridan-to'g'ri printerga yuboradi: oynasiz, qog'oz kesiladi, 58/80 mm.

1. Kassa kompyuterida: Python + `pip install pywin32` (Windows)
2. EduCRM → Sozlamalar → **Chek printeri** → "Agentni yuklab olish", `start_agent_windows.bat` ni ishga tushirish
3. Printerni tanlash, "Sinov cheki" — tayyor. To'lovdan keyin chek o'zi chiqadi.

Batafsil: `print-agent/README.txt`.

## Tuzilishi

```
backend/
  main.py          — ilova, routerlarni ulash
  database.py      — SQLite ulanishi
  models.py        — jadvallar: User, Branch, Teacher, Group, Student, Attendance, Payment
  migrate.py       — eski bazani yangi tuzilishga moslash (ma'lumot yo'qolmaydi)
  permissions.py   — ruxsatlar katalogi va standart rollar
  schemas.py       — so'rov/javob shakllari
  auth.py          — parol, token
  utils.py         — umumiy funksiyalar (oy, to'lov holati)
  seed.py          — namunaviy ma'lumot
  routers/         — har bir bo'lim uchun API

print-agent/       — kassa kompyuteri uchun chek agenti (Python)

frontend/src/
  api.js           — backendga so'rov yuborish
  context/         — Auth (kim kirgan), Branch (tanlangan filial)
  hooks/           — useFetch, useForm, useVirtualList, useDisclosure, ...
  components/
    ui/            — Button, Input, Select, Modal, VirtualTable, Tabs, Badge, BarChart, Toast, Icon ...
    layout/        — Sidebar, Topbar, AppLayout
    common/        — PersonCell, PhoneLink, RowActions, AttendanceToggle, Toolbar
    forms/         — StudentFormModal, GroupFormModal, PaymentFormModal, ...
    payments/ students/ groups/ branches/ — sahifaga xos bo'laklar
  pages/           — Dashboard, Students, StudentDetail, Groups, Teachers, Attendance, Payments, Branches, Users
```

## Asosiy komponentlar

- **`VirtualTable`** — faqat ekranda ko'ringan qatorlarni chizadi (`hooks/useVirtualList.js`), minglab qatorda ham tez ishlaydi.
- **`Select`** — o'zimiz yasagan: qidiruv, klaviatura (↑ ↓ Enter Esc), tozalash, pastda joy bo'lmasa yuqoriga ochiladi.
- **`FormModal`** — hamma formalar uchun umumiy oyna: saqlash, yuklanish, xato xabari.
- Dizayn ranglari `src/index.css` dagi `@theme` ichida — rangni bir joyda o'zgartirsangiz hamma joyda o'zgaradi.
