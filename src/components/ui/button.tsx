import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-[var(--ink)] text-white hover:bg-[var(--green)] border-[var(--ink)] hover:border-[var(--green)] shadow-[3px_3px_0_var(--acid)]",
  secondary: "bg-white text-[var(--ink)] hover:bg-[var(--surface-subtle)] border-[var(--line-strong)]",
  ghost: "bg-transparent text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] border-transparent",
  danger: "bg-[var(--red)] text-white hover:bg-[#9f3336] border-[var(--red)]",
};

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-[3px] border px-3.5 text-sm font-bold transition-[background-color,border-color,color,transform,box-shadow] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
