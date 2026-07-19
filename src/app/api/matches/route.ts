import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getNetworkSnapshot } from "@/data";
import { MATCHING_METHOD_VERSION, scoreRecipient } from "@/features/matching/engine";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { persistAcceptedMatch } from "@/server/services/matches";

interface MatchRequest {
  listingId?: unknown;
  recipientId?: unknown;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  let body: MatchRequest;
  try {
    body = await request.json() as MatchRequest;
  } catch {
    return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId : "";
  const recipientId = typeof body.recipientId === "string" ? body.recipientId : "";
  if (!listingId || !recipientId) {
    return NextResponse.json({ error: "Listing and recipient identifiers are required." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Sign in as a donor coordinator to accept a match." }, { status: 401 });
  }

  const network = await getNetworkSnapshot();
  const listing = network.surplusListings.find((item) => item.id === listingId);
  const donor = network.donors.find((item) => item.id === listing?.donorId);
  const recipient = network.recipients.find((item) => item.id === recipientId);
  if (!listing || !donor || !recipient) {
    return NextResponse.json({ error: "The listing or recipient is no longer available." }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("organisation_id, role")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (!profile || (profile.organisation_id !== donor.id && profile.role !== "platform_admin") || profile.role === "viewer") {
    return NextResponse.json({ error: "Your account cannot accept matches for this donor." }, { status: 403 });
  }

  const ranking = scoreRecipient(listing, donor, recipient);
  if (!ranking.eligible) {
    return NextResponse.json({ error: "This recipient no longer satisfies all blocking requirements." }, { status: 409 });
  }

  const result = await persistAcceptedMatch({ supabase, ranking, userId: authData.user.id, methodVersion: MATCHING_METHOD_VERSION });

  if (result.error) {
    console.error(`[supabase] Could not accept match: ${result.error.message}`);
    return NextResponse.json({ error: "Supabase rejected the match decision. Check membership and RLS policies." }, { status: 403 });
  }

  revalidatePath("/");
  revalidatePath("/matches");
  return NextResponse.json({ id: result.data.id });
}
