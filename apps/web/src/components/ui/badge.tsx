import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple";

const variants: Record<BadgeVariant, string> = {
  default: "bg-[var(--surface-active)] text-muted border-[var(--border)]",
  success: "bg-teal-500/15 text-teal-400 border-teal-500/20",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  danger: "bg-[rgba(220,20,60,0.15)] text-[#f87171] border-[rgba(220,20,60,0.25)]",
  info: "bg-teal-500/15 text-teal-400 border-teal-500/20",
  purple: "bg-violet-500/15 text-violet-400 border-violet-500/25",
};

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
