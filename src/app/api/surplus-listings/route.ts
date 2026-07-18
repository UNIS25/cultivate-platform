import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { IMPACT_ASSUMPTIONS } from "@/config/impact-assumptions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FoodCategory } from "@/types/domain";

const categories = new Set<FoodCategory>(["Bakery", "Produce", "Prepared meals", "Dairy", "Pantry", "Mixed"]);
const handlingValues = new Set(["Ambient", "Chilled", "Frozen"] as const);

interface ListingRequest {
  donorId?: unknown;
  title?: unknown;
  category?: unknown;
  quantityKg?: unknown;
  handling?: unknown;
  availableFrom?: unknown;
  collectBy?: unknown;
  notes?: unknown;
}

function invalid(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  let body: ListingRequest;
  try {
    body = await request.json() as ListingRequest;
  } catch {
    return invalid("The request body must be valid JSON.");
  }

  const donorId = typeof body.donorId === "string" ? body.donorId : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const category = typeof body.category === "string" ? body.category as FoodCategory : undefined;
  const quantityKg = typeof body.quantityKg === "number" ? body.quantityKg : Number(body.quantityKg);
  const handling = typeof body.handling === "string" ? body.handling as "Ambient" | "Chilled" | "Frozen" : undefined;
  const availableFrom = typeof body.availableFrom === "string" ? new Date(body.availableFrom) : undefined;
  const collectBy = typeof body.collectBy === "string" ? new Date(body.collectBy) : undefined;
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  if (!donorId) return invalid("Choose a donor organisation.");
  if (title.length < 3 || title.length > 160) return invalid("Food description must be between 3 and 160 characters.");
  if (!category || !categories.has(category)) return invalid("Choose a supported food category.");
  if (!Number.isFinite(quantityKg) || quantityKg <= 0 || quantityKg > 2000) return invalid("Quantity must be between 0 and 2,000 kg.");
  if (!handling || !handlingValues.has(handling)) return invalid("Choose a supported handling requirement.");
  if (!availableFrom || Number.isNaN(availableFrom.getTime()) || !collectBy || Number.isNaN(collectBy.getTime())) return invalid("Choose a valid collection window.");
  if (collectBy <= availableFrom) return invalid("The collection deadline must be after the start time.");
  if (notes.length > 2000) return invalid("Handling notes must be 2,000 characters or fewer.");

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Sign in as a donor coordinator to create a listing." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("organisation_id, role")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (!profile || profile.organisation_id !== donorId || !(["coordinator", "organisation_admin", "platform_admin"] as string[]).includes(profile.role)) {
    return NextResponse.json({ error: "Your account cannot create listings for this donor." }, { status: 403 });
  }

  const [locationResult, categoryResult] = await Promise.all([
    supabase.from("organisation_locations").select("id").eq("organisation_id", donorId).eq("is_primary", true).maybeSingle(),
    supabase.from("food_categories").select("id").eq("name", category).eq("active", true).maybeSingle(),
  ]);
  if (!locationResult.data || !categoryResult.data) {
    return NextResponse.json({ error: "The donor location or food category is not configured." }, { status: 422 });
  }

  const { data: listing, error } = await supabase
    .from("surplus_listings")
    .insert({
      donor_organisation_id: donorId,
      location_id: locationResult.data.id,
      food_category_id: categoryResult.data.id,
      title,
      quantity_kg: quantityKg,
      estimated_meals: Math.round(quantityKg * IMPACT_ASSUMPTIONS.mealsPerKilogram.value),
      available_from: availableFrom.toISOString(),
      collection_deadline: collectBy.toISOString(),
      status: "available",
      handling: handling.toLowerCase() as "ambient" | "chilled" | "frozen",
      notes,
      published_at: new Date().toISOString(),
      created_by: authData.user.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[supabase] Could not create surplus listing: ${error.message}`);
    return NextResponse.json({ error: "Supabase rejected the listing. Check organisation membership and RLS policies." }, { status: 403 });
  }

  revalidatePath("/");
  revalidatePath("/map");
  revalidatePath("/matches");
  revalidatePath("/impact");
  return NextResponse.json({ id: listing.id }, { status: 201 });
}
