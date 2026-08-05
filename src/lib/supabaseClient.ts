import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * Lazily creates (and caches) the Supabase client. Deliberately NOT created
 * at module load time — throwing at import time would crash the whole
 * module graph before any caller's try/catch has a chance to run (a real
 * failure mode caught while testing the Day 5 server action: a missing
 * .env.local turned into an unhandled crash instead of a clean error
 * message). Throwing only when actually called means a misconfigured
 * deploy fails gracefully with a clear message instead of a hard crash.
 */
export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env vars. Copy .env.local.example to .env.local and fill in your project URL + anon key from the Supabase dashboard (Project Settings > API)."
    );
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey);
  return cachedClient;
}
