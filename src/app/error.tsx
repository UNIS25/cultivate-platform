"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="cn-panel mx-auto max-w-2xl p-8 text-center" role="alert"><span className="mx-auto grid size-12 place-items-center bg-[var(--red-soft)] text-[var(--red)]"><AlertTriangle size={23} /></span><h1 className="mt-5 text-xl font-bold">This demonstration view could not be loaded</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">No data was changed. Check the Supabase connection or retry the request.</p><button type="button" onClick={reset} className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-[2px] bg-[var(--ink)] px-4 text-sm font-bold text-white"><RotateCcw size={16} /> Try again</button></section>;
}
