import { ArrowRight, PlayCircle, Search, Trophy, UserPlus } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StarRating } from "@/components/ui/StarRating";

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  action,
}: {
  /** Heading id, referenced by the parent section's aria-labelledby */
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">{eyebrow}</p>}
        <h2 id={id} className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          {title}
        </h2>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400 sm:text-base">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const STEPS = [
  {
    icon: Search,
    title: "Kursni tanlang",
    text: "Yo'nalish, daraja va narx bo'yicha filtrlab, o'zingizga mos kursni toping. Birinchi dars har doim bepul.",
  },
  {
    icon: UserPlus,
    title: "Yoziling",
    text: "Bepul kurslarga bir bosishda yoziling, pullik kurslarni xavfsiz to'lov orqali sotib oling.",
  },
  {
    icon: PlayCircle,
    title: "O'rganing va o'sing",
    text: "Video darslarni istalgan qurilmada ko'ring, darslarni yakunlang va progressingizni kuzating.",
  },
] as const;

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works">
      <SectionHeading id="how-it-works" eyebrow="Qanday ishlaydi" title="Uch qadamda boshlang" description="Ro'yxatdan o'tishdan birinchi darsgacha bir necha daqiqa kifoya." />
      <ol className="grid gap-5 md:grid-cols-3">
        {STEPS.map((step, idx) => (
          <li key={step.title}>
            <Card className="relative h-full overflow-hidden">
              <span className="absolute -right-3 -top-4 select-none text-7xl font-bold text-slate-100 dark:text-slate-800/80" aria-hidden="true">
                {idx + 1}
              </span>
              <div className="relative">
                <span className="ok-gradient-bg inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm" aria-hidden="true">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{step.text}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}

const TESTIMONIALS = [
  {
    name: "Madina Yusupova",
    role: "Frontend dasturchi",
    rating: 5,
    text: "Ishdan keyin har kuni 30 daqiqa o'qidim. Uch oydan so'ng birinchi buyurtmamni topshirdim — darslar juda amaliy.",
  },
  {
    name: "Jasur Abdullayev",
    role: "SMM mutaxassis",
    rating: 5,
    text: "Instagram marketing kursi orqali mijozlarim sonini ikki baravar oshirdim. O'qituvchi har bir savolga javob beradi.",
  },
  {
    name: "Sevara Qodirova",
    role: "IELTS 7.5",
    rating: 4,
    text: "Progress kuzatuvi juda qulay: qaysi darsda to'xtaganimni doim bilaman. IELTS'ga tayyorgarlik oson kechdi.",
  },
] as const;

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials">
      <SectionHeading id="testimonials" eyebrow="Fikrlar" title="Talabalarimiz nima deydi" description="Har kuni minglab talabalar OnlineKurs orqali yangi ko'nikmalarni egallaydi." />
      <div className="grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((item) => (
          <Card key={item.name} className="flex h-full flex-col">
            <StarRating value={item.rating} label={`${item.name} bahosi`} />
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">“{item.text}”</blockquote>
            <figure className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Avatar name={item.name} size="sm" />
              <figcaption className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.role}</p>
              </figcaption>
            </figure>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function CtaBanner({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-12 text-center text-white shadow-glow sm:px-12 sm:py-16">
      <span className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      <span className="absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-black/10 blur-2xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-2xl">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur" aria-hidden="true">
          <Trophy className="h-6 w-6" />
        </span>
        <h2 id="cta-title" className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
          Kelajagingizga bugun sarmoya kiriting
        </h2>
        <p className="mt-3 text-sm text-white/85 sm:text-base">
          Bepul kurslardan boshlang, o'z tezligingizda o'rganing va yangi kasb egasi bo'ling.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {isAuthenticated ? (
            <>
              <Link to="/courses" className={buttonClassName({ variant: "inverse", size: "lg" })}>
                Kurslarni ko'rish
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/dashboard" className={buttonClassName({ variant: "inverseOutline", size: "lg" })}>
                Boshqaruv paneli
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className={buttonClassName({ variant: "inverse", size: "lg" })}>
                Bepul ro'yxatdan o'tish
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/courses" className={buttonClassName({ variant: "inverseOutline", size: "lg" })}>
                Kurslarni ko'rish
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
