import { cache } from "react";
import { getDemoListingSchedule } from "@/lib/demo-dates";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { AuditEvent, Donor, FoodCategory, Initiative, Recipient, ResourceEvent, ResourceEventStatus, SurplusListing, Weekday } from "@/types/domain";

type FoodCategoryRow = Database["public"]["Tables"]["food_categories"]["Row"];
type OrganisationRow = Database["public"]["Tables"]["organisations"]["Row"];
type OrganisationLocationRow = Database["public"]["Tables"]["organisation_locations"]["Row"];
type OrganisationFoodCategoryRow = Database["public"]["Tables"]["organisation_food_categories"]["Row"];
type SurplusListingRow = Database["public"]["Tables"]["surplus_listings"]["Row"];
type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];
type ImpactRecordRow = Database["public"]["Tables"]["impact_records"]["Row"];
type GovernanceResourceRow = Database["public"]["Tables"]["governance_resources"]["Row"];
type EngagementResourceRow = Database["public"]["Tables"]["engagement_resources"]["Row"];

export type DataSourceStatus = "ready" | "unconfigured" | "error";

export interface DataSourceState {
  status: DataSourceStatus;
  message?: string;
}

export interface NetworkSnapshot {
  initiatives: Initiative[];
  donors: Donor[];
  recipients: Recipient[];
  surplusListings: SurplusListing[];
  resourceEvents: ResourceEvent[];
  source: DataSourceState;
}

export interface GovernanceResource {
  id: string;
  slug: string;
  priority: "High" | "Medium" | "Low";
  title: string;
  description: string;
  area: string;
  effort: string;
  audience: string;
}

export interface EngagementResource {
  id: string;
  slug: string;
  type: string;
  title: string;
  detail: string;
  content: string;
  audience: string;
  url?: string;
}

export interface RecommendationResources {
  governance: GovernanceResource[];
  engagement: EngagementResource[];
  source: DataSourceState;
}

const EMPTY_NETWORK: NetworkSnapshot = {
  initiatives: [],
  donors: [],
  recipients: [],
  surplusListings: [],
  resourceEvents: [],
  source: {
    status: "unconfigured",
    message: "Add the Supabase URL and publishable key to load the seeded demonstration workspace.",
  },
};

const weekdayValues = new Set<Weekday>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
const initiativeTypes = new Set<Initiative["type"]>(["Community fridge", "Food hub", "Social kitchen", "Redistribution network"]);
const donorTypes = new Set<Donor["type"]>(["Supermarket", "Bakery", "Farm", "Caterer", "Wholesaler"]);
const recipientTypes = new Set<Recipient["type"]>(["Community kitchen", "Shelter", "Food bank", "Youth centre", "Mutual aid group"]);
const foodCategoryValues = new Set<FoodCategory>(["Bakery", "Produce", "Prepared meals", "Dairy", "Pantry", "Mixed"]);

function primaryLocation(organisationId: string, locations: OrganisationLocationRow[]) {
  return locations.find((item) => item.organisation_id === organisationId && item.is_primary)
    ?? locations.find((item) => item.organisation_id === organisationId);
}

function categoryNames(
  organisationId: string,
  memberships: OrganisationFoodCategoryRow[],
  categories: Map<string, FoodCategoryRow>,
) {
  return memberships
    .filter((item) => item.organisation_id === organisationId)
    .sort((a, b) => b.priority - a.priority)
    .flatMap((item) => {
      const name = categories.get(item.food_category_id)?.name;
      return name && foodCategoryValues.has(name as FoodCategory) ? [name as FoodCategory] : [];
    });
}

function toInitiative(
  row: OrganisationRow,
  locations: OrganisationLocationRow[],
  memberships: OrganisationFoodCategoryRow[],
  categories: Map<string, FoodCategoryRow>,
): Initiative | undefined {
  const location = primaryLocation(row.id, locations);
  if (!location || !initiativeTypes.has(row.organisation_type as Initiative["type"])) return undefined;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: location.city,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
    type: row.organisation_type as Initiative["type"],
    status: row.status === "pilot" ? "Pilot" : row.status === "seasonal" ? "Seasonal" : "Active",
    description: row.description,
    categories: categoryNames(row.id, memberships, categories),
    weeklyCapacityKg: row.weekly_capacity_kg ?? 0,
    activeVolunteers: row.active_volunteers ?? 0,
    householdsReached: row.households_supported ?? 0,
    governanceScore: row.governance_score ?? 0,
    verified: row.verified,
    nextCollection: row.next_collection_label ?? "To be confirmed",
  };
}

