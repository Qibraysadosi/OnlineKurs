import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CourseLevel, PaymentStatus, Role } from "@/types";

/** Merges Tailwind classes, resolving conflicts (later wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** 199000 -> "199 000 so'm"; 0 -> "Bepul" */
export function formatPrice(amount: number, freeLabel = "Bepul"): string {
  if (!amount || amount <= 0) return freeLabel;
  return `${formatNumber(amount)} so'm`;
}

/** 1234567 -> "1 234 567" */
export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** 80 -> "1 soat 20 daqiqa"; 45 -> "45 daqiqa"; 120 -> "2 soat"; 0 -> "0 daqiqa" */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins} daqiqa`;
  if (mins === 0) return `${hours} soat`;
  return `${hours} soat ${mins} daqiqa`;
}

/** Compact variant for tight spaces: 80 -> "1s 20d", 45 -> "45d" */
export function formatDurationShort(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins}d`;
  if (mins === 0) return `${hours}s`;
  return `${hours}s ${mins}d`;
}

export const UZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
] as const;

/** "2026-01-12T10:00:00Z" -> "12-yanvar, 2026" */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getDate()}-${UZ_MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
}

/** "2026-01-12T10:05:00Z" -> "12-yanvar, 2026, 10:05" (local time) */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(date)}, ${hh}:${mm}`;
}

/** "2026-03" -> "mar 2026" (for chart axes) */
export function formatMonth(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-");
  const idx = Number(month) - 1;
  const name = UZ_MONTHS[idx] ?? yyyyMm;
  return `${name.slice(0, 3)} ${year}`;
}

/** "Aziz Toshmatov" -> "AT" */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export function isYouTubeUrl(url: string | null | undefined): boolean {
  return Boolean(url && YOUTUBE_RE.test(url));
}

/** Returns an embeddable YouTube URL or null when the input is not a YouTube link. */
export function toYouTubeEmbed(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(YOUTUBE_RE);
  if (!match) return null;
  return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1`;
}

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: "Boshlang'ich",
  intermediate: "O'rta",
  advanced: "Yuqori",
};

export function levelLabel(level: CourseLevel): string {
  return LEVEL_LABELS[level] ?? level;
}

export const ROLE_LABELS: Record<Role, string> = {
  student: "Talaba",
  teacher: "O'qituvchi",
  admin: "Administrator",
};

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Kutilmoqda",
  paid: "To'langan",
  failed: "Bekor qilingan",
  refunded: "Qaytarilgan",
};

export function paymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

const PROVIDER_LABELS: Record<string, string> = {
  mock: "Test to'lov",
};

/** Backend payment provider code -> user-facing label ("mock" -> "Test to'lov"). */
export function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

/** Maps a payment status to the `Badge` tone to render it with. */
export function paymentStatusColor(status: PaymentStatus): BadgeTone {
  switch (status) {
    case "paid":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "danger";
    case "refunded":
      return "info";
    default:
      return "neutral";
  }
}

export function levelColor(level: CourseLevel): BadgeTone {
  switch (level) {
    case "beginner":
      return "success";
    case "intermediate":
      return "warning";
    case "advanced":
      return "danger";
    default:
      return "neutral";
  }
}

export const LANGUAGE_LABELS: Record<string, string> = {
  uz: "O'zbek",
  ru: "Rus",
  en: "Ingliz",
};

export function languageLabel(code: string): string {
  return LANGUAGE_LABELS[code] ?? code.toUpperCase();
}

/** Stable gradient per category so placeholders feel branded, not random. */
const CATEGORY_GRADIENTS = [
  "from-indigo-500 via-violet-500 to-fuchsia-500",
  "from-sky-500 via-cyan-500 to-emerald-500",
  "from-rose-500 via-pink-500 to-orange-400",
  "from-amber-500 via-orange-500 to-red-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-fuchsia-500 via-purple-500 to-indigo-500",
  "from-blue-600 via-indigo-500 to-purple-500",
  "from-lime-500 via-emerald-500 to-teal-600",
] as const;

export function categoryGradient(key: string | number | null | undefined): string {
  if (key === null || key === undefined) return CATEGORY_GRADIENTS[0];
  const str = String(key);
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0;
  return CATEGORY_GRADIENTS[Math.abs(hash) % CATEGORY_GRADIENTS.length];
}

/** 0.5 -> 50 (rounded, clamped 0..100) */
export function clampPercent(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** "Salom dunyo bu matn" -> "Salom dunyo…" */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** 1234 -> "1.2 ming" for compact stat displays */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")} mln`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")} ming`;
  return String(value);
}

/** Pluralised student label: 1 -> "1 talaba", 25 -> "25 talaba" (Uzbek has no plural suffix here). */
export function studentsLabel(count: number): string {
  return `${formatNumber(count)} talaba`;
}

export function lessonsLabel(count: number): string {
  return `${count} ta dars`;
}

/** 4.5 -> "4.5"; 0 -> "0.0" */
export function formatRating(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Formats bytes for upload UIs: 1536000 -> "1.5 MB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
