export type FoodCategory =
  | "Bakery"
  | "Produce"
  | "Prepared meals"
  | "Dairy"
  | "Pantry"
  | "Mixed";

export type InitiativeStatus = "Active" | "Pilot" | "Seasonal";
export type SurplusStatus = "Available" | "Reserved" | "Collected";
export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface Initiative {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  type: "Community fridge" | "Food hub" | "Social kitchen" | "Redistribution network";
  status: InitiativeStatus;
  description: string;
  categories: FoodCategory[];
  weeklyCapacityKg: number;
  activeVolunteers: number;
  householdsReached: number;
  governanceScore: number;
  verified: boolean;
  nextCollection: string;
}

export interface Donor {
  id: string;
  name: string;
  type: "Supermarket" | "Bakery" | "Farm" | "Caterer" | "Wholesaler";
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  contactName: string;
  reliabilityScore: number;
  donationsThisMonth: number;
}

export interface Recipient {
  id: string;
  name: string;
  type: "Community kitchen" | "Shelter" | "Food bank" | "Youth centre" | "Mutual aid group";
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  contactName: string;
  acceptedCategories: FoodCategory[];
  capacityKg: number;
  refrigeration: boolean;
  householdsSupported: number;
  timeZone: string;
  openingHours: {
    days: Weekday[];
    opensAt: string;
    closesAt: string;
  };
}

export interface SurplusListing {
  id: string;
  donorId: string;
  recipientId?: string;
  title: string;
  category: FoodCategory;
  quantityKg: number;
  portions: number;
  availableFrom: string;
  collectBy: string;
  collectedAt?: string;
  status: SurplusStatus;
  handling: "Ambient" | "Chilled" | "Frozen";
  city: string;
  latitude: number;
  longitude: number;
  notes: string;
}

export interface MatchRecommendation {
  id: string;
  surplus: SurplusListing;
  donor: Donor;
  recipient: Recipient;
  score: number;
  distanceKm: number;
  reasons: string[];
}

export type MatchFactorKey =
  | "distance"
  | "capacity"
  | "category"
  | "refrigeration"
  | "openingHours"
  | "deadline";

export interface MatchScoreFactor {
  key: MatchFactorKey;
  label: string;
  score: number;
  maxScore: number;
  explanation: string;
  blocking: boolean;
}

export interface RecipientRanking {
  id: string;
  surplus: SurplusListing;
  donor: Donor;
  recipient: Recipient;
  score: number;
  eligible: boolean;
  distanceKm: number;
  factors: MatchScoreFactor[];
  blockers: string[];
}

export interface ListingMatchGroup {
  id: string;
  surplus: SurplusListing;
  donor: Donor;
  rankings: RecipientRanking[];
}
