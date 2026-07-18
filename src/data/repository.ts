import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { Donor, FoodCategory, Initiative, Recipient, SurplusListing, Weekday } from "@/types/domain";

type FoodCategoryRow = Database["public"]["Tables"]["food_categories"]["Row"];
type OrganisationRow = Database["public"]["Tables"]["organisations"]["Row"];
type OrganisationLocationRow = Database["public"]["Tables"]["organisation_locations"]["Row"];
type OrganisationFoodCategoryRow = Database["public"]["Tables"]["organisation_food_categories"]["Row"];
type SurplusListingRow = Database["public"]["Tables"]["surplus_listings"]["Row"];
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
): SurplusListing | undefined {
  const location = locations.get(row.location_id);
  const categoryName = categories.get(row.food_category_id)?.name;
  if (!location || !categoryName || !foodCategoryValues.has(categoryName as FoodCategory)) return undefined;
  if (!(["available", "reserved", "collected"] as const).includes(row.status as "available" | "reserved" | "collected")) return undefined;

  return {
    id: row.id,
    donorId: row.donor_organisation_id,
    recipientId: row.recipient_organisation_id ?? undefined,
    title: row.title,
    category: categoryName as FoodCategory,
    quantityKg: row.quantity_kg,
    portions: row.estimated_meals,
    availableFrom: row.available_from,
    collectBy: row.collection_deadline,
    collectedAt: row.collected_at ?? undefined,
    status: row.status === "reserved" ? "Reserved" : row.status === "collected" ? "Collected" : "Available",
    handling: row.handling === "chilled" ? "Chilled" : row.handling === "frozen" ? "Frozen" : "Ambient",
    city: location.city,
    latitude: location.latitude,
    longitude: location.longitude,
    notes: row.notes,
  };
}

function repositoryError(message: string): DataSourceState {
  console.error(`[supabase] ${message}`);
  return { status: "error", message: "Supabase could not load the demonstration workspace. Check the migration, seed, and API credentials." };
}

export const getNetworkSnapshot = cache(async (): Promise<NetworkSnapshot> => {
  if (!isSupabaseConfigured()) return EMPTY_NETWORK;

  try {
    const supabase = await createSupabaseServerClient();
    const [organisationsResult, locationsResult, categoriesResult, membershipsResult, listingsResult] = await Promise.all([
      supabase.from("organisations").select("*").order("name"),
      supabase.from("organisation_locations").select("*").order("is_primary", { ascending: false }),
      supabase.from("food_categories").select("*").order("sort_order"),
      supabase.from("organisation_food_categories").select("*").order("priority", { ascending: false }),
      supabase.from("surplus_listings").select("*").order("collection_deadline"),
    ]);

    const error = organisationsResult.error
      ?? locationsResult.error
      ?? categoriesResult.error
      ?? membershipsResult.error
      ?? listingsResult.error;
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
    const surplusListings = (listingsResult.data as SurplusListingRow[])
      .flatMap((item) => toSurplusListing(item, locationMap, categoryMap) ?? []);

    return {
      initiatives,
      donors,
      recipients,
      surplusListings,
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
