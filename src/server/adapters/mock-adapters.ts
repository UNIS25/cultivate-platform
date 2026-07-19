import "server-only";

import { IMPACT_ASSUMPTIONS } from "@/config/impact-assumptions";
import type { CultivateAdapters } from "@/server/adapters/types";

export const mockCultivateAdapters: CultivateAdapters = {
  map: {
    async generaliseLocation(input) {
      return { label: `${input.city}, ${input.country}`, latitude: Number(input.latitude.toFixed(2)), longitude: Number(input.longitude.toFixed(2)) };
    },
  },
  calculator: {
    async calculate(quantityKg) {
      return {
        meals: Math.round(quantityKg * IMPACT_ASSUMPTIONS.mealsPerKilogram.value),
        financialValueEur: Number((quantityKg * IMPACT_ASSUMPTIONS.financialValuePerKilogramEur.value).toFixed(2)),
        co2eKg: Number((quantityKg * IMPACT_ASSUMPTIONS.co2eAvoidedPerKilogram.value).toFixed(1)),
        landfillDiversionKg: Number((quantityKg * IMPACT_ASSUMPTIONS.wasteAvoidanceRate.value).toFixed(1)),
      };
    },
  },
  governance: {
    async listGuidance() {
      return [{ id: "mock-governance-1", title: "Confirm chain-of-custody roles", summary: "Fictional adapter response for future integration." }];
    },
  },
  engagementLibrary: {
    async searchResources(query) {
      return [{ id: "mock-engagement-1", title: `${query || "Community"} facilitation canvas`, type: "Fictional template" }];
    },
  },
  communityOfPractice: {
    async getActivity() {
      return {
        upcomingEvents: ["Shared cold-chain clinic"],
        knowledgeResources: ["Neighbourhood logistics playbook"],
        collaborationRequests: ["Partners sought for multilingual volunteer induction"],
        activeInitiatives: ["Harbour Share Hub", "Brussels Common Plate"],
      };
    },
  },
};