function toDonor(row: OrganisationRow, locations: OrganisationLocationRow[]): Donor | undefined {
  const location = primaryLocation(row.id, locations);
  if (!location || !donorTypes.has(row.organisation_type as Donor["type"])) return undefined;

  return {
    id: row.id,
    name: row.name,
    type: row.organisation_type as Donor["type"],
    city: location.city,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
    contactName: "Restricted to confirmed participants",
    reliabilityScore: row.reliability_score ?? 0,
    donationsThisMonth: row.donations_this_month ?? 0,
  };
}

function toRecipient(
  row: OrganisationRow,
  locations: OrganisationLocationRow[],
  memberships: OrganisationFoodCategoryRow[],
  categories: Map<string, FoodCategoryRow>,
): Recipient | undefined {
  const location = primaryLocation(row.id, locations);
  if (!location || !recipientTypes.has(row.organisation_type as Recipient["type"])) return undefined;

  return {
    id: row.id,
    name: row.name,
    type: row.organisation_type as Recipient["type"],
    city: location.city,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
    contactName: "Restricted to confirmed participants",
    acceptedCategories: categoryNames(row.id, memberships, categories),
    capacityKg: row.recipient_capacity_kg ?? 0,
    refrigeration: row.has_refrigeration,
    householdsSupported: row.households_supported ?? 0,
    timeZone: row.time_zone ?? "UTC",
    openingHours: {
      days: row.opening_days.filter((day): day is Weekday => weekdayValues.has(day as Weekday)),
      opensAt: row.opens_at?.slice(0, 5) ?? "09:00",
      closesAt: row.closes_at?.slice(0, 5) ?? "17:00",
    },
  };
}

function toSurplusListing(
  row: SurplusListingRow,
  locations: Map<string, OrganisationLocationRow>,
  categories: Map<string, FoodCategoryRow>,
  snapshotNow: Date,
): SurplusListing | undefined {
  const location = locations.get(row.location_id);
  const categoryName = categories.get(row.food_category_id)?.name;
  if (!location || !categoryName || !foodCategoryValues.has(categoryName as FoodCategory)) return undefined;
  if (!(["available", "reserved", "collected"] as const).includes(row.status as "available" | "reserved" | "collected")) return undefined;

  const status = row.status === "reserved" ? "Reserved" : row.status === "collected" ? "Collected" : "Available";
  const demoSchedule = row.legacy_id?.startsWith("surplus-")
    ? getDemoListingSchedule(row.legacy_id, status, snapshotNow)
    : undefined;

  return {
    id: row.id,
    donorId: row.donor_organisation_id,
    recipientId: row.recipient_organisation_id ?? undefined,
    title: row.title,
    category: categoryName as FoodCategory,
    quantityKg: row.quantity_kg,
    portions: row.estimated_meals,
    availableFrom: demoSchedule?.availableFrom ?? row.available_from,
    collectBy: demoSchedule?.collectBy ?? row.collection_deadline,
    collectedAt: demoSchedule?.collectedAt ?? row.collected_at ?? undefined,
    status,
    handling: row.handling === "chilled" ? "Chilled" : row.handling === "frozen" ? "Frozen" : "Ambient",
    city: location.city,
    latitude: location.latitude,
    longitude: location.longitude,
    notes: row.notes,
  };
}

function addHours(value: string, hours: number) {
  return new Date(new Date(value).getTime() + hours * 60 * 60 * 1000).toISOString();
}

