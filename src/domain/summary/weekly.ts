/**
 * Weekly learning summary (spine §3 step 7; F-008) — RULE-BASED and correlational only. It reports
 * simple counts and averages over the trailing 7 days; it never claims causation, never diagnoses,
 * and never uses streak/failure language (principle 3/7). No LLM. The UI phrases the numbers with
 * calm, correlation-safe copy.
 */
import type { AppData } from '@/domain/model';
import type { Attempt, Outcome } from '@/domain/types';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface WeeklySummary {
  offered: number;
  did: number;
  notNow: number;
  declined: number;
  /** Average sense-of-connection (0–10) recorded on this week's "did" outcomes, if any. */
  connectionAvgOnDid: number | null;
  /** Average craving (0–10) recorded on this week's "did" outcomes, if any. */
  cravingAvgOnDid: number | null;
  hasData: boolean;
}

function inWindow(when: string, nowMs: number): boolean {
  const t = new Date(when).getTime();
  return t > nowMs - SEVEN_DAYS_MS && t <= nowMs;
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export function buildWeeklySummary(data: AppData, nowISO: string): WeeklySummary {
  const nowMs = new Date(nowISO).getTime();
  const weekAttempts: Attempt[] = data.attempts.filter(
    (a) => !a.deletedAt && inWindow(a.respondedAt ?? a.offeredAt, nowMs),
  );
  const did = weekAttempts.filter((a) => a.response === 'did');
  const didIds = new Set(did.map((a) => a.id));
  const didOutcomes: Outcome[] = data.outcomes.filter((o) => !o.deletedAt && didIds.has(o.attemptId));

  const counts = {
    offered: weekAttempts.length,
    did: did.length,
    notNow: weekAttempts.filter((a) => a.response === 'not_now').length,
    declined: weekAttempts.filter((a) => a.response === 'declined').length,
  };

  return {
    ...counts,
    connectionAvgOnDid: avg(didOutcomes.map((o) => o.connectionFeeling).filter((n): n is number => n !== null)),
    cravingAvgOnDid: avg(didOutcomes.map((o) => o.craving).filter((n): n is number => n !== null)),
    hasData: weekAttempts.length > 0,
  };
}
