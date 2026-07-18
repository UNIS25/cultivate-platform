import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const schema = readFileSync("supabase/migrations/202607180001_initial_schema.sql", "utf8");
const security = readFileSync("supabase/migrations/202607180002_row_level_security.sql", "utf8");
const seed = readFileSync("supabase/seed.sql", "utf8");

const requiredTables = [
  "organisations",
  "organisation_locations",
  "surplus_listings",
  "food_categories",
  "matches",
  "collections",
  "impact_records",
  "governance_resources",
  "engagement_resources",
  "users",
];

test("Supabase migration creates every required table with RLS", () => {
  for (const table of requiredTables) {
    expect(schema).toContain(`create table public.${table}`);
    expect(security).toContain(`alter table public.${table} enable row level security`);
  }
});

test("seed contains the fictional network and database-backed resources", () => {
  expect(seed).toContain("create temporary table seed_initiatives");
  expect(seed).toContain("create temporary table seed_donors");
  expect(seed).toContain("create temporary table seed_recipients");
  expect(seed).toContain("create temporary table seed_surplus");
  expect(seed).toContain("insert into public.governance_resources");
  expect(seed).toContain("insert into public.engagement_resources");

  const datasets = ["initiatives", "donors", "recipients", "surplus"] as const;
  const expectedCounts = [20, 10, 10, 20];
  datasets.forEach((name, index) => {
    const match = seed.match(new RegExp(`\\$${name}\\$([\\s\\S]*?)\\$${name}\\$`));
    expect(match, `${name} seed block`).not.toBeNull();
    expect(JSON.parse(match![1])).toHaveLength(expectedCounts[index]);
  });
});

test("runtime data no longer contains local JSON datasets", () => {
  for (const name of ["initiatives", "donors", "recipients", "surplus"]) {
    expect(existsSync(`src/data/${name}.json`)).toBe(false);
  }
});
