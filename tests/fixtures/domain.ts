import type { Donor, Recipient, SurplusListing } from "@/types/domain";

export const localDonor: Donor = {
  id: "donor-fixture-local",
  name: "Fixture Fresh Market",
  type: "Supermarket",
  city: "Dublin",
  country: "Ireland",
  latitude: 53.346,
  longitude: -6.267,
  contactName: "Test coordinator",
  reliabilityScore: 96,
  donationsThisMonth: 18,
};

export const remoteDonor: Donor = {
  ...localDonor,
  id: "donor-fixture-remote",
  name: "Fixture Catering",
  type: "Caterer",
  city: "Brussels",
  country: "Belgium",
  latitude: 50.855,
  longitude: 4.36,
};

export const compatibleRecipient: Recipient = {
  id: "recipient-fixture-compatible",
  name: "Fixture Family Kitchen",
  type: "Community kitchen",
  city: "Dublin",
  country: "Ireland",
  latitude: 53.358,
  longitude: -6.255,
  contactName: "Test recipient",
  acceptedCategories: ["Produce", "Bakery", "Prepared meals", "Pantry"],
  capacityKg: 180,
  refrigeration: true,
  householdsSupported: 84,
  timeZone: "Europe/Dublin",
  openingHours: {
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    opensAt: "08:00",
    closesAt: "20:00",
  },
};

export const blockedRecipient: Recipient = {
  ...compatibleRecipient,
  id: "recipient-fixture-blocked",
  name: "Fixture Mutual Support",
  type: "Mutual aid group",
  city: "Porto",
  country: "Portugal",
  latitude: 41.16,
  longitude: -8.61,
  acceptedCategories: ["Mixed", "Produce", "Pantry", "Bakery"],
  capacityKg: 150,
  refrigeration: false,
  timeZone: "Europe/Lisbon",
  openingHours: {
    days: ["Tue", "Wed", "Thu", "Fri", "Sat"],
    opensAt: "09:00",
    closesAt: "19:00",
  },
};

export const produceListing: SurplusListing = {
  id: "listing-fixture-produce",
  donorId: localDonor.id,
  title: "Seasonal vegetables",
  category: "Produce",
  quantityKg: 86,
  portions: 172,
  availableFrom: "2026-07-18T15:00:00Z",
  collectBy: "2026-07-18T19:00:00Z",
  status: "Available",
  handling: "Ambient",
  city: "Dublin",
  latitude: 53.346,
  longitude: -6.267,
  notes: "Fixture produce listing.",
};

export const chilledMealListing: SurplusListing = {
  ...produceListing,
  id: "listing-fixture-chilled",
  donorId: remoteDonor.id,
  title: "Conference lunch trays",
  category: "Prepared meals",
  quantityKg: 64,
  portions: 118,
  availableFrom: "2026-07-18T14:00:00Z",
  collectBy: "2026-07-18T18:00:00Z",
  handling: "Chilled",
  city: "Brussels",
  latitude: 50.855,
  longitude: 4.36,
};

export const completedListings: SurplusListing[] = [
  {
    ...produceListing,
    id: "listing-fixture-collected-1",
    recipientId: "impact-recipient-1",
    title: "Breakfast pastries",
    category: "Bakery",
    quantityKg: 18,
    status: "Collected",
    collectedAt: "2026-07-18T18:42:00Z",
  },
  {
    ...produceListing,
    id: "listing-fixture-collected-2",
    recipientId: "impact-recipient-2",
    title: "Cardamom buns",
    category: "Bakery",
    quantityKg: 21,
    status: "Collected",
    collectedAt: "2026-07-18T20:18:00Z",
  },
  {
    ...produceListing,
    id: "listing-fixture-collected-3",
    recipientId: "impact-recipient-3",
    title: "Fresh herb boxes",
    category: "Produce",
    quantityKg: 16,
    status: "Collected",
    collectedAt: "2026-07-18T17:24:00Z",
  },
];

export const impactRecipients: Recipient[] = completedListings.map((listing, index) => ({
  ...compatibleRecipient,
  id: listing.recipientId!,
  name: `Impact recipient ${index + 1}`,
  city: ["Cork", "Malmo", "Valencia"][index],
}));
