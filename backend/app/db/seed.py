"""Demo data: `python -m app.db.seed`. Idempotent — skips when the admin account exists."""

import logging
import random
from dataclasses import dataclass
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base, utcnow
from app.db.session import SessionLocal, engine
from app.models import (
    Category,
    Course,
    CourseLevel,
    Enrollment,
    Lesson,
    LessonProgress,
    Payment,
    PaymentStatus,
    Review,
    Section,
    User,
    UserRole,
)
from app.services.slugs import generate_category_slug, generate_course_slug
from app.services.storage import public_url

logger = logging.getLogger("onlinekurs.seed")

ADMIN_EMAIL = "admin@onlinekurs.uz"
DEMO_PASSWORD = "Parol123!"
SEED_IMAGES = ("glavniy.png", "wallhaven-pk25m9.png")

VIDEO_BASE = "https://storage.googleapis.com/gtv-videos-bucket/sample"
VIDEOS = [
    f"{VIDEO_BASE}/BigBuckBunny.mp4",
    f"{VIDEO_BASE}/ElephantsDream.mp4",
    f"{VIDEO_BASE}/ForBiggerBlazes.mp4",
    f"{VIDEO_BASE}/Sintel.mp4",
    f"{VIDEO_BASE}/TearsOfSteel.mp4",
]

CATEGORIES = [
    ("Dasturlash", "code", "Python, JavaScript, mobil va veb dasturlash kurslari"),
    ("Dizayn", "palette", "UI/UX, grafik dizayn va brending"),
    ("Marketing", "megaphone", "SMM, kontent va raqamli marketing"),
    ("Tillar", "languages", "Ingliz, rus va boshqa xorijiy tillar"),
    ("Biznes", "briefcase", "Tadbirkorlik, boshqaruv va moliya"),
    ("Matematika", "calculator", "Maktab va oliy matematika, mantiq"),
]

TEACHERS = [
    (
        "ustoz@onlinekurs.uz",
        "Dilshod Karimov",
        "+998901234567",
        "10 yildan ortiq tajribaga ega dasturchi va o'qituvchi. Python, JavaScript va veb texnologiyalar bo'yicha 5000 dan ortiq talabaga dars bergan.",
    ),
    (
        "ustoz2@onlinekurs.uz",
        "Nilufar Rashidova",
        "+998907654321",
        "UI/UX dizayner va marketing mutaxassisi. Xalqaro brendlar bilan ishlagan, IELTS 8.0 sertifikatiga ega.",
    ),
]

EXTRA_STUDENTS = [
    ("Madina Yusupova", "madina@example.uz"),
    ("Jasur Abdullayev", "jasur@example.uz"),
    ("Sevara Qodirova", "sevara@example.uz"),
    ("Bekzod Rahimov", "bekzod@example.uz"),
    ("Kamola Ergasheva", "kamola@example.uz"),
    ("Sardor Mirzayev", "sardor@example.uz"),
]

LESSON_DESCRIPTION = (
    "Bu darsda mavzuni amaliy misollar orqali ko'rib chiqamiz va uy vazifasini bajaramiz."
)

REVIEW_COMMENTS = [
    "Juda tushunarli va amaliy kurs. Har bir mavzu misollar bilan yoritilgan.",
    "O'qituvchi mavzularni oddiy tilda tushuntiradi, yangi boshlovchilar uchun ayni muddao.",
    "Kurs kutganimdan ham yaxshi chiqdi. Uy vazifalari haqiqiy loyihalarga o'xshaydi.",
    "Ba'zi mavzular tezroq o'tilgan, lekin umumiy sifat yuqori.",
    "Narxiga arziydi. Ayniqsa amaliy darslar juda foydali bo'ldi.",
    "Materiallar yangi va zamonaviy. Tavsiya qilaman!",
]


@dataclass
class LessonSpec:
    title: str
    minutes: int


@dataclass
class SectionSpec:
    title: str
    lessons: list[LessonSpec]


@dataclass
class CourseSpec:
    title: str
    short_description: str
    description: str
    category: str
    teacher: str
    level: CourseLevel
    price: int
    what_you_learn: list[str]
    requirements: list[str]
    sections: list[SectionSpec]
    cover: str | None = None
    is_published: bool = True


