import { decideNotification, type DecisionInput } from './engine';

function base(overrides: Partial<DecisionInput> = {}): DecisionInput {
  return {
    nowMinute: 17 * 60, // 17:00
    dayOfWeek: 3,
    moment: {
      decisionPoint: 'arriving_home',
      timeWindowStartMinute: 18 * 60, // 18:00
      timeWindowEndMinute: 19 * 60, // 19:00
    },
    proactiveSentToday: 0,
    notificationBudget: 2,
    quietWindows: [],
    lastResponse: null,
    ...overrides,
  };
}

describe('decideNotification', () => {
  it('schedules at the window start when budget and timing allow', () => {
    const r = decideNotification(base());
    expect(r.action).toBe('schedule');
    expect(r.reason).toBe('scheduled');
    expect(r.scheduleAtMinute).toBe(18 * 60);
  });

  it('fires now when already inside the window', () => {
    const r = decideNotification(base({ nowMinute: 18 * 60 + 30 }));
    expect(r.action).toBe('schedule');
    expect(r.scheduleAtMinute).toBe(18 * 60 + 30);
  });

  it('sends nothing when the daily budget is exhausted', () => {
    const r = decideNotification(base({ proactiveSentToday: 2, notificationBudget: 2 }));
    expect(r).toEqual({ action: 'none', reason: 'budget_exhausted' });
  });

  it('respects "not now" learning and does not immediately re-offer', () => {
    const r = decideNotification(base({ lastResponse: 'not_now' }));
    expect(r).toEqual({ action: 'none', reason: 'respecting_not_now' });
  });

  it('sends nothing inside a quiet window', () => {
    const r = decideNotification(
      base({
        nowMinute: 18 * 60 + 10,
        quietWindows: [{ startMinute: 18 * 60, endMinute: 20 * 60, days: [] }],
      }),
    );
    expect(r).toEqual({ action: 'none', reason: 'in_quiet_window' });
  });

  it('honors quiet windows only on their configured days', () => {
    const quiet = [{ startMinute: 18 * 60, endMinute: 20 * 60, days: [0, 6] }]; // weekends only
    // Wednesday (day 3) → not quiet → schedules
    expect(decideNotification(base({ nowMinute: 18 * 60 + 10, dayOfWeek: 3, quietWindows: quiet })).action).toBe(
      'schedule',
    );
    // Sunday (day 0) → quiet → none
    expect(decideNotification(base({ nowMinute: 18 * 60 + 10, dayOfWeek: 0, quietWindows: quiet })).reason).toBe(
      'in_quiet_window',
    );
  });

  it('sends nothing when the window has already passed', () => {
    const r = decideNotification(base({ nowMinute: 20 * 60 }));
    expect(r).toEqual({ action: 'none', reason: 'window_passed' });
  });

  it('sends nothing when the moment has no time window (v1 needs a clock)', () => {
    const r = decideNotification(
      base({ moment: { decisionPoint: 'arriving_home', timeWindowStartMinute: null, timeWindowEndMinute: null } }),
    );
    expect(r).toEqual({ action: 'none', reason: 'no_time_window' });
  });

  it('is a pure function (same input → same output)', () => {
    const input = base();
    expect(decideNotification(input)).toEqual(decideNotification(input));
  });
});
