const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !publishableKey) {
  throw new Error("Set the Supabase URL and publishable key in .env.local before running db:verify.");
}

const headers = {
  apikey: publishableKey,
  Prefer: "count=exact",
  Range: "0-0",
};

const expectedPublicCounts = {
  organisations: 40,
  organisation_locations: 40,
  surplus_listings: 20,
  food_categories: 6,
  collections: 3,
  impact_records: 3,
  governance_resources: 4,
  engagement_resources: 4,
};

const anonymousReadDeniedTables = ["matches", "users", "resource_events", "delivery_confirmations", "audit_events"];

async function request(path, init = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, ...init.headers },
  });

  return response;
}

for (const [table, expectedCount] of Object.entries(expectedPublicCounts)) {
  const response = await request(`${table}?select=id`);
  if (!response.ok) {
    throw new Error(`${table} returned ${response.status}: ${await response.text()}`);
  }

  const contentRange = response.headers.get("content-range");
  const count = Number(contentRange?.match(/\/(\d+)$/)?.[1]);
  if (count !== expectedCount) {
    throw new Error(`${table} exposed ${count} rows to anon; expected ${expectedCount}.`);
  }
}

for (const table of anonymousReadDeniedTables) {
  const response = await request(`${table}?select=id`);
  if (![401, 403, 404].includes(response.status)) {
    throw new Error(`${table} returned ${response.status}; anonymous reads should be denied.`);
  }
}

const locationsResponse = await request(
  "organisation_locations?select=visibility,address_line_1,postal_code",
  { headers: { Range: "0-39" } },
);
if (!locationsResponse.ok) {
  throw new Error(`Location privacy check returned ${locationsResponse.status}.`);
}

const locations = await locationsResponse.json();
const exposesPreciseLocation = locations.some((location) => (
  location.visibility !== "generalised"
  || location.address_line_1 !== null
  || location.postal_code !== null
));
if (locations.length !== 40 || exposesPreciseLocation) {
  throw new Error("Anonymous location discovery exposed a precise or incomplete location record.");
}

const anonymousWrite = await request("organisations", {
  method: "POST",
  headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
  body: JSON.stringify({
    name: "RLS verification record",
    slug: "rls-verification-record",
    kind: "initiative",
    organisation_type: "Food hub",
  }),
});
if (anonymousWrite.ok) {
  throw new Error("Anonymous organisation insert unexpectedly bypassed RLS.");
}

const listingsResponse = await request(
  "surplus_listings?select=status,collection_deadline,collected_at&order=collection_deadline.asc",
  { headers: { Range: "0-19" } },
);
if (!listingsResponse.ok) {
  throw new Error(`Listing date check returned ${listingsResponse.status}.`);
}
const listings = await listingsResponse.json();
const now = Date.now();
for (const listing of listings) {
  if (["available", "reserved"].includes(listing.status)) {
    const remaining = new Date(listing.collection_deadline).getTime() - now;
    if (remaining <= 0 || remaining > 72 * 60 * 60 * 1000) {
      throw new Error(`Active ${listing.status} listing has an invalid demonstration deadline.`);
    }
  }
  if (listing.status === "collected") {
    const elapsed = now - new Date(listing.collected_at).getTime();
    if (elapsed < 0 || elapsed > 7 * 24 * 60 * 60 * 1000) {
      throw new Error("Completed collection falls outside the previous seven days.");
    }
  }
}

const transparencyResponse = await request("rpc/get_transparency_statistics", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({}),
});
if (!transparencyResponse.ok) {
  throw new Error(`Transparency RPC returned ${transparencyResponse.status}.`);
}
const transparency = await transparencyResponse.json();
if (!Array.isArray(transparency.activityByCity) || !Array.isArray(transparency.recentEvents)) {
  throw new Error("Transparency RPC did not return aggregate city and anonymised event collections.");
}
if (transparency.recentEvents.some((event) => !event.donorAlias || !event.recipientAlias || event.donorName || event.recipientName)) {
  throw new Error("Transparency RPC exposed an identity or omitted an anonymous label.");
}

console.log("Supabase verification passed: dates, aggregate transparency, seed counts, private-table denial, location privacy, and anonymous write denial.");
