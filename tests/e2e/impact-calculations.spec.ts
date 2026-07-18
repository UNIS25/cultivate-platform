import { expect, test } from "@playwright/test";
import { IMPACT_ASSUMPTIONS, IMPACT_ASSUMPTIONS_VERSION } from "@/config/impact-assumptions";
import { calculateImpactReport } from "@/features/impact/calculations";
import { completedListings, impactRecipients } from "../fixtures/domain";

test("impact report derives all metrics from completed collections", () => {
  const report = calculateImpactReport(completedListings, impactRecipients);

  expect(report.metrics).toEqual({
    redistributedKg: 55,
    estimatedMeals: 132,
    financialValueEur: 316.25,
    collectionsCompleted: 3,
    recipientOrganisationsSupported: 3,
    estimatedWasteAvoidedKg: 50.6,
  });
  expect(report.assumptionsVersion).toBe(IMPACT_ASSUMPTIONS_VERSION);
  expect(report.completedCollections).toHaveLength(3);
  expect(report.completedCollections.every((item) => item.recipientName !== "Unassigned recipient")).toBe(true);
  expect(report.supportedRecipients.reduce((total, item) => total + item.kilograms, 0)).toBe(55);
});

test("impact conversions are read from the single assumptions configuration", () => {
  expect(IMPACT_ASSUMPTIONS.mealsPerKilogram.value).toBe(2.4);
  expect(IMPACT_ASSUMPTIONS.financialValuePerKilogramEur.value).toBe(5.75);
  expect(IMPACT_ASSUMPTIONS.wasteAvoidanceRate.value).toBe(0.92);
  expect(IMPACT_ASSUMPTIONS.co2eAvoidedPerKilogram.value).toBe(2.15);
  expect(Object.keys(IMPACT_ASSUMPTIONS)).toHaveLength(4);
});
