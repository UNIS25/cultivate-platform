"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Download,
  Euro,
  FlaskConical,
  Handshake,
  Leaf,
  MapPin,
  PackageOpen,
  Radio,
  Scale,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NetworkSnapshot } from "@/data/repository";
import { getListingMatchGroups } from "@/data/selectors";
import { calculateImpactReport } from "@/features/impact/calculations";
import { HealthIndicators } from "@/features/operations/health-indicators";
import { ResourceEventWorkflow } from "@/features/workflow/resource-event-workflow";
import { formatDateTime, formatNumber } from "@/lib/format";

type DemoRole = "Food donor" | "Recipient organisation" | "Municipality" | "Researcher" | "Platform administrator";

const roles: Array<{ role: DemoRole; icon: ComponentType<{ size?: number }> }> = [
  { role: "Food donor", icon: PackageOpen },
  { role: "Recipient organisation", icon: Truck },
  { role: "Municipality", icon: Building2 },
  { role: "Researcher", icon: FlaskConical },
  { role: "Platform administrator", icon: ShieldCheck },
];

function Stat({ label, value, detail, icon: Icon, tone = "green" }: { label: string; value: string; detail: string; icon: ComponentType<{ size?: number }>; tone?: "green" | "blue" | "amber" | "red" }) {
  const color = tone === "blue" ? "text-[var(--blue)] bg-[var(--blue-soft)]" : tone === "amber" ? "text-[var(--amber)] bg-[var(--amber-soft)]" : tone === "red" ? "text-[var(--red)] bg-[var(--red-soft)]" : "text-[var(--green)] bg-[var(--green-soft)]";
  return <article className="bg-white p-5"><span className={`grid size-9 place-items-center ${color}`}><Icon size={17} /></span><p className="mt-5 text-3xl font-semibold leading-none">{value}</p><h2 className="mt-2 text-xs font-bold">{label}</h2><p className="mt-2 text-[10px] leading-4 text-[var(--muted)]">{detail}</p></article>;
}

function CommunityActivity() {
  const groups = [
    ["Upcoming events", "Cold-chain practice clinic", "Tomorrow · Online demonstration", CalendarDays],
    ["Knowledge resources", "Neighbourhood logistics playbook", "Updated this week", Database],
    ["Collaboration requests", "Multilingual volunteer induction", "3 fictional partners wanted", Handshake],
    ["Recently active initiatives", "Harbour Share Hub + 6 more", "Activity within 48 hours", Radio],
  ] as const;
  return <section className="cn-panel mt-5 overflow-hidden" aria-labelledby="community-practice"><div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--ink)] p-4 text-white"><div><h2 id="community-practice" className="text-sm font-bold">Community of Practice activity</h2><p className="mt-1 font-mono text-[9px] text-white/45">SECONDARY FICTIONAL NETWORK SIGNALS</p></div><Badge tone="blue">Demo</Badge></div><div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">{groups.map(([label, title, detail, Icon]) => <article key={label} className="bg-white p-4"><Icon size={16} className="text-[var(--green)]" /><p className="mt-4 font-mono text-[9px] font-bold text-[var(--muted)]">{label.toUpperCase()}</p><p className="mt-2 text-xs font-bold">{title}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{detail}</p></article>)}</div></section>;
}

