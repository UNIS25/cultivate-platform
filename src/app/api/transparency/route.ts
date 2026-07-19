import { NextResponse } from "next/server";
import { serviceErrorResponse } from "@/server/http";
import { getTransparencyStatistics } from "@/server/services/transparency";

export async function GET(request: Request) {
  try {
    const asOfDate = new URL(request.url).searchParams.get("date") || undefined;
    return NextResponse.json({ data: await getTransparencyStatistics(asOfDate) });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
