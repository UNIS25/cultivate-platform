import { Sprout } from "lucide-react";
import { cn } from "@/lib/format";

export function Logo({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className={cn(
          "relative grid size-9 shrink-0 place-items-center rounded-[2px]",
          inverse ? "bg-[var(--acid)] text-[var(--ink)]" : "bg-[var(--ink)] text-[var(--acid)]",
        )}
      >
        <Sprout aria-hidden="true" size={20} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className={cn("block text-[14px] font-bold leading-none", inverse ? "text-white" : "text-[var(--ink)]")}>
            CULTIVATE <span className={inverse ? "text-[var(--acid)]" : "text-[var(--green)]"}>NEXT</span>
          </span>
          <span className={cn("mt-1 block font-mono text-[8px] font-semibold uppercase", inverse ? "text-white/45" : "text-[var(--muted)]")}>
            Food systems console
          </span>
        </span>
      )}
    </div>
  );
}
