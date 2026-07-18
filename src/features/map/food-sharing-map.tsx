"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  List,
  Map,
  MapPin,
  PackageOpen,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Store,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MapCanvas, type MapPoint, type MapPointKind } from "@/features/map/map-canvas";
import { cn, formatDateTime } from "@/lib/format";
import type { Donor, FoodCategory, Initiative, Recipient, SurplusListing, SurplusStatus } from "@/types/domain";

const categories: Array<FoodCategory | "All food categories"> = ["All food categories", "Produce", "Bakery", "Prepared meals", "Dairy", "Pantry", "Mixed"];
const organisationTypes = [
  "All organisation types",
  "Community fridge",
  "Food hub",
  "Social kitchen",
  "Redistribution network",
  "Supermarket",
  "Bakery",
  "Farm",
  "Caterer",
  "Wholesaler",
  "Community kitchen",
  "Shelter",
  "Food bank",
  "Youth centre",
  "Mutual aid group",
] as const;
const listingStatuses: Array<SurplusStatus | "All active statuses"> = ["All active statuses", "Available", "Reserved"];

type OrganisationType = (typeof organisationTypes)[number];
type ListingStatusFilter = (typeof listingStatuses)[number];
type LayerVisibility = Record<MapPointKind, boolean>;

const layerDefinitions: Array<{ kind: MapPointKind; label: string; markerClass: string }> = [
  { kind: "initiative", label: "Initiatives", markerClass: "rounded-full bg-[var(--green)]" },
  { kind: "donor", label: "Donors", markerClass: "rounded-[2px] bg-[var(--blue)]" },
  { kind: "recipient", label: "Recipients", markerClass: "rotate-45 rounded-[2px] bg-[#287f83]" },
  { kind: "surplus", label: "Surplus", markerClass: "rotate-45 rounded-full bg-[var(--amber)]" },
];

const initialLayers: LayerVisibility = { initiative: true, donor: true, recipient: true, surplus: true };

function matchesText(query: string, ...values: Array<string | number>) {
  return values.join(" ").toLowerCase().includes(query.trim().toLowerCase());
}

function typeMatches(filter: OrganisationType, type: string) {
  return filter === "All organisation types" || filter === type;
}

