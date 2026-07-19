import { NextResponse } from "next/server";
import { serviceErrorResponse } from "@/server/http";
import { listAuditEvents } from "@/server/services/audit-events";

export async function GET(request: Request) {
  const resourceEventId = new URL(request.url).searchParams.get("resourceEventId");
  if (!resourceEventId) return NextResponse.json({ error: "resourceEventId is required." }, { status: 400 });
  try {
    return NextResponse.json({ data: await listAuditEvents(resourceEventId) });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
