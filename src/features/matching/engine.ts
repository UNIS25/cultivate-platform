import { distanceInKm } from "@/lib/geo";
import type {
  Donor,
  MatchFactorKey,
  MatchScoreFactor,
  Recipient,
  RecipientRanking,
  SurplusListing,
  Weekday,
} from "@/types/domain";

export const MATCHING_METHOD_VERSION = "rules-v1";

export const MATCHING_WEIGHTS: ReadonlyArray<{ key: MatchFactorKey; label: string; maxScore: number }> = [
  { key: "distance", label: "Distance", maxScore: 25 },
  { key: "capacity", label: "Recipient capacity", maxScore: 20 },
  { key: "category", label: "Food-category compatibility", maxScore: 20 },
  { key: "refrigeration", label: "Refrigeration requirement", maxScore: 15 },
  { key: "openingHours", label: "Opening hours", maxScore: 10 },
  { key: "deadline", label: "Collection deadline", maxScore: 10 },
] as const;

function factor(
  key: MatchFactorKey,
  label: string,
  score: number,
  maxScore: number,
  explanation: string,
  blocking = false,
): MatchScoreFactor {
  return { key, label, score: Math.max(0, Math.min(maxScore, Math.round(score))), maxScore, explanation, blocking };
}

function scoreDistance(distanceKm: number) {
  let score = 0;
  if (distanceKm <= 5) score = 25;
  else if (distanceKm <= 25) score = 25 - (distanceKm - 5) * 0.35;
  else if (distanceKm <= 100) score = 18 - (distanceKm - 25) * (10 / 75);
  else if (distanceKm <= 300) score = 8 - (distanceKm - 100) * 0.04;

  const displayDistance = distanceKm < 10 ? distanceKm.toFixed(1) : String(Math.round(distanceKm));
  const explanation = distanceKm <= 5
    ? `${displayDistance} km route is inside the local 5 km band.`
    : `${displayDistance} km route receives fewer points as travel distance increases.`;
  return factor("distance", "Distance", score, 25, explanation);
}

function scoreCapacity(surplus: SurplusListing, recipient: Recipient) {
  const ratio = surplus.quantityKg > 0 ? recipient.capacityKg / surplus.quantityKg : 0;
  const score = Math.min(1, ratio) * 20;
  const explanation = ratio >= 1
    ? `Can receive the full ${surplus.quantityKg} kg with ${recipient.capacityKg} kg capacity.`
    : `Can receive about ${Math.round(ratio * 100)}% of the offer (${recipient.capacityKg} of ${surplus.quantityKg} kg).`;
  return factor("capacity", "Recipient capacity", score, 20, explanation);
}

function scoreCategory(surplus: SurplusListing, recipient: Recipient) {
  if (recipient.acceptedCategories.includes(surplus.category)) {
    return factor("category", "Food-category compatibility", 20, 20, `${recipient.name} explicitly accepts ${surplus.category.toLowerCase()}.`);
  }
  if (surplus.category === "Mixed" && recipient.acceptedCategories.length >= 3) {
    return factor("category", "Food-category compatibility", 12, 20, `Mixed offer can be partly handled across ${recipient.acceptedCategories.length} accepted categories.`);
  }
  return factor("category", "Food-category compatibility", 0, 20, `${surplus.category} is not listed among the recipient's accepted categories.`, true);
}

function scoreRefrigeration(surplus: SurplusListing, recipient: Recipient) {
  if (surplus.handling === "Ambient") {
    return factor("refrigeration", "Refrigeration requirement", 15, 15, "Ambient handling does not require refrigerated storage.");
  }
  if (recipient.refrigeration) {
    return factor("refrigeration", "Refrigeration requirement", 15, 15, `${surplus.handling} handling is supported by recorded cold storage.`);
  }
  return factor("refrigeration", "Refrigeration requirement", 0, 15, `${surplus.handling} handling requires cold storage, which is not recorded.`, true);
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    weekday: values.weekday as Weekday,
    minutes: Number(values.hour) * 60 + Number(values.minute),
  };
}

function isOpenAt(recipient: Recipient, date: Date) {
  const local = localParts(date, recipient.timeZone);
  const opens = timeToMinutes(recipient.openingHours.opensAt);
  const closes = timeToMinutes(recipient.openingHours.closesAt);
  return recipient.openingHours.days.includes(local.weekday) && local.minutes >= opens && local.minutes <= closes;
}

function scoreOpeningHours(surplus: SurplusListing, recipient: Recipient) {
  const start = new Date(surplus.availableFrom);
  const deadline = new Date(surplus.collectBy);
  const deadlineIsOpen = isOpenAt(recipient, deadline);
  let overlaps = deadlineIsOpen;

  for (let time = start.getTime(); !overlaps && time <= deadline.getTime(); time += 30 * 60 * 1000) {
    overlaps = isOpenAt(recipient, new Date(time));
  }

  const schedule = `${recipient.openingHours.days.join(", ")} ${recipient.openingHours.opensAt}-${recipient.openingHours.closesAt}`;
  if (deadlineIsOpen) {
    return factor("openingHours", "Opening hours", 10, 10, `Collection deadline falls within opening hours (${schedule}, local time).`);
  }
  if (overlaps) {
    return factor("openingHours", "Opening hours", 7, 10, `Open during part of the collection window but closed at the deadline (${schedule}).`);
  }
  return factor("openingHours", "Opening hours", 0, 10, `No overlap with recorded opening hours (${schedule}, local time).`, true);
}

function scoreDeadline(surplus: SurplusListing, distanceKm: number) {
  const start = new Date(surplus.availableFrom).getTime();
  const deadline = new Date(surplus.collectBy).getTime();
  const windowHours = Math.max(0, (deadline - start) / (60 * 60 * 1000));
  const travelHours = Math.max(0.25, distanceKm / 45);
  const requiredHours = travelHours + 0.5;
  const slackHours = windowHours - requiredHours;
  let score = 0;
  if (slackHours >= 4) score = 10;
  else if (slackHours >= 2) score = 8;
  else if (slackHours >= 1) score = 6;
  else if (slackHours >= 0) score = 4;

  const explanation = score > 0
    ? `${windowHours.toFixed(1)} hour window leaves about ${slackHours.toFixed(1)} hours after estimated travel and loading.`
    : `${windowHours.toFixed(1)} hour window is shorter than the estimated ${requiredHours.toFixed(1)} hours needed for travel and loading.`;
  return factor("deadline", "Collection deadline", score, 10, explanation, score === 0);
}

export function scoreRecipient(
  surplus: SurplusListing,
  donor: Donor,
  recipient: Recipient,
): RecipientRanking {
  const distanceKm = distanceInKm(surplus, recipient);
  const factors = [
    scoreDistance(distanceKm),
    scoreCapacity(surplus, recipient),
    scoreCategory(surplus, recipient),
    scoreRefrigeration(surplus, recipient),
    scoreOpeningHours(surplus, recipient),
    scoreDeadline(surplus, distanceKm),
  ];
  const blockers = factors.filter((item) => item.blocking).map((item) => item.explanation);

  return {
    id: `match-${surplus.id}-${recipient.id}`,
    surplus,
    donor,
    recipient,
    score: factors.reduce((total, item) => total + item.score, 0),
    eligible: blockers.length === 0,
    distanceKm,
    factors,
    blockers,
  };
}

export function rankRecipients(
  surplus: SurplusListing,
  donor: Donor,
  recipients: Recipient[],
) {
  return recipients
    .map((recipient) => scoreRecipient(surplus, donor, recipient))
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score || a.distanceKm - b.distanceKm);
}
