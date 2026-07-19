import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CheckCircle2, Leaf, MapPin, Scale, ShieldCheck, Truck, Users, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { IMPACT_ASSUMPTIONS } from "@/config/impact-assumptions";
import { getNetworkSnapshot } from "@/data";
import { formatDateTime, formatNumber } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getTransparencyStatistics, type TransparencyStatistics } from "@/server/services/transparency";

export const metadata: Metadata = { title: "Public transparency" };
export const dynamic = "force-dynamic";

async function fallbackStatistics(): Promise<TransparencyStatistics> {
  const network = await getNetworkSnapshot();
  const delivered = network.resourceEvents.filter((event) => event.status === "delivered" && event.deliveredAt);
  const today = new Date().toISOString().slice(0, 10);
  const deliveredToday = delivered.filter((event) => event.deliveredAt?.slice(0, 10) === today);
  const kilograms = deliveredToday.reduce((total, event) => total + event.quantityKg, 0);
  const cityTotals = new Map<string, { country: string; kilograms: number; completedEvents: number }>();
  delivered.forEach((event) => {
    const current = cityTotals.get(event.city) ?? { country: event.country, kilograms: 0, completedEvents: 0 };
    cityTotals.set(event.city, { ...current, kilograms: current.kilograms + event.quantityKg, completedEvents: current.completedEvents + 1 });
  });
  return {
    asOfDate: today,
    kilogramsRedistributedToday: kilograms,
    estimatedMealsToday: Math.round(kilograms * IMPACT_ASSUMPTIONS.mealsPerKilogram.value),
    completedPickupsToday: deliveredToday.length,
    activeOrganisations: network.initiatives.length + network.donors.length + network.recipients.length,
    estimatedCo2eAvoidedToday: Number((kilograms * IMPACT_ASSUMPTIONS.co2eAvoidedPerKilogram.value).toFixed(1)),
    activityByCity: [...cityTotals.entries()].map(([city, value]) => ({ city, ...value })),
    recentEvents: delivered.slice(0, 6).map((event, index) => ({ id: event.id, donorAlias: `Food donor ${String.fromCharCode(65 + index)}`, recipientAlias: `Recipient organisation ${index + 1}`, city: event.city, country: event.country, category: event.materialCategory, quantityKg: event.quantityKg, deliveredAt: event.deliveredAt! })),
  };
}

export default async function TransparencyPage() {
  let statistics: TransparencyStatistics;
  try {
    statistics = isSupabaseConfigured() ? await getTransparencyStatistics() : await fallbackStatistics();
  } catch {
    statistics = await fallbackStatistics();
  }
  const maxCityKg = Math.max(1, ...statistics.activityByCity.map((item) => item.kilograms));
  const metrics = [
    ["Kilograms redistributed today", `${formatNumber(statistics.kilogramsRedistributedToday)} kg`, Scale],
    ["Estimated meals", formatNumber(statistics.estimatedMealsToday), Utensils],
    ["Completed pickups", formatNumber(statistics.completedPickupsToday), Truck],
    ["Active organisations", formatNumber(statistics.activeOrganisations), Building2],
    ["Estimated CO2e avoided", `${formatNumber(statistics.estimatedCo2eAvoidedToday)} kg`, Leaf],
  ] as const;

  return (
    <>
      <PageHeader eyebrow="Public transparency" title="Food-sharing activity at a glance" description="Aggregated fictional demonstration data designed for public accountability without exposing private operational details." actions={<Badge tone="green">Aggregate data only</Badge>} />

      <aside className="cn-enter-delay mt-6 flex items-start gap-3 border-l-4 border-[var(--blue)] bg-[var(--blue-soft)] p-4 text-xs leading-5 text-[var(--blue)]"><ShieldCheck className="mt-0.5 shrink-0" size={17} /><span>No contact details, personal data, exact pickup locations or identifiable recipient histories are shown. <Link href="/data-governance" className="font-bold underline">Read the data-governance model</Link>.</span></aside>

      <section className="cn-panel mt-5 grid gap-px overflow-hidden bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5" aria-label="Public transparency summary">
        {metrics.map(([label, value, Icon]) => <article key={label} className="bg-white p-5"><Icon size={18} className="text-[var(--green)]" /><p className="mt-5 text-3xl font-semibold">{value}</p><h2 className="mt-2 text-xs font-bold">{label}</h2><p className="mt-2 text-[10px] text-[var(--muted)]">Fictional demonstration estimate</p></article>)}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <section className="cn-panel overflow-hidden" aria-labelledby="city-activity"><div className="border-b border-[var(--line)] p-5"><div className="flex items-center gap-2"><MapPin size={17} className="text-[var(--amber)]" /><h2 id="city-activity" className="text-sm font-bold">Activity by city</h2></div><p className="mt-1 text-xs text-[var(--muted)]">Generalised 30-day demonstration activity</p></div><div className="divide-y divide-[var(--line)]">{statistics.activityByCity.map((item) => <div key={`${item.city}-${item.country}`} className="p-4"><div className="flex items-center justify-between gap-3 text-xs"><span className="font-bold">{item.city}, {item.country}</span><span className="text-[var(--muted)]">{formatNumber(item.kilograms)} kg · {item.completedEvents} events</span></div><div className="mt-2 h-2 bg-[var(--surface-subtle)]"><div className="h-full bg-[var(--green)]" style={{ width: `${(item.kilograms / maxCityKg) * 100}%` }} /></div></div>)}{statistics.activityByCity.length === 0 && <p className="p-8 text-center text-sm text-[var(--muted)]">No completed public events are available.</p>}</div></section>

        <section className="cn-panel overflow-hidden" aria-labelledby="recent-public-events"><div className="border-b border-[var(--line)] p-5"><div className="flex items-center gap-2"><CheckCircle2 size={17} className="text-[var(--green)]" /><h2 id="recent-public-events" className="text-sm font-bold">Recent completed events</h2></div><p className="mt-1 text-xs text-[var(--muted)]">Organisation identities are replaced with stable anonymous labels</p></div><div className="divide-y divide-[var(--line)]">{statistics.recentEvents.map((event) => <article key={event.id} className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center"><div><p className="text-xs font-bold">{event.donorAlias} → {event.recipientAlias}</p><p className="mt-1 text-[11px] text-[var(--muted)]">{event.category} · {event.city}, {event.country} · {formatDateTime(event.deliveredAt)}</p></div><p className="text-sm font-bold text-[var(--green)] sm:text-right">{formatNumber(event.quantityKg)} kg</p></article>)}{statistics.recentEvents.length === 0 && <p className="p-8 text-center text-sm text-[var(--muted)]">No completed public events are available.</p>}</div></section>
      </div>

      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[var(--muted)]"><Users className="mt-0.5 shrink-0" size={15} /> All values are fictional and illustrative. The page intentionally trades granularity for privacy and should not be treated as an official CULTIVATE report.</p>
    </>
  );
}
