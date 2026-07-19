import { CheckCircle2, Clock3, Database, ShieldCheck, Truck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Donor, OrganisationHealthIndicators, ResourceEvent } from "@/types/domain";

export function calculateOrganisationHealth(donor: Donor, events: ResourceEvent[]): OrganisationHealthIndicators {
  const ownEvents = events.filter((event) => event.organisationId === donor.id);
  const terminal = ownEvents.filter((event) => ["delivered", "cancelled", "collected"].includes(event.status));
  const delivered = ownEvents.filter((event) => event.status === "delivered");
  const cancelled = ownEvents.filter((event) => event.status === "cancelled");
  const responseHours = ownEvents.flatMap((event) => event.matchedAt ? [(new Date(event.matchedAt).getTime() - new Date(event.createdAt).getTime()) / 3_600_000] : []);
  const completeFields = ownEvents.reduce((total, event) => total + [event.materialCategory, event.quantityKg, event.city, event.collectionDeadline].filter(Boolean).length, 0);
  const possibleFields = Math.max(1, ownEvents.length * 4);

  return {
    organisationId: donor.id,
    pickupCompletionRate: terminal.length ? Number(((delivered.length / terminal.length) * 100).toFixed(1)) : 0,
    averageResponseHours: responseHours.length ? Number((responseHours.reduce((a, b) => a + b, 0) / responseHours.length).toFixed(1)) : 0,
    successfulDeliveryRate: terminal.length ? Number(((delivered.length / terminal.length) * 100).toFixed(1)) : 0,
    cancelledMatchRate: ownEvents.length ? Number(((cancelled.length / ownEvents.length) * 100).toFixed(1)) : 0,
    dataCompleteness: Number(((completeFields / possibleFields) * 100).toFixed(1)),
    verificationStatus: donor.reliabilityScore >= 70 ? "Verified" : "Pending",
  };
}

export function HealthIndicators({ donor, events }: { donor: Donor; events: ResourceEvent[] }) {
  const values = calculateOrganisationHealth(donor, events);
  const indicators = [
    ["Pickup completion", `${values.pickupCompletionRate}%`, "Delivered events ÷ terminal pickup attempts", Truck],
    ["Average response", `${values.averageResponseHours} h`, "Mean time from offer creation to proposed match", Clock3],
    ["Successful delivery", `${values.successfulDeliveryRate}%`, "Confirmed deliveries ÷ terminal attempts", CheckCircle2],
    ["Cancelled matches", `${values.cancelledMatchRate}%`, "Cancelled events ÷ all recorded events", XCircle],
    ["Data completeness", `${values.dataCompleteness}%`, "Present category, quantity, city and deadline fields", Database],
  ] as const;

  return (
    <section className="cn-panel overflow-hidden" aria-labelledby={`health-${donor.id}`}>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-5"><div><h2 id={`health-${donor.id}`} className="text-sm font-bold">Organisation health indicators</h2><p className="mt-1 text-xs text-[var(--muted)]">Transparent components; no opaque composite or AI score</p></div><Badge tone={values.verificationStatus === "Verified" ? "green" : "amber"}><ShieldCheck size={12} className="mr-1" /> {values.verificationStatus}</Badge></div>
      <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5">{indicators.map(([label, value, explanation, Icon]) => <div key={label} className="bg-white p-4"><Icon size={16} className="text-[var(--green)]" /><p className="mt-4 text-xl font-semibold">{value}</p><p className="mt-1 text-xs font-bold">{label}</p><p className="mt-2 text-[10px] leading-4 text-[var(--muted)]">{explanation}</p></div>)}</div>
    </section>
  );
}