function buildDerivedAuditTrail(event: Omit<ResourceEvent, "auditTrail">): AuditEvent[] {
  const entries: AuditEvent[] = [{
    id: `${event.id}-created`,
    resourceEventId: event.id,
    eventType: "offer_created",
    actorLabel: "Fictional food donor",
    occurredAt: event.createdAt,
    newStatus: "available",
    note: "Offer entered the demonstration workflow.",
  }];

  if (event.matchedAt) entries.push({
    id: `${event.id}-matched`, resourceEventId: event.id, eventType: "match_proposed",
    actorLabel: "Rules-based matching service", occurredAt: event.matchedAt,
    previousStatus: "available", newStatus: "matched", note: "A compatible recipient was proposed.",
  });
  if (event.acceptedAt) entries.push({
    id: `${event.id}-accepted`, resourceEventId: event.id, eventType: "recipient_accepted",
    actorLabel: "Fictional recipient coordinator", occurredAt: event.acceptedAt,
    previousStatus: "matched", newStatus: "accepted", note: "Recipient acceptance recorded.",
  });
  if (event.collectedAt) entries.push({
    id: `${event.id}-collected`, resourceEventId: event.id, eventType: "collection_confirmed",
    actorLabel: "Fictional collection coordinator", occurredAt: event.collectedAt,
    previousStatus: "accepted", newStatus: "collected", note: "Collection handover confirmed.",
  });
  if (event.deliveredAt) entries.push({
    id: `${event.id}-delivered`, resourceEventId: event.id, eventType: "delivery_confirmed",
    actorLabel: "Fictional recipient coordinator", occurredAt: event.deliveredAt,
    previousStatus: "collected", newStatus: "delivered", note: "Delivery and quantity confirmed.",
  });
  if (event.impactRecordedAt) entries.push({
    id: `${event.id}-impact`, resourceEventId: event.id, eventType: "impact_recorded",
    actorLabel: "CULTIVATE Next impact calculator", occurredAt: event.impactRecordedAt,
    previousStatus: "delivered", newStatus: "delivered", note: "Demonstration estimates calculated from confirmed delivery.",
  });
  return entries;
}

function toResourceEvents(
  listings: SurplusListing[],
  donors: Donor[],
  recipients: Recipient[],
  collections: CollectionRow[],
  impacts: ImpactRecordRow[],
): ResourceEvent[] {
  const collectionByListing = new Map(collections.map((item) => [item.listing_id, item]));
  const impactByCollection = new Map(impacts.map((item) => [item.collection_id, item]));

  return listings.flatMap((listing) => {
    const donor = donors.find((item) => item.id === listing.donorId);
    if (!donor) return [];
    const recipient = recipients.find((item) => item.id === listing.recipientId);
    const collection = collectionByListing.get(listing.id);
    const impact = collection ? impactByCollection.get(collection.id) : undefined;
    const delivered = Boolean(impact && listing.collectedAt);
    const matchedAt = listing.status === "Reserved" || listing.status === "Collected" ? addHours(listing.availableFrom, 0.5) : undefined;
    const acceptedAt = listing.status === "Collected" && listing.collectedAt ? addHours(listing.collectedAt, -2) : undefined;
    const deliveredAt = delivered && listing.collectedAt ? addHours(listing.collectedAt, 1) : undefined;
    const status: ResourceEventStatus = delivered
      ? "delivered"
      : listing.status === "Collected"
        ? "collected"
        : listing.status === "Reserved"
          ? "matched"
          : "available";
    const withoutAudit: Omit<ResourceEvent, "auditTrail"> = {
      id: `resource-${listing.id}`,
      organisationId: listing.donorId,
      sourceType: "surplus_listing",
      sourceId: listing.id,
      materialCategory: listing.category,
      quantityKg: listing.quantityKg,
      status,
      sourceLocation: `${listing.city}, generalised area`,
      destinationId: listing.recipientId,
      collectionId: collection?.id,
      impactRecordId: impact?.id,
      matchedAt,
      acceptedAt,
      collectedAt: listing.collectedAt,
      deliveredAt,
      impactRecordedAt: impact?.recorded_at,
      createdAt: listing.availableFrom,
      updatedAt: impact?.recorded_at ?? deliveredAt ?? listing.collectedAt ?? matchedAt ?? listing.availableFrom,
      title: listing.title,
      city: listing.city,
      country: donor.country,
      donorName: donor.name,
      donorType: donor.type,
      recipientName: recipient?.name,
      recipientType: recipient?.type,
      collectionDeadline: listing.collectBy,
    };
    return [{ ...withoutAudit, auditTrail: buildDerivedAuditTrail(withoutAudit) }];
  });
}

function repositoryError(message: string): DataSourceState {
  console.error(`[supabase] ${message}`);
  return { status: "error", message: "Supabase could not load the demonstration workspace. Check the migration, seed, and API credentials." };
}

