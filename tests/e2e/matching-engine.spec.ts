import { expect, test } from "@playwright/test";
import { MATCHING_WEIGHTS, scoreRecipient } from "@/features/matching/engine";
import { blockedRecipient, chilledMealListing, compatibleRecipient, localDonor, produceListing, remoteDonor } from "../fixtures/domain";

test("matching engine uses six fixed factors totalling 100 points", () => {
  const ranking = scoreRecipient(produceListing, localDonor, compatibleRecipient);
  expect(MATCHING_WEIGHTS).toHaveLength(6);
  expect(MATCHING_WEIGHTS.reduce((sum, item) => sum + item.maxScore, 0)).toBe(100);
  expect(ranking.factors.reduce((sum, item) => sum + item.score, 0)).toBe(ranking.score);
  expect(ranking.factors.map((item) => item.key)).toEqual(["distance", "capacity", "category", "refrigeration", "openingHours", "deadline"]);
  expect(ranking.eligible).toBe(true);
});

test("cold-storage and category failures remain visible as blockers", () => {
  const ranking = scoreRecipient(chilledMealListing, remoteDonor, blockedRecipient);

  expect(ranking.eligible).toBe(false);
  expect(ranking.factors.find((item) => item.key === "category")?.blocking).toBe(true);
  expect(ranking.factors.find((item) => item.key === "refrigeration")?.blocking).toBe(true);
  expect(ranking.blockers.length).toBeGreaterThanOrEqual(2);
});
