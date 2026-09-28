import { Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <IconButton
      aria-label={isDark ? "Yorug' rejimga o'tish" : "Qorong'u rejimga o'tish"}
      onClick={toggleTheme}
      className={className}
    >
      {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </IconButton>
  );
}
