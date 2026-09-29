/**
 * Environment configuration + validation (ARCHITECTURE §19). The app runs fully local-first WITHOUT
 * any backend credentials. Supabase values are OPTIONAL here: when both are present the cloud sync
 * layer can be enabled; when absent the app stays local-only and says so honestly. Only the
 * publishable/anon key is ever read on the client — the service_role key must never ship in the app
 * bundle (spine §19; AGENTS.md §8 "Never expose service-role").
 */
import Constants from 'expo-constants';

export interface AppEnv {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  /** True only when BOTH Supabase values are present and well-formed. */
  supabaseConfigured: boolean;
}

function nonEmpty(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readExtra(key: 'supabaseUrl' | 'supabaseAnonKey'): string | null {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  return nonEmpty(extra[key]);
}

export function loadEnv(): AppEnv {
  // EXPO_PUBLIC_* vars must be accessed statically so Metro can inline them at build time
  // (expo/no-dynamic-env-var). Only the publishable/anon key is ever read on the client.
  const supabaseUrl = nonEmpty(process.env.EXPO_PUBLIC_SUPABASE_URL) ?? readExtra('supabaseUrl');
  const supabaseAnonKey = nonEmpty(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) ?? readExtra('supabaseAnonKey');
  const supabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && /^https:\/\//.test(supabaseUrl);
  return { supabaseUrl, supabaseAnonKey, supabaseConfigured };
}

export const env: AppEnv = loadEnv();
