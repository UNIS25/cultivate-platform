import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin, PackageOpen, Scale, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataSourceNotice } from "@/components/ui/data-source-notice";
import { PageHeader } from "@/components/ui/page-header";
import { getNetworkSnapshot, getResourceEvent } from "@/data";
import { HealthIndicators } from "@/features/operations/health-indicators";
import { ResourceEventWorkflow, TraceabilityPanel } from "@/features/workflow/resource-event-workflow";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getNetworkSnapshot();
  const event = getResourceEvent(data, id);
  return { title: event?.title ?? "Resource event" };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getNetworkSnapshot();
  const event = getResourceEvent(data, id);
  if (!event && data.source.status === "ready") notFound();

  if (!event) {
    return <><PageHeader eyebrow="Resource workflow" title="Resource event unavailable" description="The demonstration data source did not return this event." /><DataSourceNotice source={data.source} /></>;
  }

  const donor = data.donors.find((item) => item.id === event.organisationId);
  return (
    <>
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-[var(--green)]"><ArrowLeft size={14} /> Back to dashboard</Link>
      <PageHeader eyebrow="Traceable resource event" title={event.title} description={`${event.quantityKg} kg of ${event.materialCategory.toLowerCase()} moving through the shared operational workflow.`} actions={<Badge tone={event.status === "delivered" ? "green" : "blue"}>{event.status}</Badge>} />
      <DataSourceNotice source={data.source} />

      <section className="cn-panel mt-6 grid gap-px overflow-hidden bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4" aria-label="Listing details">
        <div className="bg-white p-5"><PackageOpen className="text-[var(--green)]" size={18} /><p className="mt-4 font-mono text-[9px] font-bold text-[var(--muted)]">SOURCE ORGANISATION</p><p className="mt-1 text-sm font-bold">{event.donorName}</p><p className="mt-1 text-xs text-[var(--muted)]">{event.donorType}</p></div>
        <div className="bg-white p-5"><Scale className="text-[var(--blue)]" size={18} /><p className="mt-4 font-mono text-[9px] font-bold text-[var(--muted)]">QUANTITY</p><p className="mt-1 text-sm font-bold">{event.quantityKg} kg</p><p className="mt-1 text-xs text-[var(--muted)]">{event.materialCategory}</p></div>
        <div className="bg-white p-5"><MapPin className="text-[var(--amber)]" size={18} /><p className="mt-4 font-mono text-[9px] font-bold text-[var(--muted)]">PUBLIC LOCATION</p><p className="mt-1 text-sm font-bold">{event.city}, {event.country}</p><p className="mt-1 text-xs text-[var(--muted)]">Generalised area only</p></div>
        <div className="bg-white p-5"><CalendarClock className="text-[var(--cyan)]" size={18} /><p className="mt-4 font-mono text-[9px] font-bold text-[var(--muted)]">COLLECTION DEADLINE</p><p className="mt-1 text-sm font-bold">{event.collectionDeadline ? formatDateTime(event.collectionDeadline) : "Completed"}</p><p className="mt-1 text-xs text-[var(--muted)]">Europe/Dublin local display</p></div>
      </section>

      <div className="mt-5"><ResourceEventWorkflow event={event} allowDemoMutation={event.status !== "delivered"} /></div>
      {event.status === "delivered" && <div className="mt-5"><TraceabilityPanel event={event} /></div>}
      {donor && <div className="mt-5"><HealthIndicators donor={donor} events={data.resourceEvents} /></div>}

      <aside className="mt-5 flex items-start gap-3 border-l-4 border-[var(--blue)] bg-[var(--blue-soft)] p-4 text-xs leading-5 text-[var(--blue)]"><ShieldCheck className="mt-0.5 shrink-0" size={16} /><span>Exact pickup addresses, contact details and user identities are restricted to authorised match participants. <Link className="font-bold underline" href="/data-governance">Review access levels</Link>.</span></aside>
    </>
  );
}
