import { rankRecipients } from "@/features/matching/engine";
import type { NetworkSnapshot } from "@/data/repository";
import type { ListingMatchGroup, MatchRecommendation } from "@/types/domain";

export function getListingMatchGroups(data: NetworkSnapshot): ListingMatchGroup[] {
  return data.surplusListings
    .filter((listing) => listing.status !== "Collected")
    .flatMap((surplus) => {
      const donor = data.donors.find((item) => item.id === surplus.donorId);
      if (!donor) return [];
      return [{ id: `group-${surplus.id}`, surplus, donor, rankings: rankRecipients(surplus, donor, data.recipients) }];
    })
    .sort((a, b) => new Date(a.surplus.collectBy).getTime() - new Date(b.surplus.collectBy).getTime());
}

export function getMatchRecommendations(data: NetworkSnapshot): MatchRecommendation[] {
  return getListingMatchGroups(data)
    .flatMap((group) => {
      const best = group.rankings.find((ranking) => ranking.eligible);
      if (!best) return [];
      return [{
        id: best.id,
        surplus: group.surplus,
        donor: group.donor,
        recipient: best.recipient,
        score: best.score,
        distanceKm: best.distanceKm,
        reasons: best.factors.filter((item) => item.score > 0).map((item) => item.explanation),
      }];
    })
    .sort((a, b) => b.score - a.score);
}

export function getInitiative(data: NetworkSnapshot, slug: string) {
  return data.initiatives.find((initiative) => initiative.slug === slug);
}

export function getDemoMetrics(data: NetworkSnapshot) {
  return {
    availableKg: data.surplusListings
      .filter((listing) => listing.status === "Available")
      .reduce((total, listing) => total + listing.quantityKg, 0),
    coordinatedKg: data.surplusListings.reduce((total, listing) => total + listing.quantityKg, 0),
    portions: data.surplusListings.reduce((total, listing) => total + listing.portions, 0),
    households: data.recipients.reduce((total, recipient) => total + recipient.householdsSupported, 0),
  };
}
