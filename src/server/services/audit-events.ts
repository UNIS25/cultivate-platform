import "server-only";

import { requireAuthenticatedSupabase, ServiceError } from "@/server/services/auth";
import type { Database } from "@/types/database";

export type AuditEventRow = Database["public"]["Tables"]["audit_events"]["Row"];

export async function listAuditEvents(resourceEventId: string) {
  const { supabase } = await requireAuthenticatedSupabase();
  const { data, error } = await supabase
    .from("audit_events")
    .select("*")
    .eq("resource_event_id", resourceEventId)
    .order("occurred_at")
    .order("id");
  if (error) throw new ServiceError(`Audit events could not be loaded: ${error.message}`, 403);
  return data as AuditEventRow[];
}
