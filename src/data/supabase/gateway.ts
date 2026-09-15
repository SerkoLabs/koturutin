/**
 * RemoteGateway — the minimal remote surface the SyncingStore needs, kept behind an interface so the
 * sync logic is unit-testable against a fake and the app talks to Supabase in one place.
 *
 * ISOLATION (ADR-012): every call is scoped to the dedicated `koturutin` Postgres schema via
 * `.schema(KOTURUTIN_SCHEMA)` — never the shared `public` schema. RLS (`auth.uid() = user_id`) is
 * the authorization boundary; this client only ever holds the anon key + the user's session.
 *
 * free_note is NEVER written from the client (the column is revoked in migration 0002 and there is a
 * server-side consent trigger); the push mapper omits it. safety_events and experiment_library are
 * not part of the owner-writable sync set and are not touched here.
 */
import { getSupabase, KOTURUTIN_SCHEMA } from './client';

/** Owner-writable tables the client syncs. FK-safe order (parents before children). */
export type SyncTable =
  | 'users'
  | 'moments'
  | 'routine_edges'
  | 'experiments'
  | 'attempts'
  | 'outcomes'
  | 'observations'
  | 'who5';

export type Row = Record<string, unknown>;

export interface RemoteGateway {
  /** The authenticated user's id (auth.uid()), or null when there is no session. Never throws for a
   *  missing session — it resolves null so the SyncingStore can cleanly skip. */
  currentUserId(): Promise<string | null>;
  /** Upsert rows (snake_case, keyed by `id`) into a koturutin table. `insertOnly` maps to
   *  on-conflict-do-nothing for append-only tables whose UPDATE grant is column-restricted. */
  upsert(table: SyncTable, rows: Row[], opts?: { insertOnly?: boolean }): Promise<void>;
  /** Fetch every row the caller may read from a koturutin table (their own rows, under RLS). */
  fetchAll(table: SyncTable): Promise<Row[]>;
  /** End the current session so no further pull/push can act on the previous user's rows. Used by
   *  local account deletion so cloud data cannot be resurrected onto a freshly-wiped device. */
  signOut(): Promise<void>;
}

export class SupabaseRemoteGateway implements RemoteGateway {
  async currentUserId(): Promise<string | null> {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.auth.getUser();
    if (error || !data.user) return null; // "Auth session missing" is expected pre-login → skip.
    return data.user.id;
  }

  async upsert(table: SyncTable, rows: Row[], opts?: { insertOnly?: boolean }): Promise<void> {
    if (rows.length === 0) return;
    const sb = getSupabase();
    if (!sb) throw new Error('supabase-not-configured');
    const { error } = await sb
      .schema(KOTURUTIN_SCHEMA)
      .from(table)
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: opts?.insertOnly ?? false });
    if (error) throw new Error(`upsert ${table}: ${error.message}`);
  }

  async fetchAll(table: SyncTable): Promise<Row[]> {
    const sb = getSupabase();
    if (!sb) throw new Error('supabase-not-configured');
    const { data, error } = await sb.schema(KOTURUTIN_SCHEMA).from(table).select('*');
    if (error) throw new Error(`fetch ${table}: ${error.message}`);
    return (data ?? []) as Row[];
  }

  async signOut(): Promise<void> {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
  }
}
