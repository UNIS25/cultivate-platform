"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Handshake,
  Info,
  MapPin,
  PackageOpen,
  Route,
  Scale,
  Search,
  Snowflake,
  Tags,
  Timer,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MATCHING_METHOD_VERSION, MATCHING_WEIGHTS } from "@/features/matching/engine";
import { ResourceEventWorkflow } from "@/features/workflow/resource-event-workflow";
import { cn, formatDateTime } from "@/lib/format";
import type { ListingMatchGroup, MatchFactorKey, RecipientRanking, ResourceEvent } from "@/types/domain";

const factorIcons = {
  distance: Route,
  capacity: Scale,
  category: Tags,
  refrigeration: Snowflake,
  openingHours: Clock3,
  deadline: Timer,
} satisfies Record<MatchFactorKey, typeof Route>;

export function MatchesWorkspace({ groups, events, dataReady }: { groups: ListingMatchGroup[]; events: ResourceEvent[]; dataReady: boolean }) {
  const [query, setQuery] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(groups[0]?.id);
  const [selectedRankingId, setSelectedRankingId] = useState<string | undefined>(groups[0]?.rankings[0]?.id);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string>();
  const [acceptError, setAcceptError] = useState("");

  const visibleGroups = useMemo(
    () => groups.filter((group) => `${group.surplus.title} ${group.donor.name} ${group.surplus.city} ${group.surplus.category}`.toLowerCase().includes(query.toLowerCase())),
    [groups, query],
  );
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? visibleGroups[0];
  const selectedRanking = selectedGroup?.rankings.find((ranking) => ranking.id === selectedRankingId) ?? selectedGroup?.rankings[0];
  const selectedEvent = events.find((event) => event.sourceId === selectedGroup?.surplus.id);
  const eligibleCount = groups.reduce((total, group) => total + group.rankings.filter((ranking) => ranking.eligible).length, 0);

  function selectGroup(group: ListingMatchGroup) {
    setSelectedGroupId(group.id);
    setSelectedRankingId(group.rankings[0]?.id);
  }

  async function acceptMatch(ranking: RecipientRanking) {
    setSavingId(ranking.id);
    setAcceptError("");
    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: ranking.surplus.id, recipientId: ranking.recipient.id }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The match could not be accepted.");
      setAccepted((current) => new Set(current).add(ranking.id));
    } catch (error) {
      setAcceptError(error instanceof Error ? error.message : "The match could not be accepted.");
    } finally {
      setSavingId(undefined);
    }
  }

  return (
    <>
      <section aria-label="Matching summary" className="cn-panel-dark cn-enter-delay mt-6 grid sm:grid-cols-2 xl:grid-cols-4">
        <div className="border-b border-white/10 p-5 sm:border-r xl:border-b-0"><div className="flex items-center gap-2 font-mono text-[9px] font-bold text-white/50"><PackageOpen size={15} className="text-[#ffc270]" /> ACTIVE OFFERS</div><p className="mt-4 text-3xl font-semibold">{groups.length}</p><p className="mt-1 text-[10px] text-white/45">Available or reserved</p></div>
        <div className="border-b border-white/10 p-5 xl:border-b-0 xl:border-r"><div className="flex items-center gap-2 font-mono text-[9px] font-bold text-white/50"><Users size={15} className="text-[#90afff]" /> ELIGIBLE PAIRINGS</div><p className="mt-4 text-3xl font-semibold">{eligibleCount}</p><p className="mt-1 text-[10px] text-white/45">After blocking checks</p></div>
        <div className="border-b border-white/10 p-5 sm:border-b-0 sm:border-r"><div className="flex items-center gap-2 font-mono text-[9px] font-bold text-white/50"><CheckCircle2 size={15} className="text-[var(--acid)]" /> ACCEPTED NOW</div><p className="mt-4 text-3xl font-semibold">{accepted.size}</p><p className="mt-1 text-[10px] text-white/45">Persisted to Supabase</p></div>
        <div className="p-5"><div className="flex items-center gap-2 font-mono text-[9px] font-bold text-white/50"><Scale size={15} className="text-[#83ddd6]" /> FOOD TO COORDINATE</div><p className="mt-4 text-3xl font-semibold">{groups.reduce((sum, group) => sum + group.surplus.quantityKg, 0)} kg</p><p className="mt-1 text-[10px] text-white/45">Across active offers</p></div>
      </section>

      <section className="mt-5 grid min-h-[700px] overflow-hidden border border-[var(--ink)] bg-white xl:grid-cols-[390px_minmax(0,1fr)]">
        <div className="border-b border-[var(--ink)] xl:border-b-0 xl:border-r">
          <div className="border-b border-[var(--line)] bg-[var(--ink)] p-3.5"><div className="mb-3 flex items-center justify-between font-mono text-[9px] font-bold text-white/50"><span>OFFER QUEUE</span><span>{visibleGroups.length} SIGNALS</span></div><label className="relative block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" size={16} /><span className="sr-only">Search active food offers</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search active food offers" className="h-11 w-full rounded-[2px] border border-white/15 bg-white/8 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[var(--acid)]" /></label></div>
          <div className="scrollbar-thin max-h-[760px] divide-y divide-[var(--line)] overflow-y-auto">
            {visibleGroups.map((group) => {
              const best = group.rankings.find((ranking) => ranking.eligible);
              return (
                <button key={group.id} onClick={() => selectGroup(group)} className={cn("cn-row-action relative w-full p-4 text-left", selectedGroup?.id === group.id && "bg-[var(--acid)]/30")}>
                  {selectedGroup?.id === group.id && <span className="absolute inset-y-0 left-0 w-[4px] bg-[var(--green)]" />}
                  <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><Badge tone={group.surplus.status === "Available" ? "amber" : "blue"}>{group.surplus.status}</Badge><span className="text-[11px] font-semibold text-[var(--muted)]">{group.surplus.quantityKg} kg</span></div><ChevronRight className="mt-1 shrink-0 text-[var(--muted)]" size={17} /></div>
                  <p className="mt-2 truncate text-sm font-bold">{group.surplus.title}</p>
                  <p className="mt-1 truncate text-xs text-[var(--muted)]">{group.donor.name} · {group.surplus.city}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3"><span className="truncate text-[11px] text-[var(--muted)]">{best ? `Best: ${best.recipient.name}` : "No eligible recipient"}</span>{best ? <strong className="text-xs text-[var(--green)]">{best.score}/100</strong> : <Badge tone="red">Blocked</Badge>}</div>
                </button>
              );
            })}
            {visibleGroups.length === 0 && <div className="p-10 text-center"><Search className="mx-auto text-[#9ba6a0]" size={24} /><p className="mt-3 text-sm font-bold">No active offers found</p><p className="mt-1 text-xs text-[var(--muted)]">Clear the search to see available listings.</p></div>}
          </div>
        </div>

        {selectedGroup && selectedRanking ? (
          <div className="min-w-0 p-4 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div><div className="flex flex-wrap items-center gap-2"><Badge tone={selectedGroup.surplus.status === "Available" ? "amber" : "blue"}>{selectedGroup.surplus.status} offer</Badge><span className="text-[11px] font-bold text-[var(--muted)]">Collect by {formatDateTime(selectedGroup.surplus.collectBy)}</span></div><h2 className="mt-3 text-xl font-bold">{selectedGroup.surplus.title}</h2><p className="mt-1 text-sm text-[var(--muted)]">{selectedGroup.surplus.quantityKg} kg · {selectedGroup.surplus.category} · {selectedGroup.surplus.handling} · from {selectedGroup.donor.name}</p></div>
              <div className="shrink-0"><Badge tone="green">{selectedGroup.rankings.filter((ranking) => ranking.eligible).length} of {selectedGroup.rankings.length} eligible</Badge></div>
            </div>

            {selectedEvent && <div className="mt-5"><ResourceEventWorkflow event={selectedEvent} compact /></div>}

            <div className="mt-5 border-l-4 border-[var(--blue)] bg-[var(--blue-soft)] p-4">
              <div className="flex items-start gap-3"><Info className="mt-0.5 shrink-0 text-[var(--blue)]" size={17} /><div><p className="text-xs font-bold text-[var(--blue)]">Transparent rules, not an AI model</p><p className="mt-1 text-xs leading-5 text-[var(--blue)]/80">Every recipient is scored with the same six published factors. Blocking requirements remain visible and place a recipient below eligible matches.</p></div></div>
              <div className="mt-3 flex flex-wrap gap-px border border-[var(--blue)]/15 bg-[var(--blue)]/15">{MATCHING_WEIGHTS.map((weight) => <span key={weight.key} className="bg-white/80 px-2.5 py-1.5 font-mono text-[9px] font-bold text-[var(--blue)]">{weight.label} {weight.maxScore}</span>)}</div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
              <section className="overflow-hidden border border-[var(--line-strong)]">
                <div className="border-b border-[var(--line)] bg-[var(--ink)] px-4 py-3 text-white"><h3 className="text-xs font-bold">Recipient ranking</h3><p className="mt-1 font-mono text-[9px] text-white/45">ELIGIBLE FIRST / TOTAL SCORE</p></div>
                <div className="scrollbar-thin max-h-[570px] divide-y divide-[var(--line)] overflow-y-auto">
                  {selectedGroup.rankings.map((ranking, index) => (
                    <button key={ranking.id} data-testid={`recipient-ranking-${ranking.recipient.id}`} data-eligible={ranking.eligible} onClick={() => setSelectedRankingId(ranking.id)} className={cn("cn-row-action flex w-full items-center gap-3 p-3.5 text-left", selectedRanking.id === ranking.id && "bg-[var(--green-soft)]")}>
                      <span className={cn("grid size-7 shrink-0 place-items-center rounded-[2px] font-mono text-[10px] font-bold", ranking.eligible ? "bg-[var(--green)] text-white" : "bg-[var(--surface-subtle)] text-[var(--muted)]")}>#{index + 1}</span>
                      <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{ranking.recipient.name}</p><p className="mt-1 truncate text-[10px] text-[var(--muted)]">{ranking.recipient.type} · {ranking.distanceKm < 10 ? ranking.distanceKm.toFixed(1) : Math.round(ranking.distanceKm)} km</p></div>
                      <div className="shrink-0 text-right"><p className={cn("text-sm font-bold", ranking.eligible ? "text-[var(--green)]" : "text-[var(--muted)]")}>{ranking.score}</p><p className="text-[9px] font-bold uppercase text-[var(--muted)]">{ranking.eligible ? "Eligible" : "Blocked"}</p></div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="min-w-0 border border-[var(--line-strong)] p-4 sm:p-5">
                <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge tone={selectedRanking.eligible ? "green" : "red"}>{selectedRanking.eligible ? "Eligible recommendation" : "Not currently eligible"}</Badge>{accepted.has(selectedRanking.id) && <Badge tone="green"><Check size={12} className="mr-1" /> Accepted</Badge>}</div><h3 className="mt-3 text-base font-bold">{selectedRanking.recipient.name}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]"><MapPin size={13} /> {selectedRanking.recipient.city}, {selectedRanking.recipient.country} · {selectedRanking.recipient.type}</p></div><div className="shrink-0 text-left sm:text-right"><p className={cn("text-3xl font-bold", selectedRanking.eligible ? "text-[var(--green)]" : "text-[var(--muted)]")}>{selectedRanking.score}<span className="text-sm">/100</span></p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--muted)]">Rules score</p></div></div>

                {selectedRanking.blockers.length > 0 && <div className="mt-4 border-l-4 border-[var(--red)] bg-[var(--red-soft)] p-3"><div className="flex items-center gap-2 text-xs font-bold text-[var(--red)]"><AlertCircle size={15} /> {selectedRanking.blockers.length} blocking requirement{selectedRanking.blockers.length === 1 ? "" : "s"}</div><ul className="mt-2 space-y-1.5">{selectedRanking.blockers.map((blocker) => <li key={blocker} className="text-[11px] leading-4 text-[var(--red)]">{blocker}</li>)}</ul></div>}

                <div className="mt-4 divide-y divide-[var(--line)] border border-[var(--line)]" aria-label={`Score breakdown for ${selectedRanking.recipient.name}`}>
                  {selectedRanking.factors.map((scoreFactor) => {
                    const Icon = factorIcons[scoreFactor.key];
                    const percentage = (scoreFactor.score / scoreFactor.maxScore) * 100;
                    return (
                      <div key={scoreFactor.key} className={cn("p-3", scoreFactor.blocking ? "bg-[var(--red-soft)]/45" : "bg-white")}>
                        <div className="flex items-center gap-3"><span className={cn("grid size-8 shrink-0 place-items-center rounded-[2px]", scoreFactor.blocking ? "bg-[var(--red-soft)] text-[var(--red)]" : "bg-[var(--surface-subtle)] text-[var(--green)]")}><Icon size={16} /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold">{scoreFactor.label}</p><strong className={cn("text-xs", scoreFactor.blocking && "text-[var(--red)]")}>{scoreFactor.score}/{scoreFactor.maxScore}</strong></div><div className="mt-2 h-1.5 bg-[var(--surface-subtle)]"><div className={cn("h-full", scoreFactor.blocking ? "bg-[var(--red)]" : "bg-[var(--green)]")} style={{ width: `${percentage}%` }} /></div></div></div>
                        <p className="mt-2 text-[11px] leading-4 text-[var(--muted)]">{scoreFactor.explanation}</p>
                      </div>
                    );
                  })}
                </div>

                {acceptError && <p role="alert" className="mt-4 rounded-md bg-[var(--red-soft)] p-3 text-xs leading-5 text-[var(--red)]">{acceptError}</p>}
                <div className="mt-5 flex flex-col gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] text-[var(--muted)]">Method {MATCHING_METHOD_VERSION} · Fixed weights · Deterministic</p><Button type="button" onClick={() => acceptMatch(selectedRanking)} disabled={!dataReady || !selectedRanking.eligible || accepted.has(selectedRanking.id) || savingId === selectedRanking.id}>{accepted.has(selectedRanking.id) ? <><Check size={16} /> Match accepted</> : savingId === selectedRanking.id ? "Saving..." : <><Handshake size={16} /> Accept match</>}</Button></div>
              </section>
            </div>
          </div>
        ) : <div className="grid place-items-center p-8 text-center"><div><Users className="mx-auto text-[#9ba6a0]" size={28} /><p className="mt-3 text-sm font-bold">Select an active offer</p></div></div>}
      </section>
    </>
  );
}
