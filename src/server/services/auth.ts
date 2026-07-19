import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export class ServiceError extends Error {
  constructor(message: string, public readonly status = 500) {
    super(message);
  }
}

export async function requireAuthenticatedSupabase() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ServiceError("Authentication is required.", 401);
  return { supabase, user: data.user };
}
