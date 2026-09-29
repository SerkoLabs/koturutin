/**
 * Rule-based decision engine (spine §7, ADR-002) — deterministic, explainable, NO ML, NO I/O.
 *
 * Decides whether to schedule ONE proactive right-moment reminder for a confirmed transition,
 * respecting the notification budget (≤ 2/day at start) and the user's quiet windows. "Right
 * moment beats notification volume" (spine §1.6). The result is fully derived from its inputs so
 * it can be unit-tested without a clock or device.
 *
 * The engine never emits behavior/sensitive text — only the decision. The notification adapter
 * carries an opaque reference; the transition card resolves content in-app (spine §10/§11).
 */
import type { AttemptResponse, DecisionPoint, QuietWindow } from '@/domain/types';

export interface DecisionInput {
  /** Minutes since local midnight, 0–1439. */
  nowMinute: number;
  /** 0 = Sunday … 6 = Saturday (local). */
  dayOfWeek: number;
  /** The confirmed priority transition. */
  moment: {
    decisionPoint: DecisionPoint | null;
    timeWindowStartMinute: number | null;
    timeWindowEndMinute: number | null;
  };
  /** Proactive notifications already sent to the user today. */
  proactiveSentToday: number;
  /** Daily budget (spine §7: start at 2, may be reduced). */
  notificationBudget: number;
  quietWindows: QuietWindow[];
  /** The user's last response to a card, for "not now" learning (spine §7). */
  lastResponse: AttemptResponse | null;
}

export type DecisionReason =
  | 'budget_exhausted'
  | 'in_quiet_window'
  | 'no_time_window'
  | 'window_passed'
  | 'respecting_not_now'
  | 'scheduled';

export interface DecisionResult {
  action: 'schedule' | 'none';
  reason: DecisionReason;
  /** Minutes-since-midnight to fire at, when action === 'schedule'. */
  scheduleAtMinute?: number;
}

function isWithinQuietWindow(minute: number, dayOfWeek: number, windows: QuietWindow[]): boolean {
  return windows.some((w) => {
    const dayApplies = w.days.length === 0 || w.days.includes(dayOfWeek);
    if (!dayApplies) return false;
    // Same-day window (start < end). (Overnight windows are out of scope for the MVP slice.)
    return minute >= w.startMinute && minute < w.endMinute;
  });
}

export function decideNotification(input: DecisionInput): DecisionResult {
  const {
    nowMinute,
    dayOfWeek,
    moment,
    proactiveSentToday,
    notificationBudget,
    quietWindows,
    lastResponse,
  } = input;

  // 1. Budget: never exceed the daily proactive-notification budget.
  if (proactiveSentToday >= notificationBudget) {
    return { action: 'none', reason: 'budget_exhausted' };
  }

  // 2. "Not now" learning: if the user just said "not now", do not immediately re-offer.
  if (lastResponse === 'not_now') {
    return { action: 'none', reason: 'respecting_not_now' };
  }

  // 3. A right moment needs a concrete window in v1 (simple clock, spine §7).
  const start = moment.timeWindowStartMinute;
  const end = moment.timeWindowEndMinute;
  if (start === null) {
    return { action: 'none', reason: 'no_time_window' };
  }

  // 4. The whole window (or its start) must be in the future and outside quiet windows.
  const fireAt = Math.max(start, nowMinute);
  if (end !== null && fireAt >= end) {
    return { action: 'none', reason: 'window_passed' };
  }
  if (isWithinQuietWindow(fireAt, dayOfWeek, quietWindows)) {
    return { action: 'none', reason: 'in_quiet_window' };
  }

  return { action: 'schedule', reason: 'scheduled', scheduleAtMinute: fireAt };
}
