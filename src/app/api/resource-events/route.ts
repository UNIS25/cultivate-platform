import { NextResponse } from "next/server";
import { serviceErrorResponse } from "@/server/http";
import { listResourceEvents, type ResourceEventStatus } from "@/server/services/resource-events";

const statuses = new Set<ResourceEventStatus>(["draft", "available", "matched", "accepted", "collected", "delivered", "cancelled", "expired"]);

export async function GET(request: Request) {
  const value = new URL(request.url).searchParams.get("status");
  const status = value && statuses.has(value as ResourceEventStatus) ? value as ResourceEventStatus : undefined;
  try {
    return NextResponse.json({ data: await listResourceEvents(status) });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
