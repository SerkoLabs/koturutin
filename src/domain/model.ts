/**
 * Pure app-data model + transitions for the vertical slice (spine §5/§17).
 *
 * All operations are pure: they take the current AppData plus explicit ids/timestamps and return a
 * new AppData (immutably). No clock, no I/O — the persistence layer (src/data) supplies ids/now and
 * saves the result. This keeps the whole core loop deterministic and unit-testable, and enforces
 * the invariants that the Supabase schema also enforces (single active experiment, gate-before-
 * capture, relationship-safety gate).
 */
import { canEnterLoop } from '@/domain/consent/consent';
import { evaluateRelationshipGate, requiresRelationshipGate, type RelationshipContextAnswer } from '@/domain/safety/safety';
import type {
  Attempt,
  AttemptResponse,
  Experiment,
  ExperimentLibraryEntry,
  IfThenPlan,
  Language,
  Moment,
  Observation,
  Outcome,
  RoutineEdge,
  UserProfile,
  Who5Response,
} from '@/domain/types';

export const APP_DATA_VERSION = 3;

export interface AppData {
  version: number;
  profile: UserProfile | null;
  moments: Moment[];
  routineEdges: RoutineEdge[];
  experiments: Experiment[];
  attempts: Attempt[];
  outcomes: Outcome[];
  observations: Observation[];
  who5: Who5Response[];
}

export function emptyAppData(): AppData {
  return {
    version: APP_DATA_VERSION,
    profile: null,
    moments: [],
    routineEdges: [],
    experiments: [],
    attempts: [],
    outcomes: [],
    observations: [],
    who5: [],
  };
}

/**
 * Bring a persisted document up to the current shape without wiping local data (forward-compatible
 * load). Backfills arrays added in later versions and stamps the current version.
 */
export function normalizeAppData(raw: Partial<AppData> | null | undefined): AppData {
  const base = emptyAppData();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    version: APP_DATA_VERSION,
    moments: raw.moments ?? [],
    routineEdges: raw.routineEdges ?? [],
    experiments: raw.experiments ?? [],
    attempts: raw.attempts ?? [],
    outcomes: raw.outcomes ?? [],
    observations: raw.observations ?? [],
    who5: raw.who5 ?? [],
    profile: raw.profile ?? null,
  };
}

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'loop_locked' | 'relationship_unsafe'; routeToSupport?: boolean };

// ---------------------------------------------------------------------------
// Profile / consent
// ---------------------------------------------------------------------------

export function createProfile(
  data: AppData,
  args: { id: string; language: Language; timezone: string; nowISO: string },
): AppData {
  const profile: UserProfile = {
    id: args.id,
    language: args.language,
    timezone: args.timezone,
    notificationBudget: 2,
    quietWindows: [],
    smokingStance: null,
    intentValue: null,
    intentTargetBehavior: null,
    ageConfirmed18: false,
    consentHealthProcessing: false,
    consentPersonalization: false,
    consentResearch: false,
    consentFreeTextToModel: false,
    analyticsEnabled: false,
    consentUpdatedAt: null,
    retentionWindowDays: 180,
    createdAt: args.nowISO,
    updatedAt: args.nowISO,
  };
  return { ...data, profile };
}

export type ConsentPatch = Partial<
  Pick<
    UserProfile,
    | 'ageConfirmed18'
    | 'consentHealthProcessing'
    | 'consentPersonalization'
    | 'consentResearch'
    | 'consentFreeTextToModel'
    | 'analyticsEnabled'
    | 'smokingStance'
    | 'intentValue'
    | 'intentTargetBehavior'
    | 'language'
  >
>;

export function updateProfile(data: AppData, patch: ConsentPatch, nowISO: string): AppData {
  if (!data.profile) return data;
  const consentKeys: (keyof ConsentPatch)[] = [
    'consentHealthProcessing',
    'consentPersonalization',
    'consentResearch',
    'consentFreeTextToModel',
  ];
  const touchedConsent = consentKeys.some((k) => k in patch);
  const profile: UserProfile = {
    ...data.profile,
    ...patch,
    consentUpdatedAt: touchedConsent ? nowISO : data.profile.consentUpdatedAt,
    updatedAt: nowISO,
  };
  return { ...data, profile };
}

// ---------------------------------------------------------------------------
// Day map: one confirmed priority moment + its routine edges (minimal S-02 → S-04)
// ---------------------------------------------------------------------------