export function FoodSharingMap({
  initiatives,
  donors,
  recipients,
  surplus,
}: {
  initiatives: Initiative[];
  donors: Donor[];
  recipients: Recipient[];
  surplus: SurplusListing[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All food categories");
  const [organisationType, setOrganisationType] = useState<OrganisationType>("All organisation types");
  const [listingStatus, setListingStatus] = useState<ListingStatusFilter>("All active statuses");
  const [layers, setLayers] = useState<LayerVisibility>(initialLayers);
  const [selected, setSelected] = useState<MapPoint | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");

  const activeSurplus = useMemo(() => surplus.filter((item) => item.status !== "Collected"), [surplus]);

  const filteredInitiatives = useMemo(
    () => initiatives.filter((item) => {
      const categoryMatches = category === "All food categories" || item.categories.includes(category);
      return matchesText(query, item.name, item.city, item.country, item.type) && categoryMatches && typeMatches(organisationType, item.type);
    }),
    [category, initiatives, organisationType, query],
  );

  const filteredDonors = useMemo(
    () => donors.filter((item) => {
      const categoryMatches = category === "All food categories" || activeSurplus.some((listing) => listing.donorId === item.id && listing.category === category);
      return matchesText(query, item.name, item.city, item.country, item.type) && categoryMatches && typeMatches(organisationType, item.type);
    }),
    [activeSurplus, category, donors, organisationType, query],
  );

  const filteredRecipients = useMemo(
    () => recipients.filter((item) => {
      const categoryMatches = category === "All food categories" || item.acceptedCategories.includes(category);
      return matchesText(query, item.name, item.city, item.country, item.type) && categoryMatches && typeMatches(organisationType, item.type);
    }),
    [category, organisationType, query, recipients],
  );

  const filteredSurplus = useMemo(
    () => activeSurplus.filter((item) => {
      const donor = donors.find((entry) => entry.id === item.donorId);
      const categoryMatches = category === "All food categories" || item.category === category;
      const statusMatches = listingStatus === "All active statuses" || item.status === listingStatus;
      const organisationMatches = organisationType === "All organisation types" || donor?.type === organisationType;
      return matchesText(query, item.title, item.city, item.category, item.status, donor?.name ?? "") && categoryMatches && statusMatches && organisationMatches;
    }),
    [activeSurplus, category, donors, listingStatus, organisationType, query],
  );

  const points: MapPoint[] = [
    ...(layers.initiative ? filteredInitiatives.map((item) => ({ id: item.id, latitude: item.latitude, longitude: item.longitude, kind: "initiative" as const, label: `${item.name}, ${item.city}` })) : []),
    ...(layers.donor ? filteredDonors.map((item) => ({ id: item.id, latitude: item.latitude, longitude: item.longitude, kind: "donor" as const, label: `${item.name}, ${item.city}` })) : []),
    ...(layers.recipient ? filteredRecipients.map((item) => ({ id: item.id, latitude: item.latitude, longitude: item.longitude, kind: "recipient" as const, label: `${item.name}, ${item.city}` })) : []),
    ...(layers.surplus ? filteredSurplus.map((item) => ({ id: item.id, latitude: item.latitude, longitude: item.longitude, kind: "surplus" as const, label: `${item.title}, ${item.city}` })) : []),
  ];

  const selectedIsVisible = selected ? points.some((point) => point.id === selected.id && point.kind === selected.kind) : false;
  const selectedInitiative = selectedIsVisible && selected?.kind === "initiative" ? initiatives.find((item) => item.id === selected.id) : undefined;
  const selectedDonor = selectedIsVisible && selected?.kind === "donor" ? donors.find((item) => item.id === selected.id) : undefined;
  const selectedRecipient = selectedIsVisible && selected?.kind === "recipient" ? recipients.find((item) => item.id === selected.id) : undefined;
  const selectedSurplus = selectedIsVisible && selected?.kind === "surplus" ? surplus.find((item) => item.id === selected.id) : undefined;

  function selectPoint(point: MapPoint) {
    setSelected(point);
    setMobileView("map");
  }

  function toggleLayer(kind: MapPointKind) {
    setLayers((current) => ({ ...current, [kind]: !current[kind] }));
  }

  function resetFilters() {
    setQuery("");
    setCategory("All food categories");
    setOrganisationType("All organisation types");
    setListingStatus("All active statuses");
    setLayers(initialLayers);
    setSelected(null);
  }

  return (
    <section className="cn-enter-delay mt-6 overflow-hidden border border-[var(--ink)] bg-white">
      <div className="border-b border-[var(--line)] bg-white p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_220px_180px_170px_auto]">
          <label className="relative min-w-0 sm:col-span-2 xl:col-span-1">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={17} />
            <span className="sr-only">Search map locations</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search organisations, cities or food" className="h-11 w-full rounded-[2px] border border-[var(--line-strong)] bg-[var(--surface-raised)] pl-10 pr-3 text-sm outline-none placeholder:text-[#7c8881] focus:border-[var(--blue)] focus:bg-white" />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by organisation type</span>
            <select value={organisationType} onChange={(event) => setOrganisationType(event.target.value as OrganisationType)} className="h-11 w-full appearance-none rounded-[2px] border border-[var(--line)] bg-white px-3 pr-8 text-xs font-semibold outline-none focus:border-[var(--blue)]">
              {organisationTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
            <Building2 aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by food category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value as (typeof categories)[number])} className="h-11 w-full appearance-none rounded-[2px] border border-[var(--line)] bg-white px-3 pr-8 text-xs font-semibold outline-none focus:border-[var(--blue)]">
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <SlidersHorizontal aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by listing status</span>
            <select value={listingStatus} onChange={(event) => setListingStatus(event.target.value as ListingStatusFilter)} className="h-11 w-full appearance-none rounded-[2px] border border-[var(--line)] bg-white px-3 pr-8 text-xs font-semibold outline-none focus:border-[var(--blue)]">
              {listingStatuses.map((item) => <option key={item}>{item}</option>)}
            </select>
            <PackageOpen aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} />
          </label>
          <div className="grid h-11 grid-cols-2 border border-[var(--line)] p-1 lg:hidden">
            <button aria-label="Show map" onClick={() => setMobileView("map")} className={cn("grid place-items-center rounded-[2px]", mobileView === "map" ? "bg-[var(--ink)] text-[var(--acid)]" : "text-[var(--muted)]")}><Map size={17} /></button>
            <button aria-label="Show list" onClick={() => setMobileView("list")} className={cn("grid place-items-center rounded-[2px]", mobileView === "list" ? "bg-[var(--ink)] text-[var(--acid)]" : "text-[var(--muted)]")}><List size={17} /></button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 border-t border-[var(--line)] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] sm:flex">
            {layerDefinitions.map((layer) => (
              <button key={layer.kind} onClick={() => toggleLayer(layer.kind)} aria-pressed={layers[layer.kind]} className={cn("flex min-h-9 items-center justify-center gap-2 bg-white px-3 text-[11px] font-bold transition-colors", layers[layer.kind] ? "text-[var(--ink)] shadow-[inset_0_-3px_0_var(--acid)]" : "text-[var(--muted)] opacity-50")}>
                <span className={cn("size-2.5 shrink-0", layer.markerClass)} /> {layer.label}
              </button>
            ))}
          </div>
          <button onClick={resetFilters} className="inline-flex min-h-9 items-center justify-center gap-2 px-3 text-[11px] font-bold text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"><RotateCcw size={13} /> Reset filters</button>
        </div>
      </div>

      <div className="grid h-[690px] lg:grid-cols-[410px_minmax(0,1fr)]">
        <div className={cn("scrollbar-thin overflow-y-auto border-r border-[var(--line)]", mobileView === "map" ? "hidden lg:block" : "block")}>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--ink)] px-4 py-3.5 text-white">
            <p className="flex items-center gap-2 text-xs font-bold"><span className="cn-live-dot" /> {points.length} visible locations</p>
            <span className="font-mono text-[9px] text-white/50">LIVE LEDGER</span>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {layers.surplus && filteredSurplus.map((item) => (
              <button key={item.id} onClick={() => selectPoint({ id: item.id, latitude: item.latitude, longitude: item.longitude, kind: "surplus", label: item.title })} className={cn("cn-row-action w-full border-l-[3px] border-l-[var(--amber)] p-4 text-left", selected?.id === item.id && selected.kind === "surplus" && "bg-[var(--amber-soft)]/70")}>
                <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><span className="size-3 rotate-45 rounded-full bg-[var(--amber)]" /><Badge tone={item.status === "Available" ? "amber" : "blue"}>{item.status}</Badge></div><span className="text-xs font-bold text-[var(--amber)]">{item.quantityKg} kg</span></div>
                <p className="mt-2 text-sm font-bold text-[var(--ink)]">{item.title}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]"><MapPin size={13} /> {item.city} · Collect by {formatDateTime(item.collectBy)}</p>
              </button>
            ))}
            {layers.donor && filteredDonors.map((item) => (
              <button key={item.id} onClick={() => selectPoint({ id: item.id, latitude: item.latitude, longitude: item.longitude, kind: "donor", label: item.name })} className={cn("cn-row-action w-full border-l-[3px] border-l-[var(--blue)] p-4 text-left", selected?.id === item.id && selected.kind === "donor" && "bg-[var(--blue-soft)]/70")}>
                <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="size-3 rounded-[2px] bg-[var(--blue)]" /><Badge tone="blue">Food donor</Badge></div><span className="text-[11px] font-bold text-[var(--muted)]">{item.reliabilityScore}% reliable</span></div>
                <p className="mt-2 text-sm font-bold">{item.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.type} · {item.city}, {item.country}</p>
              </button>
            ))}
            {layers.recipient && filteredRecipients.map((item) => (
              <button key={item.id} onClick={() => selectPoint({ id: item.id, latitude: item.latitude, longitude: item.longitude, kind: "recipient", label: item.name })} className={cn("cn-row-action w-full border-l-[3px] border-l-[var(--cyan)] p-4 text-left", selected?.id === item.id && selected.kind === "recipient" && "bg-[var(--cyan-soft)]")}>
                <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="size-3 rotate-45 rounded-[2px] bg-[#287f83]" /><Badge tone="green">Recipient</Badge></div><span className="text-[11px] font-bold text-[var(--muted)]">{item.capacityKg} kg capacity</span></div>
                <p className="mt-2 text-sm font-bold">{item.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.type} · {item.city}, {item.country}</p>
              </button>
            ))}
            {layers.initiative && filteredInitiatives.map((item) => (
              <button key={item.id} onClick={() => selectPoint({ id: item.id, latitude: item.latitude, longitude: item.longitude, kind: "initiative", label: item.name })} className={cn("cn-row-action w-full border-l-[3px] border-l-[var(--green)] p-4 text-left", selected?.id === item.id && selected.kind === "initiative" && "bg-[var(--green-soft)]/70")}>
                <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><span className="size-3 rounded-full bg-[var(--green)]" /><Badge tone={item.status === "Active" ? "green" : item.status === "Pilot" ? "blue" : "amber"}>{item.status}</Badge></div>{item.verified && <CheckCircle2 aria-label="Verified" className="text-[var(--blue)]" size={16} />}</div>
                <p className="mt-2 text-sm font-bold text-[var(--ink)]">{item.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]"><MapPin size={13} /> {item.city}, {item.country}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">{item.type} · {item.weeklyCapacityKg} kg weekly capacity</p>
              </button>
            ))}
            {points.length === 0 && <div className="p-8 text-center"><Search className="mx-auto text-[#9aa59f]" size={24} /><p className="mt-3 text-sm font-bold">No locations found</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Adjust the organisation, food, status or layer filters.</p><button onClick={resetFilters} className="mt-4 text-xs font-bold text-[var(--green)] hover:underline">Reset all filters</button></div>}
          </div>
        </div>

        <div className={cn("relative min-w-0", mobileView === "list" ? "hidden lg:block" : "block")}>
          <MapCanvas points={points} selectedId={selectedIsVisible ? selected?.id : undefined} onSelect={selectPoint} />
          {(selectedInitiative || selectedDonor || selectedRecipient || selectedSurplus) && (
            <div className="cn-panel absolute bottom-7 left-3 right-3 z-[500] max-w-sm p-5 shadow-[10px_12px_0_rgb(17_24_20_/_18%)] sm:left-5 sm:right-auto">
              {selectedInitiative ? (
                <><div className="flex items-center justify-between gap-3"><Badge tone="green">{selectedInitiative.type}</Badge><Users className="text-[var(--muted)]" size={17} /></div><h2 className="mt-3 text-base font-bold">{selectedInitiative.name}</h2><p className="mt-1 text-xs text-[var(--muted)]">{selectedInitiative.city}, {selectedInitiative.country}</p><p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{selectedInitiative.description}</p><Link href={`/initiatives/${selectedInitiative.slug}`} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[var(--green)] hover:underline">View initiative profile <ArrowRight size={14} /></Link></>
              ) : selectedDonor ? (
                <><div className="flex items-center justify-between gap-3"><Badge tone="blue">{selectedDonor.type}</Badge><Store className="text-[var(--blue)]" size={17} /></div><h2 className="mt-3 text-base font-bold">{selectedDonor.name}</h2><p className="mt-1 text-xs text-[var(--muted)]">{selectedDonor.city}, {selectedDonor.country}</p><div className="mt-3 flex gap-4 text-xs text-[var(--muted)]"><span><strong className="text-[var(--ink)]">{selectedDonor.reliabilityScore}%</strong> reliability</span><span><strong className="text-[var(--ink)]">{selectedDonor.donationsThisMonth}</strong> donations</span></div></>
              ) : selectedRecipient ? (
                <><div className="flex items-center justify-between gap-3"><Badge tone="green">{selectedRecipient.type}</Badge><Users className="text-[#287f83]" size={17} /></div><h2 className="mt-3 text-base font-bold">{selectedRecipient.name}</h2><p className="mt-1 text-xs text-[var(--muted)]">{selectedRecipient.city}, {selectedRecipient.country}</p><p className="mt-3 text-xs leading-5 text-[var(--muted)]">Accepts {selectedRecipient.acceptedCategories.join(", ")} · {selectedRecipient.capacityKg} kg capacity{selectedRecipient.refrigeration ? " · Cold storage" : ""}</p><Link href="/matches" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[var(--green)] hover:underline">Review matching capacity <ArrowRight size={14} /></Link></>
              ) : selectedSurplus ? (
                <><div className="flex items-center justify-between gap-3"><Badge tone={selectedSurplus.status === "Available" ? "amber" : "blue"}>{selectedSurplus.status} surplus</Badge><PackageOpen className="text-[var(--amber)]" size={17} /></div><h2 className="mt-3 text-base font-bold">{selectedSurplus.title}</h2><p className="mt-1 text-xs text-[var(--muted)]">{selectedSurplus.quantityKg} kg · {selectedSurplus.portions} portions · {selectedSurplus.handling}</p><p className="mt-3 text-xs leading-5 text-[var(--muted)]">{selectedSurplus.notes}</p><Link href="/matches" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[var(--green)] hover:underline">Review possible matches <ArrowRight size={14} /></Link></>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
