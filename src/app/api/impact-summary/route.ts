import { NextResponse } from "next/server";
import { serviceErrorResponse } from "@/server/http";
import { getImpactSummary } from "@/server/services/impact-summaries";
import type { FoodCategory } from "@/types/domain";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    const data = await getImpactSummary({
      from: params.get("from") || undefined,
      to: params.get("to") || undefined,
      city: params.get("city") || undefined,
      organisationType: params.get("organisationType") || undefined,
      category: (params.get("category") || undefined) as FoodCategory | undefined,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
