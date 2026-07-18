"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CheckCircle2,
  Download,
  Euro,
  Info,
  Recycle,
  Scale,
  Settings2,
  Utensils,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { IMPACT_ASSUMPTIONS } from "@/config/impact-assumptions";
import type { ImpactReport } from "@/features/impact/calculations";
import { cn, formatDateTime, formatNumber } from "@/lib/format";

const currencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

type MetricTone = "green" | "blue" | "amber" | "red";

interface MetricItem {
  label: string;
  value: string;
  detail: string;
  type: "direct" | "estimate";
  icon: LucideIcon;
  tone: MetricTone;
}

const iconTones: Record<MetricTone, string> = {
  green: "bg-[var(--green-soft)] text-[var(--green)]",
  blue: "bg-[var(--blue-soft)] text-[var(--blue)]",
  amber: "bg-[var(--amber-soft)] text-[var(--amber)]",
  red: "bg-[var(--red-soft)] text-[var(--red)]",
};

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function ImpactMetric({ item }: { item: MetricItem }) {
  const estimated = item.type === "estimate";

  return (
    <article className="group relative flex min-h-[190px] min-w-0 flex-col bg-white p-5 transition-colors hover:bg-[var(--surface-raised)] sm:p-6">
      <span className={cn("absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform group-hover:scale-x-100", item.tone === "blue" ? "bg-[var(--blue)]" : item.tone === "amber" ? "bg-[var(--amber)]" : item.tone === "red" ? "bg-[var(--coral)]" : "bg-[var(--green)]")} />
      <div className="flex items-start justify-between gap-3">
        <Badge tone={estimated ? "amber" : "green"}>
          {estimated ? "Demo estimate" : "Direct record"}
        </Badge>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-[2px]", iconTones[item.tone])}>
          <item.icon aria-hidden="true" size={18} />
        </span>
      </div>
      <p className="mt-6 text-3xl font-semibold leading-none text-[var(--ink)]">{item.value}</p>
      <h2 className="mt-2 text-sm font-bold leading-5">{item.label}</h2>
      <p className="mt-auto pt-3 text-xs leading-5 text-[var(--muted)]">{item.detail}</p>
    </article>
  );
}

