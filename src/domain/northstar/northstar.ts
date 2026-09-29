/**
 * North Star metric (spine §0/§15, ADR-007): the weekly number of *successful conscious
 * transitions* — real-life choices — NOT time-in-app and NOT streaks.
 *
 * A successful conscious transition is an Attempt the user marked `did`. We count those whose
 * response happened within the trailing 7 days. Pure and deterministic: `nowISO` is passed in
 * (never read from the clock) so it is fully testable.
 */
import type { Attempt } from '@/domain/types';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function countWeeklyConsciousTransitions(attempts: Attempt[], nowISO: string): number {
  const now = new Date(nowISO).getTime();
  const windowStart = now - SEVEN_DAYS_MS;
  return attempts.filter((a) => {
    if (a.response !== 'did') return false;
    if (a.deletedAt) return false;
    const when = a.respondedAt ?? a.offeredAt;
    const t = new Date(when).getTime();
    return t > windowStart && t <= now;
  }).length;
}

/** Total lifetime successful conscious transitions (all-time), for a gentle progress read. */
export function countTotalConsciousTransitions(attempts: Attempt[]): number {
  return attempts.filter((a) => a.response === 'did' && !a.deletedAt).length;
}
