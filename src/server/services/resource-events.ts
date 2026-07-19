import "server-only";

import { requireAuthenticatedSupabase, ServiceError } from "@/server/services/auth";
import type { Database } from "@/types/database";

export type ResourceEventRow = Database["public"]["Tables"]["resource_events"]["Row"];
export type ResourceEventStatus = Database["public"]["Enums"]["resource_event_status"];

export async function listResourceEvents(status?: ResourceEventStatus) {
  const { supabase } = await requireAuthenticatedSupabase();
  let query = supabase.from("resource_events").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new ServiceError(`Resource events could not be loaded: ${error.message}`, 403);
  return data as ResourceEventRow[];
}

export async function getResourceEventRecord(id: string) {
  const { supabase } = await requireAuthenticatedSupabase();
  const { data, error } = await supabase.from("resource_events").select("*").eq("id", id).maybeSingle();
  if (error) throw new ServiceError(`Resource event could not be loaded: ${error.message}`, 403);
  if (!data) throw new ServiceError("Resource event not found.", 404);
  return data as ResourceEventRow;
}

export async function transitionResourceEvent(id: string, status: ResourceEventStatus, note?: string) {
  const { supabase } = await requireAuthenticatedSupabase();
  const { data, error } = await supabase.rpc("transition_resource_event", {
    target_resource_event_id: id,
    target_status: status,
    transition_note: note?.trim() || undefined,
  });
  if (error) throw new ServiceError(`Resource-event transition was rejected: ${error.message}`, 409);
  return { id: data };
}
