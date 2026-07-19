import { IMPACT_ASSUMPTIONS, IMPACT_ASSUMPTIONS_VERSION } from "@/config/impact-assumptions";
import type { FoodCategory, ResourceEvent, ResourceEventStatus } from "@/types/domain";

export interface ImpactFilters {
  from?: string;
  to?: string;
  city?: string;
  organisationType?: string;
  category?: FoodCategory | "";
}

export interface ImpactMetrics {
  redistributedKg: number;
  estimatedMeals: number;
  financialValueEur: number;
  estimatedCo2eAvoidedKg: number;
  landfillDiversionKg: number;
  collectionsCompleted: number;
  recipientOrganisationsSupported: number;
  collectionSuccessRate: number;
}

export interface ImpactBreakdownItem {
  label: string;
  kilograms: number;
  color: string;
}

export interface SupportedRecipientImpact {
  id: string;
  name: string;
  type: string;
  city: string;
  kilograms: number;
  collections: number;
}

export interface DeliveredEventImpact {
  id: string;
  sourceId: string;
  title: string;
  category: FoodCategory;
  kilograms: number;
  city: string;
  organisationType: string;
  deliveredAt: string;
  recipientName: string;
}

export interface ImpactReport {
  assumptionsVersion: string;
  metrics: ImpactMetrics;
  statusBreakdown: ImpactBreakdownItem[];
  categoryBreakdown: ImpactBreakdownItem[];
  supportedRecipients: SupportedRecipientImpact[];
  deliveredEvents: DeliveredEventImpact[];
  filters: ImpactFilters;
}

const statusColors: Record<ResourceEventStatus, string> = {
  draft: "#647069",
  available: "#b75408",
  matched: "#315fce",
  accepted: "#1b8790",
  collected: "#6f5f91",
  delivered: "#08765a",
  cancelled: "#c53f42",
  expired: "#8a6b54",
};

const categoryColors: Record<FoodCategory, string> = {
  Bakery: "#315fce",
  Produce: "#08765a",
  "Prepared meals": "#b75408",
  Dairy: "#c53f42",
  Pantry: "#6f5f91",
  Mixed: "#1b8790",
};

function isWithinDateRange(value: string | undefined, filters: ImpactFilters) {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (filters.from && time < new Date(`${filters.from}T00:00:00`).getTime()) return false;
  if (filters.to && time > new Date(`${filters.to}T23:59:59.999`).getTime()) return false;
  return true;
}

export function filterDeliveredResourceEvents(events: ResourceEvent[], filters: ImpactFilters = {}) {
  return events.filter((event) => (
    event.status === "delivered"
    && Boolean(event.deliveredAt)
    && isWithinDateRange(event.deliveredAt, filters)
    && (!filters.city || event.city === filters.city)
    && (!filters.organisationType || event.donorType === filters.organisationType)
    && (!filters.category || event.materialCategory === filters.category)
  ));
}

export function calculateImpactReport(events: ResourceEvent[], filters: ImpactFilters = {}): ImpactReport {
  const delivered = filterDeliveredResourceEvents(events, filters);
  const redistributedKg = delivered.reduce((total, event) => total + event.quantityKg, 0);
  const recipientIds = new Set(delivered.flatMap((event) => event.destinationId ? [event.destinationId] : []));
  const terminalAttempts = events.filter((event) => (
    event.status === "delivered" || event.status === "cancelled" || event.status === "collected"
  ));

  const metrics: ImpactMetrics = {
    redistributedKg,
    estimatedMeals: Math.round(redistributedKg * IMPACT_ASSUMPTIONS.mealsPerKilogram.value),
    financialValueEur: Number((redistributedKg * IMPACT_ASSUMPTIONS.financialValuePerKilogramEur.value).toFixed(2)),
    estimatedCo2eAvoidedKg: Number((redistributedKg * IMPACT_ASSUMPTIONS.co2eAvoidedPerKilogram.value).toFixed(1)),
    landfillDiversionKg: Number((redistributedKg * IMPACT_ASSUMPTIONS.wasteAvoidanceRate.value).toFixed(1)),
    collectionsCompleted: delivered.length,
    recipientOrganisationsSupported: recipientIds.size,
    collectionSuccessRate: terminalAttempts.length === 0
      ? 0
      : Number(((events.filter((event) => event.status === "delivered").length / terminalAttempts.length) * 100).toFixed(1)),
  };

  const statuses: ResourceEventStatus[] = ["available", "matched", "accepted", "collected", "delivered", "cancelled", "expired"];
  const statusBreakdown = statuses
    .map((status) => ({
      label: status[0].toUpperCase() + status.slice(1),
      kilograms: events.filter((event) => event.status === status).reduce((total, event) => total + event.quantityKg, 0),
      color: statusColors[status],
    }))
    .filter((item) => item.kilograms > 0);

  const categoryTotals = new Map<FoodCategory, number>();
  delivered.forEach((event) => categoryTotals.set(event.materialCategory, (categoryTotals.get(event.materialCategory) ?? 0) + event.quantityKg));
  const categoryBreakdown = [...categoryTotals.entries()]
    .map(([category, kilograms]) => ({ label: category, kilograms, color: categoryColors[category] }))
    .sort((a, b) => b.kilograms - a.kilograms);

  const supportedRecipients = [...recipientIds].map((recipientId) => {
    const recipientEvents = delivered.filter((event) => event.destinationId === recipientId);
    const representative = recipientEvents[0];
    return {
      id: recipientId,
      name: representative?.recipientName ?? "Anonymised recipient organisation",
      type: representative?.recipientType ?? "Recipient organisation",
      city: representative?.city ?? "Generalised area",
      kilograms: recipientEvents.reduce((total, event) => total + event.quantityKg, 0),
      collections: recipientEvents.length,
    };
  }).sort((a, b) => b.kilograms - a.kilograms);

  const deliveredEvents = delivered.map((event) => ({
    id: event.id,
    sourceId: event.sourceId,
    title: event.title,
    category: event.materialCategory,
    kilograms: event.quantityKg,
    city: event.city,
    organisationType: event.donorType,
    deliveredAt: event.deliveredAt!,
    recipientName: event.recipientName ?? "Anonymised recipient organisation",
  })).sort((a, b) => new Date(b.deliveredAt).getTime() - new Date(a.deliveredAt).getTime());

  return {
    assumptionsVersion: IMPACT_ASSUMPTIONS_VERSION,
    metrics,
    statusBreakdown,
    categoryBreakdown,
    supportedRecipients,
    deliveredEvents,
    filters,
  };
}