export function ImpactDashboard({ report }: { report: ImpactReport }) {
  const { metrics } = report;
  const metricItems: MetricItem[] = [
    {
      label: "Food redistributed",
      value: `${formatNumber(metrics.redistributedKg)} kg`,
      detail: `Sum of ${metrics.collectionsCompleted} collected listing quantities`,
      type: "direct",
      icon: Scale,
      tone: "green",
    },
    {
      label: "Estimated meals provided",
      value: formatNumber(metrics.estimatedMeals),
      detail: `${formatNumber(metrics.redistributedKg)} kg x ${IMPACT_ASSUMPTIONS.mealsPerKilogram.value} meals per kg`,
      type: "estimate",
      icon: Utensils,
      tone: "blue",
    },
    {
      label: "Estimated financial value",
      value: currencyFormatter.format(metrics.financialValueEur),
      detail: `${formatNumber(metrics.redistributedKg)} kg x ${currencyFormatter.format(IMPACT_ASSUMPTIONS.financialValuePerKilogramEur.value)} per kg`,
      type: "estimate",
      icon: Euro,
      tone: "amber",
    },
    {
      label: "Collections completed",
      value: formatNumber(metrics.collectionsCompleted),
      detail: "Listings with a Collected status",
      type: "direct",
      icon: CheckCircle2,
      tone: "blue",
    },
    {
      label: "Recipient organisations supported",
      value: formatNumber(metrics.recipientOrganisationsSupported),
      detail: "Unique recipients linked to completed collections",
      type: "direct",
      icon: Users,
      tone: "green",
    },
    {
      label: "Estimated waste avoided",
      value: `${formatNumber(metrics.estimatedWasteAvoidedKg)} kg`,
      detail: `${formatNumber(metrics.redistributedKg)} kg x ${IMPACT_ASSUMPTIONS.wasteAvoidanceRate.value * 100}% avoidance rate`,
      type: "estimate",
      icon: Recycle,
      tone: "red",
    },
  ];

  const assumptionRows = [
    {
      name: IMPACT_ASSUMPTIONS.mealsPerKilogram.label,
      value: `${IMPACT_ASSUMPTIONS.mealsPerKilogram.value} meals per kg`,
      description: IMPACT_ASSUMPTIONS.mealsPerKilogram.description,
      scope: "Impact dashboard",
    },
    {
      name: IMPACT_ASSUMPTIONS.financialValuePerKilogramEur.label,
      value: `${currencyFormatter.format(IMPACT_ASSUMPTIONS.financialValuePerKilogramEur.value)} per kg`,
      description: IMPACT_ASSUMPTIONS.financialValuePerKilogramEur.description,
      scope: "Impact dashboard",
    },
    {
      name: IMPACT_ASSUMPTIONS.wasteAvoidanceRate.label,
      value: `${IMPACT_ASSUMPTIONS.wasteAvoidanceRate.value * 100}% of redistributed kg`,
      description: IMPACT_ASSUMPTIONS.wasteAvoidanceRate.description,
      scope: "Impact dashboard",
    },
    {
      name: IMPACT_ASSUMPTIONS.co2eAvoidedPerKilogram.label,
      value: `${IMPACT_ASSUMPTIONS.co2eAvoidedPerKilogram.value} kg CO2e per kg`,
      description: IMPACT_ASSUMPTIONS.co2eAvoidedPerKilogram.description,
      scope: "Surplus report calculator",
    },
  ];

  function downloadCsv() {
    const rows: Array<Array<string | number>> = [
      ["record_type", "name", "value", "unit_or_scope", "basis"],
      ["metric", "Food redistributed", metrics.redistributedKg, "kg", "Completed listing quantity"],
      ["metric", "Estimated meals provided", metrics.estimatedMeals, "meals", "Demonstration assumption"],
      ["metric", "Estimated financial value", metrics.financialValueEur, "EUR", "Demonstration assumption"],
      ["metric", "Collections completed", metrics.collectionsCompleted, "collections", "Collected status records"],
      ["metric", "Recipient organisations supported", metrics.recipientOrganisationsSupported, "organisations", "Unique linked recipient IDs"],
      ["metric", "Estimated waste avoided", metrics.estimatedWasteAvoidedKg, "kg", "Demonstration assumption"],
      ...assumptionRows.map((item) => ["assumption", item.name, item.value, item.scope, item.description]),
      ...report.completedCollections.map((item) => [
        "collection",
        item.title,
        item.kilograms,
        "kg",
        `${item.recipientName}; ${item.category}; collected ${item.collectedAt}`,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cultivate-next-demo-impact.csv";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <section className="cn-enter-delay mt-6 flex flex-col gap-4 border border-[var(--ink)] bg-[var(--acid)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5" aria-label="Impact reporting scope">
        <div className="flex items-start gap-3">
          <Info aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink)]" size={18} />
          <div>
            <p className="text-sm font-bold">Completed demonstration collections only</p>
            <p className="mt-1 text-xs leading-5 text-[var(--ink)]/65">
              Direct metrics use Supabase Collected records. Calculated outcomes use the labelled demonstration assumptions below.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={downloadCsv}
          className="inline-flex min-h-10 w-fit shrink-0 items-center gap-2 rounded-[2px] border border-[var(--ink)] bg-[var(--ink)] px-3 text-xs font-bold text-white transition-colors hover:bg-[var(--green)]"
        >
          <Download aria-hidden="true" size={16} />
          Export CSV
        </button>
      </section>

      <section aria-label="Impact summary" className="cn-panel mt-5 grid gap-px overflow-hidden bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-3">
        {metricItems.map((item) => <ImpactMetric key={item.label} item={item} />)}
      </section>

      <section aria-labelledby="assumptions-title" className="mt-5 border border-[var(--ink)] bg-white">
        <div className="flex flex-col gap-4 border-b border-[var(--line)] bg-[var(--ink)] p-5 text-white sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Settings2 aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--acid)]" size={19} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="assumptions-title" className="text-sm font-bold">Demonstration assumptions</h2>
                <Badge tone="blue">{report.assumptionsVersion}</Badge>
              </div>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-white/55">
                Illustrative, not audited. Edit all conversion factors in <code className="font-bold text-[var(--acid)]">src/config/impact-assumptions.ts</code>.
              </p>
            </div>
          </div>
          <Badge tone="amber" className="w-fit shrink-0">Demo values only</Badge>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {assumptionRows.map((item) => (
            <div key={item.name} className="cn-row-action grid gap-2 px-5 py-4 md:grid-cols-[minmax(0,1fr)_210px_minmax(0,1.4fr)] md:items-center md:gap-5">
              <div>
                <p className="text-xs font-bold">{item.name}</p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">{item.scope}</p>
              </div>
              <p className="text-sm font-bold text-[var(--blue)]">{item.value}</p>
              <p className="text-xs leading-5 text-[var(--muted)]">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="cn-panel p-4 sm:p-5" aria-labelledby="pipeline-title">
          <h2 id="pipeline-title" className="text-sm font-bold">Listing pipeline by status</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Kilograms across all 20 Supabase demonstration listings</p>
          <div className="mt-5 h-[270px] min-w-0" role="img" aria-label="Bar chart of listing kilograms by status">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.statusBreakdown} margin={{ top: 8, right: 8, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="#e3e8e5" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#66736d", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#66736d", fontSize: 11 }} />
                <Tooltip cursor={{ fill: "#f1f4ef" }} contentStyle={{ border: "1px solid #111814", borderRadius: 2, fontSize: 12, boxShadow: "4px 4px 0 rgba(17,24,20,.12)" }} />
                <Bar dataKey="kilograms" name="Kilograms" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                  {report.statusBreakdown.map((entry) => <Cell key={entry.label} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="cn-panel p-4 sm:p-5" aria-labelledby="category-title">
          <h2 id="category-title" className="text-sm font-bold">Redistributed food by category</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Completed collection quantities only</p>
          <div className="mt-5 h-[270px] min-w-0" role="img" aria-label="Bar chart of redistributed kilograms by food category">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.categoryBreakdown} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="#e3e8e5" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#66736d", fontSize: 11 }} />
                <YAxis dataKey="label" type="category" width={76} axisLine={false} tickLine={false} tick={{ fill: "#66736d", fontSize: 11 }} />
                <Tooltip cursor={{ fill: "#f1f4ef" }} contentStyle={{ border: "1px solid #111814", borderRadius: 2, fontSize: 12, boxShadow: "4px 4px 0 rgba(17,24,20,.12)" }} />
                <Bar dataKey="kilograms" name="Kilograms" radius={[0, 2, 2, 0]} isAnimationActive={false}>
                  {report.categoryBreakdown.map((entry) => <Cell key={entry.label} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="cn-panel mt-5" aria-labelledby="recipients-title">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] bg-[var(--ink)] p-5 text-white">
          <div>
            <h2 id="recipients-title" className="text-sm font-bold">Recipient organisations supported</h2>
            <p className="mt-1 text-xs text-white/45">Unique recipients linked to completed collections</p>
          </div>
          <Building2 aria-hidden="true" className="shrink-0 text-[var(--acid)]" size={19} />
        </div>
        <div className="divide-y divide-[var(--line)]">
          {report.supportedRecipients.map((recipient) => (
            <div key={recipient.id} className="cn-row-action grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_140px_100px] sm:items-center sm:gap-5">
              <div className="min-w-0">
                <p className="text-sm font-bold">{recipient.name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{recipient.type}, {recipient.city}</p>
              </div>
              <p className="text-xs"><strong>{recipient.collections}</strong> {recipient.collections === 1 ? "collection" : "collections"}</p>
              <p className="text-sm font-bold text-[var(--green)] sm:text-right">{formatNumber(recipient.kilograms)} kg</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cn-panel mt-5 overflow-hidden" aria-labelledby="collections-title">
        <div className="border-b border-[var(--line)] p-5">
          <h2 id="collections-title" className="text-sm font-bold">Completed collection log</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Traceable source records for the direct impact totals</p>
        </div>
        <div className="divide-y divide-[var(--line)] md:hidden">
          {report.completedCollections.map((collection) => (
            <article key={collection.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">{collection.title}</h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">{collection.category}, {collection.city}</p>
                </div>
                <strong className="shrink-0 text-sm text-[var(--green)]">{formatNumber(collection.kilograms)} kg</strong>
              </div>
              <p className="mt-3 text-xs"><span className="text-[var(--muted)]">Recipient:</span> {collection.recipientName}</p>
              <p className="mt-1 text-xs"><span className="text-[var(--muted)]">Collected:</span> {formatDateTime(collection.collectedAt)}</p>
            </article>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[var(--ink)] font-mono text-[9px] text-white/55">
              <tr>
                <th className="px-5 py-3 font-bold">Listing</th>
                <th className="px-5 py-3 font-bold">Recipient</th>
                <th className="px-5 py-3 font-bold">Collected</th>
                <th className="px-5 py-3 text-right font-bold">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {report.completedCollections.map((collection) => (
                <tr key={collection.id} className="transition-colors hover:bg-[var(--surface-raised)]">
                  <td className="px-5 py-4"><strong className="block text-[var(--ink)]">{collection.title}</strong><span className="mt-1 block text-[var(--muted)]">{collection.category}, {collection.city}</span></td>
                  <td className="px-5 py-4 font-semibold">{collection.recipientName}</td>
                  <td className="px-5 py-4 text-[var(--muted)]">{formatDateTime(collection.collectedAt)}</td>
                  <td className="px-5 py-4 text-right text-sm font-bold text-[var(--green)]">{formatNumber(collection.kilograms)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
