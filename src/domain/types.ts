/**
 * koturutin domain types — mirror the entities and enums defined in docs/DATABASE.md
 * and docs/SPINE.md §5. These are the local-first representations (ISO string timestamps,
 * string ids). The cloud (Supabase) schema is the same shape; see supabase/migrations.
 *
 * This module is pure TypeScript with no React Native / Expo imports so it is unit-testable
 * in a plain Node environment.
 */

export type Language = 'tr' | 'en';

export type DecisionPoint =
  | 'waking'
  | 'leaving_home'
  | 'arriving_at_work'
  | 'break'
  | 'arriving_home'
  | 'after_meal'
  | 'bedtime';

export type VerificationStatus = 'hypothesis' | 'confirmed';

/** Function families (spine §8). Never a morality label. */
export type FunctionLabel =
  | 'waking_energy'
  | 'relief_transition'
  | 'connection'
  | 'attention_silence'
  | 'craving'
  | 'avoidance_procrastination'
  | 'sleep_transition';

/** Gates activation of an experiment (spine §10, DATABASE.md). */
export type SafetyClass = 'standard' | 'smoking_support' | 'relationship_safety';

/** No streak / failure semantics (principle 3). */
export type AttemptResponse = 'offered' | 'did' | 'not_now' | 'declined';

export type SmokingStance = 'quitting' | 'reducing' | 'noticing' | 'not_ready';

/** A protected time window that suppresses proactive notifications (spine §7). */
export interface QuietWindow {
  /** Minutes since local midnight, 0–1439. */
  startMinute: number;
  endMinute: number;
  /** Days of week this window applies to (0 = Sunday … 6 = Saturday). Empty = every day. */
  days: number[];
}

/**
 * The local user profile / preferences + the canonical consent set (spine §21 R2).
 * On device this is a single owner; when Supabase auth is wired it maps to `users`.
 */
export interface UserProfile {
  id: string;
  language: Language;
  timezone: string;
  notificationBudget: number; // ≤ 2 proactive/day at start (spine §7)
  quietWindows: QuietWindow[];
  smokingStance: SmokingStance | null;
  intentValue: string | null;
  intentTargetBehavior: string | null;
  // Canonical consent model — see docs/DATABASE.md users table + ADR-005/ADR-004.
  ageConfirmed18: boolean;
  consentHealthProcessing: boolean; // REQUIRED before any capture (Art.9(2)(a))
  consentPersonalization: boolean; // gates structured special-category data → model
  consentResearch: boolean;
  consentFreeTextToModel: boolean; // gates free text → model / cloud
  analyticsEnabled: boolean; // opt-in, non-sensitive only
  consentUpdatedAt: string | null;
  retentionWindowDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface Moment {
  id: string;
  userId: string;
  name: string;
  decisionPoint: DecisionPoint | null;
  timeWindowStartMinute: number | null;
  timeWindowEndMinute: number | null;
  context: string | null; // Sensitive
  verificationStatus: VerificationStatus;
  isPriority: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface RoutineEdge {
  id: string;
  userId: string;
  momentId: string;
  trigger: string; // Sensitive
  behavior: string; // Sensitive
  functionLabel: FunctionLabel | null;
  delayedCost: string | null; // Sensitive
  confidence: number; // 0–100
  evidenceCount: number;
  userConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface IfThenPlan {
  if: string;
  then: string;
}

export interface Experiment {
  id: string;
  userId: string;
  momentId: string;
  libraryId: string | null;
  functionLabel: FunctionLabel;
  durationBand: string;
  difficulty: number; // 1–5
  safetyClass: SafetyClass;
  ifThisThenThat: IfThenPlan; // Sensitive
  isActive: boolean; // at most one active per user
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Attempt {
  id: string;
  userId: string;
  experimentId: string;
  momentId: string | null;
  offeredAt: string;
  response: AttemptResponse;
  respondedAt: string | null;
  reason: string | null; // Sensitive
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Outcome {
  id: string;
  userId: string;
  attemptId: string;
  craving: number | null; // 0–10
  energy: number | null;
  mood: number | null;
  connectionFeeling: number | null;
  /**
   * Sensitive free text. LOCAL-FIRST: kept on device and only synced to the cloud when
   * consentFreeTextToModel is true (spine §21 R3; ADR-004). Never placed in a notification
   * payload or analytics event.
   */
  freeNote: string | null;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Curated, read-only reference content (spine §5/§8). NOT user data. */
export interface ExperimentLibraryEntry {
  id: string;
  intentKey: string; // language-neutral (spine §11); copy resolved via i18n
  functionLabel: FunctionLabel;
  family: string;
  durationBand: string;
  minSeconds: number;
  maxSeconds: number;
  difficulty: number;
  safetyClass: SafetyClass;
  clinicallyReviewed: boolean;
  culturallyReviewed: boolean;
  enabled: boolean;
}
