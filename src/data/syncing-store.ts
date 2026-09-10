/**
 * SyncingStore — a LOCAL-FIRST decorator over a local Store (ADR-004, ADR-012).
 *
 * Contract:
 *   - load()/save()/clear() operate on the LOCAL store only and NEVER block on the network. The
 *     on-device document is always the primary source of truth; the app is fully usable offline.
 *   - sync() is the explicit reconciliation entrypoint (call on app foreground / when a session
 *     appears). It: resolves auth.uid() → pulls the user's rows from the isolated `koturutin`
 *     schema → merges (union + last-write-wins) → persists the merge locally BEFORE pushing → pushes.
 *   - Any failure is non-destructive: with no session/unreachable backend it SKIPS (local untouched);
 *     a pull/push error leaves the (already-persisted) local document intact and flags pending, so a
 *     later sync retries. No data is ever lost on a sync failure.
 *   - Transient errors are retried with exponential backoff (injectable sleep for tests).
 *
 * Deletion note: clear() clears the LOCAL document only; it does not delete cloud rows. Full account
 * / cloud deletion is a separate, explicit server path (Edge Function) — see docs/PROJECT_STATUS.md.
 */
import { emptyAppData, type AppData } from '@/domain/model';
import type { Store } from './store';
import type { RemoteGateway, Row, SyncTable } from './supabase/gateway';
import {
  buildPushRows,
  countEntities,
  mergeAppData,
  snapshotFromRows,
  SYNC_TABLES,
  TABLE_INSERT_ONLY,
} from './supabase/sync-mapping';

export type SyncStatus = 'ok' | 'skipped' | 'error';

export interface SyncResult {
  status: SyncStatus;
  reason?: string;
  pushed?: number;
  pulled?: number;
}

export interface SyncingStoreOptions {
  retryAttempts?: number;
  retryBaseMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const msg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export class SyncingStore implements Store {
  private pending = false;
  private readonly attempts: number;
  private readonly baseMs: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(
    private readonly local: Store,
    private readonly gateway: RemoteGateway,
    opts: SyncingStoreOptions = {},
  ) {
    this.attempts = Math.max(1, opts.retryAttempts ?? 3);
    this.baseMs = opts.retryBaseMs ?? 500;
    this.sleep = opts.sleep ?? defaultSleep;
  }

  // ---- local-first Store surface (never touches the network) ----
  load(): Promise<AppData | null> {
    return this.local.load();
  }

  async save(data: AppData): Promise<void> {
    await this.local.save(data); // durable, primary
    this.pending = true; // remote is now behind; next sync() will push
  }

  clear(): Promise<void> {
    this.pending = true;
    return this.local.clear();
  }

  /** True when local changes have not yet been pushed (best-effort hint, in-memory). */
  hasPendingChanges(): boolean {
    return this.pending;
  }

  // ---- reconciliation ----
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastErr: unknown;
    for (let i = 0; i < this.attempts; i++) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        if (i < this.attempts - 1) await this.sleep(this.baseMs * 2 ** i);
      }
    }
    throw lastErr;
  }

  private async pull(): Promise<AppData> {
    const rows = {} as Record<SyncTable, Row[]>;
    for (const table of SYNC_TABLES) {
      rows[table] = await this.withRetry(() => this.gateway.fetchAll(table));
    }
    return snapshotFromRows(rows);
  }

  private async push(data: AppData, uid: string): Promise<number> {
    const rows = buildPushRows(data, uid);
    let pushed = 0;
    for (const table of SYNC_TABLES) {
      const batch = rows[table];
      if (batch.length === 0) continue;
      await this.withRetry(() => this.gateway.upsert(table, batch, { insertOnly: TABLE_INSERT_ONLY[table] }));
      pushed += batch.length;
    }
    return pushed;
  }

  async sync(): Promise<SyncResult> {
    const local = (await this.local.load()) ?? emptyAppData();

    let uid: string | null;
    try {
      uid = await this.gateway.currentUserId();
    } catch {
      return { status: 'skipped', reason: 'remote-unavailable' };
    }
    if (!uid) return { status: 'skipped', reason: 'no-session' };

    let remote: AppData;
    try {
      remote = await this.pull();
    } catch (e) {
      this.pending = true;
      return { status: 'error', reason: `pull-failed: ${msg(e)}` };
    }

    const merged = mergeAppData(local, remote);
    // Persist the merge locally FIRST so a push failure cannot lose pulled remote data.
    await this.local.save(merged);

    let pushed: number;
    try {
      pushed = await this.push(merged, uid);
    } catch (e) {
      this.pending = true;
      return { status: 'error', reason: `push-failed: ${msg(e)}`, pulled: countEntities(remote) };
    }

    this.pending = false;
    return { status: 'ok', pushed, pulled: countEntities(remote) };
  }
}
