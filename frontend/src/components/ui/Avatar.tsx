import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";

export interface AvatarProps {
  src?: string | null;
  name: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-24 w-24 text-3xl",
};

/** Image when available, otherwise gradient circle with initials. */
export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-white ring-2 ring-white dark:ring-slate-900",
        !showImage && "ok-gradient-bg",
        SIZES[size],
        className,
      )}
      aria-label={name ?? undefined}
      role="img"
    >
      {showImage ? (
        <img src={src ?? undefined} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
