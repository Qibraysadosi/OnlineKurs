import {
  BarChart3,
  BookOpen,
  Briefcase,
  Calculator,
  Camera,
  Code,
  Cpu,
  Globe,
  GraduationCap,
  HeartPulse,
  Languages,
  Megaphone,
  Music,
  Palette,
  PenTool,
  Smartphone,
  TrendingUp,
  type LucideProps,
} from "lucide-react";
import { type ComponentType } from "react";
import type { SelectOption } from "@/components/ui/Select";

interface CategoryIconEntry {
  /** Lucide icon name as stored on `Category.icon`. */
  name: string;
  /** Uzbek label shown in the admin category form. */
  label: string;
  icon: ComponentType<LucideProps>;
}

/** Single source of truth: every icon name an admin may assign to a category. */
const CATEGORY_ICONS: CategoryIconEntry[] = [
  { name: "code", label: "Kod (dasturlash)", icon: Code },
  { name: "palette", label: "Palitra (dizayn)", icon: Palette },
  { name: "megaphone", label: "Karnay (marketing)", icon: Megaphone },
  { name: "languages", label: "Tillar", icon: Languages },
  { name: "briefcase", label: "Portfel (biznes)", icon: Briefcase },
  { name: "calculator", label: "Kalkulyator (matematika)", icon: Calculator },
  { name: "book-open", label: "Kitob", icon: BookOpen },
  { name: "graduation-cap", label: "Bitiruvchi shapkasi", icon: GraduationCap },
  { name: "camera", label: "Kamera (foto/video)", icon: Camera },
  { name: "cpu", label: "Protsessor (IT)", icon: Cpu },
  { name: "globe", label: "Globus", icon: Globe },
  { name: "heart-pulse", label: "Yurak (sog'liq)", icon: HeartPulse },
  { name: "music", label: "Musiqa", icon: Music },
  { name: "pen-tool", label: "Qalam (grafika)", icon: PenTool },
  { name: "smartphone", label: "Smartfon (mobil)", icon: Smartphone },
  { name: "trending-up", label: "O'sish (moliya)", icon: TrendingUp },
  { name: "bar-chart-3", label: "Diagramma (tahlil)", icon: BarChart3 },
];

const ICON_BY_NAME = new Map(CATEGORY_ICONS.map((entry) => [entry.name, entry.icon]));

/** `<Select>` options for the admin category form, derived from the same map the icon renders from. */
export const CATEGORY_ICON_OPTIONS: SelectOption[] = CATEGORY_ICONS.map(({ name, label }) => ({ value: name, label }));

export interface CategoryIconProps {
  /** Lucide icon name as stored on the category (e.g. "code"); unknown names fall back to a book. */
  name: string | null | undefined;
  className?: string;
}

export function CategoryIcon({ name, className }: CategoryIconProps) {
  const Icon = (name && ICON_BY_NAME.get(name.toLowerCase())) || BookOpen;
  return <Icon className={className} aria-hidden="true" />;
}
