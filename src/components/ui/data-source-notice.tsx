import { CircleAlert, Database } from "lucide-react";
import type { DataSourceState } from "@/data";

export function DataSourceNotice({ source }: { source: DataSourceState }) {
  if (source.status === "ready") return null;

  const unconfigured = source.status === "unconfigured";
  return (
    <section role="status" className="mt-5 flex items-start gap-3 border border-[var(--line)] bg-white p-4 sm:p-5">
      {unconfigured
        ? <Database aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--blue)]" size={19} />
        : <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--red)]" size={19} />}
      <div>
        <h2 className="text-sm font-bold">{unconfigured ? "Supabase connection required" : "Supabase data unavailable"}</h2>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{source.message}</p>
        {unconfigured && (
          <p className="mt-2 text-[11px] text-[var(--muted)]">
            Configure <code className="font-bold text-[var(--ink)]">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="font-bold text-[var(--ink)]">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>.
          </p>
        )}
      </div>
    </section>
  );
}
