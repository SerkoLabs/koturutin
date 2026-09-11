import { emptyAppData, type AppData } from '@/domain/model';
import type { Attempt, Moment, Outcome, UserProfile } from '@/domain/types';
import { MemoryStore } from './memory-store';
import { SyncingStore } from './syncing-store';
import { buildPushRows, SYNC_TABLES } from './supabase/sync-mapping';
import type { RemoteGateway, Row, SyncTable } from './supabase/gateway';

const UID = 'auth-uid-123';
const noSleep = async (): Promise<void> => {};

function emptyTables(): Record<SyncTable, Map<string, Row>> {
  const t = {} as Record<SyncTable, Map<string, Row>>;
  for (const table of SYNC_TABLES) t[table] = new Map();
  return t;
}

/** In-memory RemoteGateway with failure injection — stands in for the isolated koturutin schema. */
class FakeGateway implements RemoteGateway {
  uid: string | null = UID;
  tables = emptyTables();
  fetchCalls = 0;
  fetchFailsRemaining = 0;
  upsertFailsAlways = false;

  seed(table: SyncTable, rows: Row[]): void {
    for (const r of rows) this.tables[table].set(String(r.id), r);
  }

  async currentUserId(): Promise<string | null> {
    return this.uid;
  }

  async upsert(table: SyncTable, rows: Row[], opts?: { insertOnly?: boolean }): Promise<void> {
    if (this.upsertFailsAlways) throw new Error('network down');
    for (const r of rows) {
      const id = String(r.id);
      if (opts?.insertOnly && this.tables[table].has(id)) continue;
      this.tables[table].set(id, r);
    }
  }

  async fetchAll(table: SyncTable): Promise<Row[]> {
    this.fetchCalls += 1;
    if (this.fetchFailsRemaining > 0) {
      this.fetchFailsRemaining -= 1;
      throw new Error('transient fetch failure');
    }
    return [...this.tables[table].values()];
  }

  async signOut(): Promise<void> {
    this.uid = null; // ending the session makes currentUserId() resolve null
  }
}

function profile(): UserProfile {
  return {
    id: 'local-id',
    language: 'tr',
    timezone: 'Europe/Istanbul',
    notificationBudget: 2,
    quietWindows: [],
    smokingStance: null,
    intentValue: null,
    intentTargetBehavior: null,
    ageConfirmed18: true,
    consentHealthProcessing: true,
    consentPersonalization: false,
    consentResearch: false,
    consentFreeTextToModel: false,
    analyticsEnabled: false,
    consentUpdatedAt: null,
    retentionWindowDays: 180,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };
}

function moment(id: string): Moment {
  return {
    id,
    userId: 'local-id',
    name: 'Eve varış',
    decisionPoint: 'arriving_home',
    timeWindowStartMinute: 1080,
    timeWindowEndMinute: 1140,
    context: null,
    verificationStatus: 'confirmed',
    isPriority: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    deletedAt: null,
  };
}

function attempt(id: string): Attempt {
  return {
    id,
    userId: 'local-id',
    experimentId: 'x1',
    momentId: 'm1',
    offeredAt: '2026-09-02T00:00:00.000Z',
    response: 'did',
    respondedAt: '2026-09-02T00:00:00.000Z',
    reason: null,
    createdAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
    deletedAt: null,
  };
}

function outcome(id: string, freeNote: string | null): Outcome {
  return {
    id,
    userId: 'local-id',
    attemptId: 'a1',
    craving: 3,
    energy: 6,
    mood: 7,
    connectionFeeling: 8,
    freeNote,
    capturedAt: '2026-09-02T00:00:00.000Z',
    createdAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
    deletedAt: null,
  };
}

describe('SyncingStore — local-first surface', () => {
  it('load/save/clear operate on local storage only (no gateway calls)', async () => {
    const local = new MemoryStore();
    const gw = new FakeGateway();
    const store = new SyncingStore(local, gw, { sleep: noSleep });

    const data: AppData = { ...emptyAppData(), profile: profile(), moments: [moment('m1')] };
    await store.save(data);

    const back = await store.load();
    expect(back?.moments).toHaveLength(1);
    expect(store.hasPendingChanges()).toBe(true);
    expect(gw.fetchCalls).toBe(0); // save never touches the network
  });
});

