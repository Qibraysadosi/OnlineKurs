import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  as?: "div" | "section" | "main" | "header" | "footer" | "nav";
}

const SIZES = { sm: "max-w-3xl", md: "max-w-5xl", lg: "max-w-6xl", xl: "max-w-7xl" };

/** `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` */
export function Container({ size = "xl", as: Tag = "div", className, ...rest }: ContainerProps) {
  return <Tag className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", SIZES[size], className)} {...rest} />;
}
