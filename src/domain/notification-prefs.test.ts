import {
  clampNotificationBudget,
  createProfile,
  emptyAppData,
  isValidQuietWindow,
  setNotificationPrefs,
  updateProfile,
  type AppData,
} from './model';
import { decideNotification } from './decision-engine/engine';
import type { QuietWindow } from './types';

const NOW = '2026-09-11T09:00:00.000Z';

function consented(): AppData {
  let d = createProfile(emptyAppData(), { id: 'u1', language: 'tr', timezone: 'Europe/Istanbul', nowISO: NOW });
  d = updateProfile(d, { ageConfirmed18: true, consentHealthProcessing: true }, NOW);
  return d;
}

describe('clampNotificationBudget', () => {
  it('clamps to the allowed 0–2 range and coerces junk to 0', () => {
    expect(clampNotificationBudget(5)).toBe(2);
    expect(clampNotificationBudget(-1)).toBe(0);
    expect(clampNotificationBudget(1)).toBe(1);
    expect(clampNotificationBudget(1.6)).toBe(2);
    expect(clampNotificationBudget(Number.NaN)).toBe(0);
  });
});

describe('isValidQuietWindow', () => {
  it('accepts a same-day interval and rejects invalid ones', () => {
    expect(isValidQuietWindow({ startMinute: 720, endMinute: 840, days: [] })).toBe(true);
    expect(isValidQuietWindow({ startMinute: 840, endMinute: 720, days: [] })).toBe(false); // start >= end
    expect(isValidQuietWindow({ startMinute: 0, endMinute: 1441, days: [] })).toBe(false); // end > 1440
    expect(isValidQuietWindow({ startMinute: 60, endMinute: 120, days: [7] })).toBe(false); // bad weekday
  });
});

describe('setNotificationPrefs', () => {
  it('clamps the budget and does NOT re-stamp consentUpdatedAt (not a consent)', () => {
    const before = consented();
    expect(before.profile?.consentUpdatedAt).toBe(NOW); // granting health consent stamped it
    const d = setNotificationPrefs(before, { notificationBudget: 9 }, '2026-09-12T00:00:00.000Z');
    expect(d.profile?.notificationBudget).toBe(2);
    expect(d.profile?.consentUpdatedAt).toBe(NOW); // unchanged by a non-consent update
    expect(d.profile?.updatedAt).toBe('2026-09-12T00:00:00.000Z');
  });

  it('keeps valid quiet windows and drops invalid ones', () => {
    const windows: QuietWindow[] = [
      { startMinute: 720, endMinute: 840, days: [] }, // valid
      { startMinute: 900, endMinute: 800, days: [] }, // invalid (start >= end)
    ];
    const d = setNotificationPrefs(consented(), { quietWindows: windows }, NOW);
    expect(d.profile?.quietWindows).toHaveLength(1);
    expect(d.profile?.quietWindows[0].startMinute).toBe(720);
  });

  it('is a no-op without a profile', () => {
    const d = setNotificationPrefs(emptyAppData(), { notificationBudget: 1 }, NOW);
    expect(d.profile).toBeNull();
  });
});

describe('preferences feed the decision engine (F-013 ↔ spine §7)', () => {
  const moment = { decisionPoint: 'arriving_home' as const, timeWindowStartMinute: 18 * 60, timeWindowEndMinute: 19 * 60 };

  it('budget 0 suppresses all proactive notifications', () => {
    const d = setNotificationPrefs(consented(), { notificationBudget: 0 }, NOW);
    const r = decideNotification({
      nowMinute: 17 * 60,
      dayOfWeek: 5,
      moment,
      proactiveSentToday: 0,
      notificationBudget: d.profile!.notificationBudget,
      quietWindows: d.profile!.quietWindows,
      lastResponse: null,
    });
    expect(r.action).toBe('none');
    expect(r.reason).toBe('budget_exhausted');
  });

  it('a quiet window covering the fire time withholds the reminder', () => {
    // Quiet 17:30–19:30 covers the 18:00 fire time.
    const d = setNotificationPrefs(consented(), { quietWindows: [{ startMinute: 17 * 60 + 30, endMinute: 19 * 60 + 30, days: [] }] }, NOW);
    const r = decideNotification({
      nowMinute: 18 * 60,
      dayOfWeek: 5,
      moment,
      proactiveSentToday: 0,
      notificationBudget: d.profile!.notificationBudget,
      quietWindows: d.profile!.quietWindows,
      lastResponse: null,
    });
    expect(r.action).toBe('none');
    expect(r.reason).toBe('in_quiet_window');
  });

  it('schedules when budget allows and no quiet window blocks it', () => {
    const d = setNotificationPrefs(consented(), { notificationBudget: 2, quietWindows: [] }, NOW);
    const r = decideNotification({
      nowMinute: 17 * 60,
      dayOfWeek: 5,
      moment,
      proactiveSentToday: 0,
      notificationBudget: d.profile!.notificationBudget,
      quietWindows: d.profile!.quietWindows,
      lastResponse: null,
    });
    expect(r.action).toBe('schedule');
    expect(r.scheduleAtMinute).toBe(18 * 60);
  });
});
