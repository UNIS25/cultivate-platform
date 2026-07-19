import "server-only";

import { getNetworkSnapshot } from "@/data";
import { calculateImpactReport, type ImpactFilters } from "@/features/impact/calculations";

export async function getImpactSummary(filters: ImpactFilters = {}) {
  const network = await getNetworkSnapshot();
  return calculateImpactReport(network.resourceEvents, filters);
}
