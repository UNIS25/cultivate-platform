import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock3,
  Handshake,
  Leaf,
  MapPin,
  PackageOpen,
  Plus,
  Radio,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataSourceNotice } from "@/components/ui/data-source-notice";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { getDemoMetrics, getMatchRecommendations, getNetworkSnapshot } from "@/data";
import { MapCanvas, type MapPoint } from "@/features/map/map-canvas";
import { formatDateTime, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getNetworkSnapshot();
  const { initiatives, surplusListings } = data;
  const demoMetrics = getDemoMetrics(data);
  const matches = getMatchRecommendations(data).slice(0, 4);
  const urgent = surplusListings.filter((item) => item.status === "Available").slice(0, 5);
  const activeSurplus = surplusListings.filter((item) => item.status !== "Collected");
  const networkPoints: MapPoint[] = [
    ...initiatives.map((item) => ({ id: item.id, latitude: item.latitude, longitude: item.longitude, kind: "initiative" as const, label: `${item.name}, ${item.city}` })),
    ...activeSurplus.map((item) => ({ id: item.id, latitude: item.latitude, longitude: item.longitude, kind: "surplus" as const, label: `${item.title}, ${item.city}` })),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Live operations / 18 July"
        title="Good morning, Demo coordinator"
        description="Track today’s surplus, coordinate matches and monitor the network’s shared impact."
        actions={<Link href="/report" className="inline-flex min-h-11 items-center gap-2 rounded-[3px] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-bold text-white shadow-[4px_4px_0_var(--acid)] transition-colors hover:border-[var(--green)] hover:bg-[var(--green)]"><Plus size={17} /> Report surplus</Link>}
      />

      <DataSourceNotice source={data.source} />

      <section aria-label="Key metrics" className="cn-panel cn-enter-delay mt-6 grid overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Food coordinated" value={`${formatNumber(demoMetrics.coordinatedKg)} kg`} detail={`Across ${surplusListings.length} Supabase listings`} icon={Leaf} trend="up" tone="green" />
        <MetricCard label="Available now" value={`${formatNumber(demoMetrics.availableKg)} kg`} detail="Requires collection" icon={PackageOpen} tone="amber" />
        <MetricCard label="Recommended matches" value={String(matches.length)} detail="High-confidence options" icon={Handshake} trend="up" tone="blue" />
        <MetricCard label="Households supported" value={formatNumber(demoMetrics.households)} detail="Recipient capacity measure" icon={Users} trend="up" tone="green" />
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(430px,.92fr)]">
        <section className="cn-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-4 sm:px-5">
            <div className="flex items-center gap-3"><span className="grid size-9 place-items-center bg-[var(--amber-soft)] text-[var(--amber)]"><Zap size={17} /></span><div><h2 className="text-sm font-bold">Priority dispatch queue</h2><p className="mt-0.5 text-[11px] text-[var(--muted)]">Offers ordered by collection deadline</p></div></div>
            <Link href="/map" className="group flex items-center gap-2 text-[11px] font-bold text-[var(--green)]">Open live map <ArrowRight className="transition-transform group-hover:translate-x-1" size={14} /></Link>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {urgent.map((listing, index) => (
              <div key={listing.id} className="cn-row-action group grid gap-3 px-4 py-3.5 sm:grid-cols-[34px_minmax(0,1fr)_92px_120px_38px] sm:items-center sm:px-5">
                <span className="hidden font-mono text-[10px] font-bold text-[var(--muted)] sm:block">{String(index + 1).padStart(2, "0")}</span>
                <div className="cn-row-shift min-w-0"><div className="flex items-center gap-2"><span className="cn-live-dot !size-1.5 !bg-[var(--amber)]" /><p className="truncate text-sm font-bold">{listing.title}</p></div><p className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--muted)]"><MapPin size={12} /> {listing.city} / {listing.handling}</p></div>
                <div><p className="text-sm font-bold">{listing.quantityKg} kg</p><p className="mt-1 text-[10px] text-[var(--muted)]">{listing.portions} portions</p></div>
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--amber)]"><Clock3 size={13} /> {formatDateTime(listing.collectBy)}</p>
                <Link href="/matches" aria-label={`Match ${listing.title}`} title={`Match ${listing.title}`} className="grid size-9 place-items-center border border-[var(--line)] bg-white text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"><ArrowUpRight size={16} /></Link>
              </div>
            ))}
          </div>
        </section>

        <section className="relative min-h-[430px] overflow-hidden border border-[var(--ink)] bg-[#d8e4df] xl:min-h-0">
          <MapCanvas points={networkPoints} compact />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between bg-[var(--ink)]/92 px-4 py-3 text-white backdrop-blur sm:px-5">
            <div><div className="flex items-center gap-2"><Radio size={14} className="text-[var(--acid)]" /><h2 className="text-xs font-bold">Network pulse</h2></div><p className="mt-1 font-mono text-[9px] text-white/55">EUROPEAN DEMONSTRATION AREA</p></div>
            <div className="text-right"><p className="text-xl font-semibold">{networkPoints.length}</p><p className="font-mono text-[8px] text-white/55">VISIBLE SIGNALS</p></div>
          </div>
          <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex items-center gap-3 bg-white/94 px-3 py-2 text-[9px] font-bold shadow-lg backdrop-blur"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[var(--green)]" /> Initiatives</span><span className="flex items-center gap-1.5"><span className="size-2 rotate-45 rounded-full bg-[var(--amber)]" /> Active surplus</span></div>
        </section>
      </div>

      <section className="mt-6 grid border border-[var(--line)] bg-white lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.55fr)_minmax(0,.8fr)]">
        <div className="overflow-hidden border-b border-[var(--line)] lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--ink)] px-5 py-4 text-white"><div><div className="flex items-center gap-2"><Handshake size={15} className="text-[var(--acid)]" /><h2 className="text-sm font-bold">Match stream</h2></div><p className="mt-1 text-[10px] text-white/50">Deterministic recipient fit</p></div><Link href="/matches" aria-label="View all matches" title="View all matches" className="grid size-8 place-items-center border border-white/20 text-white/70 hover:bg-white hover:text-[var(--ink)]"><ArrowRight size={15} /></Link></div>
          <div className="divide-y divide-[var(--line)]">
            {matches.map((match, index) => <Link href="/matches" key={match.id} className="cn-row-action group grid grid-cols-[24px_minmax(0,1fr)_54px] items-center gap-3 px-5 py-3.5"><span className="font-mono text-[9px] text-[var(--muted)]">M{index + 1}</span><div className="min-w-0"><p className="truncate text-xs font-bold">{match.surplus.title} <span className="text-[var(--muted)]">→</span> {match.recipient.name}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{match.distanceKm.toFixed(1)} km / {match.surplus.quantityKg} kg</p></div><div className="text-right"><span className="text-lg font-semibold text-[var(--green)]">{match.score}</span><span className="text-[9px] text-[var(--muted)]">%</span></div></Link>)}
          </div>
        </div>

        <div className="border-b border-[var(--line)] p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between"><p className="font-mono text-[9px] font-bold text-[var(--muted)]">OPERATIONAL READINESS</p><Badge tone="green">On track</Badge></div>
          <div className="mt-6 flex items-end gap-2"><span className="text-5xl font-semibold leading-none">78</span><span className="pb-1 text-sm font-bold text-[var(--muted)]">/100</span></div>
          <div className="mt-5 grid grid-cols-10 gap-1" aria-label="Readiness score 78 out of 100">{Array.from({ length: 10 }, (_, index) => <span key={index} className={`h-8 ${index < 8 ? "bg-[var(--green)]" : "bg-[var(--surface-subtle)]"}`} />)}</div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-[11px]"><CheckCircle2 className="text-[var(--green)]" size={15} /><span className="flex-1 font-semibold">Food safety</span><span className="text-[var(--muted)]">18/20</span></div>
            <div className="flex items-center gap-2 text-[11px]"><CheckCircle2 className="text-[var(--green)]" size={15} /><span className="flex-1 font-semibold">Safeguards</span><span className="text-[var(--muted)]">16/20</span></div>
            <Link href="/recommendations" className="flex items-center gap-2 border-t border-[var(--line)] pt-3 text-[11px] font-bold text-[var(--amber)]"><Clock3 size={14} /> 4 reviews due <ArrowRight className="ml-auto" size={13} /></Link>
          </div>
        </div>

        <div className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4"><div><h2 className="text-sm font-bold">Initiatives on watch</h2><p className="mt-1 text-[10px] text-[var(--muted)]">Recently active partners</p></div><Badge tone="blue">{initiatives.length} total</Badge></div>
          <div className="divide-y divide-[var(--line)]">
            {initiatives.slice(0, 2).map((initiative) => <Link key={initiative.id} href={`/initiatives/${initiative.slug}`} className="cn-row-action group flex items-center gap-3 px-5 py-4"><span className="grid size-9 shrink-0 place-items-center bg-[var(--green-soft)] text-[var(--green)]"><Building2 size={16} /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{initiative.name}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{initiative.city} / {initiative.weeklyCapacityKg} kg week</p></div><ArrowUpRight className="text-[var(--muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={15} /></Link>)}
          </div>
        </div>
      </section>
    </>
  );
}
