import "server-only";

export interface MapAdapter {
  generaliseLocation(input: { city: string; country: string; latitude: number; longitude: number }): Promise<{ label: string; latitude: number; longitude: number }>;
}

export interface CalculatorAdapter {
  calculate(quantityKg: number): Promise<{ meals: number; financialValueEur: number; co2eKg: number; landfillDiversionKg: number }>;
}

export interface GovernanceAdapter {
  listGuidance(context: { organisationType: string }): Promise<Array<{ id: string; title: string; summary: string }>>;
}

export interface EngagementLibraryAdapter {
  searchResources(query: string): Promise<Array<{ id: string; title: string; type: string }>>;
}

export interface CommunityOfPracticeAdapter {
  getActivity(): Promise<{ upcomingEvents: string[]; knowledgeResources: string[]; collaborationRequests: string[]; activeInitiatives: string[] }>;
}

export interface CultivateAdapters {
  map: MapAdapter;
  calculator: CalculatorAdapter;
  governance: GovernanceAdapter;
  engagementLibrary: EngagementLibraryAdapter;
  communityOfPractice: CommunityOfPracticeAdapter;
}
