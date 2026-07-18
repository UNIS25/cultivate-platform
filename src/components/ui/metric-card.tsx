import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/format";

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  trend,
  tone = "green",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  trend?: "up" | "down";
  tone?: "green" | "blue" | "amber" | "red";
}) {
  const iconTone = {
    green: "bg-[var(--green-soft)] text-[var(--green)]",
    blue: "bg-[var(--blue-soft)] text-[var(--blue)]",
    amber: "bg-[var(--amber-soft)] text-[var(--amber)]",
    red: "bg-[var(--red-soft)] text-[var(--red)]",
  }[tone];

  return (
    <article className="group relative min-w-0 border-b border-[var(--line)] bg-white p-4 transition-colors hover:bg-[var(--surface-raised)] last:border-b-0 sm:p-5 lg:border-b-0 lg:border-r lg:last:border-r-0">
      <span className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-[var(--acid)] transition-transform group-hover:scale-x-100" />
      <div className="flex items-center justify-between gap-3">
        <p className="truncate font-mono text-[9px] font-bold uppercase text-[var(--muted)]">{label}</p>
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-[2px]", iconTone)}>
          <Icon aria-hidden="true" size={17} />
        </span>
      </div>
      <p className="mt-5 text-3xl font-semibold leading-none text-[var(--ink)]">{value}</p>
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
        {trend === "up" && <ArrowUpRight aria-hidden="true" className="text-[var(--green)]" size={14} />}
        {trend === "down" && <ArrowDownRight aria-hidden="true" className="text-[var(--red)]" size={14} />}
        <span>{detail}</span>
      </div>
    </article>
  );
}
