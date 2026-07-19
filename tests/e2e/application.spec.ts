import { expect, test } from "@playwright/test";

const hasSupabaseData = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL
  && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
);
const hasAuthenticatedSupabaseSession = process.env.SUPABASE_E2E_AUTH === "1";

const routes = [
  ["/", "Good morning, Demo coordinator"],
  ["/map", "Explore the sharing network"],
  ["/report", "Report surplus food"],
  ["/matches", "Matching recommendations"],
  ["/recommendations", "Strengthen how the network works"],
  ["/impact", "Impact dashboard"],
  ["/transparency", "Food-sharing activity at a glance"],
  ["/data-governance", "Data governance and access levels"],
] as const;

test.describe("primary routes", () => {
  for (const [path, heading] of routes) {
    test(`${path} renders without horizontal overflow`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    });
  }
});

test("map initializes with visible demonstration markers", async ({ page }, testInfo) => {
  test.skip(!hasSupabaseData, "Requires a migrated and seeded Supabase project.");
  await page.goto("/map");
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.locator(".leaflet-marker-initiative")).not.toHaveCount(0);
  await expect(page.locator(".leaflet-marker-donor")).not.toHaveCount(0);
  await expect(page.locator(".leaflet-marker-recipient")).not.toHaveCount(0);
  await expect(page.locator(".leaflet-marker-surplus")).not.toHaveCount(0);
  if (testInfo.project.name === "desktop") await page.screenshot({ path: "/tmp/cultivate-map-desktop.png", fullPage: true });
});

test("map filters active listings by layer, status, category, and donor type", async ({ page }, testInfo) => {
  test.skip(!hasSupabaseData, "Requires a migrated and seeded Supabase project.");
  await page.goto("/map");
  await page.getByRole("button", { name: "Initiatives", exact: true }).click();
  await page.getByRole("button", { name: "Donors", exact: true }).click();
  await page.getByRole("button", { name: "Recipients", exact: true }).click();
  if (testInfo.project.name === "mobile") await page.getByRole("button", { name: "Show list" }).click();
  await expect(page.getByText("17 visible locations", { exact: true })).toBeVisible();

  await page.getByLabel("Filter by listing status").selectOption("Reserved");
  await expect(page.getByText("5 visible locations", { exact: true })).toBeVisible();
  await page.getByLabel("Filter by food category").selectOption("Pantry");
  await expect(page.getByText("1 visible locations", { exact: true })).toBeVisible();
  await page.getByLabel("Filter by organisation type").selectOption("Wholesaler");
  await expect(page.getByText("1 visible locations", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.getByText("57 visible locations", { exact: true })).toBeVisible();
});

test("matching recommendations expose all six score factors and blockers", async ({ page }, testInfo) => {
  test.skip(!hasSupabaseData, "Requires a migrated and seeded Supabase project.");
  await page.goto("/matches");
  await expect(page.getByText("Transparent rules, not an AI model", { exact: true })).toBeVisible();
  const breakdown = page.locator('[aria-label^="Score breakdown for"]');
  await expect(breakdown).toBeVisible();
  for (const label of ["Distance", "Recipient capacity", "Food-category compatibility", "Refrigeration requirement", "Opening hours", "Collection deadline"]) {
    await expect(breakdown.getByText(label, { exact: true })).toBeVisible();
  }

  const blockedRankings = page.locator('[data-eligible="false"]');
  expect(await blockedRankings.count()).toBeGreaterThan(0);
  await blockedRankings.first().click();
  await expect(page.getByText("Not currently eligible", { exact: true })).toBeVisible();
  await expect(page.getByText(/blocking requirement/)).toBeVisible();
  if (testInfo.project.name === "desktop") await page.screenshot({ path: "/tmp/cultivate-matching-desktop.png", fullPage: true });
});

test("surplus report persists through Supabase", async ({ page }) => {
  test.skip(!hasSupabaseData || !hasAuthenticatedSupabaseSession, "Requires an authenticated donor coordinator session.");
  await page.goto("/report");
  await page.getByPlaceholder("e.g. Mixed seasonal vegetables").fill("Demo orchard fruit");
  await page.getByPlaceholder("0").fill("48");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create demo listing" }).click();
  await expect(page.getByRole("heading", { name: "Your surplus is ready for matching" })).toBeVisible();
});

test("impact dashboard exposes direct metrics and demonstration assumptions", async ({ page }, testInfo) => {
  test.skip(!hasSupabaseData, "Requires a migrated and seeded Supabase project.");
  await page.goto("/impact");

  const summary = page.getByRole("region", { name: "Impact summary" });
  for (const label of [
    "Food redistributed",
    "Estimated meals",
    "Estimated financial value",
    "Estimated CO2e avoided",
    "Landfill diversion",
    "Collections completed",
    "Recipient organisations supported",
    "Collection success rate",
  ]) {
    await expect(summary.getByRole("heading", { name: label, exact: true })).toBeVisible();
  }

  await expect(page.getByRole("heading", { name: "Demonstration methodology", exact: true })).toBeVisible();
  await expect(page.getByText("2.4 meals per kg", { exact: true })).toBeVisible();
  await expect(page.getByText("€5.75 per kg", { exact: true })).toBeVisible();
  await expect(page.getByText("92% of delivered kg", { exact: true })).toBeVisible();
  await expect(page.getByText("src/config/impact-assumptions.ts", { exact: true })).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await download).suggestedFilename()).toBe("cultivate-next-demo-impact.csv");

  if (testInfo.project.name === "desktop") {
    await page.screenshot({ path: "/tmp/cultivate-impact-desktop.png", fullPage: true });
  } else {
    await page.screenshot({ path: "/tmp/cultivate-impact-mobile.png", fullPage: true });
  }
});

