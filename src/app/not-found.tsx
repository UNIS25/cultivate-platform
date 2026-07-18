import Link from "next/link";
import { ArrowLeft, MapPinOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="grid size-14 place-items-center rounded-md bg-[var(--surface-subtle)] text-[var(--muted)]"><MapPinOff size={26} /></span>
      <h1 className="mt-5 text-2xl font-bold">This page is not in the demo workspace</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">The record may have moved or the link may be incomplete.</p>
      <Link href="/" className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--green)] px-4 text-sm font-bold text-white hover:bg-[var(--green-dark)]"><ArrowLeft size={16} /> Return to dashboard</Link>
    </div>
  );
}
