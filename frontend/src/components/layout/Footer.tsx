import { Link } from "react-router-dom";
import { Container } from "./Container";
import { Logo } from "./Logo";

const LINKS = [
  { to: "/courses", label: "Barcha kurslar" },
  { to: "/courses?price=free", label: "Bepul kurslar" },
  { to: "/register", label: "Ro'yxatdan o'tish" },
  { to: "/login", label: "Kirish" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60">
      <Container className="grid gap-8 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
            O'zbek tilidagi zamonaviy onlayn kurslar: dasturlash, dizayn, marketing, tillar va boshqalar.
          </p>
        </div>
        <nav aria-label="Foydali havolalar">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Havolalar</h3>
          <ul className="mt-3 space-y-2">
            {LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="ok-focus rounded text-sm text-slate-600 transition hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-300">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Aloqa</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>
              <a href="mailto:info@onlinekurs.uz" className="ok-focus rounded transition hover:text-primary-600 dark:hover:text-primary-300">
                info@onlinekurs.uz
              </a>
            </li>
            <li>Toshkent, O'zbekiston</li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-slate-200 dark:border-slate-800">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-500 dark:text-slate-400 sm:flex-row">
          <p>© {year} OnlineKurs. Barcha huquqlar himoyalangan.</p>
          <p>Ta'lim — kelajakka sarmoya.</p>
        </Container>
      </div>
    </footer>
  );
}