describe('SyncingStore.sync — reconciliation', () => {
  it('SKIPS cleanly when there is no session (local untouched, nothing pushed)', async () => {
    const local = new MemoryStore({ ...emptyAppData(), profile: profile(), moments: [moment('m1')] });
    const gw = new FakeGateway();
    gw.uid = null;
    const store = new SyncingStore(local, gw, { sleep: noSleep });

    const r = await store.sync();
    expect(r.status).toBe('skipped');
    expect(r.reason).toBe('no-session');
    expect(gw.tables.moments.size).toBe(0); // nothing uploaded
    expect((await local.load())?.moments).toHaveLength(1); // local intact
  });

  it('pushes local rows and pulls remote-only rows, merging both', async () => {
    const local = new MemoryStore({ ...emptyAppData(), profile: profile(), moments: [moment('mLocal')] });
    const gw = new FakeGateway();
    // Seed the remote as if another device wrote a different moment for the same user.
    const remoteData: AppData = { ...emptyAppData(), moments: [moment('mRemote')] };
    const remoteRows = buildPushRows(remoteData, UID);
    for (const t of SYNC_TABLES) gw.seed(t, remoteRows[t]);

    const store = new SyncingStore(local, gw, { sleep: noSleep });
    const r = await store.sync();

    expect(r.status).toBe('ok');
    expect(r.pulled).toBeGreaterThan(0);
    // Local now has both moments (merged).
    const merged = await local.load();
    expect(merged?.moments.map((m) => m.id).sort()).toEqual(['mLocal', 'mRemote']);
    // Remote now has the local moment too (pushed, owner-stamped to uid).
    expect(gw.tables.moments.get('mLocal')?.user_id).toBe(UID);
  });

  it('NEVER uploads free_note; the local note is retained', async () => {
    const local = new MemoryStore({
      ...emptyAppData(),
      profile: profile(),
      attempts: [attempt('a1')],
      outcomes: [outcome('o1', 'sensitive on-device note')],
    });
    const gw = new FakeGateway();
    const store = new SyncingStore(local, gw, { sleep: noSleep });

    await store.sync();

    const uploaded = gw.tables.outcomes.get('o1');
    expect(uploaded).toBeDefined();
    expect(Object.keys(uploaded as Row)).not.toContain('free_note');
    expect((await local.load())?.outcomes[0].freeNote).toBe('sensitive on-device note');
  });

  it('retries transient failures with backoff, then succeeds', async () => {
    const local = new MemoryStore({ ...emptyAppData(), profile: profile() });
    const gw = new FakeGateway();
    gw.fetchFailsRemaining = 2; // fail the first two fetch attempts
    const store = new SyncingStore(local, gw, { sleep: noSleep, retryAttempts: 3 });

    const r = await store.sync();
    expect(r.status).toBe('ok');
    expect(gw.fetchCalls).toBeGreaterThanOrEqual(3); // 2 failures + 1 success on the first table
  });

  it('signOut prevents resurrection: after delete + signOut, sync skips and does not re-pull cloud rows (SEC P1-1)', async () => {
    const local = new MemoryStore({ ...emptyAppData(), profile: profile(), moments: [moment('m1')] });
    const gw = new FakeGateway();
    // The cloud still holds this user's rows.
    const remoteData: AppData = { ...emptyAppData(), moments: [moment('mRemote')] };
    const remoteRows = buildPushRows(remoteData, UID);
    for (const t of SYNC_TABLES) gw.seed(t, remoteRows[t]);
    const store = new SyncingStore(local, gw, { sleep: noSleep });

    // Simulate account deletion: end the session, then wipe local to a fresh empty document.
    await store.signOut();
    await local.save(emptyAppData());

    const r = await store.sync();
    expect(r.status).toBe('skipped');
    expect(r.reason).toBe('no-session');
    const after = await local.load();
    expect(after?.moments ?? []).toHaveLength(0); // cloud rows were NOT resurrected onto the device
  });

  it('is non-destructive on push failure (local data survives, marked pending)', async () => {
    const local = new MemoryStore({ ...emptyAppData(), profile: profile(), moments: [moment('m1')] });
    const gw = new FakeGateway();
    gw.upsertFailsAlways = true;
    const store = new SyncingStore(local, gw, { sleep: noSleep, retryAttempts: 2 });

    const r = await store.sync();
    expect(r.status).toBe('error');
    expect(r.reason).toContain('push-failed');
    expect((await local.load())?.moments).toHaveLength(1); // no data loss
    expect(store.hasPendingChanges()).toBe(true);
  });
});
