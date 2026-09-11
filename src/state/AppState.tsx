/**
 * App state: owns the single AppData document, loads it from the on-device Store on mount, exposes
 * the loop actions, and persists after every change (spine §17 loop; ADR-004 local-first). The
 * domain stays pure — this provider supplies ids/timestamps and saves results.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { canEnterLoop as canEnterLoopPredicate, loopBlockReason } from '@/domain/consent/consent';
import {
  addConfirmedMoment,
  addObservation,
  addWho5,
  countObservations,
  createProfile,
  emptyAppData,
  getActiveExperiment,
  getPriorityMoment,
  latestWho5,
  offerAttempt,
  recordOutcome,
  respondToAttempt,
  selectExperiment,
  setNotificationPrefs,
  updateProfile,
  type AppData,
  type ConsentPatch,
  type Result,
} from '@/domain/model';
import { countWeeklyConsciousTransitions } from '@/domain/northstar/northstar';
import { buildWeeklySummary, type WeeklySummary } from '@/domain/summary/weekly';
import { who5Score } from '@/domain/who5/who5';
import { decideNotification } from '@/domain/decision-engine/engine';
import type { RelationshipContextAnswer } from '@/domain/safety/safety';
import type { AttemptResponse, Experiment, ExperimentLibraryEntry, Language, Moment, Outcome, QuietWindow } from '@/domain/types';
import { AsyncStorageStore } from '@/data/async-store';
import { SyncingStore } from '@/data/syncing-store';
import { SupabaseRemoteGateway } from '@/data/supabase/gateway';
import { scheduleTransitionReminder } from '@/notifications';
import { detectLanguage, makeT, type TFunction } from '@/i18n';
import { localDayOfWeek, localMinuteOfDay, newId, nowISO } from '@/lib/ids';

// Local-first: on-device storage is the primary source of truth. The SyncingStore wraps it and,
// ONLY when a session + the isolated `koturutin` schema are available (founder prerequisites),
// mirrors rows to Postgres under RLS. Until then sync() skips and behaviour is pure-local (ADR-004/012).
const store = new SyncingStore(new AsyncStorageStore(), new SupabaseRemoteGateway());

interface AppStateValue {
  loading: boolean;
  data: AppData;
  language: Language;
  t: TFunction;
  // derived
  canEnterLoop: boolean;
  loopBlock: ReturnType<typeof loopBlockReason>;
  priorityMoment: Moment | null;
  activeExperiment: Experiment | null;
  lastOutcome: Outcome | null;
  weeklyConsciousTransitions: number;
  weeklySummary: WeeklySummary;
  observationCount: number;
  latestWho5Score: number | null;
  // actions
  addObservationCheckin: (input: {
    context: string | null;
    behavior: string | null;
    craving: number | null;
    energy: number | null;
  }) => Promise<Result<AppData>>;
  submitWho5: (answers: number[]) => Promise<Result<AppData>>;
  deleteAllData: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
  grantConsent: (patch: ConsentPatch) => Promise<void>;
  setNotificationBudget: (budget: number) => Promise<void>;
  setQuietWindows: (windows: QuietWindow[]) => Promise<void>;
  addArrivingHomeMoment: (input: {
    name: string;
    trigger: string;
    behavior: string;
    context: string | null;
    timeWindowStartMinute: number | null;
    timeWindowEndMinute: number | null;
  }) => Promise<Result<AppData>>;
  chooseExperiment: (input: {
    entry: ExperimentLibraryEntry;
    thenText: string;
    relationshipAnswer: RelationshipContextAnswer | null;
  }) => Promise<Result<AppData>>;
  openTransitionCard: () => Promise<string | null>; // returns attemptId
  respondToCard: (attemptId: string, response: AttemptResponse, reason?: string | null) => Promise<void>;
  saveOutcome: (
    attemptId: string,
    scores: { craving: number | null; energy: number | null; mood: number | null; connectionFeeling: number | null; freeNote: string | null },
  ) => Promise<void>;
}

const Ctx = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AppData>(() => emptyAppData());

  // Load persisted data (or create a fresh profile with the detected language) on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await store.load();
      if (cancelled) return;
      if (loaded && loaded.profile) {
        setData(loaded);
      } else {
        const fresh = createProfile(emptyAppData(), {
          id: newId(),
          language: detectLanguage(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Europe/Istanbul',
          nowISO: nowISO(),
        });
        await store.save(fresh);
        if (!cancelled) setData(fresh);
      }
      if (!cancelled) setLoading(false);

      // Best-effort cloud reconciliation (ADR-012). Cleanly SKIPS with no session / unexposed schema,
      // so the app never blocks on it; when it merges remote rows we refresh the in-memory document.
      store
        .sync()
        .then(async (r) => {
          if (cancelled || r.status !== 'ok' || !(r.pulled && r.pulled > 0)) return;
          const merged = await store.load();
          if (!cancelled && merged) setData(merged);
        })
        .catch(() => {
          // Sync is strictly optional; a failure never affects the local-first experience.
        });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: AppData) => {
    setData(next);
    try {
      await store.save(next);
    } catch {
      // A failed local save must not crash the app or leave callers hanging; state stays in memory.
    }
  }, []);

  const language: Language = data.profile?.language ?? 'tr';
  const userId = data.profile?.id ?? '';

  const value = useMemo<AppStateValue>(() => {
    const t = makeT(language);
    const priorityMoment = getPriorityMoment(data);
    const activeExperiment = getActiveExperiment(data);
    const lastOutcome: Outcome | null = data.outcomes
      .filter((o) => !o.deletedAt)
      .reduce<Outcome | null>((latest, o) => (!latest || o.capturedAt > latest.capturedAt ? o : latest), null);
    return {
      loading,
      data,
      language,
      t,
      canEnterLoop: data.profile ? canEnterLoopPredicate(data.profile) : false,
      loopBlock: data.profile ? loopBlockReason(data.profile) : 'age_not_confirmed',
      priorityMoment,
      activeExperiment,
      lastOutcome,
      weeklyConsciousTransitions: countWeeklyConsciousTransitions(data.attempts, nowISO()),
      weeklySummary: buildWeeklySummary(data, nowISO()),
      observationCount: countObservations(data),
      latestWho5Score: latestWho5(data)?.score ?? null,

      submitWho5: async (answers) => {
        const score = who5Score(answers);
        if (score === null) return { ok: false, reason: 'loop_locked' };
        const r = addWho5(data, { id: newId(), userId, answers, score, nowISO: nowISO() });
        if (r.ok) await persist(r.value);
        return r;
      },

      addObservationCheckin: async (input) => {
        const r = addObservation(data, {
          observationId: newId(),
          userId,
          momentId: priorityMoment?.id ?? null,
          context: input.context,
          behavior: input.behavior,
          craving: input.craving,
          energy: input.energy,
          nowISO: nowISO(),
        });
        if (r.ok) await persist(r.value);
        return r;
      },
      deleteAllData: async () => {
        await store.clear();
        const fresh = createProfile(emptyAppData(), {
          id: newId(),
          language,
          timezone: data.profile?.timezone ?? 'Europe/Istanbul',
          nowISO: nowISO(),
        });
        await persist(fresh);
      },

      setLanguage: async (lang) => {
        await persist(updateProfile(data, { language: lang }, nowISO()));
      },
      grantConsent: async (patch) => {
        await persist(updateProfile(data, patch, nowISO()));
      },
      setNotificationBudget: async (budget) => {
        await persist(setNotificationPrefs(data, { notificationBudget: budget }, nowISO()));
      },
      setQuietWindows: async (windows) => {
        await persist(setNotificationPrefs(data, { quietWindows: windows }, nowISO()));
      },
      addArrivingHomeMoment: async (input) => {
        const r = addConfirmedMoment(data, {
          momentId: newId(),
          userId,
          name: input.name,
          decisionPoint: 'arriving_home',
          context: input.context,
          timeWindowStartMinute: input.timeWindowStartMinute,
          timeWindowEndMinute: input.timeWindowEndMinute,
          edges: [
            {
              id: newId(),
              trigger: input.trigger,
              behavior: input.behavior,
              functionLabel: 'relief_transition',
              delayedCost: null,
            },
          ],
          nowISO: nowISO(),
        });
        if (r.ok) await persist(r.value);
        return r;
      },
      chooseExperiment: async (input) => {
        if (!priorityMoment) return { ok: false, reason: 'loop_locked' };
        const experimentId = newId();
        const r = selectExperiment(data, {
          experimentId,
          userId,
          momentId: priorityMoment.id,
          entry: input.entry,
          // The implementation intention references the confirmed moment (F-005): "when <moment>, then <plan>".
          ifThisThenThat: { if: priorityMoment.name, then: input.thenText },
          relationshipAnswer: input.relationshipAnswer,
          nowISO: nowISO(),
        });
        if (r.ok) {
          await persist(r.value);
          // Wire the pure decision engine → local notification adapter (TASK-180). Best-effort:
          // device delivery is verified separately (TASK-370); the in-app card is always available.
          try {
            const m = priorityMoment;
            if (m.timeWindowStartMinute !== null) {
              const decision = decideNotification({
                nowMinute: localMinuteOfDay(),
                dayOfWeek: localDayOfWeek(),
                moment: {
                  decisionPoint: m.decisionPoint,
                  timeWindowStartMinute: m.timeWindowStartMinute,
                  timeWindowEndMinute: m.timeWindowEndMinute,
                },
                proactiveSentToday: 0, // per-day budget accounting is hardened in TASK-330
                notificationBudget: data.profile?.notificationBudget ?? 2,
                quietWindows: data.profile?.quietWindows ?? [],
                lastResponse: null,
              });
              if (decision.action === 'schedule' && decision.scheduleAtMinute !== undefined) {
                const fire = new Date();
                fire.setHours(Math.floor(decision.scheduleAtMinute / 60), decision.scheduleAtMinute % 60, 0, 0);
                if (fire.getTime() > Date.now()) {
                  await scheduleTransitionReminder({
                    language,
                    fireDate: fire,
                    ref: { kind: 'transition_card', ref: experimentId },
                  });
                }
              }
            }
          } catch {
            // Notifications unavailable (no permission / platform) — the in-app card is the fallback (UF-006).
          }
        }
        return r;
      },
      openTransitionCard: async () => {
        // Defense in depth: never capture without the consent/age gate (mirrors the route guard + DB gate).
        if (!data.profile || !canEnterLoopPredicate(data.profile)) return null;
        if (!activeExperiment) return null;
        const attemptId = newId();
        const next = offerAttempt(data, {
          attemptId,
          userId,
          experimentId: activeExperiment.id,
          momentId: activeExperiment.momentId,
          nowISO: nowISO(),
        });
        await persist(next);
        return attemptId;
      },
      respondToCard: async (attemptId, response, reason) => {
        await persist(respondToAttempt(data, { attemptId, response, reason: reason ?? null, nowISO: nowISO() }));
      },
      saveOutcome: async (attemptId, scores) => {
        if (!data.profile || !canEnterLoopPredicate(data.profile)) return;
        await persist(
          recordOutcome(data, {
            outcomeId: newId(),
            userId,
            attemptId,
            craving: scores.craving,
            energy: scores.energy,
            mood: scores.mood,
            connectionFeeling: scores.connectionFeeling,
            freeNote: scores.freeNote,
            nowISO: nowISO(),
          }),
        );
      },
    };
  }, [data, language, loading, persist, userId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppStateValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState must be used within AppStateProvider');
  return v;
}
