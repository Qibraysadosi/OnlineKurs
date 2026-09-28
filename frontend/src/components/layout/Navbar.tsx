import { ChevronDown, LayoutDashboard, LogOut, Menu, Search, User, X } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton, buttonClassName } from "@/components/ui/Button";
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/Dropdown";
import { useAuth } from "@/hooks/useAuth";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useToast } from "@/hooks/useToast";
import { cn, roleLabel } from "@/lib/utils";
import { Container } from "./Container";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { navGroupsForRole, panelLinkForRole } from "./navigation";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "ok-focus rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "text-primary-700 dark:text-primary-300"
      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
  );

function SearchForm({ onDone, autoFocus }: { onDone?: () => void; autoFocus?: boolean }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = value.trim();
    navigate(q ? `/courses?q=${encodeURIComponent(q)}` : "/courses");
    setValue("");
    onDone?.();
  };
  return (
    <form onSubmit={submit} role="search" className="relative w-full">
      <label htmlFor="navbar-search" className="sr-only">
        Kurslarni qidirish
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        id="navbar-search"
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Kurs qidirish..."
        className="ok-focus h-10 w-full rounded-xl border border-slate-200 bg-slate-100/70 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-100 dark:focus:bg-slate-900"
      />
    </form>
  );
}

export function Navbar() {
  const { user, isAuthenticated, logout, role } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  useLockBodyScroll(mobileOpen);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  const panelLink = panelLinkForRole(role);
  const groups = navGroupsForRole(role);

  const handleLogout = () => {
    logout();
    toast.info("Tizimdan chiqdingiz");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70">
      <Container className="flex h-16 items-center gap-3">
        <Logo />

        <nav aria-label="Asosiy" className="ml-4 hidden items-center gap-1 md:flex">
          <NavLink to="/courses" className={navLinkClass}>
            Kurslar
          </NavLink>
          {panelLink && (
            <NavLink to={panelLink.to} className={navLinkClass}>
              {panelLink.label}
            </NavLink>
          )}
        </nav>

        <div className="hidden flex-1 justify-end px-2 lg:flex">
          {searchOpen ? (
            <div className="w-full max-w-sm animate-in-right">
              <SearchForm onDone={() => setSearchOpen(false)} autoFocus />
            </div>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <IconButton
            aria-label="Qidiruv"
            className="hidden lg:inline-flex"
            onClick={() => setSearchOpen((v) => !v)}
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Search className="h-5 w-5" aria-hidden="true" />}
          </IconButton>
          <ThemeToggle />

          {isAuthenticated && user ? (
            <Dropdown
              trigger={({ open, toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  aria-haspopup="menu"
                  aria-expanded={open}
                  aria-label="Foydalanuvchi menyusi"
                  className="ok-focus hidden items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition hover:bg-slate-100 dark:hover:bg-slate-800 md:flex"
                >
                  <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                  <span className="max-w-[120px] truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {user.full_name}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} aria-hidden="true" />
                </button>
              )}
            >
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user.full_name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-primary-600 dark:text-primary-300">
                  {roleLabel(user.role)}
                </p>
              </div>
              <DropdownSeparator />
              <DropdownItem icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => navigate("/dashboard")}>
                Boshqaruv paneli
              </DropdownItem>
              <DropdownItem icon={<User className="h-4 w-4" />} onClick={() => navigate("/profile")}>
                Profil
              </DropdownItem>
              {panelLink && (
                <DropdownItem icon={<panelLink.icon className="h-4 w-4" />} onClick={() => navigate(panelLink.to)}>
                  {panelLink.label}
                </DropdownItem>
              )}
              <DropdownSeparator />
              <DropdownItem icon={<LogOut className="h-4 w-4" />} danger onClick={handleLogout}>
                Chiqish
              </DropdownItem>
            </Dropdown>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className={buttonClassName({ variant: "ghost", size: "sm" })}>
                Kirish
              </Link>
              <Link to="/register" className={buttonClassName({ variant: "gradient", size: "sm" })}>
                Ro'yxatdan o'tish
              </Link>
            </div>
          )}

          <IconButton
            aria-label={mobileOpen ? "Menyuni yopish" : "Menyuni ochish"}
            aria-expanded={mobileOpen}
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </IconButton>
        </div>
      </Container>

      {mobileOpen && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Mobil menyu">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto border-r border-slate-200 bg-white p-4 shadow-xl animate-in-left dark:border-slate-800 dark:bg-slate-950">
            <SearchForm onDone={() => setMobileOpen(false)} />

            {isAuthenticated && user && (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-100 p-3 dark:bg-slate-900">
                <Avatar src={user.avatar_url} name={user.full_name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user.full_name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{roleLabel(user.role)}</p>
                </div>
              </div>
            )}

            <nav aria-label="Mobil navigatsiya" className="mt-4 flex flex-col gap-1">
              <MobileLink to="/courses">Kurslar</MobileLink>
              {isAuthenticated &&
                groups.map((group) => (
                  <div key={group.title} className="mt-3">
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>
                    {group.items.map((item) => (
                      <MobileLink key={item.to} to={item.to} end={item.end} icon={<item.icon className="h-4 w-4" />}>
                        {item.label}
                      </MobileLink>
                    ))}
                  </div>
                ))}
            </nav>

            <div className="mt-auto pt-6">
              {isAuthenticated ? (
                <Button variant="outline" fullWidth leftIcon={<LogOut className="h-4 w-4" />} onClick={handleLogout}>
                  Chiqish
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/login" className={buttonClassName({ variant: "outline" })}>
                    Kirish
                  </Link>
                  <Link to="/register" className={buttonClassName({ variant: "gradient" })}>
                    Ro'yxatdan o'tish
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({ to, end, icon, children }: { to: string; end?: boolean; icon?: ReactNode; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "ok-focus flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900",
        )
      }
    >
      {icon && <span className="text-slate-400" aria-hidden="true">{icon}</span>}
      {children}
    </NavLink>
  );
}
