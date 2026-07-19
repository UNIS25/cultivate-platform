import type { Metadata } from "next";
import { Building2, Database, Eye, FlaskConical, LockKeyhole, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Data governance" };

const levels = [
  { title: "Public", icon: Eye, access: "Aggregate statistics, public organisation profiles and generalised city-level locations.", excluded: "No contacts, exact pickup addresses, personal data or private match participants." },
  { title: "Verified organisations", icon: Building2, access: "Operational details for offers, matches, collections and deliveries in which their organisation participates.", excluded: "No unrelated organisation records or platform-administration data." },
  { title: "Researchers", icon: FlaskConical, access: "Anonymised aggregate indicators, documented methodology and filtered exports.", excluded: "No direct identifiers, contacts, exact locations or row-level custody histories." },
  { title: "Platform administrators", icon: LockKeyhole, access: "Separated authenticated oversight for verification, moderation, quality and policy administration.", excluded: "Access is accountable through RLS, audit events and least-privilege server routes." },
];

export default function DataGovernancePage() {
  return (
    <>
      <PageHeader eyebrow="Privacy by design" title="Data governance and access levels" description="How the fictional prototype separates public transparency, operational coordination, research use and administration." actions={<Badge tone="green"><ShieldCheck size={12} className="mr-1" /> RLS enabled</Badge>} />
      <section className="cn-panel cn-enter-delay mt-6 overflow-hidden" aria-label="Access levels"><div className="grid gap-px bg-[var(--line)] md:grid-cols-2">{levels.map(({ title, icon: Icon, access, excluded }) => <article key={title} className="bg-white p-5 sm:p-6"><span className="grid size-10 place-items-center bg-[var(--green-soft)] text-[var(--green)]"><Icon size={19} /></span><h2 className="mt-5 text-base font-bold">{title}</h2><p className="mt-3 text-xs leading-5"><strong>Can access:</strong> {access}</p><p className="mt-2 text-xs leading-5 text-[var(--muted)]"><strong>Withheld:</strong> {excluded}</p></article>)}</div></section>
      <section className="mt-5 grid gap-5 lg:grid-cols-2"><article className="cn-panel p-5"><Database size={18} className="text-[var(--blue)]" /><h2 className="mt-4 text-sm font-bold">Database enforcement</h2><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Supabase Row Level Security remains enabled on every application table, including resource events, delivery confirmations and append-only audit events. Audit rows receive no client update or delete grants.</p></article><article className="border border-[var(--ink)] bg-[var(--acid)] p-5"><LockKeyhole size={18} /><h2 className="mt-4 text-sm font-bold">Credential boundary</h2><p className="mt-2 text-xs leading-5 text-[var(--ink)]/65">The browser receives only the Supabase publishable key. Service-role credentials are neither required nor exposed; privileged operations belong in controlled server infrastructure.</p></article></section>
      <p className="mt-5 text-xs leading-5 text-[var(--muted)]">This page describes a demonstration design, not a final legal policy. A production deployment would add retention schedules, lawful-basis records, incident procedures, data-processing agreements and a formal access-review process.</p>
    </>
  );
}
