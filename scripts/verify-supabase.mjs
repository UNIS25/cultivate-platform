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

const anonymousReadDeniedTables = ["matches", "users"];

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
  if (![401, 403].includes(response.status)) {
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

console.log("Supabase verification passed: seed counts, private-table denial, location privacy, and anonymous write denial.");
