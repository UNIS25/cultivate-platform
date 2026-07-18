import { IMPACT_ASSUMPTIONS, IMPACT_ASSUMPTIONS_VERSION } from "@/config/impact-assumptions";
import type { FoodCategory, Recipient, SurplusListing, SurplusStatus } from "@/types/domain";

export interface ImpactMetrics {
  redistributedKg: number;
  estimatedMeals: number;
  financialValueEur: number;
  collectionsCompleted: number;
  recipientOrganisationsSupported: number;
  estimatedWasteAvoidedKg: number;
}

export interface ImpactBreakdownItem {
  label: string;
  kilograms: number;
  color: string;
}

export interface SupportedRecipientImpact {
  id: string;
  name: string;
  type: Recipient["type"];
  city: string;
  kilograms: number;
  collections: number;
}

export interface CompletedCollectionImpact {
  id: string;
  title: string;
  category: FoodCategory;
  kilograms: number;
  city: string;
  collectedAt: string;
  recipientName: string;
}

export interface ImpactReport {
  assumptionsVersion: string;
  metrics: ImpactMetrics;
  statusBreakdown: ImpactBreakdownItem[];
  categoryBreakdown: ImpactBreakdownItem[];
  supportedRecipients: SupportedRecipientImpact[];
  completedCollections: CompletedCollectionImpact[];
}

const statusColors: Record<SurplusStatus, string> = {
  Available: "#a95f05",
  Reserved: "#2456a6",
  Collected: "#176b4d",
};

const categoryColors: Record<FoodCategory, string> = {
  Bakery: "#2456a6",
  Produce: "#176b4d",
  "Prepared meals": "#a95f05",
  Dairy: "#b05252",
  Pantry: "#6f5f91",
  Mixed: "#287f83",
};

export function calculateImpactReport(
  listings: SurplusListing[],
  recipients: Recipient[],
): ImpactReport {
  const completed = listings.filter((listing) => listing.status === "Collected");
  const redistributedKg = completed.reduce((total, listing) => total + listing.quantityKg, 0);
  const recipientIds = new Set(completed.flatMap((listing) => listing.recipientId ? [listing.recipientId] : []));

  const metrics: ImpactMetrics = {
    redistributedKg,
    estimatedMeals: Math.round(redistributedKg * IMPACT_ASSUMPTIONS.mealsPerKilogram.value),
    financialValueEur: Number((redistributedKg * IMPACT_ASSUMPTIONS.financialValuePerKilogramEur.value).toFixed(2)),
    collectionsCompleted: completed.length,
    recipientOrganisationsSupported: recipientIds.size,
    estimatedWasteAvoidedKg: Number((redistributedKg * IMPACT_ASSUMPTIONS.wasteAvoidanceRate.value).toFixed(1)),
  };

  const statusBreakdown = (["Available", "Reserved", "Collected"] as const).map((status) => ({
    label: status,
    kilograms: listings.filter((listing) => listing.status === status).reduce((total, listing) => total + listing.quantityKg, 0),
    color: statusColors[status],
  }));

  const categoryTotals = new Map<FoodCategory, number>();
  completed.forEach((listing) => categoryTotals.set(listing.category, (categoryTotals.get(listing.category) ?? 0) + listing.quantityKg));
  const categoryBreakdown = [...categoryTotals.entries()]
    .map(([category, kilograms]) => ({ label: category, kilograms, color: categoryColors[category] }))
    .sort((a, b) => b.kilograms - a.kilograms);

  const supportedRecipients = recipients
    .filter((recipient) => recipientIds.has(recipient.id))
    .map((recipient) => {
      const recipientCollections = completed.filter((listing) => listing.recipientId === recipient.id);
      return {
        id: recipient.id,
        name: recipient.name,
        type: recipient.type,
        city: recipient.city,
        kilograms: recipientCollections.reduce((total, listing) => total + listing.quantityKg, 0),
        collections: recipientCollections.length,
      };
    })
    .sort((a, b) => b.kilograms - a.kilograms);

  const completedCollections = completed
    .map((listing) => ({
      id: listing.id,
      title: listing.title,
      category: listing.category,
      kilograms: listing.quantityKg,
      city: listing.city,
      collectedAt: listing.collectedAt ?? listing.collectBy,
      recipientName: recipients.find((recipient) => recipient.id === listing.recipientId)?.name ?? "Unassigned recipient",
    }))
    .sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime());

  return {
    assumptionsVersion: IMPACT_ASSUMPTIONS_VERSION,
    metrics,
    statusBreakdown,
    categoryBreakdown,
    supportedRecipients,
    completedCollections,
  };
}
