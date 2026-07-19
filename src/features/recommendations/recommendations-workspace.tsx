"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CircleAlert,
  ClipboardCheck,
  FileText,
  MessageSquareText,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EngagementResource, GovernanceResource } from "@/data";
import { cn } from "@/lib/format";

function governanceIcon(area: string) {
  if (area === "Data stewardship") return ClipboardCheck;
  if (area === "Learning") return MessageSquareText;
  if (area === "Participation") return Users;
  return ShieldCheck;
}

function engagementIcon(type: string) {
  if (type === "Template") return FileText;
  if (type === "Guide") return BookOpen;
  if (type === "Practice exchange") return Network;
  return Users;
}

export function RecommendationsWorkspace({ governanceActions, resources }: { governanceActions: GovernanceResource[]; resources: EngagementResource[] }) {
  const [tab, setTab] = useState<"governance" | "engagement">("governance");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [checks, setChecks] = useState({ roles: true, privacy: false, feedback: false, representation: true, safety: true });
  const [practiceOpen, setPracticeOpen] = useState(false);

  const maturity = useMemo(() => Math.round((Object.values(checks).filter(Boolean).length / Object.values(checks).length) * 100), [checks]);

  function toggleCompleted(id: string) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="cn-enter-delay mt-6 grid border border-[var(--ink)] bg-[var(--ink)] sm:grid-cols-2">
        <button onClick={() => setTab("governance")} className={cn("relative flex min-h-16 items-center gap-3 border-b border-white/10 px-5 text-left sm:border-b-0 sm:border-r", tab === "governance" ? "bg-white text-[var(--ink)]" : "text-white/55 hover:text-white")}><span className="font-mono text-[9px] opacity-55">01</span><ShieldCheck size={18} /><span><strong className="block text-sm">Good governance</strong><span className="mt-0.5 block text-[10px] opacity-55">Assessment and actions</span></span>{tab === "governance" && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--acid)]" />}</button>
        <button onClick={() => setTab("engagement")} className={cn("relative flex min-h-16 items-center gap-3 px-5 text-left", tab === "engagement" ? "bg-white text-[var(--ink)]" : "text-white/55 hover:text-white")}><span className="font-mono text-[9px] opacity-55">02</span><Users size={18} /><span><strong className="block text-sm">Citizen engagement</strong><span className="mt-0.5 block text-[10px] opacity-55">Resources and shared practice</span></span>{tab === "engagement" && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--blue)]" />}</button>
      </div>

      {tab === "governance" ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_390px]">
          <section className="cn-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4"><div><h2 className="text-sm font-bold">Prioritised action ledger</h2><p className="mt-1 text-[11px] text-[var(--muted)]">Current fictional network assessment</p></div><Badge tone="amber">{governanceActions.length - completed.size} open</Badge></div>
            <div className="divide-y divide-[var(--line)]">
              {governanceActions.map(({ id, priority, title, description, area, effort }, index) => {
                const Icon = governanceIcon(area);
                const done = completed.has(id);
                return (
                  <article key={id} className={cn("cn-row-action grid gap-4 border-l-4 p-5 sm:grid-cols-[32px_42px_minmax(0,1fr)_auto] sm:items-start", priority === "High" ? "border-l-[var(--coral)]" : "border-l-[var(--amber)]", done && "bg-[var(--surface-subtle)] opacity-65")}>
                    <span className="pt-3 font-mono text-[9px] font-bold text-[var(--muted)]">A{String(index + 1).padStart(2, "0")}</span>
                    <span className={cn("grid size-10 place-items-center rounded-[2px]", priority === "High" ? "bg-[var(--red-soft)] text-[var(--red)]" : "bg-[var(--amber-soft)] text-[var(--amber)]")}><Icon size={18} /></span>
                    <div><div className="flex flex-wrap items-center gap-2"><Badge tone={priority === "High" ? "red" : "amber"}>{priority} priority</Badge><span className="font-mono text-[9px] text-[var(--muted)]">{area} / {effort}</span></div><h3 className={cn("mt-2 text-sm font-bold", done && "line-through")}>{title}</h3><p className="mt-1.5 max-w-2xl text-xs leading-5 text-[var(--muted)]">{description}</p></div>
                    <Button type="button" variant={done ? "secondary" : "ghost"} className="min-h-9 px-2.5 text-xs" onClick={() => toggleCompleted(id)}>{done ? "Undo" : <><Check size={15} /> Mark complete</>}</Button>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="cn-panel-dark p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] font-bold text-white/45">GOVERNANCE MATURITY</p><p className="mt-3 text-5xl font-semibold">{maturity}<span className="text-base text-white/40">/100</span></p></div><span className="grid size-10 place-items-center bg-[var(--acid)] text-[var(--ink)]"><ShieldCheck size={20} /></span></div>
              <div className="mt-5 grid grid-cols-10 gap-1">{Array.from({ length: 10 }, (_, index) => <span key={index} className={cn("h-7", index < Math.round(maturity / 10) ? "bg-[var(--acid)]" : "bg-white/10")} />)}</div>
              <fieldset className="mt-6 space-y-3 border-t border-white/10 pt-5"><legend className="mb-3 text-xs font-bold">Quick assessment</legend>{[
                ["roles", "Approval roles are documented"], ["privacy", "Pickup data access is reviewed"], ["feedback", "Recipients can report outcomes"], ["representation", "Citizens join decision reviews"], ["safety", "Food-safety process is current"],
              ].map(([key, label]) => <label key={key} className="flex cursor-pointer items-start gap-2.5 text-xs leading-5 text-white/70"><input type="checkbox" checked={checks[key as keyof typeof checks]} onChange={(event) => setChecks((current) => ({ ...current, [key]: event.target.checked }))} className="mt-0.5 size-4 shrink-0 accent-[var(--acid)]" /><span>{label}</span></label>)}</fieldset>
            </section>
            <section className="border border-[var(--ink)] bg-[var(--acid)] p-5"><Sparkles size={20} /><h2 className="mt-4 text-sm font-bold">Recommendation method</h2><p className="mt-2 text-xs leading-5 text-[var(--ink)]/65">Transparent rules connect assessment gaps to practical actions. No automated decisions or personal profiling.</p></section>
          </aside>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_390px]">
          <section id="engagement-resources" className="cn-panel p-5 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-sm font-bold">Engagement resource library</h2><p className="mt-1 text-[11px] text-[var(--muted)]">Reusable fictional materials for inclusive local participation</p></div><Badge tone="blue">{resources.length} resources</Badge></div>
            <div className="mt-5 grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
              {resources.map(({ id, type, title, detail, audience }, index) => {
                const Icon = engagementIcon(type);
                return <article key={id} className="group relative bg-white p-5 transition-colors hover:bg-[var(--surface-raised)]"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="font-mono text-[9px] text-[var(--muted)]">R{String(index + 1).padStart(2, "0")}</span><span className="grid size-10 place-items-center bg-[var(--blue-soft)] text-[var(--blue)]"><Icon size={18} /></span></div><Badge tone="blue">{type}</Badge></div><h3 className="mt-5 text-sm font-bold">{title}</h3><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{detail}</p><div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-3"><span className="text-[10px] text-[var(--muted)]">{audience}</span><ArrowUpRight className="text-[var(--blue)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={15} /></div></article>;
              })}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="cn-panel overflow-hidden"><div className="bg-[var(--ink)] p-5 text-white"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center bg-[var(--acid)] text-[var(--ink)]"><Network size={19} /></span><div><h2 className="text-sm font-bold">Community of Practice</h2><p className="mt-1 font-mono text-[9px] text-white/45">FICTIONAL PEER NETWORK</p></div></div></div><div className="p-5"><div className="divide-y divide-[var(--line)]"><div className="flex items-center justify-between pb-4 text-xs"><span className="font-semibold">Active members</span><strong className="text-lg">84</strong></div><div className="flex items-center justify-between py-4 text-xs"><span className="font-semibold">Practice notes shared</span><strong>26</strong></div><div className="flex items-center justify-between py-4 text-xs"><span className="font-semibold">Next exchange</span><strong>Next Thursday</strong></div></div>{practiceOpen && <div className="mt-4 border-l-4 border-[var(--green)] bg-[var(--green-soft)] p-3 text-xs leading-5"><strong className="block text-[var(--green-dark)]">Shared logistics clinic</strong><span className="text-[var(--muted)]">Next Thursday, 14:00 / Online demonstration / 18 places</span></div>}<Button type="button" variant="secondary" className="mt-5 w-full" aria-expanded={practiceOpen} onClick={() => setPracticeOpen((current) => !current)}>{practiceOpen ? "Close exchange details" : <><span>Open practice exchange</span><ArrowRight size={15} /></>}</Button></div></section>
            <section className="border-l-4 border-[var(--amber)] bg-[var(--amber-soft)] p-5"><CircleAlert className="text-[var(--amber)]" size={19} /><h2 className="mt-3 text-sm font-bold">Participation gap</h2><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Four initiatives have not recorded citizen input in the current fictional review cycle.</p></section>
          </aside>
        </div>
      )}
    </>
  );
}
