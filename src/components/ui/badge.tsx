import type { ReactNode } from "react";
import { cn } from "@/lib/format";

type Tone = "green" | "blue" | "amber" | "red" | "neutral";

const tones: Record<Tone, string> = {
  green: "bg-[var(--green-soft)] text-[var(--green-dark)]",
  blue: "bg-[var(--blue-soft)] text-[var(--blue)]",
  amber: "bg-[var(--amber-soft)] text-[var(--amber)]",
  red: "bg-[var(--red-soft)] text-[var(--red)]",
  neutral: "bg-[var(--surface-subtle)] text-[var(--muted)]",
};

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex min-h-6 items-center rounded-[2px] border border-current/10 px-2 py-1 font-mono text-[9px] font-bold uppercase leading-none", tones[tone], className)}>
      {children}
    </span>
  );
}