def _lessons(*items: tuple[str, int]) -> list[LessonSpec]:
    return [LessonSpec(title, minutes) for title, minutes in items]


COURSES: list[CourseSpec] = [
    CourseSpec(
        title="Python asoslari: noldan dasturchigacha",
        short_description="Python tilini noldan o'rganing va birinchi dasturlaringizni yozing.",
        description=(
            "Ushbu kurs dasturlashni endi boshlayotganlar uchun mo'ljallangan. Siz Python sintaksisi, "
            "ma'lumot turlari, shartli operatorlar, sikllar, funksiyalar va obyektga yo'naltirilgan dasturlash "
            "asoslarini o'rganasiz. Kurs davomida 3 ta amaliy loyiha yaratiladi: kalkulyator, matnli o'yin "
            "va oddiy Telegram bot."
        ),
        category="Dasturlash",
        teacher="ustoz@onlinekurs.uz",
        level=CourseLevel.beginner,
        price=0,
        what_you_learn=[
            "Python sintaksisi va asosiy ma'lumot turlari",
            "Shartli operatorlar va sikllar bilan ishlash",
            "Funksiyalar va modullar yaratish",
            "Fayllar va xatoliklar bilan ishlash",
            "Birinchi Telegram botni yozish",
        ],
        requirements=["Kompyuter va internet", "Dasturlash tajribasi talab qilinmaydi"],
        cover="glavniy.png",
        sections=[
            SectionSpec(
                "Kirish",
                _lessons(
                    ("Kurs haqida va Python o'rnatish", 12),
                    ("Birinchi dastur: print va input", 15),
                    ("O'zgaruvchilar va ma'lumot turlari", 20),
                ),
            ),
            SectionSpec(
                "Boshqaruv konstruksiyalari",
                _lessons(
                    ("if-elif-else shartlari", 18),
                    ("for va while sikllari", 22),
                    ("Ro'yxatlar va lug'atlar", 25),
                    ("Amaliyot: son topish o'yini", 17),
                ),
            ),
            SectionSpec(
                "Funksiyalar va modullar",
                _lessons(
                    ("Funksiya yaratish va chaqirish", 20),
                    ("Argumentlar va qaytariladigan qiymat", 18),
                    ("Modullar va pip", 16),
                    ("Xatoliklarni ushlash", 14),
                ),
            ),
            SectionSpec(
                "Yakuniy loyiha",
                _lessons(
                    ("Telegram bot: tayyorgarlik", 15),
                    ("Botga buyruqlar qo'shish", 24),
                    ("Loyihani yakunlash", 19),
                ),
            ),
        ],
    ),
    CourseSpec(
        title="Frontend: HTML, CSS va JavaScript",
        short_description="Zamonaviy veb-saytlar yaratishni noldan o'rganing.",
        description=(
            "Kursda siz HTML5 belgilash tili, CSS3 bilan uslublash, Flexbox va Grid, moslashuvchan dizayn "
            "hamda JavaScript asoslarini o'rganasiz. Yakunda to'liq ishlaydigan portfolio sayt yaratasiz."
        ),
        category="Dasturlash",
        teacher="ustoz@onlinekurs.uz",
        level=CourseLevel.beginner,
        price=299000,
        what_you_learn=[
            "HTML5 semantik belgilash",
            "CSS Flexbox va Grid",
            "Moslashuvchan (responsive) dizayn",
            "JavaScript bilan DOM boshqarish",
            "Portfolio sayt yaratish",
        ],
        requirements=["Brauzer va matn muharriri", "Dasturlash tajribasi shart emas"],
        cover="wallhaven-pk25m9.png",
        sections=[
            SectionSpec(
                "HTML asoslari",
                _lessons(
                    ("Veb qanday ishlaydi", 10),
                    ("HTML hujjat tuzilishi", 18),
                    ("Matn, havola va rasmlar", 20),
                    ("Jadvallar va formalar", 22),
                ),
            ),
            SectionSpec(
                "CSS bilan uslublash",
                _lessons(
                    ("Selektorlar va xususiyatlar", 20),
                    ("Box model", 18),
                    ("Flexbox", 25),
                    ("Grid", 24),
                    ("Media so'rovlar", 16),
                ),
            ),
            SectionSpec(
                "JavaScript asoslari",
                _lessons(
                    ("O'zgaruvchilar va funksiyalar", 22),
                    ("DOM bilan ishlash", 26),
                    ("Hodisalar (events)", 20),
                ),
            ),
            SectionSpec(
                "Loyiha",
                _lessons(
                    ("Portfolio sayt: maket", 15),
                    ("Portfolio sayt: kod", 35),
                    ("Saytni internetga joylash", 12),
                ),
            ),
        ],
    ),
    CourseSpec(
        title="Figma'da UI/UX dizayn",
        short_description="Figma yordamida mobil va veb ilovalar dizaynini yarating.",
        description=(
            "UI/UX dizayn asoslari, foydalanuvchi tadqiqoti, wireframe va prototiplash. Figma'ning barcha "
            "asosiy vositalari: auto layout, komponentlar, variantlar va dizayn tizimlari."
        ),
        category="Dizayn",
        teacher="ustoz2@onlinekurs.uz",
        level=CourseLevel.intermediate,
        price=450000,
        what_you_learn=[
            "UX tadqiqot va foydalanuvchi yo'li",
            "Wireframe va prototip yaratish",
            "Figma auto layout va komponentlar",
            "Dizayn tizimini qurish",
        ],
        requirements=["Figma (bepul versiya yetarli)", "Dizaynga qiziqish"],
        sections=[
            SectionSpec(
                "UX asoslari",
                _lessons(
                    ("Dizayn jarayoni", 14),
                    ("Foydalanuvchi tadqiqoti", 20),
                    ("Foydalanuvchi yo'li (user flow)", 18),
                ),
            ),
            SectionSpec(
                "Figma vositalari",
                _lessons(
                    ("Interfeys bilan tanishuv", 16),
                    ("Auto layout", 24),
                    ("Komponentlar va variantlar", 26),
                    ("Stillar va dizayn tizimi", 22),
                ),
            ),
            SectionSpec(
                "Amaliy loyiha",
                _lessons(
                    ("Mobil ilova: ekranlar", 30),
                    ("Prototip va animatsiya", 20),
                    ("Dasturchilarga topshirish", 15),
                ),
            ),
        ],
    ),
    CourseSpec(
        title="Instagram marketing",
        short_description="Instagram orqali mijozlar topish va savdoni oshirish strategiyasi.",
        description=(
            "Profilni to'g'ri rasmiylashtirish, kontent reja, Reels va Stories, targetlangan reklama va "
            "statistikani tahlil qilish. Kurs kichik biznes egalari va SMM mutaxassislari uchun."
        ),
        category="Marketing",
        teacher="ustoz2@onlinekurs.uz",
        level=CourseLevel.beginner,
        price=199000,
        what_you_learn=[
            "Profilni sotuvga moslash",
            "Kontent reja tuzish",
            "Reels orqali auditoriya yig'ish",
            "Targetlangan reklama sozlash",
        ],
        requirements=["Instagram akkaunti"],
        sections=[
            SectionSpec(
                "Strategiya",
                _lessons(
                    ("Maqsad va auditoriya", 15),
                    ("Profilni rasmiylashtirish", 18),
                    ("Raqobatchilar tahlili", 14),
                ),
            ),
            SectionSpec(
                "Kontent",
                _lessons(
                    ("Kontent reja", 20),
                    ("Reels ssenariylari", 22),
                    ("Stories va interaktivlik", 16),
                    ("Vizual uslub", 14),
                ),
            ),
            SectionSpec(
                "Reklama va tahlil",
                _lessons(
                    ("Target reklama asoslari", 25),
                    ("Byudjet va test", 18),
                    ("Statistika tahlili", 15),
                ),
            ),
        ],
    ),
    CourseSpec(
        title="IELTS 7+ ga tayyorgarlik",
        short_description="IELTS imtihonining barcha 4 bo'limiga tizimli tayyorgarlik.",
        description=(
            "Listening, Reading, Writing va Speaking bo'limlari uchun strategiyalar, band tavsiflari, "
            "tez-tez uchraydigan xatolar va haftalik mashq rejasi. Kurs 6.0 dan yuqori darajadagi o'quvchilar uchun."
        ),
        category="Tillar",
        teacher="ustoz2@onlinekurs.uz",
        level=CourseLevel.advanced,
        price=890000,
        what_you_learn=[
            "Writing Task 1 va 2 tuzilmasi",
            "Speaking uchun ideyalar banki",
            "Reading tezligini oshirish",
            "Listening tuzoqlaridan qochish",
        ],
        requirements=["Ingliz tili darajasi B1+ (IELTS 5.5–6.0)"],
        sections=[
            SectionSpec(
                "Listening",
                _lessons(
                    ("Imtihon formati", 12),
                    ("Part 1–2 strategiyalari", 20),
                    ("Part 3–4 strategiyalari", 24),
                ),
            ),
            SectionSpec(
                "Reading",
                _lessons(
                    ("Skimming va scanning", 18),
                    ("True/False/Not Given", 22),
                    ("Matching headings", 20),
                    ("Vaqtni boshqarish", 14),
                ),
            ),
            SectionSpec(
                "Writing",
                _lessons(
                    ("Task 1: grafiklar", 25),
                    ("Task 2: esse tuzilmasi", 30),
                    ("Band 7 lug'ati", 18),
                    ("Tekshirilgan esselar", 20),
                ),
            ),
            SectionSpec(
                "Speaking",
                _lessons(
                    ("Part 1 javob shablonlari", 16),
                    ("Part 2: cue card", 20),
                    ("Part 3: munozara", 18),
                ),
            ),
        ],
    ),
    CourseSpec(
        title="Excel: boshlang'ichdan mutaxassisgacha",
        short_description="Excel formulalari, jadvallar va hisobotlar bilan professional ishlash.",
        description=(
            "Asosiy formulalardan tortib VLOOKUP, XLOOKUP, pivot jadvallar va dashboardlar yaratishgacha. "
            "Har bir dars real biznes ma'lumotlari asosida o'tiladi."
        ),
        category="Biznes",
        teacher="ustoz@onlinekurs.uz",
        level=CourseLevel.beginner,
        price=0,
        what_you_learn=[
            "Asosiy va matnli formulalar",
            "VLOOKUP / XLOOKUP",
            "Pivot jadvallar",
            "Diagramma va dashboard",
        ],
        requirements=["Microsoft Excel yoki Google Sheets"],
        sections=[
            SectionSpec(
                "Boshlang'ich",
                _lessons(
                    ("Interfeys va yacheykalar", 12), ("Formatlash", 15), ("Asosiy formulalar", 20)
                ),
            ),
            SectionSpec(
                "Formulalar",
                _lessons(
                    ("Mantiqiy funksiyalar", 18),
                    ("VLOOKUP va XLOOKUP", 24),
                    ("Matn va sana funksiyalari", 20),
                    ("Xatolarni tuzatish", 12),
                ),
            ),
            SectionSpec(
                "Tahlil",
                _lessons(("Pivot jadvallar", 26), ("Diagrammalar", 18), ("Dashboard yaratish", 30)),
            ),
        ],
    ),
    CourseSpec(
        title="React va TypeScript",
        short_description="Zamonaviy React ilovalarini TypeScript bilan professional darajada yozing.",
        description=(
            "Komponentlar, hooklar, holat boshqaruvi, React Router, ma'lumotlarni yuklash (React Query) va "
            "TypeScript bilan xavfsiz kod yozish. Yakunda to'liq CRUD ilova quriladi."
        ),
        category="Dasturlash",
        teacher="ustoz@onlinekurs.uz",
        level=CourseLevel.intermediate,
        price=650000,
        what_you_learn=[
            "React komponentlari va hooklar",
            "TypeScript tiplari va generiklar",
            "React Router va React Query",
            "Ilovani deploy qilish",
        ],
        requirements=["HTML, CSS va JavaScript asoslari"],
        sections=[
            SectionSpec(
                "Kirish",
                _lessons(
                    ("Vite bilan loyiha yaratish", 14),
                    ("JSX va komponentlar", 20),
                    ("Props va state", 22),
                ),
            ),
            SectionSpec(
                "TypeScript",
                _lessons(
                    ("Asosiy tiplar", 18),
                    ("Interfeys va generiklar", 24),
                    ("Komponentlarni tiplash", 20),
                ),
            ),
            SectionSpec(
                "Hooklar",
                _lessons(
                    ("useEffect va useRef", 22),
                    ("useContext va useReducer", 24),
                    ("Custom hooklar", 18),
                    ("Performance: useMemo", 16),
                ),
            ),
            SectionSpec(
                "Loyiha",
                _lessons(("React Router", 20), ("React Query bilan API", 28), ("Deploy", 12)),
            ),
        ],
    ),
    CourseSpec(
        title="Startap qurish asoslari",
        short_description="G'oyadan birinchi mijozgacha: startap qurishning amaliy yo'li.",
        description=(
            "Muammoni aniqlash, mijozlar bilan intervyu, MVP yaratish, biznes model kanvasi, "
            "investorlarga pitch tayyorlash va jamoa yig'ish."
        ),
        category="Biznes",
        teacher="ustoz2@onlinekurs.uz",
        level=CourseLevel.intermediate,
        price=350000,
        what_you_learn=[
            "G'oyani tekshirish (validation)",
            "Biznes model kanvasi",
            "MVP va birinchi savdo",
            "Investorga pitch",
        ],
        requirements=["Biznes g'oya yoki unga qiziqish"],
        sections=[
            SectionSpec(
                "G'oya",
                _lessons(("Muammo va yechim", 15), ("Mijoz intervyusi", 20), ("Bozor hajmi", 16)),
            ),
            SectionSpec(
                "Mahsulot",
                _lessons(
                    ("MVP nima", 14),
                    ("Biznes model kanvasi", 22),
                    ("Narxlash strategiyasi", 18),
                    ("Birinchi 10 mijoz", 20),
                ),
            ),
            SectionSpec(
                "O'sish",
                _lessons(
                    ("Jamoa va rollar", 15), ("Pitch deck", 24), ("Investor bilan muzokara", 18)
                ),
            ),
        ],
    ),
    CourseSpec(
        title="Matematika: algebra va funksiyalar",
        short_description="Abituriyentlar uchun algebra, tenglamalar va funksiyalar kursi.",
        description=(
            "Chiziqli va kvadrat tenglamalar, tengsizliklar, funksiyalar grafigi, logarifm va trigonometriya "
            "asoslari. Har bir mavzuda test topshiriqlari va yechimlar."
        ),
        category="Matematika",
        teacher="ustoz@onlinekurs.uz",
        level=CourseLevel.beginner,
        price=0,
        what_you_learn=[
            "Tenglama va tengsizliklarni yechish",
            "Funksiya grafiklarini chizish",
            "Logarifm va daraja",
            "Test yechish strategiyasi",
        ],
        requirements=["Maktab matematikasi asoslari"],
        sections=[
            SectionSpec(
                "Tenglamalar",
                _lessons(
                    ("Chiziqli tenglamalar", 16),
                    ("Kvadrat tenglamalar", 22),
                    ("Tenglamalar sistemasi", 20),
                ),
            ),
            SectionSpec(
                "Funksiyalar",
                _lessons(
                    ("Funksiya tushunchasi", 15),
                    ("Chiziqli va kvadrat funksiya", 20),
                    ("Grafiklarni o'zgartirish", 18),
                    ("Daraja va logarifm", 24),
                ),
            ),
            SectionSpec(
                "Trigonometriya",
                _lessons(
                    ("Burchak va radian", 14),
                    ("Asosiy ayniyatlar", 20),
                    ("Trigonometrik tenglamalar", 22),
                ),
            ),
        ],
    ),
    CourseSpec(
        title="Mobil ilovalar: Flutter bilan boshlash",
        short_description="Flutter va Dart yordamida Android va iOS ilovalarini yarating.",
        description=(
            "Dart tili asoslari, Flutter vidjetlari, navigatsiya, holat boshqaruvi va API bilan ishlash. "
            "Kurs hozircha tayyorlanmoqda."
        ),
        category="Dasturlash",
        teacher="ustoz@onlinekurs.uz",
        level=CourseLevel.intermediate,
        price=550000,
        what_you_learn=["Dart tili asoslari", "Flutter vidjetlari", "Navigatsiya va holat"],
        requirements=["Dasturlash asoslari"],
        is_published=False,
        sections=[
            SectionSpec(
                "Dart asoslari",
                _lessons(("Dart o'rnatish", 12), ("O'zgaruvchilar va funksiyalar", 20)),
            ),
        ],
    ),
]


