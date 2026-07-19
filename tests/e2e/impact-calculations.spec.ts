import { expect, test } from "@playwright/test";
import { IMPACT_ASSUMPTIONS, IMPACT_ASSUMPTIONS_VERSION } from "@/config/impact-assumptions";
import { calculateImpactReport } from "@/features/impact/calculations";
import { deliveredResourceEvents } from "../fixtures/domain";

test("impact report derives all metrics from delivered resource events", () => {
  const report = calculateImpactReport(deliveredResourceEvents);

  expect(report.metrics).toEqual({
    redistributedKg: 55,
    estimatedMeals: 132,
    financialValueEur: 316.25,
    estimatedCo2eAvoidedKg: 118.3,
    landfillDiversionKg: 50.6,
    collectionsCompleted: 3,
    recipientOrganisationsSupported: 3,
    collectionSuccessRate: 100,
  });
  expect(report.assumptionsVersion).toBe(IMPACT_ASSUMPTIONS_VERSION);
  expect(report.deliveredEvents).toHaveLength(3);
  expect(report.deliveredEvents.every((item) => item.recipientName !== "Anonymised recipient organisation")).toBe(true);
  expect(report.supportedRecipients.reduce((total, item) => total + item.kilograms, 0)).toBe(55);
});

test("impact ignores collected events until delivery is confirmed", () => {
  const undelivered = { ...deliveredResourceEvents[0], status: "collected" as const, deliveredAt: undefined };
  const report = calculateImpactReport([undelivered]);
  expect(report.metrics.redistributedKg).toBe(0);
  expect(report.deliveredEvents).toHaveLength(0);
});

test("impact conversions are read from the single assumptions configuration", () => {
  expect(IMPACT_ASSUMPTIONS.mealsPerKilogram.value).toBe(2.4);
  expect(IMPACT_ASSUMPTIONS.financialValuePerKilogramEur.value).toBe(5.75);
  expect(IMPACT_ASSUMPTIONS.wasteAvoidanceRate.value).toBe(0.92);
  expect(IMPACT_ASSUMPTIONS.co2eAvoidedPerKilogram.value).toBe(2.15);
  expect(Object.keys(IMPACT_ASSUMPTIONS)).toHaveLength(4);
});
