import { expect, test } from "@playwright/test";
import { getDemoListingSchedule, isActiveDemoSchedule } from "@/lib/demo-dates";

test("all active fictional listings have deterministic deadlines in the next 72 hours", () => {
  const now = new Date("2031-03-12T23:45:00Z");

  for (let index = 1; index <= 20; index += 1) {
    if ([4, 12, 18].includes(index)) continue;
    const id = `surplus-${String(index).padStart(3, "0")}`;
    const first = getDemoListingSchedule(id, index % 4 === 2 ? "Reserved" : "Available", now);
    const second = getDemoListingSchedule(id, index % 4 === 2 ? "Reserved" : "Available", now);
    expect(second).toEqual(first);
    expect(isActiveDemoSchedule(first, now), `${id} should not be expired`).toBe(true);
  }
});

test("completed fictional collections remain within the previous seven days", () => {
  const now = new Date("2031-03-12T23:45:00Z");

  for (const index of [4, 12, 18]) {
    const schedule = getDemoListingSchedule(`surplus-${String(index).padStart(3, "0")}`, "Collected", now);
    const collectedAt = new Date(schedule.collectedAt!).getTime();
    expect(collectedAt).toBeLessThan(now.getTime());
    expect(collectedAt).toBeGreaterThanOrEqual(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
});