export interface EdgeInput {
  id: string;
  trigger: string;
  behavior: string;
  functionLabel: RoutineEdge['functionLabel'];
  delayedCost: string | null;
}

/**
 * Create ONE confirmed, priority moment with its edges. Gated: requires canEnterLoop (age +
 * health-processing consent). Enforces the single-priority invariant by clearing any prior
 * priority flag.
 */
export function addConfirmedMoment(
  data: AppData,
  args: {
    momentId: string;
    userId: string;
    name: string;
    decisionPoint: Moment['decisionPoint'];
    context: string | null;
    timeWindowStartMinute: number | null;
    timeWindowEndMinute: number | null;
    edges: EdgeInput[];
    nowISO: string;
  },
): Result<AppData> {
  if (!data.profile || !canEnterLoop(data.profile)) {
    return { ok: false, reason: 'loop_locked' };
  }
  const moment: Moment = {
    id: args.momentId,
    userId: args.userId,
    name: args.name,
    decisionPoint: args.decisionPoint,
    timeWindowStartMinute: args.timeWindowStartMinute,
    timeWindowEndMinute: args.timeWindowEndMinute,
    context: args.context,
    verificationStatus: 'confirmed',
    isPriority: true,
    createdAt: args.nowISO,
    updatedAt: args.nowISO,
    deletedAt: null,
  };
  const edges: RoutineEdge[] = args.edges.map((e) => ({
    id: e.id,
    userId: args.userId,
    momentId: args.momentId,
    trigger: e.trigger,
    behavior: e.behavior,
    functionLabel: e.functionLabel,
    delayedCost: e.delayedCost,
    confidence: 0,
    evidenceCount: 0,
    userConfirmed: true,
    createdAt: args.nowISO,
    updatedAt: args.nowISO,
    deletedAt: null,
  }));
  // Single-priority invariant: clear priority on other live moments.
  const moments = data.moments.map((m) =>
    m.deletedAt ? m : { ...m, isPriority: false, updatedAt: args.nowISO },
  );
  return {
    ok: true,
    value: { ...data, moments: [...moments, moment], routineEdges: [...data.routineEdges, ...edges] },
  };
}

export function getPriorityMoment(data: AppData): Moment | null {
  return data.moments.find((m) => m.isPriority && !m.deletedAt) ?? null;
}

// ---------------------------------------------------------------------------
// Observations — the 3-day check-ins (F-003, S-03). Gated: no capture without consent.
// ---------------------------------------------------------------------------

export function addObservation(
  data: AppData,
  args: {
    observationId: string;
    userId: string;
    momentId: string | null;
    context: string | null;
    behavior: string | null;
    craving: number | null;
    energy: number | null;
    nowISO: string;
  },
): Result<AppData> {
  if (!data.profile || !canEnterLoop(data.profile)) {
    return { ok: false, reason: 'loop_locked' };
  }
  const observation: Observation = {
    id: args.observationId,
    userId: args.userId,
    momentId: args.momentId,
    context: args.context,
    behavior: args.behavior,
    craving: args.craving,
    energy: args.energy,
    capturedAt: args.nowISO,
    createdAt: args.nowISO,
    updatedAt: args.nowISO,
    deletedAt: null,
  };
  return { ok: true, value: { ...data, observations: [...data.observations, observation] } };
}

export function countObservations(data: AppData): number {
  return data.observations.filter((o) => !o.deletedAt).length;
}

// ---------------------------------------------------------------------------
// WHO-5 optional wellbeing check (F-014). Gated: special-category data.
// ---------------------------------------------------------------------------

export function addWho5(
  data: AppData,
  args: { id: string; userId: string; answers: number[]; score: number; nowISO: string },
): Result<AppData> {
  if (!data.profile || !canEnterLoop(data.profile)) {
    return { ok: false, reason: 'loop_locked' };
  }
  const entry: Who5Response = {
    id: args.id,
    userId: args.userId,
    answers: args.answers,
    score: args.score,
    capturedAt: args.nowISO,
    createdAt: args.nowISO,
    deletedAt: null,
  };
  return { ok: true, value: { ...data, who5: [...data.who5, entry] } };
}

export function latestWho5(data: AppData): Who5Response | null {
  return data.who5
    .filter((w) => !w.deletedAt)
    .reduce<Who5Response | null>((latest, w) => (!latest || w.capturedAt > latest.capturedAt ? w : latest), null);
}

// ---------------------------------------------------------------------------
// Experiment selection (S-05) with the relationship-safety gate + single-active invariant
// ---------------------------------------------------------------------------

