import { Badge } from "@/components/ui/Badge";
import { levelColor, levelLabel } from "@/lib/utils";
import type { CourseLevel } from "@/types";

export function LevelBadge({ level, className, size = "sm" }: { level: CourseLevel; className?: string; size?: "sm" | "md" }) {
  return (
    <Badge tone={levelColor(level)} size={size} className={className}>
      {levelLabel(level)}
    </Badge>
  );
}
