/**
 * Seed for the curated, read-only experiment_library (spine §5/§8; F-009; TASK-150).
 * Reference data only — NOT user data. Copy is resolved per language from the i18n catalog via
 * `intentKey`; no morality/causal language lives here. These MVP rows are placeholders for
 * clinically & culturally reviewed content — they carry review flags and MUST be replaced with
 * reviewed content before beta (spine §8). The same rows are seeded server-side in
 * supabase/migrations/0003_seed_experiment_library.sql.
 */
import type { ExperimentLibraryEntry } from '@/domain/types';

export const EXPERIMENT_LIBRARY_SEED: ExperimentLibraryEntry[] = [
  {
    id: 'lib_home_arrival_connection',
    intentKey: 'transition.home.arrival.connection',
    functionLabel: 'connection',
    family: 'greeting',
    durationBand: '30s-3m',
    minSeconds: 90,
    maxSeconds: 180,
    difficulty: 1,
    safetyClass: 'relationship_safety', // requires the relationship-safety gate before activation
    clinicallyReviewed: false,
    culturallyReviewed: false,
    enabled: true,
  },
  {
    id: 'lib_home_arrival_relief',
    intentKey: 'transition.home.arrival.relief',
    functionLabel: 'relief_transition',
    family: 'breath',
    durationBand: '60s-5m',
    minSeconds: 60,
    maxSeconds: 300,
    difficulty: 1,
    safetyClass: 'standard',
    clinicallyReviewed: false,
    culturallyReviewed: false,
    enabled: true,
  },
  {
    id: 'lib_after_meal_craving_support',
    intentKey: 'craving.delay.support',
    functionLabel: 'craving',
    family: 'delay',
    durationBand: '1-10m',
    minSeconds: 60,
    maxSeconds: 600,
    difficulty: 2,
    safetyClass: 'smoking_support', // keeps professional cessation support visible (ALO 171)
    clinicallyReviewed: false,
    culturallyReviewed: false,
    enabled: true,
  },
];

/** Enabled entries whose function matches, used by the (rule-based) selection screen. */
export function libraryForFunction(
  entries: ExperimentLibraryEntry[],
  functionLabel: ExperimentLibraryEntry['functionLabel'],
): ExperimentLibraryEntry[] {
  return entries.filter((e) => e.enabled && e.functionLabel === functionLabel);
}