export function getActiveExperiment(data: AppData): Experiment | null {
  return data.experiments.find((e) => e.isActive && !e.deletedAt) ?? null;
}

/**
 * Select one experiment from a library entry for a confirmed moment. For the `connection` family
 * (relationship_safety class) the relationship-safety gate must pass first (spine §10): only an
 * explicit "safe" context activates it; otherwise the action is withheld and the caller routes to
 * support. Enforces the single-active-experiment invariant.
 */
export function selectExperiment(
  data: AppData,
  args: {
    experimentId: string;
    userId: string;
    momentId: string;
    entry: ExperimentLibraryEntry;
    ifThisThenThat: IfThenPlan;
    relationshipAnswer: RelationshipContextAnswer | null;
    nowISO: string;
  },
): Result<AppData> {
  if (!data.profile || !canEnterLoop(data.profile)) {
    return { ok: false, reason: 'loop_locked' };
  }
  if (requiresRelationshipGate(args.entry.safetyClass)) {
    const gate = evaluateRelationshipGate(args.relationshipAnswer ?? 'unsure');
    if (!gate.allowConnectionAction) {
      return { ok: false, reason: 'relationship_unsafe', routeToSupport: true };
    }
  }
  const experiment: Experiment = {
    id: args.experimentId,
    userId: args.userId,
    momentId: args.momentId,
    libraryId: args.entry.id,
    functionLabel: args.entry.functionLabel,
    durationBand: args.entry.durationBand,
    difficulty: args.entry.difficulty,
    safetyClass: args.entry.safetyClass,
    ifThisThenThat: args.ifThisThenThat,
    isActive: true,
    startedAt: args.nowISO,
    endedAt: null,
    createdAt: args.nowISO,
    updatedAt: args.nowISO,
    deletedAt: null,
  };
  // Single-active invariant: retire any currently active experiment.
  const experiments = data.experiments.map((e) =>
    e.isActive && !e.deletedAt
      ? { ...e, isActive: false, endedAt: args.nowISO, updatedAt: args.nowISO }
      : e,
  );
  return { ok: true, value: { ...data, experiments: [...experiments, experiment] } };
}

// ---------------------------------------------------------------------------
// Attempts (S-06) + outcomes (S-07)
// ---------------------------------------------------------------------------

export function offerAttempt(
  data: AppData,
  args: { attemptId: string; userId: string; experimentId: string; momentId: string | null; nowISO: string },
): AppData {
  const attempt: Attempt = {
    id: args.attemptId,
    userId: args.userId,
    experimentId: args.experimentId,
    momentId: args.momentId,
    offeredAt: args.nowISO,
    response: 'offered',
    respondedAt: null,
    reason: null,
    createdAt: args.nowISO,
    updatedAt: args.nowISO,
    deletedAt: null,
  };
  return { ...data, attempts: [...data.attempts, attempt] };
}

export function respondToAttempt(
  data: AppData,
  args: { attemptId: string; response: AttemptResponse; reason?: string | null; nowISO: string },
): AppData {
  const attempts = data.attempts.map((a) =>
    a.id === args.attemptId
      ? { ...a, response: args.response, respondedAt: args.nowISO, reason: args.reason ?? a.reason, updatedAt: args.nowISO }
      : a,
  );
  return { ...data, attempts };
}

export function recordOutcome(
  data: AppData,
  args: {
    outcomeId: string;
    userId: string;
    attemptId: string;
    craving: number | null;
    energy: number | null;
    mood: number | null;
    connectionFeeling: number | null;
    freeNote: string | null;
    nowISO: string;
  },
): AppData {
  const outcome: Outcome = {
    id: args.outcomeId,
    userId: args.userId,
    attemptId: args.attemptId,
    craving: args.craving,
    energy: args.energy,
    mood: args.mood,
    connectionFeeling: args.connectionFeeling,
    // Local-first: the note lives on device. The cloud sync layer drops it unless
    // consentFreeTextToModel is true (enforced server-side too — spine §21 R3).
    freeNote: args.freeNote,
    capturedAt: args.nowISO,
    createdAt: args.nowISO,
    updatedAt: args.nowISO,
    deletedAt: null,
  };
  return { ...data, outcomes: [...data.outcomes, outcome] };
}

export function getOutcomeForAttempt(data: AppData, attemptId: string): Outcome | null {
  return data.outcomes.find((o) => o.attemptId === attemptId && !o.deletedAt) ?? null;
}
