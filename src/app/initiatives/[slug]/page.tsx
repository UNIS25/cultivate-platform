import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, ClipboardCheck, MapPin, PackageCheck, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataSourceNotice } from "@/components/ui/data-source-notice";
import { getInitiative, getNetworkSnapshot } from "@/data";
import { MapCanvas, type MapPoint } from "@/features/map/map-canvas";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getNetworkSnapshot();
  const initiative = getInitiative(data, slug);
  return { title: initiative?.name ?? "Initiative" };
}

export default async function InitiativeProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getNetworkSnapshot();
  const initiative = getInitiative(data, slug);
  if (data.source.status !== "ready") return <DataSourceNotice source={data.source} />;
  if (!initiative) notFound();
  const cityOffers = data.surplusListings.filter((listing) => listing.city === initiative.city && listing.status === "Available");
  const point: MapPoint = { id: initiative.id, latitude: initiative.latitude, longitude: initiative.longitude, kind: "initiative", label: `${initiative.name}, ${initiative.city}` };
  const metrics = [
    { label: "Weekly capacity", value: `${initiative.weeklyCapacityKg} kg`, icon: PackageCheck, tone: "text-[var(--green)]" },
    { label: "Households reached", value: String(initiative.householdsReached), icon: Users, tone: "text-[var(--blue)]" },
    { label: "Active volunteers", value: String(initiative.activeVolunteers), icon: ClipboardCheck, tone: "text-[var(--cyan)]" },
    { label: "Governance score", value: `${initiative.governanceScore}/100`, icon: ShieldCheck, tone: "text-[var(--amber)]" },
  ];

  return (
    <>
      <Link href="/map" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--green)]"><ArrowLeft size={15} /> Back to network map</Link>

      <section className="cn-enter grid overflow-hidden border border-[var(--ink)] bg-white lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,.8fr)]">
        <div className="flex min-h-[340px] flex-col p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-2"><Badge tone={initiative.status === "Active" ? "green" : initiative.status === "Pilot" ? "blue" : "amber"}>{initiative.status}</Badge>{initiative.verified && <Badge tone="blue"><CheckCircle2 size={12} className="mr-1" /> Verified initiative</Badge>}</div>
          <p className="cn-kicker mt-8">Initiative profile</p>
          <h1 className="mt-4 max-w-3xl text-[34px] font-semibold leading-[1.03] sm:text-[44px]">{initiative.name}</h1>
          <p className="mt-4 flex items-center gap-1.5 text-sm text-[var(--muted)]"><MapPin size={15} /> {initiative.city}, {initiative.country} / {initiative.type}</p>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--muted)]">{initiative.description}</p>
          <div className="mt-auto pt-7"><Link href="/report" className="inline-flex min-h-11 items-center gap-2 rounded-[3px] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-bold text-white shadow-[4px_4px_0_var(--acid)] hover:bg-[var(--green)]"><PackageCheck size={17} /> Offer food</Link></div>
        </div>
        <div className="relative min-h-[340px] border-t border-[var(--ink)] lg:border-l lg:border-t-0"><MapCanvas points={[point]} selectedId={point.id} compact /><div className="pointer-events-none absolute bottom-3 left-3 z-[500] bg-[var(--ink)] px-3 py-2 font-mono text-[9px] font-bold text-white"><span className="mr-2 inline-block size-2 rounded-full bg-[var(--acid)]" />{initiative.city.toUpperCase()} / ACTIVE AREA</div></div>
      </section>

      <section aria-label="Initiative metrics" className="cn-panel mt-5 grid sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, tone }) => <div key={label} className="group border-b border-[var(--line)] p-5 last:border-b-0 sm:border-r sm:[&:nth-child(2)]:border-r-0 lg:border-b-0 lg:[&:nth-child(2)]:border-r lg:last:border-r-0"><Icon className={tone} size={19} /><p className="mt-5 text-2xl font-semibold">{value}</p><p className="mt-1 font-mono text-[9px] font-bold text-[var(--muted)]">{label.toUpperCase()}</p></div>)}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="cn-panel overflow-hidden"><div className="border-b border-[var(--line)] px-5 py-4"><h2 className="text-sm font-bold">Current food needs</h2><p className="mt-1 text-[11px] text-[var(--muted)]">Categories this initiative can safely redistribute</p></div><div className="divide-y divide-[var(--line)]">{initiative.categories.map((category, index) => <div key={category} className="cn-row-action grid grid-cols-[32px_40px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4"><span className="font-mono text-[9px] text-[var(--muted)]">N{index + 1}</span><span className="grid size-9 place-items-center bg-[var(--green-soft)] text-[var(--green)]"><PackageCheck size={17} /></span><div><p className="text-sm font-bold">{category}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{index === 0 ? "High priority" : "Accepting this week"}</p></div><Badge tone={index === 0 ? "amber" : "green"}>{index === 0 ? "Priority" : "Open"}</Badge></div>)}</div></section>
        <aside className="cn-panel-dark p-5 sm:p-6"><div className="flex items-center justify-between"><CalendarClock className="text-[var(--acid)]" size={20} /><span className="cn-live-dot" /></div><p className="mt-6 font-mono text-[9px] font-bold text-white/45">NEXT COLLECTION WINDOW</p><h2 className="mt-2 text-2xl font-semibold">{initiative.nextCollection}</h2><p className="mt-1 text-xs text-white/45">Coordinator confirmed</p><div className="mt-7 border-t border-white/10 pt-6"><p className="font-mono text-[9px] text-white/45">LOCAL AVAILABLE OFFERS</p><div className="mt-3 flex items-end justify-between"><div><p className="text-4xl font-semibold">{cityOffers.length}</p><p className="mt-1 text-xs text-white/45">{cityOffers.reduce((sum, item) => sum + item.quantityKg, 0)} kg ready</p></div><Link href="/matches" aria-label="Review local matches" title="Review local matches" className="grid size-10 place-items-center border border-white/20 text-white hover:bg-white hover:text-[var(--ink)]"><ArrowRight size={16} /></Link></div></div></aside>
      </div>
    </>
  );
}
