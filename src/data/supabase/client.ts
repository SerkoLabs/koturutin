/**
 * Supabase client — created ONLY when the publishable/anon credentials are present in the
 * environment (spine §19). The MVP slice runs local-first and does NOT require this; when a
 * session exists the SyncingStore mirrors sync-eligible rows to Postgres under RLS.
 *
 * ISOLATED SCHEMA (ADR-012): koturutin lives in its own `koturutin` Postgres schema on a SHARED
 * Supabase project. All table access therefore goes through `.schema(KOTURUTIN_SCHEMA)` — never
 * the default `public` (which belongs to other apps). See src/data/supabase/gateway.ts.
 *
 * FOUNDER PREREQUISITES for the sync path to activate (until then sync() cleanly SKIPS and the app
 * stays fully local-first):
 *   1. An auth method enabled on the project (e.g. anonymous sign-in) so there is a session /
 *      auth.uid() for RLS (`auth.uid() = user_id`).
 *   2. `koturutin` added to the project's PostgREST "Exposed schemas" (Dashboard → Settings → API).
 *      This is the ONE minimal, additive config step; it is intentionally NOT done via SQL to avoid
 *      touching the shared PostgREST config the other apps depend on.
 *
 * The service_role key is NEVER read here — it must stay in trusted Edge Functions only
 * (AGENTS.md §8). Only the anon key ships in the client, protected by database RLS, not secrecy.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

/** The dedicated, isolated schema all koturutin data access is scoped to (ADR-012). */
export const KOTURUTIN_SCHEMA = 'koturutin';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!env.supabaseConfigured || !env.supabaseUrl || !env.supabaseAnonKey) {
    return null;
  }
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        // Persist the session on-device so RLS has a stable auth.uid() across restarts.
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

export const isCloudEnabled = env.supabaseConfigured;
