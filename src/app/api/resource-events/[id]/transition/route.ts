import { NextResponse } from "next/server";
import { serviceErrorResponse } from "@/server/http";
import { transitionResourceEvent, type ResourceEventStatus } from "@/server/services/resource-events";

const statuses = new Set<ResourceEventStatus>(["available", "matched", "accepted", "collected", "delivered", "cancelled", "expired"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json() as { status?: unknown; note?: unknown };
    if (typeof body.status !== "string" || !statuses.has(body.status as ResourceEventStatus)) {
      return NextResponse.json({ error: "Choose a valid resource-event status." }, { status: 400 });
    }
    const { id } = await params;
    const result = await transitionResourceEvent(id, body.status as ResourceEventStatus, typeof body.note === "string" ? body.note : undefined);
    return NextResponse.json({ data: result });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
