/**
 * Supabase client — created ONLY when the publishable/anon credentials are present in the
 * environment (spine §19). The MVP slice runs local-first and does NOT require this; when the
 * founder provisions a Supabase project and sets EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY, the client
 * becomes available and a SyncingStore can mirror sync-eligible rows under RLS.
 *
 * The service_role key is NEVER read here — it must stay in trusted Edge Functions only
 * (AGENTS.md §8). Only the anon key ships in the client, protected by database RLS, not secrecy.
 *
 * Auth against a live project + the e2e RLS assertions (IMPLEMENTATION_PLAN TASK-210) remain
 * BLOCKED on founder-provided credentials — see docs/PROJECT_STATUS.md.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!env.supabaseConfigured || !env.supabaseUrl || !env.supabaseAnonKey) {
    return null;
  }
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  }
  return client;
}

export const isCloudEnabled = env.supabaseConfigured;
