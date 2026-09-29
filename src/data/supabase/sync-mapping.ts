/**
 * Pure mapping + conflict-resolution between the local AppData document and the isolated `koturutin`
 * Postgres rows (ADR-004 local-first, ADR-012 isolated schema). No I/O, no React Native — fully
 * unit-testable in Node.
 *
 * Push rules that protect privacy and match the DB grants (migration 0002):
 *   - Every row's owner column is set to the authenticated auth.uid() (`user_id`, or `id` for the
 *     users row) so RLS `auth.uid() = user_id` passes regardless of the locally-generated id.
 *   - outcomes.free_note is NEVER included — the column is revoked from the client and guarded by a
 *     consent trigger; the raw note stays on-device (spine §21 R3).
 *   - who5 and outcomes are append-only (their UPDATE grant is column-restricted / absent), so they
 *     sync insert-only (on-conflict-do-nothing).
 *
 * Merge = union by id with last-write-wins by updatedAt (who5 by createdAt). A local outcome's
 * free_note is always preserved over whatever the server returns, so syncing can never overwrite the
 * sensitive on-device note.
 */
import { APP_DATA_VERSION, type AppData } from '@/domain/model';
import type {
  Attempt,
  DecisionPoint,
  Experiment,
  FunctionLabel,
  IfThenPlan,
  Language,
  Moment,
  Observation,
  Outcome,
  QuietWindow,
  RoutineEdge,
  SafetyClass,
  SmokingStance,
  UserProfile,
  VerificationStatus,
  Who5Response,
} from '@/domain/types';
import type { Row, SyncTable } from './gateway';

/** FK-safe order: parents before children (used for both push and pull). */
export const SYNC_TABLES: readonly SyncTable[] = [
  'users',
  'moments',
  'routine_edges',
  'experiments',
  'attempts',
  'outcomes',
  'observations',
  'who5',
] as const;

/** Append-only tables → on-conflict-do-nothing (see grants in migration 0002). */
export const TABLE_INSERT_ONLY: Record<SyncTable, boolean> = {
  users: false,
  moments: false,
  routine_edges: false,
  experiments: false,
  attempts: false,
  outcomes: true,
  observations: false,
  who5: true,
};

// ---------------------------------------------------------------------------
// coercion helpers (PostgREST already returns typed JSON; these are defensive)
// ---------------------------------------------------------------------------
const s = (v: unknown): string => String(v);
const sN = (v: unknown): string | null => (v == null ? null : String(v));
const n = (v: unknown): number => Number(v);
const nN = (v: unknown): number | null => (v == null ? null : Number(v));
const b = (v: unknown): boolean => Boolean(v);

