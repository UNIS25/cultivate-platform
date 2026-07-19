import { NextResponse } from "next/server";
import { serviceErrorResponse } from "@/server/http";
import { getResourceEventRecord } from "@/server/services/resource-events";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ data: await getResourceEventRecord(id) });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
