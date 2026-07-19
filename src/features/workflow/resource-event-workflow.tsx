"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, Circle, Clock3, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime } from "@/lib/format";
import type { ResourceEvent, ResourceEventStatus, ResourceTimelineEventType } from "@/types/domain";

const stages: Array<{ type: ResourceTimelineEventType; label: string; status: ResourceEventStatus; description: string }> = [
  { type: "offer_created", label: "Offer created", status: "available", description: "Surplus reported and made available" },
  { type: "match_proposed", label: "Match proposed", status: "matched", description: "Recipient compatibility checked" },
  { type: "recipient_accepted", label: "Recipient accepted", status: "accepted", description: "Recipient committed to receive" },
  { type: "collection_confirmed", label: "Collected", status: "collected", description: "Donor handover confirmed" },
  { type: "delivery_confirmed", label: "Delivered", status: "delivered", description: "Recipient confirmed delivery" },
  { type: "impact_recorded", label: "Impact recorded", status: "delivered", description: "Estimates generated after delivery" },
];

const statusRank: Record<ResourceEventStatus, number> = {
  draft: -1,
  available: 0,
  matched: 1,
  accepted: 2,
  collected: 3,
  delivered: 4,
  cancelled: -1,
  expired: -1,
};

const demoTransitions: ResourceEventStatus[] = ["available", "matched", "accepted", "collected", "delivered"];

export function ResourceEventWorkflow({ event, compact = false, allowDemoMutation = false }: { event: ResourceEvent; compact?: boolean; allowDemoMutation?: boolean }) {
  const [demoStatus, setDemoStatus] = useState<ResourceEventStatus>(event.status);
  const [demoAudit, setDemoAudit] = useState(event.auditTrail);
  const [successMessage, setSuccessMessage] = useState("");
  const currentRank = statusRank[demoStatus];
  const auditByType = useMemo(() => new Map(demoAudit.map((audit) => [audit.eventType, audit])), [demoAudit]);
  const nextStatus = demoTransitions[demoTransitions.indexOf(demoStatus) + 1];

  function simulateNextStage() {
    if (!nextStatus) return;
    const stage = stages.find((item) => item.status === nextStatus);
    const now = new Date().toISOString();
    setDemoStatus(nextStatus);
    if (stage) setDemoAudit((current) => [...current, {
      id: `demo-${event.id}-${stage.type}`,
      resourceEventId: event.id,
      eventType: stage.type,
      actorLabel: "Demo role switcher user",
      occurredAt: now,
      previousStatus: demoStatus,
      newStatus: nextStatus,
      note: "Safe in-browser demonstration transition; no production record was changed.",
    }]);
    setSuccessMessage(`${stage?.label ?? nextStatus} simulated successfully.`);
  }

  return (
    <section className={cn("cn-panel overflow-hidden", compact && "shadow-none")} aria-labelledby={`workflow-${event.id}`}>
      <div className="flex flex-col gap-3 border-b border-[var(--line)] bg-[var(--ink)] p-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-2"><PackageCheck size={17} className="text-[var(--acid)]" /><h2 id={`workflow-${event.id}`} className="text-sm font-bold">Resource-event workflow</h2></div><p className="mt-1 font-mono text-[9px] text-white/45">TRACEABLE ID {event.id.slice(-12).toUpperCase()}</p></div>
        <Badge tone={demoStatus === "delivered" ? "green" : demoStatus === "cancelled" || demoStatus === "expired" ? "red" : "blue"}>{demoStatus.replaceAll("_", " ")}</Badge>
      </div>

      <ol className={cn("grid", compact ? "sm:grid-cols-3 xl:grid-cols-6" : "divide-y divide-[var(--line)]")}>
        {stages.map((stage, index) => {
          const audit = auditByType.get(stage.type);
          const complete = stage.type === "impact_recorded" ? Boolean(audit) : currentRank >= index;
          const current = !complete && index === currentRank + 1;
          return (
            <li key={stage.type} className={cn("relative p-4", compact && "border-b border-[var(--line)] sm:border-r", complete && "bg-[var(--green-soft)]/35", current && "bg-[var(--amber-soft)]/55")}>
              <div className="flex items-start gap-3">
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border", complete ? "border-[var(--green)] bg-[var(--green)] text-white" : current ? "border-[var(--amber)] bg-white text-[var(--amber)]" : "border-[var(--line-strong)] bg-white text-[var(--muted)]")}>{complete ? <Check size={14} /> : current ? <Clock3 size={13} /> : <Circle size={10} />}</span>
                <div><p className="text-xs font-bold">{stage.label}</p><p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">{stage.description}</p>{audit && <p className="mt-2 text-[10px] font-semibold text-[var(--green)]">{formatDateTime(audit.occurredAt)}</p>}</div>
              </div>
            </li>
          );
        })}
      </ol>

      {!compact && (
        <div className="border-t border-[var(--line)] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-2 text-xs leading-5 text-[var(--muted)]"><ShieldCheck className="mt-0.5 shrink-0 text-[var(--green)]" size={15} /><span>Every persisted transition is designed to create an append-only audit event.</span></div>{allowDemoMutation && nextStatus && <Button type="button" onClick={simulateNextStage}><Sparkles size={15} /> Simulate next stage (demo)</Button>}</div>
          {successMessage && <p role="status" className="mt-3 flex items-center gap-2 bg-[var(--green-soft)] p-3 text-xs font-bold text-[var(--green-dark)]"><CheckCircle2 size={15} /> {successMessage}</p>}
        </div>
      )}
    </section>
  );
}

export function TraceabilityPanel({ event }: { event: ResourceEvent }) {
  if (event.status !== "delivered") return null;
  return (
    <section className="cn-panel overflow-hidden" aria-labelledby={`trace-${event.id}`}>
      <div className="border-b border-[var(--line)] p-5"><h2 id={`trace-${event.id}`} className="text-sm font-bold">Chain of custody</h2><p className="mt-1 text-xs text-[var(--muted)]">Simplified completed-delivery trace; contact details and precise locations are withheld.</p></div>
      <div className="grid gap-px bg-[var(--line)] sm:grid-cols-4">
        {[
          ["Source", event.donorName, `${event.city}, generalised area`],
          ["Collection", `${event.quantityKg} kg confirmed`, event.collectedAt ? formatDateTime(event.collectedAt) : "Recorded"],
          ["Destination", event.recipientName ?? "Recipient organisation", "Verified participant"],
          ["Delivery + impact", "Receipt confirmed", event.deliveredAt ? formatDateTime(event.deliveredAt) : "Recorded"],
        ].map(([label, value, detail]) => <div key={label} className="bg-white p-5"><p className="font-mono text-[9px] font-bold text-[var(--muted)]">{label.toUpperCase()}</p><p className="mt-3 text-sm font-bold">{value}</p><p className="mt-1 text-xs text-[var(--muted)]">{detail}</p></div>)}
      </div>
    </section>
  );
}