export const getNetworkSnapshot = cache(async (): Promise<NetworkSnapshot> => {
  if (!isSupabaseConfigured()) return EMPTY_NETWORK;

  try {
    const supabase = await createSupabaseServerClient();
    const [organisationsResult, locationsResult, categoriesResult, membershipsResult, listingsResult, collectionsResult, impactsResult] = await Promise.all([
      supabase.from("organisations").select("*").order("name"),
      supabase.from("organisation_locations").select("*").order("is_primary", { ascending: false }),
      supabase.from("food_categories").select("*").order("sort_order"),
      supabase.from("organisation_food_categories").select("*").order("priority", { ascending: false }),
      supabase.from("surplus_listings").select("*").order("collection_deadline"),
      supabase.from("collections").select("*").eq("is_public", true).order("completed_at", { ascending: false }),
      supabase.from("impact_records").select("*").eq("is_public", true).order("recorded_at", { ascending: false }),
    ]);

    const error = organisationsResult.error
      ?? locationsResult.error
      ?? categoriesResult.error
      ?? membershipsResult.error
      ?? listingsResult.error
      ?? collectionsResult.error
      ?? impactsResult.error;
    if (error) return { ...EMPTY_NETWORK, source: repositoryError(error.message) };

    const organisations = organisationsResult.data as OrganisationRow[];
    const locations = locationsResult.data as OrganisationLocationRow[];
    const memberships = membershipsResult.data as OrganisationFoodCategoryRow[];
    const categoryMap = new Map((categoriesResult.data as FoodCategoryRow[]).map((item) => [item.id, item]));
    const locationMap = new Map(locations.map((item) => [item.id, item]));

    const initiatives = organisations
      .filter((item) => item.kind === "initiative" || item.kind === "hybrid")
      .flatMap((item) => toInitiative(item, locations, memberships, categoryMap) ?? []);
    const donors = organisations
      .filter((item) => item.kind === "donor" || item.kind === "hybrid")
      .flatMap((item) => toDonor(item, locations) ?? []);
    const recipients = organisations
      .filter((item) => item.kind === "recipient" || item.kind === "hybrid")
      .flatMap((item) => toRecipient(item, locations, memberships, categoryMap) ?? []);
    const snapshotNow = new Date();
    const surplusListings = (listingsResult.data as SurplusListingRow[])
      .flatMap((item) => toSurplusListing(item, locationMap, categoryMap, snapshotNow) ?? []);
    const resourceEvents = toResourceEvents(
      surplusListings,
      donors,
      recipients,
      collectionsResult.data as CollectionRow[],
      impactsResult.data as ImpactRecordRow[],
    );

    return {
      initiatives,
      donors,
      recipients,
      surplusListings,
      resourceEvents,
      source: { status: "ready" },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown repository error";
    return { ...EMPTY_NETWORK, source: repositoryError(message) };
  }
});

export const getRecommendationResources = cache(async (): Promise<RecommendationResources> => {
  if (!isSupabaseConfigured()) {
    return { governance: [], engagement: [], source: EMPTY_NETWORK.source };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [governanceResult, engagementResult] = await Promise.all([
      supabase.from("governance_resources").select("*").order("published_at", { ascending: false }),
      supabase.from("engagement_resources").select("*").order("published_at", { ascending: false }),
    ]);
    const error = governanceResult.error ?? engagementResult.error;
    if (error) return { governance: [], engagement: [], source: repositoryError(error.message) };

    return {
      governance: (governanceResult.data as GovernanceResourceRow[]).map((item) => ({
        id: item.id,
        slug: item.slug,
        priority: item.priority === "High" || item.priority === "Low" ? item.priority : "Medium",
        title: item.title,
        description: item.summary,
        area: item.area,
        effort: item.effort_label,
        audience: item.audience,
      })),
      engagement: (engagementResult.data as EngagementResourceRow[]).map((item) => ({
        id: item.id,
        slug: item.slug,
        type: item.resource_type,
        title: item.title,
        detail: item.summary,
        content: item.content,
        audience: item.audience,
        url: item.external_url ?? undefined,
      })),
      source: { status: "ready" },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown repository error";
    return { governance: [], engagement: [], source: repositoryError(message) };
  }
});