test("completed deliveries expose workflow timeline and chain of custody", async ({ page }) => {
  test.skip(!hasSupabaseData, "Requires a migrated and seeded Supabase project.");
  await page.goto("/impact");
  const links = page.locator('section[aria-labelledby="deliveries-title"] a[href^="/listings/"]');
  expect(await links.count()).toBeGreaterThan(0);
  await links.first().click();
  await expect(page.getByRole("heading", { name: "Resource-event workflow" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chain of custody" })).toBeVisible();
  for (const stage of ["Offer created", "Match proposed", "Recipient accepted", "Collected", "Delivered", "Impact recorded"]) {
    await expect(page.getByText(stage, { exact: true })).toBeVisible();
  }
});

test("demonstration role switcher exposes all five dashboard views", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Demonstration role switcher" })).toBeVisible();
  for (const [role, expected] of [
    ["Food donor", "Active donor offers"],
    ["Recipient organisation", "Nearby food and delivery history"],
    ["Municipality", "Surplus hotspots"],
    ["Researcher", "Dataset methodology"],
    ["Platform administrator", "Pending organisation verification"],
  ] as const) {
    await page.getByRole("button", { name: role, exact: true }).click();
    await expect(page.getByRole("heading", { name: expected, exact: true })).toBeVisible();
  }
});

test("public transparency remains aggregate and anonymised", async ({ page }) => {
  await page.goto("/transparency");
  await expect(page.getByRole("region", { name: "Public transparency summary" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent completed events" })).toBeVisible();
  await expect(page.getByText("No contact details", { exact: false })).toBeVisible();
});

test("shell notifications expose linked demo alerts", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText("Demo notifications", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Four high-confidence matches are ready Review recipient capacity and collection windows." })).toHaveAttribute("href", "/matches");
});

test("keyboard command search opens a workspace", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Search workspace" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "Search workspace" }).fill("Impact");
  if (testInfo.project.name === "desktop") await page.screenshot({ path: "/tmp/cultivate-command-desktop.png" });
  await dialog.getByRole("link", { name: "Impact" }).click();
  await expect(page).toHaveURL("/impact");
});

test("community practice exchange expands in place", async ({ page }) => {
  await page.goto("/recommendations");
  await page.getByRole("button", { name: "Citizen engagement" }).click();
  await page.getByRole("button", { name: "Open practice exchange" }).click();
  await expect(page.getByText("Shared logistics clinic", { exact: true })).toBeVisible();
});

test("responsive shell screenshots", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Good morning, Demo coordinator" })).toBeVisible();
  if (testInfo.project.name === "desktop") {
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await page.screenshot({ path: "/tmp/cultivate-dashboard-desktop.png", fullPage: true });
  } else {
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    await page.screenshot({ path: "/tmp/cultivate-dashboard-mobile.png", fullPage: true });
  }
});
