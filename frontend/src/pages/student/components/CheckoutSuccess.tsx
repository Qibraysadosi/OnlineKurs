import { PlayCircle, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, buttonClassName } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import type { Payment } from "@/types";

const CONFETTI = ["🎉", "✨", "🎊", "⭐", "🎈", "💜"] as const;

/** Post-payment screen with a playful emoji burst and the resume CTA. */
export function CheckoutSuccess({ payment }: { payment: Payment }) {
  return (
    <Card className="relative mx-auto max-w-xl overflow-hidden text-center animate-in">
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-around px-4 pt-4 text-2xl" aria-hidden="true">
        {CONFETTI.map((emoji, i) => (
          <span key={i} className="animate-in-scale" style={{ animationDelay: `${i * 80}ms` }}>
            {emoji}
          </span>
        ))}
      </div>
      <div className="mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-5xl dark:bg-emerald-950/60" aria-hidden="true">
        🎉
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">To'lov muvaffaqiyatli!</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        <span className="font-medium text-slate-900 dark:text-slate-100">{payment.course.title}</span> kursi endi sizniki. Barcha darslar va materiallar ochildi.
      </p>
      <dl className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-900/80">
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Summa</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatPrice(payment.amount)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">To'lov raqami</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-slate-900 dark:text-slate-100">№{payment.id}</dd>
        </div>
      </dl>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to={`/learn/${payment.course.slug}`} className={buttonClassName({ variant: "gradient", size: "lg" })}>
          <PlayCircle className="h-5 w-5" aria-hidden="true" />
          Darsni boshlash
        </Link>
        <Link to="/payments" className={buttonClassName({ variant: "outline", size: "lg" })}>
          <Receipt className="h-5 w-5" aria-hidden="true" />
          To'lovlarim
        </Link>
      </div>
    </Card>
  );
}