def _seed_cover_urls() -> dict[str, str]:
    """Absolute URLs of the bundled cover images in uploads/seed (name -> URL)."""
    seed_dir = settings.UPLOAD_DIR / "seed"
    urls: dict[str, str] = {}
    for name in SEED_IMAGES:
        if (seed_dir / name).exists():
            urls[name] = public_url("seed", name)
        else:
            logger.warning("Seed image %s not found in %s; course cover left empty", name, seed_dir)
    return urls


def _create_user(
    db: Session,
    email: str,
    full_name: str,
    role: UserRole,
    phone: str | None = None,
    bio: str | None = None,
) -> User:
    user = User(
        email=email,
        full_name=full_name,
        phone=phone,
        bio=bio,
        role=role,
        password_hash=hash_password(DEMO_PASSWORD),
    )
    db.add(user)
    db.flush()
    return user


def _create_course(
    db: Session,
    spec: CourseSpec,
    categories: dict[str, Category],
    teachers: dict[str, User],
    covers: dict[str, str],
    rng: random.Random,
) -> Course:
    course = Course(
        title=spec.title,
        slug=generate_course_slug(db, spec.title),
        short_description=spec.short_description,
        description=spec.description,
        what_you_learn=spec.what_you_learn,
        requirements=spec.requirements,
        category_id=categories[spec.category].id,
        teacher_id=teachers[spec.teacher].id,
        level=spec.level,
        price=spec.price,
        cover_url=covers.get(spec.cover) if spec.cover else None,
        is_published=spec.is_published,
        created_at=utcnow() - timedelta(days=rng.randint(20, 200)),
    )
    db.add(course)
    db.flush()
    video_index = 0
    for section_position, section_spec in enumerate(spec.sections, start=1):
        section = Section(course_id=course.id, title=section_spec.title, position=section_position)
        db.add(section)
        db.flush()
        for lesson_position, lesson_spec in enumerate(section_spec.lessons, start=1):
            db.add(
                Lesson(
                    section_id=section.id,
                    title=lesson_spec.title,
                    description=LESSON_DESCRIPTION,
                    video_url=VIDEOS[video_index % len(VIDEOS)],
                    duration_minutes=lesson_spec.minutes,
                    position=lesson_position,
                    is_free_preview=section_position == 1 and lesson_position == 1,
                )
            )
            video_index += 1
    db.flush()
    return course