export function RoleDashboard({ data }: { data: NetworkSnapshot }) {
  const [role, setRole] = useState<DemoRole>("Food donor");
  const [exported, setExported] = useState(false);
  const activeEvents = data.resourceEvents.filter((event) => !["delivered", "cancelled", "expired"].includes(event.status));
  const deliveredEvents = data.resourceEvents.filter((event) => event.status === "delivered");
  const impact = useMemo(() => calculateImpactReport(data.resourceEvents), [data.resourceEvents]);
  const matchGroups = useMemo(() => getListingMatchGroups(data), [data]);
  const firstDonor = data.donors.find((donor) => deliveredEvents.some((event) => event.organisationId === donor.id)) ?? data.donors[0];
  const firstRecipient = data.recipients[0];
  const cityHotspots = useMemo(() => {
    const totals = new Map<string, number>();
    activeEvents.forEach((event) => totals.set(event.city, (totals.get(event.city) ?? 0) + event.quantityKg));
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [activeEvents]);

  function exportResearchCsv() {
    const rows = ["indicator,value", `delivered_kg,${impact.metrics.redistributedKg}`, `estimated_meals,${impact.metrics.estimatedMeals}`, `cities,${new Set(data.resourceEvents.map((event) => event.city)).size}`, `resource_events,${data.resourceEvents.length}`];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cultivate-next-anonymised-demo-indicators.csv";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setExported(true);
  }

  return (
    <>
      <section className="cn-panel cn-enter-delay mt-6 overflow-hidden" aria-labelledby="role-switcher-title">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] bg-[var(--acid)] p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><Sparkles size={16} /><h2 id="role-switcher-title" className="text-sm font-bold">Demonstration role switcher</h2></div><p className="mt-1 text-xs text-[var(--ink)]/65">Presentation aid only — this does not change authentication or RLS permissions.</p></div><Badge tone="amber">Demo only</Badge></div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-5">{roles.map(({ role: item, icon: Icon }) => <button key={item} type="button" aria-pressed={role === item} onClick={() => setRole(item)} className={`flex min-h-14 items-center gap-2 border-b border-r border-[var(--line)] px-4 text-left text-xs font-bold transition-colors ${role === item ? "bg-[var(--ink)] text-white" : "bg-white text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"}`}><Icon size={16} /> {item}</button>)}</div>
      </section>

      {role === "Food donor" && <>
        <section className="cn-panel mt-5 grid gap-px overflow-hidden bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5" aria-label="Food donor dashboard"><Stat label="Active offers" value={formatNumber(activeEvents.length)} detail="Available, matched or accepted" icon={PackageOpen} tone="amber" /><Stat label="Pending matches" value={formatNumber(matchGroups.length)} detail="Rules-based recipient groups" icon={Handshake} tone="blue" /><Stat label="Completed collections" value={formatNumber(deliveredEvents.length)} detail="Confirmed delivery records" icon={CheckCircle2} /><Stat label="Food redistributed" value={`${formatNumber(impact.metrics.redistributedKg)} kg`} detail="Delivered resource events only" icon={Scale} /><Stat label="Estimated savings + impact" value={`€${formatNumber(Math.round(impact.metrics.financialValueEur))}`} detail={`${impact.metrics.estimatedCo2eAvoidedKg} kg CO2e demo estimate`} icon={Euro} tone="blue" /></section>
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]"><section className="cn-panel overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--line)] p-4"><div><h2 className="text-sm font-bold">Active donor offers</h2><p className="mt-1 text-xs text-[var(--muted)]">Collection deadlines within 72 hours</p></div><Link href="/report" className="text-xs font-bold text-[var(--green)]">Report surplus</Link></div><div className="divide-y divide-[var(--line)]">{activeEvents.slice(0, 5).map((event) => <Link href={`/listings/${event.sourceId}`} key={event.id} className="cn-row-action flex items-center gap-3 p-4"><span className="grid size-9 shrink-0 place-items-center bg-[var(--amber-soft)] text-[var(--amber)]"><PackageOpen size={16} /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{event.title}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{event.city} · {event.quantityKg} kg · {event.collectionDeadline ? formatDateTime(event.collectionDeadline) : "Scheduled"}</p></div><ArrowRight size={14} className="text-[var(--muted)]" /></Link>)}</div></section>{activeEvents[0] && <ResourceEventWorkflow event={activeEvents[0]} compact />}</div>
        {firstDonor && <div className="mt-5"><HealthIndicators donor={firstDonor} events={data.resourceEvents} /></div>}
      </>}

      {role === "Recipient organisation" && <>
        <section className="cn-panel mt-5 grid gap-px overflow-hidden bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4" aria-label="Recipient organisation dashboard"><Stat label="Nearby available food" value={`${formatNumber(activeEvents.filter((event) => event.city === firstRecipient?.city).reduce((sum, event) => sum + event.quantityKg, 0))} kg`} detail={`Generalised area around ${firstRecipient?.city ?? "selected recipient"}`} icon={MapPin} tone="amber" /><Stat label="Accepted collections" value={formatNumber(activeEvents.filter((event) => event.status === "matched" || event.status === "accepted").length)} detail="Matched demonstration offers" icon={ClipboardCheck} tone="blue" /><Stat label="Storage capacity" value={`${formatNumber(firstRecipient?.capacityKg ?? 0)} kg`} detail={firstRecipient?.refrigeration ? "Refrigerated storage available" : "Ambient storage"} icon={Database} /><Stat label="Delivery history" value={formatNumber(deliveredEvents.length)} detail="Completed network deliveries" icon={Truck} /></section>
        <section className="cn-panel mt-5 overflow-hidden"><div className="border-b border-[var(--line)] p-5"><h2 className="text-sm font-bold">Nearby food and delivery history</h2><p className="mt-1 text-xs text-[var(--muted)]">Operational details would be restricted to relevant verified matches</p></div><div className="grid gap-px bg-[var(--line)] lg:grid-cols-2"><div className="bg-white divide-y divide-[var(--line)]">{activeEvents.slice(0, 4).map((event) => <Link href={`/listings/${event.sourceId}`} key={event.id} className="block p-4"><p className="text-xs font-bold">{event.title} · {event.quantityKg} kg</p><p className="mt-1 text-[10px] text-[var(--muted)]">{event.city} · generalised pickup area</p></Link>)}</div><div className="bg-white divide-y divide-[var(--line)]">{deliveredEvents.map((event) => <div key={event.id} className="p-4"><p className="text-xs font-bold">{event.materialCategory} delivery · {event.quantityKg} kg</p><p className="mt-1 text-[10px] text-[var(--muted)]">{event.deliveredAt ? formatDateTime(event.deliveredAt) : "Confirmed"}</p></div>)}</div></div></section>
      </>}

      {role === "Municipality" && <>
        <section className="cn-panel mt-5 grid gap-px overflow-hidden bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4" aria-label="Municipality dashboard"><Stat label="Initiatives by area" value={formatNumber(data.initiatives.length)} detail={`${new Set(data.initiatives.map((item) => item.city)).size} demonstration cities`} icon={Building2} /><Stat label="Food-sharing coverage" value={`${formatNumber(new Set(data.resourceEvents.map((event) => event.city)).size)} cities`} detail="Generalised operational coverage" icon={MapPin} tone="blue" /><Stat label="Completed diversion" value={`${formatNumber(impact.metrics.landfillDiversionKg)} kg`} detail="Delivered food adjusted for handling" icon={Truck} /><Stat label="Environmental impact" value={`${formatNumber(impact.metrics.estimatedCo2eAvoidedKg)} kg`} detail="Estimated CO2e avoided" icon={Leaf} /></section>
        <section className="cn-panel mt-5 overflow-hidden"><div className="border-b border-[var(--line)] p-5"><h2 className="text-sm font-bold">Surplus hotspots</h2><p className="mt-1 text-xs text-[var(--muted)]">Active kilograms by generalised city area</p></div><div className="divide-y divide-[var(--line)]">{cityHotspots.map(([city, kilograms], index) => <div key={city} className="grid grid-cols-[32px_minmax(0,1fr)_90px] items-center gap-3 p-4"><span className="font-mono text-[10px] text-[var(--muted)]">{String(index + 1).padStart(2, "0")}</span><div><p className="text-xs font-bold">{city}</p><div className="mt-2 h-1.5 bg-[var(--surface-subtle)]"><div className="h-full bg-[var(--amber)]" style={{ width: `${Math.min(100, kilograms / Math.max(1, cityHotspots[0]?.[1] ?? 1) * 100)}%` }} /></div></div><p className="text-right text-xs font-bold">{kilograms} kg</p></div>)}</div></section>
      </>}

      {role === "Researcher" && <>
        <section className="cn-panel mt-5 grid gap-px overflow-hidden bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4" aria-label="Researcher dashboard"><Stat label="Delivered kilograms" value={`${formatNumber(impact.metrics.redistributedKg)} kg`} detail="Anonymised aggregate" icon={Scale} /><Stat label="Resource events" value={formatNumber(data.resourceEvents.length)} detail="No personal or contact data" icon={Database} tone="blue" /><Stat label="City coverage" value={formatNumber(new Set(data.resourceEvents.map((event) => event.city)).size)} detail="Generalised locations" icon={MapPin} /><Stat label="Data completeness" value="100%" detail="Required demo indicator fields present" icon={CheckCircle2} /></section>
        <div className="mt-5 grid gap-5 lg:grid-cols-2"><section className="cn-panel p-5"><BarChart3 size={18} className="text-[var(--blue)]" /><h2 className="mt-4 text-sm font-bold">Dataset methodology</h2><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Impact includes only delivered events. Meals, financial value, CO2e and landfill diversion use versioned factors in the editable assumptions configuration. Dates and cities can be filtered on the impact workspace.</p><Link href="/impact" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[var(--green)]">Open methodology and filters <ArrowRight size={14} /></Link></section><section className="cn-panel p-5"><Download size={18} className="text-[var(--green)]" /><h2 className="mt-4 text-sm font-bold">Anonymised export options</h2><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Download aggregate indicators without organisation IDs, contacts or exact locations.</p><button type="button" onClick={exportResearchCsv} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-[2px] bg-[var(--ink)] px-4 text-xs font-bold text-white"><Download size={15} /> Export aggregate CSV</button>{exported && <p role="status" className="mt-3 text-xs font-bold text-[var(--green)]">Aggregate export prepared successfully.</p>}</section></div>
        <aside className="mt-5 flex items-start gap-3 border-l-4 border-[var(--amber)] bg-[var(--amber-soft)] p-4 text-xs leading-5 text-[var(--amber)]"><AlertTriangle className="mt-0.5 shrink-0" size={16} /><span><strong>Data-quality notice:</strong> all records are fictional, sample sizes are small, factors are illustrative and no causal conclusions should be drawn.</span></aside>
      </>}

      {role === "Platform administrator" && <>
        <section className="cn-panel mt-5 grid gap-px overflow-hidden bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4" aria-label="Platform administrator dashboard"><Stat label="Pending verification" value={formatNumber(data.initiatives.filter((item) => !item.verified).length)} detail="Fictional organisation reviews" icon={ShieldCheck} tone="amber" /><Stat label="Flagged listings" value={formatNumber(data.surplusListings.filter((item) => item.handling === "Chilled" && item.quantityKg > 70).length)} detail="Demo moderation queue" icon={AlertTriangle} tone="red" /><Stat label="Organisations + users" value={`${data.initiatives.length + data.donors.length + data.recipients.length} / 68`} detail="Organisations / fictional user profiles" icon={Users} tone="blue" /><Stat label="Platform activity" value={formatNumber(data.resourceEvents.length)} detail="Resource events in shared spine" icon={Radio} /></section>
        <div className="mt-5 grid gap-5 lg:grid-cols-2"><section className="cn-panel overflow-hidden"><div className="border-b border-[var(--line)] p-5"><h2 className="text-sm font-bold">Pending organisation verification</h2></div><div className="divide-y divide-[var(--line)]">{data.initiatives.filter((item) => !item.verified).map((item) => <div key={item.id} className="flex items-center gap-3 p-4"><span className="grid size-9 place-items-center bg-[var(--amber-soft)] text-[var(--amber)]"><Building2 size={16} /></span><div><p className="text-xs font-bold">{item.name}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{item.city} · {item.type}</p></div></div>)}</div></section><section className="cn-panel overflow-hidden"><div className="border-b border-[var(--line)] p-5"><h2 className="text-sm font-bold">Data-quality alerts</h2></div><div className="divide-y divide-[var(--line)]"><div className="p-4"><p className="text-xs font-bold">Matched events missing a destination</p><p className="mt-1 text-[10px] text-[var(--muted)]">{data.resourceEvents.filter((event) => event.status === "matched" && !event.destinationId).length} fictional records require review</p></div><div className="p-4"><p className="text-xs font-bold">Expired active listings</p><p className="mt-1 text-[10px] text-[var(--muted)]">0 records · deterministic date safeguard passed</p></div><div className="p-4"><p className="text-xs font-bold">Append-only audit protection</p><p className="mt-1 text-[10px] text-[var(--muted)]">Enabled through grants, RLS and database trigger</p></div></div></section></div>
      </>}

      <CommunityActivity />
    </>
  );
}
