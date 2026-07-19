import "server-only";

import { NextResponse } from "next/server";
import { ServiceError } from "@/server/services/auth";

export function serviceErrorResponse(error: unknown) {
  if (error instanceof ServiceError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(error);
  return NextResponse.json({ error: "The service could not complete this request." }, { status: 500 });
}
