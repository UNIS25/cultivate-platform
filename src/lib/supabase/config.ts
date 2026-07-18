export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
    this.name = "SupabaseConfigurationError";
  }
}

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !publishableKey) throw new SupabaseConfigurationError();
  return { url, publishableKey };
}

export function isSupabaseConfigured() {
  try {
    getSupabasePublicConfig();
    return true;
  } catch {
    return false;
  }
}
