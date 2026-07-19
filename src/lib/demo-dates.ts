import type { SurplusStatus } from "@/types/domain";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function numericSuffix(stableId: string) {
  const match = stableId.match(/(\d+)$/);
  return match ? Number(match[1]) : [...stableId].reduce((total, character) => total + character.charCodeAt(0), 0);
}

/**
 * All fictional operational dates are anchored to UTC midnight for the current
 * day. A single server render therefore receives stable values and passes the
 * resulting ISO strings to client components without recalculating them.
 */
export function getDemoDateAnchor(now: Date = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export interface DemoListingSchedule {
  availableFrom: string;
  collectBy: string;
  collectedAt?: string;
  deliveredAt?: string;
}

export function getDemoListingSchedule(
  stableId: string,
  status: SurplusStatus,
  now: Date = new Date(),
): DemoListingSchedule {
  const anchor = getDemoDateAnchor(now).getTime();
  const index = Math.max(1, numericSuffix(stableId));

  if (status === "Collected") {
    const daysAgo = 1 + (index % 6);
    const completedAt = index === 4
      ? now.getTime() - 2 * HOUR_MS
      : anchor - daysAgo * DAY_MS + (10 + (index % 8)) * HOUR_MS;
    return {
      availableFrom: new Date(completedAt - 6 * HOUR_MS).toISOString(),
      collectBy: new Date(completedAt - HOUR_MS).toISOString(),
      collectedAt: new Date(completedAt).toISOString(),
      deliveredAt: new Date(completedAt + HOUR_MS).toISOString(),
    };
  }

  // At every point in the UTC day, deadlines remain in the future and within
  // 72 hours: the fixed offsets range from +30h to +69h from midnight.
  const deadlineHours = 30 + ((index * 11) % 40);
  const deadline = anchor + deadlineHours * HOUR_MS;
  const windowHours = 4 + (index % 4) * 2;
  return {
    availableFrom: new Date(deadline - windowHours * HOUR_MS).toISOString(),
    collectBy: new Date(deadline).toISOString(),
  };
}

export function getDefaultDemoCollectionWindow(now: Date = new Date()) {
  const schedule = getDemoListingSchedule("surplus-001", "Available", now);
  return {
    availableFrom: toDateTimeLocal(schedule.availableFrom),
    collectBy: toDateTimeLocal(schedule.collectBy),
  };
}

export function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Dublin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function isActiveDemoSchedule(schedule: DemoListingSchedule, now: Date = new Date()) {
  const deadline = new Date(schedule.collectBy).getTime();
  const remaining = deadline - now.getTime();
  return remaining > 0 && remaining <= 72 * HOUR_MS;
}
