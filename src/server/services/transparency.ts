import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ServiceError } from "@/server/services/auth";

export interface TransparencyCityActivity {
  city: string;
  country: string;
  kilograms: number;
  completedEvents: number;
}

export interface TransparencyRecentEvent {
  id: string;
  donorAlias: string;
  recipientAlias: string;
  city: string;
  country: string;
  category: string;
  quantityKg: number;
  deliveredAt: string;
}

export interface TransparencyStatistics {
  asOfDate: string;
  kilogramsRedistributedToday: number;
  estimatedMealsToday: number;
  completedPickupsToday: number;
  activeOrganisations: number;
  estimatedCo2eAvoidedToday: number;
  activityByCity: TransparencyCityActivity[];
  recentEvents: TransparencyRecentEvent[];
}

export async function getTransparencyStatistics(asOfDate?: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_transparency_statistics", { as_of_date: asOfDate });
  if (error) throw new ServiceError(`Transparency statistics could not be loaded: ${error.message}`, 503);
  return data as unknown as TransparencyStatistics;
}
