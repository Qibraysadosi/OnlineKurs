import { CheckCircle2, Eye, EyeOff, Quote } from "lucide-react";
import { forwardRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";
import { IconButton } from "@/components/ui/Button";
import { Input, type InputProps } from "@/components/ui/Input";

export interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** "Hisobingiz yo'qmi?" line under the form */
  footer: ReactNode;
  /** Right-hand brand panel copy */
  panelTitle: ReactNode;
  panelPoints: string[];
}

/** Split auth layout: form on the left, gradient brand panel on the right (desktop only). */
export function AuthLayout({ title, subtitle, children, footer, panelTitle, panelPoints }: AuthLayoutProps) {
  return (
    <Container className="py-8 animate-in sm:py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 lg:grid-cols-2">
        <div className="flex flex-col justify-center px-5 py-8 sm:px-10 sm:py-12">
          <div className="mx-auto w-full max-w-sm">
            <Logo className="mb-8" />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</p>
          </div>
        </div>

        <aside
          className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-10 text-white lg:flex lg:flex-col lg:justify-between"
          aria-label="Platforma haqida"
        >
          <span className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <span className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-black/10 blur-2xl" aria-hidden="true" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">OnlineKurs</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight">{panelTitle}</h2>
            <ul className="mt-8 space-y-3">
              {panelPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-white/90">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <figure className="relative mt-10 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
            <Quote className="h-6 w-6 text-white/60" aria-hidden="true" />
            <blockquote className="mt-2 text-sm leading-relaxed text-white/90">
              Ishdan keyin har kuni 30 daqiqa o'qidim — uch oyda birinchi frontend loyihamni topshirdim.
            </blockquote>
            <figcaption className="mt-3 text-xs font-medium text-white/70">Madina Yusupova, talaba</figcaption>
          </figure>
        </aside>
      </div>
    </Container>
  );
}

export type PasswordInputProps = Omit<InputProps, "type" | "rightElement">;

/** Password field with a show/hide toggle; spreads react-hook-form `register()` like <Input>. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      ref={ref}
      type={visible ? "text" : "password"}
      rightElement={
        <IconButton
          type="button"
          variant="ghost"
          size="sm"
          aria-label={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </IconButton>
      }
      {...props}
    />
  );
});

/** Builds `/login` or `/register` keeping the `?next=` target. */
export function authPath(base: "/login" | "/register", next: string | null): string {
  return next ? `${base}?next=${encodeURIComponent(next)}` : base;
}

/** Only relative in-app paths are safe redirect targets. */
export function safeNextPath(next: string | null, fallback = "/dashboard"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export function AuthSwitchLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="ok-focus rounded font-medium text-primary-600 transition hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200">
      {children}
    </Link>
  );
}
