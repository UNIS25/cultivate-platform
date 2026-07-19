import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json, Database } from "@/types/database";
import type { RecipientRanking } from "@/types/domain";

export async function persistAcceptedMatch({
  supabase,
  ranking,
  userId,
  methodVersion,
}: {
  supabase: SupabaseClient<Database>;
  ranking: RecipientRanking;
  userId: string;
  methodVersion: string;
}) {
  const { data: existing, error: existingError } = await supabase
    .from("matches")
    .select("id")
    .eq("listing_id", ranking.surplus.id)
    .eq("recipient_organisation_id", ranking.recipient.id)
    .maybeSingle();
  if (existingError) return { data: null, error: existingError };

  return existing
    ? supabase.from("matches").update({ status: "accepted", responded_at: new Date().toISOString() }).eq("id", existing.id).select("id").single()
    : supabase.from("matches").insert({
        listing_id: ranking.surplus.id,
        recipient_organisation_id: ranking.recipient.id,
        status: "accepted",
        score: ranking.score,
        eligible: true,
        distance_km: Number(ranking.distanceKm.toFixed(2)),
        scoring_method: methodVersion,
        score_breakdown: ranking.factors as unknown as Json,
        blockers: ranking.blockers as unknown as Json,
        responded_at: new Date().toISOString(),
        created_by: userId,
      }).select("id").single();
}
