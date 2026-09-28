# OnlineKurs

O'zbek tilidagi zamonaviy onlayn kurslar platformasi. Talabalar kurslarni ko'rib chiqadi, sotib oladi, video darslarni tomosha qiladi, progressini kuzatadi va sharh qoldiradi; o'qituvchilar kurs, bo'lim va darslarni yaratib video yuklaydi; adminlar butun tizimni boshqaradi.

- **Backend** — FastAPI + SQLAlchemy 2.0 + Pydantic v2, JWT autentifikatsiya, SQLite (standart) yoki MySQL
- **Frontend** — React 18 + TypeScript + Vite + Tailwind CSS, React Query, dark/light rejim, mobil moslashuv
- **Testlar** — pytest (backend), ESLint + TypeScript strict + Playwright e2e (frontend)

---

## Tez boshlash

Talablar: **Python 3.11+** va **Node.js 20+**.

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv/bin/pip install -r requirements.txt        # Windows: .venv\Scripts\pip install -r requirements.txt
.venv/bin/python -m app.db.seed                  # demo ma'lumotlar (bir marta)
.venv/bin/uvicorn app.main:app --reload --port 8000
```

API hujjatlari: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Sayt: http://localhost:5173

### Demo akkauntlar

Barchasining paroli: **`Parol123!`**

| Rol | Email |
|---|---|
| Admin | `admin@onlinekurs.uz` |
| O'qituvchi | `ustoz@onlinekurs.uz` |
| O'qituvchi | `ustoz2@onlinekurs.uz` |
| Talaba | `talaba@onlinekurs.uz` |

Seed 6 ta kategoriya, 10 ta kurs (108 dars), talabalar, sharhlar va oxirgi 6 oy bo'yicha to'lovlarni yaratadi. Uni qayta ishga tushirish xavfsiz — admin mavjud bo'lsa hech narsa qilmaydi.

---

## Imkoniyatlar

**Mehmon**
- Bosh sahifa: mashhur kurslar, yo'nalishlar, qidiruv
- Katalog: qidiruv, kategoriya / daraja / narx filtrlari, saralash, sahifalash (URL bilan sinxron)
- Kurs sahifasi: dastur (bo'limlar va darslar), bepul ko'rish mumkin bo'lgan darslar, o'qituvchi, sharhlar

**Talaba**
- Ro'yxatdan o'tish / kirish (JWT, refresh token)
- Bepul kursga yozilish, pullik kursni sotib olish (test to'lov)
- Dars pleyeri: video (mp4/webm yoki YouTube), qo'shimcha fayllar, "Darsni yakunlash", oldingi/keyingi dars
- Boshqaruv paneli: davom ettirish, progress, statistika
- Profil: ism, telefon, bio, avatar, parolni o'zgartirish
- Sharh va baho qoldirish (kursga kirish huquqi bo'lsa)

**O'qituvchi**
- Statistika: kurslar, talabalar, daromad, o'rtacha baho
- Kurs yaratish va tahrirlash: ma'lumot, muqova rasmi, dastur (bo'lim/dars qo'shish, tartiblash, video va fayl yuklash, bepul ko'rish belgisi), nashr qilish

**Admin**
- Statistika: foydalanuvchilar, kurslar, yozilishlar, daromad, oylik grafik, eng mashhur kurslar
- Foydalanuvchilar (rol, faollik), kurslar, to'lovlar (holatni o'zgartirish), kategoriyalar

---

## ⚠️ To'lov haqida

Platformada **haqiqiy to'lov tizimi yo'q**. `Sotib olish` tugmasi test (mock) checkout sahifasini ochadi: karta ma'lumotlari faqat brauzerda tekshiriladi, hech qayerga yuborilmaydi, va to'lov darhol "to'langan" deb belgilanadi. Haqiqiy tizim (Click, Payme va h.k.) ulash uchun `backend/app/api/routes/payments.py` dagi `confirm` mantiqini provayder callback'i bilan almashtiring.

---

## Sozlamalar (`.env`)

Namuna: ildizdagi `.env.example`. Backend uchun `backend/.env`, frontend uchun `frontend/.env`.

| O'zgaruvchi | Standart | Izoh |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./onlinekurs.db` | MySQL: `mysql+pymysql://user:parol@localhost:3306/onlinekurs` |
| `SECRET_KEY` | (dev kalit) | **Production'da albatta o'zgartiring** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `30` | |
| `CORS_ORIGINS` | `http://localhost:5173` | vergul bilan bir nechta |
| `BACKEND_URL` | `http://localhost:8000` | yuklangan fayllar URL'i uchun |
| `UPLOAD_DIR` | `backend/uploads` | |
| `MAX_UPLOAD_MB` | `500` | video uchun maksimal hajm |
| `ENVIRONMENT` | `development` | `production` — `/docs` yopiladi |
| `VITE_API_URL` | `http://localhost:8000` | frontend → backend manzili |

---

## Loyiha tuzilishi

```
backend/
  app/
    main.py            # FastAPI ilova, middleware, /uploads
    core/              # sozlamalar, xavfsizlik (bcrypt, JWT), dependency'lar
    db/                # engine, sessiya, seed
    models/            # SQLAlchemy jadvallar
    schemas/           # Pydantic so'rov/javob modellari
    services/          # biznes mantiq: kirish huquqi, progress, slug, fayllar
    api/routes/        # auth, users, categories, courses, sections, lessons,
                       # enrollments, payments, reviews, teacher, admin, uploads
  tests/               # pytest
  uploads/             # yuklangan fayllar (seed/ dan tashqari git'da yo'q)
frontend/
  src/
    api/               # axios klient (token refresh) + har bir domen uchun modul
    types/             # API bilan bir xil TypeScript tiplar
    context/           # Auth, Theme, Toast
    components/        # ui/ layout/ course/ guards/
    pages/             # public/ student/ teacher/ admin/
    router.tsx         # lazy yuklanadigan sahifa guruhlari, guardlar
    DESIGN.md          # komponentlar va dizayn tizimi haqida ma'lumotnoma
```

---

## Testlar va sifat tekshiruvi

```bash
# Backend
cd backend && .venv/bin/python -m pytest -q

# Frontend
cd frontend
npm run lint
npm run typecheck
npm run build
```

---

## Production uchun eslatmalar

1. `SECRET_KEY` ni tasodifiy qiymatga o'zgartiring: `python -c "import secrets; print(secrets.token_urlsafe(48))"`
2. `ENVIRONMENT=production`, `CORS_ORIGINS` va `BACKEND_URL` ni haqiqiy domenga sozlang
3. Frontend: `npm run build` → `frontend/dist/` ni nginx yoki istalgan statik hostingga joylang, `VITE_API_URL` ni backend domeniga qo'ying
4. Backend: `uvicorn app.main:app --host 0.0.0.0 --port 8000` (yoki gunicorn + uvicorn worker), `uploads/` papkasini doimiy diskda saqlang
5. Katta video fayllar uchun `MAX_UPLOAD_MB` va veb-server (nginx `client_max_body_size`) limitlarini moslang