// ---------------------------------------------------------------------------
// entity → row (push). uid overrides the owner column so RLS passes.
// ---------------------------------------------------------------------------
export function profileToRow(p: UserProfile, uid: string): Row {
  return {
    id: uid,
    language: p.language,
    timezone: p.timezone,
    notification_budget: p.notificationBudget,
    quiet_windows: p.quietWindows,
    smoking_stance: p.smokingStance,
    intent_value: p.intentValue,
    intent_target_behavior: p.intentTargetBehavior,
    consent_health_processing: p.consentHealthProcessing,
    consent_personalization: p.consentPersonalization,
    consent_research: p.consentResearch,
    consent_free_text_to_model: p.consentFreeTextToModel,
    consent_updated_at: p.consentUpdatedAt,
    analytics_enabled: p.analyticsEnabled,
    age_confirmed_18: p.ageConfirmed18,
    retention_window_days: p.retentionWindowDays,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export function momentToRow(m: Moment, uid: string): Row {
  return {
    id: m.id,
    user_id: uid,
    name: m.name,
    decision_point: m.decisionPoint,
    time_window_start_minute: m.timeWindowStartMinute,
    time_window_end_minute: m.timeWindowEndMinute,
    context: m.context,
    verification_status: m.verificationStatus,
    is_priority: m.isPriority,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
    deleted_at: m.deletedAt,
  };
}

export function routineEdgeToRow(e: RoutineEdge, uid: string): Row {
  return {
    id: e.id,
    user_id: uid,
    moment_id: e.momentId,
    trigger: e.trigger,
    behavior: e.behavior,
    function_label: e.functionLabel,
    delayed_cost: e.delayedCost,
    confidence: e.confidence,
    evidence_count: e.evidenceCount,
    user_confirmed: e.userConfirmed,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
    deleted_at: e.deletedAt,
  };
}

export function experimentToRow(x: Experiment, uid: string): Row {
  return {
    id: x.id,
    user_id: uid,
    moment_id: x.momentId,
    library_id: x.libraryId,
    function_label: x.functionLabel,
    duration_band: x.durationBand,
    difficulty: x.difficulty,
    safety_class: x.safetyClass,
    if_this_then_that: x.ifThisThenThat,
    is_active: x.isActive,
    started_at: x.startedAt,
    ended_at: x.endedAt,
    created_at: x.createdAt,
    updated_at: x.updatedAt,
    deleted_at: x.deletedAt,
  };
}

export function attemptToRow(a: Attempt, uid: string): Row {
  return {
    id: a.id,
    user_id: uid,
    experiment_id: a.experimentId,
    moment_id: a.momentId,
    offered_at: a.offeredAt,
    response: a.response,
    responded_at: a.respondedAt,
    reason: a.reason,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
    deleted_at: a.deletedAt,
  };
}

/** NOTE: free_note is intentionally omitted — never written from the client (spine §21 R3). */
export function outcomeToRow(o: Outcome, uid: string): Row {
  return {
    id: o.id,
    user_id: uid,
    attempt_id: o.attemptId,
    craving: o.craving,
    energy: o.energy,
    mood: o.mood,
    connection_feeling: o.connectionFeeling,
    captured_at: o.capturedAt,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
    deleted_at: o.deletedAt,
  };
}

export function observationToRow(o: Observation, uid: string): Row {
  return {
    id: o.id,
    user_id: uid,
    moment_id: o.momentId,
    context: o.context,
    behavior: o.behavior,
    craving: o.craving,
    energy: o.energy,
    captured_at: o.capturedAt,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
    deleted_at: o.deletedAt,
  };
}

export function who5ToRow(w: Who5Response, uid: string): Row {
  return {
    id: w.id,
    user_id: uid,
    answers: w.answers,
    score: w.score,
    captured_at: w.capturedAt,
    created_at: w.createdAt,
    deleted_at: w.deletedAt,
  };
}

/** Build the full set of push rows, owner-stamped to uid. */
export function buildPushRows(data: AppData, uid: string): Record<SyncTable, Row[]> {
  return {
    users: data.profile ? [profileToRow(data.profile, uid)] : [],
    moments: data.moments.map((m) => momentToRow(m, uid)),
    routine_edges: data.routineEdges.map((e) => routineEdgeToRow(e, uid)),
    experiments: data.experiments.map((x) => experimentToRow(x, uid)),
    attempts: data.attempts.map((a) => attemptToRow(a, uid)),
    outcomes: data.outcomes.map((o) => outcomeToRow(o, uid)),
    observations: data.observations.map((o) => observationToRow(o, uid)),
    who5: data.who5.map((w) => who5ToRow(w, uid)),
  };
}

// ---------------------------------------------------------------------------
// row → entity (pull)
// ---------------------------------------------------------------------------
export function rowToProfile(r: Row): UserProfile {
  return {
    id: s(r.id),
    language: (r.language as Language) ?? 'tr',
    timezone: s(r.timezone),
    notificationBudget: n(r.notification_budget),
    quietWindows: (Array.isArray(r.quiet_windows) ? r.quiet_windows : []) as QuietWindow[],
    smokingStance: (r.smoking_stance as SmokingStance | null) ?? null,
    intentValue: sN(r.intent_value),
    intentTargetBehavior: sN(r.intent_target_behavior),
    ageConfirmed18: b(r.age_confirmed_18),
    consentHealthProcessing: b(r.consent_health_processing),
    consentPersonalization: b(r.consent_personalization),
    consentResearch: b(r.consent_research),
    consentFreeTextToModel: b(r.consent_free_text_to_model),
    analyticsEnabled: b(r.analytics_enabled),
    consentUpdatedAt: sN(r.consent_updated_at),
    retentionWindowDays: n(r.retention_window_days),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
  };
}

export function rowToMoment(r: Row): Moment {
  return {
    id: s(r.id),
    userId: s(r.user_id),
    name: s(r.name),
    decisionPoint: (r.decision_point as DecisionPoint | null) ?? null,
    timeWindowStartMinute: nN(r.time_window_start_minute),
    timeWindowEndMinute: nN(r.time_window_end_minute),
    context: sN(r.context),
    verificationStatus: (r.verification_status as VerificationStatus) ?? 'hypothesis',
    isPriority: b(r.is_priority),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: sN(r.deleted_at),
  };
}

export function rowToRoutineEdge(r: Row): RoutineEdge {
  return {
    id: s(r.id),
    userId: s(r.user_id),
    momentId: s(r.moment_id),
    trigger: s(r.trigger),
    behavior: s(r.behavior),
    functionLabel: (r.function_label as FunctionLabel | null) ?? null,
    delayedCost: sN(r.delayed_cost),
    confidence: n(r.confidence),
    evidenceCount: n(r.evidence_count),
    userConfirmed: b(r.user_confirmed),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: sN(r.deleted_at),
  };
}

export function rowToExperiment(r: Row): Experiment {
  const plan = (r.if_this_then_that ?? { if: '', then: '' }) as IfThenPlan;
  return {
    id: s(r.id),
    userId: s(r.user_id),
    momentId: s(r.moment_id),
    libraryId: sN(r.library_id),
    functionLabel: r.function_label as FunctionLabel,
    durationBand: s(r.duration_band),
    difficulty: n(r.difficulty),
    safetyClass: (r.safety_class as SafetyClass) ?? 'standard',
    ifThisThenThat: plan,
    isActive: b(r.is_active),
    startedAt: sN(r.started_at),
    endedAt: sN(r.ended_at),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: sN(r.deleted_at),
  };
}

export function rowToAttempt(r: Row): Attempt {
  return {
    id: s(r.id),
    userId: s(r.user_id),
    experimentId: s(r.experiment_id),
    momentId: sN(r.moment_id),
    offeredAt: s(r.offered_at),
    response: (r.response as Attempt['response']) ?? 'offered',
    respondedAt: sN(r.responded_at),
    reason: sN(r.reason),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: sN(r.deleted_at),
  };
}

export function rowToOutcome(r: Row): Outcome {
  return {
    id: s(r.id),
    userId: s(r.user_id),
    attemptId: s(r.attempt_id),
    craving: nN(r.craving),
    energy: nN(r.energy),
    mood: nN(r.mood),
    connectionFeeling: nN(r.connection_feeling),
    // free_note may come back from the server, but the local copy is authoritative (see merge).
    freeNote: sN(r.free_note),
    capturedAt: s(r.captured_at),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: sN(r.deleted_at),
  };
}

export function rowToObservation(r: Row): Observation {
  return {
    id: s(r.id),
    userId: s(r.user_id),
    momentId: sN(r.moment_id),
    context: sN(r.context),
    behavior: sN(r.behavior),
    craving: nN(r.craving),
    energy: nN(r.energy),
    capturedAt: s(r.captured_at),
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
    deletedAt: sN(r.deleted_at),
  };
}

export function rowToWho5(r: Row): Who5Response {
  return {
    id: s(r.id),
    userId: s(r.user_id),
    answers: (Array.isArray(r.answers) ? r.answers.map(Number) : []) as number[],
    score: n(r.score),
    capturedAt: s(r.captured_at),
    createdAt: s(r.created_at),
    deletedAt: sN(r.deleted_at),
  };
}

/** Assemble a remote AppData view from fetched rows. */
export function snapshotFromRows(rows: Record<SyncTable, Row[]>): AppData {
  return {
    version: APP_DATA_VERSION,
    profile: rows.users[0] ? rowToProfile(rows.users[0]) : null,
    moments: rows.moments.map(rowToMoment),
    routineEdges: rows.routine_edges.map(rowToRoutineEdge),
    experiments: rows.experiments.map(rowToExperiment),
    attempts: rows.attempts.map(rowToAttempt),
    outcomes: rows.outcomes.map(rowToOutcome),
    observations: rows.observations.map(rowToObservation),
    who5: rows.who5.map(rowToWho5),
  };
}

// ---------------------------------------------------------------------------
// merge / conflict resolution (union by id, last-write-wins)
// ---------------------------------------------------------------------------
function mergeById<T extends { id: string }>(local: T[], remote: T[], ts: (t: T) => string): T[] {
  const byId = new Map<string, T>();
  for (const r of remote) byId.set(r.id, r);
  for (const l of local) {
    const r = byId.get(l.id);
    byId.set(l.id, !r || ts(l) >= ts(r) ? l : r);
  }
  return [...byId.values()];
}

function mergeProfile(local: UserProfile | null, remote: UserProfile | null): UserProfile | null {
  if (!local) return remote;
  if (!remote) return local;
  const base = (local.updatedAt ?? '') >= (remote.updatedAt ?? '') ? local : remote;
  // Keep the local id as the stable on-device identity even when the server row wins on recency.
  return { ...base, id: local.id };
}

/** Reconcile the local document with a pulled remote snapshot. Local free notes are preserved. */
export function mergeAppData(local: AppData, remote: AppData): AppData {
  const localNoteById = new Map(local.outcomes.map((o) => [o.id, o.freeNote] as const));
  const outcomes = mergeById(local.outcomes, remote.outcomes, (o) => o.updatedAt).map((o) =>
    localNoteById.has(o.id) ? { ...o, freeNote: localNoteById.get(o.id) ?? null } : o,
  );
  return {
    version: APP_DATA_VERSION,
    profile: mergeProfile(local.profile, remote.profile),
    moments: mergeById(local.moments, remote.moments, (m) => m.updatedAt),
    routineEdges: mergeById(local.routineEdges, remote.routineEdges, (e) => e.updatedAt),
    experiments: mergeById(local.experiments, remote.experiments, (x) => x.updatedAt),
    attempts: mergeById(local.attempts, remote.attempts, (a) => a.updatedAt),
    outcomes,
    observations: mergeById(local.observations, remote.observations, (o) => o.updatedAt),
    who5: mergeById(local.who5, remote.who5, (w) => w.createdAt),
  };
}

/** Total user rows in a document (telemetry for SyncResult). */
export function countEntities(data: AppData): number {
  return (
    (data.profile ? 1 : 0) +
    data.moments.length +
    data.routineEdges.length +
    data.experiments.length +
    data.attempts.length +
    data.outcomes.length +
    data.observations.length +
    data.who5.length
  );
}
