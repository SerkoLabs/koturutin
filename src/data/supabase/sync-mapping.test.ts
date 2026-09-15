import { APP_DATA_VERSION, emptyAppData, type AppData } from '@/domain/model';
import type { Moment, Outcome, UserProfile } from '@/domain/types';
import {
  buildPushRows,
  mergeAppData,
  outcomeToRow,
  rowToMoment,
  snapshotFromRows,
} from './sync-mapping';
import type { Row, SyncTable } from './gateway';

const UID = 'auth-uid-remote';

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'local-random-id',
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
    ...overrides,
  };
}

function moment(id: string, updatedAt: string, overrides: Partial<Moment> = {}): Moment {
  return {
    id,
    userId: 'local-random-id',
    name: 'Eve varış',
    decisionPoint: 'arriving_home',
    timeWindowStartMinute: 1080,
    timeWindowEndMinute: 1140,
    context: 'İşten dönüş',
    verificationStatus: 'confirmed',
    isPriority: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt,
    deletedAt: null,
    ...overrides,
  };
}

function outcome(id: string, updatedAt: string, freeNote: string | null): Outcome {
  return {
    id,
    userId: 'local-random-id',
    attemptId: 'att-' + id,
    craving: 3,
    energy: 6,
    mood: 7,
    connectionFeeling: 8,
    freeNote,
    capturedAt: updatedAt,
    createdAt: updatedAt,
    updatedAt,
    deletedAt: null,
  };
}

describe('push mapping', () => {
  it('stamps every row owner-column with the auth uid (not the local id)', () => {
    const data: AppData = { ...emptyAppData(), profile: profile(), moments: [moment('m1', '2026-09-02T00:00:00.000Z')] };
    const rows = buildPushRows(data, UID);
    expect(rows.users[0].id).toBe(UID);
    expect(rows.moments[0].user_id).toBe(UID);
    // The entity id itself is preserved (only the owner column is rewritten).
    expect(rows.moments[0].id).toBe('m1');
  });

  it('NEVER includes free_note in an outcome row (client column-revoke, spine R3)', () => {
    const row = outcomeToRow(outcome('o1', '2026-09-02T00:00:00.000Z', 'sensitive note'), UID);
    expect(Object.keys(row)).not.toContain('free_note');
    expect(row.connection_feeling).toBe(8);
  });
});

describe('pull mapping', () => {
  it('round-trips a moment row → entity', () => {
    const row: Row = {
      id: 'm1',
      user_id: UID,
      name: 'Eve varış',
      decision_point: 'arriving_home',
      time_window_start_minute: 1080,
      time_window_end_minute: 1140,
      context: 'İşten dönüş',
      verification_status: 'confirmed',
      is_priority: true,
      created_at: '2026-09-01T00:00:00.000Z',
      updated_at: '2026-09-02T00:00:00.000Z',
      deleted_at: null,
    };
    const m = rowToMoment(row);
    expect(m.id).toBe('m1');
    expect(m.decisionPoint).toBe('arriving_home');
    expect(m.timeWindowStartMinute).toBe(1080);
    expect(m.isPriority).toBe(true);
  });

  it('builds an AppData snapshot at the current version', () => {
    const rows = {
      users: [],
      moments: [],
      routine_edges: [],
      experiments: [],
      attempts: [],
      outcomes: [],
      observations: [],
      who5: [],
    } as Record<SyncTable, Row[]>;
    expect(snapshotFromRows(rows).version).toBe(APP_DATA_VERSION);
  });
});

describe('mergeAppData (union + last-write-wins)', () => {
  it('unions rows present on only one side', () => {
    const local: AppData = { ...emptyAppData(), moments: [moment('m1', '2026-09-02T00:00:00.000Z')] };
    const remote: AppData = { ...emptyAppData(), moments: [moment('m2', '2026-09-02T00:00:00.000Z')] };
    const merged = mergeAppData(local, remote);
    expect(merged.moments.map((m) => m.id).sort()).toEqual(['m1', 'm2']);
  });

  it('keeps the newer row on a conflict (remote newer wins)', () => {
    const local: AppData = { ...emptyAppData(), moments: [moment('m1', '2026-09-02T00:00:00.000Z', { name: 'OLD' })] };
    const remote: AppData = { ...emptyAppData(), moments: [moment('m1', '2026-09-05T00:00:00.000Z', { name: 'NEW' })] };
    expect(mergeAppData(local, remote).moments[0].name).toBe('NEW');
  });

  it('keeps the newer row on a conflict (local newer wins)', () => {
    const local: AppData = { ...emptyAppData(), moments: [moment('m1', '2026-09-09T00:00:00.000Z', { name: 'LOCAL' })] };
    const remote: AppData = { ...emptyAppData(), moments: [moment('m1', '2026-09-05T00:00:00.000Z', { name: 'REMOTE' })] };
    expect(mergeAppData(local, remote).moments[0].name).toBe('LOCAL');
  });

  it('preserves the LOCAL free_note even when the remote outcome would otherwise win', () => {
    const local: AppData = { ...emptyAppData(), outcomes: [outcome('o1', '2026-09-02T00:00:00.000Z', 'local note')] };
    // Remote is newer and carries no note (client never uploads it).
    const remote: AppData = { ...emptyAppData(), outcomes: [outcome('o1', '2026-09-05T00:00:00.000Z', null)] };
    const merged = mergeAppData(local, remote);
    expect(merged.outcomes[0].freeNote).toBe('local note');
  });

  it('merges profile fields by recency but keeps the stable local id', () => {
    const local: AppData = { ...emptyAppData(), profile: profile({ id: 'local-random-id', updatedAt: '2026-09-01T00:00:00.000Z' }) };
    const remote: AppData = {
      ...emptyAppData(),
      profile: profile({ id: UID, consentResearch: true, updatedAt: '2026-09-05T00:00:00.000Z' }),
    };
    const merged = mergeAppData(local, remote);
    expect(merged.profile?.id).toBe('local-random-id'); // stable local identity
    expect(merged.profile?.consentResearch).toBe(true); // newer remote field adopted
  });
});