def _lesson_ids(course: Course) -> list[int]:
    return [lesson.id for section in course.sections for lesson in section.lessons]


def _enroll_with_payment(
    db: Session, user: User, course: Course, paid_at, rng: random.Random
) -> None:
    db.add(Enrollment(user_id=user.id, course_id=course.id, created_at=paid_at))
    if course.price > 0:
        db.add(
            Payment(
                user_id=user.id,
                course_id=course.id,
                amount=course.price,
                status=PaymentStatus.paid,
                provider="mock",
                created_at=paid_at - timedelta(minutes=rng.randint(1, 30)),
                paid_at=paid_at,
            )
        )


def _add_progress(
    db: Session, user: User, course: Course, completed_count: int, started_at
) -> None:
    for offset, lesson_id in enumerate(_lesson_ids(course)[:completed_count]):
        db.add(
            LessonProgress(
                user_id=user.id,
                lesson_id=lesson_id,
                completed_at=started_at + timedelta(days=offset),
            )
        )


def _add_review(
    db: Session, user: User, course: Course, rating: int, comment: str, created_at
) -> None:
    db.add(
        Review(
            user_id=user.id,
            course_id=course.id,
            rating=rating,
            comment=comment,
            created_at=created_at,
        )
    )


def seed(db: Session) -> bool:
    """Populate demo data. Returns False when the database was already seeded."""
    if (
        db.execute(select(User.id).where(User.email == ADMIN_EMAIL)).scalar_one_or_none()
        is not None
    ):
        logger.info("Seed skipped: admin account already exists")
        return False

    rng = random.Random(42)
    now = utcnow()
    covers = _seed_cover_urls()

    _create_user(db, ADMIN_EMAIL, "Administrator", UserRole.admin, "+998900000000")
    teachers = {
        email: _create_user(db, email, name, UserRole.teacher, phone, bio)
        for email, name, phone, bio in TEACHERS
    }
    student = _create_user(
        db, "talaba@onlinekurs.uz", "Aziz Toshmatov", UserRole.student, "+998901112233"
    )
    extra_students = [
        _create_user(db, email, name, UserRole.student) for name, email in EXTRA_STUDENTS
    ]

    categories: dict[str, Category] = {}
    for name, icon, description in CATEGORIES:
        category = Category(
            name=name, slug=generate_category_slug(db, name), icon=icon, description=description
        )
        db.add(category)
        db.flush()
        categories[name] = category

    courses = [_create_course(db, spec, categories, teachers, covers, rng) for spec in COURSES]
    db.flush()
    for course in courses:
        db.refresh(course)
    by_title = {course.title: course for course in courses}

    python_course = by_title["Python asoslari: noldan dasturchigacha"]
    frontend_course = by_title["Frontend: HTML, CSS va JavaScript"]

    # Demo student: one free and one paid course, partial progress, two reviews.
    _enroll_with_payment(db, student, python_course, now - timedelta(days=21), rng)
    _add_progress(db, student, python_course, 6, now - timedelta(days=20))
    _add_review(db, student, python_course, 5, REVIEW_COMMENTS[0], now - timedelta(days=10))
    _enroll_with_payment(db, student, frontend_course, now - timedelta(days=9), rng)
    _add_progress(db, student, frontend_course, 3, now - timedelta(days=8))
    _add_review(db, student, frontend_course, 4, REVIEW_COMMENTS[3], now - timedelta(days=2))
    # One pending payment left over from an abandoned checkout.
    db.add(
        Payment(
            user_id=student.id,
            course_id=by_title["React va TypeScript"].id,
            amount=by_title["React va TypeScript"].price,
            status=PaymentStatus.pending,
            created_at=now - timedelta(days=1),
        )
    )

    # Generated students: enrollments and payments spread over the last six months.
    published = [course for course in courses if course.is_published]
    for index, extra in enumerate(extra_students):
        picked = rng.sample(published, k=rng.randint(2, 4))
        for course in picked:
            days_ago = rng.randint(3, 178)
            paid_at = now - timedelta(days=days_ago, hours=rng.randint(0, 23))
            _enroll_with_payment(db, extra, course, paid_at, rng)
            total = len(_lesson_ids(course))
            _add_progress(db, extra, course, rng.randint(0, total), paid_at + timedelta(days=1))
            if rng.random() < 0.75:
                _add_review(
                    db,
                    extra,
                    course,
                    rng.choice([4, 5, 5, 5, 3]),
                    REVIEW_COMMENTS[(index + len(picked)) % len(REVIEW_COMMENTS)],
                    paid_at + timedelta(days=rng.randint(2, 6)),
                )
    # A refunded payment so the admin filter has every status.
    refunded_course = by_title["Instagram marketing"]
    db.add(
        Payment(
            user_id=extra_students[0].id,
            course_id=refunded_course.id,
            amount=refunded_course.price,
            status=PaymentStatus.refunded,
            created_at=now - timedelta(days=40),
            paid_at=now - timedelta(days=40),
        )
    )
    db.commit()
    logger.info("Seed complete: %d courses, %d users", len(courses), 4 + len(extra_students))
    return True


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        created = seed(db)
    print(
        "Seed ma'lumotlari yaratildi." if created else "Seed allaqachon mavjud, o'tkazib yuborildi."
    )


if __name__ == "__main__":
    main()
