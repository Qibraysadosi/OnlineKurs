import {
  BarChart3,
  BookOpen,
  CreditCard,
  FolderTree,
  GraduationCap,
  LayoutDashboard,
  PlusSquare,
  Receipt,
  Shield,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Match only the exact path (for index routes like /dashboard, /teacher, /admin) */
  end?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const STUDENT_GROUP: NavGroup = {
  title: "Talaba",
  items: [
    { label: "Boshqaruv", to: "/dashboard", icon: LayoutDashboard, end: true },
    { label: "Kurslarim", to: "/my-courses", icon: BookOpen },
    { label: "To'lovlarim", to: "/payments", icon: Receipt },
    { label: "Profil", to: "/profile", icon: User },
  ],
};

const TEACHER_GROUP: NavGroup = {
  title: "O'qituvchi",
  items: [
    { label: "O'qituvchi paneli", to: "/teacher", icon: GraduationCap, end: true },
    { label: "Yangi kurs", to: "/teacher/courses/new", icon: PlusSquare },
  ],
};

const ADMIN_GROUP: NavGroup = {
  title: "Admin",
  items: [
    { label: "Statistika", to: "/admin", icon: BarChart3, end: true },
    { label: "Foydalanuvchilar", to: "/admin/users", icon: Users },
    { label: "Kurslar", to: "/admin/courses", icon: Shield },
    { label: "To'lovlar", to: "/admin/payments", icon: CreditCard },
    { label: "Kategoriyalar", to: "/admin/categories", icon: FolderTree },
  ],
};

/** Sidebar groups for the dashboard, depending on role. Admin sees everything. */
export function navGroupsForRole(role: Role | null): NavGroup[] {
  if (role === "admin") return [STUDENT_GROUP, TEACHER_GROUP, ADMIN_GROUP];
  if (role === "teacher") return [STUDENT_GROUP, TEACHER_GROUP];
  return [STUDENT_GROUP];
}

/** The single "panel" link shown in the navbar for the current role. */
export function panelLinkForRole(role: Role | null): NavItem | null {
  if (role === "admin") return { label: "Admin paneli", to: "/admin", icon: Shield };
  if (role === "teacher") return { label: "O'qituvchi paneli", to: "/teacher", icon: GraduationCap };
  if (role === "student") return { label: "Kurslarim", to: "/my-courses", icon: BookOpen };
  return null;
}
