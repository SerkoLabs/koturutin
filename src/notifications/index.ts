/**
 * Right-moment local notification adapter (spine §10/§11; F-006/F-013; TASK-180/190).
 *
 * Privacy-critical: the scheduled notification carries ONLY a lock-screen-safe title/body ("A
 * transition moment is coming up") plus an OPAQUE reference in data — never the behavior/experiment
 * text. The transition card resolves the real content in-app after the user opens/unlocks.
 *
 * The decision to schedule is made by the pure rule engine (src/domain/decision-engine); this module
 * only performs the I/O. Device delivery + lock-screen preview must be verified on real iOS/Android
 * targets (TASK-370) — not possible in a headless environment.
 */
import * as Notifications from 'expo-notifications';
import type { Language } from '@/domain/types';
import { translate } from '@/i18n';

export interface OpaqueNotificationRef {
  kind: 'transition_card';
  /** Opaque id resolved in-app to the experiment/moment; carries no sensitive content. */
  ref: string;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Lock-screen-safe copy only. */
function safeTitle(language: Language): string {
  // Reuse the neutral card title; never include behavior text.
  return translate(language, 'card.title');
}

/**
 * Schedule a local reminder to fire at `fireDate`. Returns the notification id, or null if
 * scheduling was skipped (no permission). Never embeds sensitive data.
 */
export async function scheduleTransitionReminder(args: {
  language: Language;
  fireDate: Date;
  ref: OpaqueNotificationRef;
}): Promise<string | null> {
  const granted = await ensureNotificationPermission();
  if (!granted) return null;
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: safeTitle(args.language),
      body: '', // deliberately empty — no sensitive/behavior text on the lock screen
      data: { ...args.ref }, // opaque reference only
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: args.fireDate },
  });
  return id;
}

export async function cancelReminder(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

/**
 * Cancel every pending proactive reminder. Called when the user tightens their notification
 * preferences (budget → 0, or a quiet interval is set) so a previously-scheduled reminder cannot
 * still fire against the new preference (F-013). Best-effort: never throws to the caller.
 */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Notifications unavailable (no permission / platform) — nothing to cancel.
  }
}
