"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";
import {
  Building2,
  CheckCircle2,
  Download,
  Euro,
  Filter,
  Info,
  Leaf,
  Recycle,
  Scale,
  Settings2,
  TrendingUp,
  Utensils,
  Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { IMPACT_ASSUMPTIONS } from "@/config/impact-assumptions";
import { calculateImpactReport, type ImpactFilters } from "@/features/impact/calculations";
import { cn, formatDateTime, formatNumber } from "@/lib/format";
import type { FoodCategory, ResourceEvent } from "@/types/domain";

const currencyFormatter = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const fieldClass = "h-10 w-full rounded-[2px] border border-[var(--line-strong)] bg-white px-3 text-xs font-semibold outline-none focus:border-[var(--blue)]";

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function Metric({
  label,
  value,
  detail,
  estimate,
  icon: Icon,
  tone = "green",
}: {
  label: string;
  value: string;
  detail: string;
  estimate?: boolean;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone?: "green" | "blue" | "amber" | "red";
}) {
  const toneClass = tone === "blue" ? "bg-[var(--blue-soft)] text-[var(--blue)]" : tone === "amber" ? "bg-[var(--amber-soft)] text-[var(--amber)]" : tone === "red" ? "bg-[var(--red-soft)] text-[var(--red)]" : "bg-[var(--green-soft)] text-[var(--green)]";
  return (
    <article className="min-h-44 bg-white p-5">
      <div className="flex items-start justify-between gap-3"><Badge tone={estimate ? "amber" : "green"}>{estimate ? "Demo estimate" : "Direct record"}</Badge><span className={cn("grid size-9 place-items-center", toneClass)}><Icon size={18} /></span></div>
      <p className="mt-5 text-3xl font-semibold leading-none">{value}</p>
      <h2 className="mt-2 text-sm font-bold">{label}</h2>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{detail}</p>
    </article>
  );
}

export function ImpactDashboard({ events }: { events: ResourceEvent[] }) {
  const [filters, setFilters] = useState<ImpactFilters>({});
  const report = useMemo(() => calculateImpactReport(events, filters), [events, filters]);
  const cities = useMemo(() => [...new Set(events.map((event) => event.city))].sort(), [events]);
  const organisationTypes = useMemo(() => [...new Set(events.map((event) => event.donorType))].sort(), [events]);
  const categories = useMemo(() => [...new Set(events.map((event) => event.materialCategory))].sort(), [events]);
  const { metrics } = report;

  function updateFilter<K extends keyof ImpactFilters>(key: K, value: ImpactFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value || undefined }));
  }

  function downloadCsv() {
    const rows: Array<Array<string | number>> = [
      ["record_type", "name", "value", "unit_or_scope", "basis"],
      ["metric", "Food redistributed", metrics.redistributedKg, "kg", "Delivered resource events only"],
      ["metric", "Estimated meals", metrics.estimatedMeals, "meals", "Demonstration assumption"],
      ["metric", "Estimated financial value", metrics.financialValueEur, "EUR", "Demonstration assumption"],
      ["metric", "Estimated CO2e avoided", metrics.estimatedCo2eAvoidedKg, "kg CO2e", "Demonstration assumption"],
      ["metric", "Landfill diversion", metrics.landfillDiversionKg, "kg", "Demonstration assumption"],
      ["metric", "Collection success rate", metrics.collectionSuccessRate, "%", "Delivered / terminal collection attempts"],
      ...report.deliveredEvents.map((event) => ["delivery", event.title, event.kilograms, "kg", `${event.city}; ${event.category}; delivered ${event.deliveredAt}`]),
    ];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cultivate-next-demo-impact.csv";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const assumptionRows = [
    [IMPACT_ASSUMPTIONS.mealsPerKilogram.label, `${IMPACT_ASSUMPTIONS.mealsPerKilogram.value} meals per kg`, IMPACT_ASSUMPTIONS.mealsPerKilogram.description],
    [IMPACT_ASSUMPTIONS.financialValuePerKilogramEur.label, `${currencyFormatter.format(IMPACT_ASSUMPTIONS.financialValuePerKilogramEur.value)} per kg`, IMPACT_ASSUMPTIONS.financialValuePerKilogramEur.description],
    ["Landfill diversion", `${IMPACT_ASSUMPTIONS.wasteAvoidanceRate.value * 100}% of delivered kg`, IMPACT_ASSUMPTIONS.wasteAvoidanceRate.description],
    [IMPACT_ASSUMPTIONS.co2eAvoidedPerKilogram.label, `${IMPACT_ASSUMPTIONS.co2eAvoidedPerKilogram.value} kg CO2e per kg`, IMPACT_ASSUMPTIONS.co2eAvoidedPerKilogram.description],
  ];

  return (
    <>
      <section className="cn-enter-delay mt-6 border border-[var(--ink)] bg-[var(--acid)] p-4 sm:p-5" aria-label="Impact reporting scope">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><Info className="mt-0.5 shrink-0" size={18} /><div><p className="text-sm font-bold">Delivered resource events only</p><p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--ink)]/65">Impact is generated after delivery confirmation. Every calculated figure is a fictional demonstration estimate, not an audited claim.</p></div></div>
          <button type="button" onClick={downloadCsv} className="inline-flex min-h-10 w-fit shrink-0 items-center gap-2 rounded-[2px] border border-[var(--ink)] bg-[var(--ink)] px-3 text-xs font-bold text-white hover:bg-[var(--green)]"><Download size={16} /> Export CSV</button>
        </div>
      </section>

      <section className="cn-panel mt-5 p-4 sm:p-5" aria-labelledby="impact-filters-title">
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Filter size={16} className="text-[var(--blue)]" /><h2 id="impact-filters-title" className="text-sm font-bold">Reporting filters</h2></div><button type="button" className="text-xs font-bold text-[var(--blue)]" onClick={() => setFilters({})}>Clear filters</button></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label><span className="mb-1.5 block text-[10px] font-bold uppercase text-[var(--muted)]">From date</span><input aria-label="Filter from date" className={fieldClass} type="date" value={filters.from ?? ""} onChange={(event) => updateFilter("from", event.target.value)} /></label>
          <label><span className="mb-1.5 block text-[10px] font-bold uppercase text-[var(--muted)]">To date</span><input aria-label="Filter to date" className={fieldClass} type="date" value={filters.to ?? ""} onChange={(event) => updateFilter("to", event.target.value)} /></label>
          <label><span className="mb-1.5 block text-[10px] font-bold uppercase text-[var(--muted)]">City</span><select aria-label="Filter by city" className={fieldClass} value={filters.city ?? ""} onChange={(event) => updateFilter("city", event.target.value)}><option value="">All cities</option>{cities.map((city) => <option key={city}>{city}</option>)}</select></label>
          <label><span className="mb-1.5 block text-[10px] font-bold uppercase text-[var(--muted)]">Organisation type</span><select aria-label="Filter by organisation type" className={fieldClass} value={filters.organisationType ?? ""} onChange={(event) => updateFilter("organisationType", event.target.value)}><option value="">All types</option>{organisationTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label><span className="mb-1.5 block text-[10px] font-bold uppercase text-[var(--muted)]">Food category</span><select aria-label="Filter by food category" className={fieldClass} value={filters.category ?? ""} onChange={(event) => updateFilter("category", event.target.value as FoodCategory | "")}><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        </div>
      </section>

      <section aria-label="Impact summary" className="cn-panel mt-5 grid gap-px overflow-hidden bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Food redistributed" value={`${formatNumber(metrics.redistributedKg)} kg`} detail={`Sum of ${metrics.collectionsCompleted} confirmed deliveries`} icon={Scale} />
        <Metric label="Estimated meals" value={formatNumber(metrics.estimatedMeals)} detail={`${metrics.redistributedKg} kg × ${IMPACT_ASSUMPTIONS.mealsPerKilogram.value}`} estimate icon={Utensils} tone="blue" />
        <Metric label="Estimated financial value" value={currencyFormatter.format(metrics.financialValueEur)} detail="Illustrative blended food value" estimate icon={Euro} tone="amber" />
        <Metric label="Estimated CO2e avoided" value={`${formatNumber(metrics.estimatedCo2eAvoidedKg)} kg`} detail="Illustrative avoided-emissions factor" estimate icon={Leaf} />
        <Metric label="Landfill diversion" value={`${formatNumber(metrics.landfillDiversionKg)} kg`} detail="Delivered quantity adjusted for handling loss" estimate icon={Recycle} tone="red" />
        <Metric label="Collections completed" value={formatNumber(metrics.collectionsCompleted)} detail="Events with delivery confirmation" icon={CheckCircle2} tone="blue" />
        <Metric label="Recipient organisations supported" value={formatNumber(metrics.recipientOrganisationsSupported)} detail="Unique recipients linked to delivered events" icon={Users} />
        <Metric label="Collection success rate" value={`${formatNumber(metrics.collectionSuccessRate)}%`} detail="Delivered events ÷ terminal attempts" icon={TrendingUp} tone="blue" />
      </section>

      {report.deliveredEvents.length === 0 ? (
        <section className="cn-panel mt-5 p-10 text-center"><Recycle className="mx-auto text-[var(--muted)]" size={28} /><h2 className="mt-3 text-sm font-bold">No delivered events match these filters</h2><p className="mt-1 text-xs text-[var(--muted)]">Clear or broaden the reporting filters to restore the demonstration results.</p></section>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <section className="cn-panel p-4 sm:p-5" aria-labelledby="pipeline-title"><h2 id="pipeline-title" className="text-sm font-bold">Resource workflow by status</h2><p className="mt-1 text-xs text-[var(--muted)]">Kilograms across the shared data spine</p><div className="mt-5 h-[270px] min-w-0" role="img" aria-label="Bar chart of resource event kilograms by status"><ResponsiveContainer width="100%" height="100%"><BarChart data={report.statusBreakdown} margin={{ top: 8, right: 8, left: -15, bottom: 0 }}><CartesianGrid stroke="#e3e8e5" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#647069", fontSize: 10 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#647069", fontSize: 10 }} /><Tooltip cursor={{ fill: "#f1f4ef" }} contentStyle={{ border: "1px solid #111814", borderRadius: 2, fontSize: 12 }} /><Bar dataKey="kilograms" name="Kilograms" isAnimationActive={false}>{report.statusBreakdown.map((entry) => <Cell key={entry.label} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer></div></section>
          <section className="cn-panel p-4 sm:p-5" aria-labelledby="category-title"><h2 id="category-title" className="text-sm font-bold">Delivered food by category</h2><p className="mt-1 text-xs text-[var(--muted)]">Confirmed delivery quantities only</p><div className="mt-5 h-[270px] min-w-0" role="img" aria-label="Bar chart of delivered kilograms by category"><ResponsiveContainer width="100%" height="100%"><BarChart data={report.categoryBreakdown} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 0 }}><CartesianGrid stroke="#e3e8e5" horizontal={false} /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#647069", fontSize: 10 }} /><YAxis dataKey="label" type="category" width={86} axisLine={false} tickLine={false} tick={{ fill: "#647069", fontSize: 10 }} /><Tooltip cursor={{ fill: "#f1f4ef" }} contentStyle={{ border: "1px solid #111814", borderRadius: 2, fontSize: 12 }} /><Bar dataKey="kilograms" name="Kilograms" isAnimationActive={false}>{report.categoryBreakdown.map((entry) => <Cell key={entry.label} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer></div></section>
        </div>
      )}

      <section className="mt-5 border border-[var(--ink)] bg-white" aria-labelledby="methodology-title">
        <div className="flex items-start gap-3 bg-[var(--ink)] p-5 text-white"><Settings2 className="mt-0.5 shrink-0 text-[var(--acid)]" size={19} /><div><div className="flex flex-wrap items-center gap-2"><h2 id="methodology-title" className="text-sm font-bold">Demonstration methodology</h2><Badge tone="blue">{report.assumptionsVersion}</Badge></div><p className="mt-2 text-xs leading-5 text-white/55">Editable conversion factors live in <code className="font-bold text-[var(--acid)]">src/config/impact-assumptions.ts</code>. Figures are estimates and are not audited.</p></div></div>
        <div className="divide-y divide-[var(--line)]">{assumptionRows.map(([name, value, description]) => <div key={name} className="grid gap-2 px-5 py-4 md:grid-cols-[minmax(0,1fr)_220px_minmax(0,1.5fr)] md:items-center md:gap-5"><p className="text-xs font-bold">{name}</p><p className="text-sm font-bold text-[var(--blue)]">{value}</p><p className="text-xs leading-5 text-[var(--muted)]">{description}</p></div>)}</div>
      </section>

      <section className="cn-panel mt-5 overflow-hidden" aria-labelledby="deliveries-title">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] p-5"><div><h2 id="deliveries-title" className="text-sm font-bold">Delivered resource-event log</h2><p className="mt-1 text-xs text-[var(--muted)]">Traceable source records behind the direct totals</p></div><Building2 size={18} className="text-[var(--green)]" /></div>
        <div className="divide-y divide-[var(--line)]">{report.deliveredEvents.map((event) => <Link href={`/listings/${event.sourceId}`} key={event.id} className="cn-row-action grid gap-2 p-5 sm:grid-cols-[minmax(0,1fr)_180px_120px] sm:items-center"><div><p className="text-sm font-bold">{event.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{event.category} · {event.city} · {event.recipientName}</p></div><p className="text-xs text-[var(--muted)]">{formatDateTime(event.deliveredAt)}</p><p className="text-sm font-bold text-[var(--green)] sm:text-right">{formatNumber(event.kilograms)} kg</p></Link>)}</div>
      </section>
    </>
  );
}
