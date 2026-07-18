"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createSupabaseBrowserClient() {
  if (client) return client;
  const { url, publishableKey } = getSupabasePublicConfig();
  client = createBrowserClient<Database>(url, publishableKey);
  return client;
}
