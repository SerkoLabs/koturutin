/**
 * App state: owns the single AppData document, loads it from the on-device Store on mount, exposes
 * the loop actions, and persists after every change (spine §17 loop; ADR-004 local-first). The
 * domain stays pure — this provider supplies ids/timestamps and saves results.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { canEnterLoop as canEnterLoopPredicate, loopBlockReason } from '@/domain/consent/consent';
import {
  addConfirmedMoment,
  createProfile,
  emptyAppData,
  getActiveExperiment,
  getPriorityMoment,
  offerAttempt,
  recordOutcome,
  respondToAttempt,
  selectExperiment,
  updateProfile,
  type AppData,
  type ConsentPatch,
  type Result,
} from '@/domain/model';
import { countWeeklyConsciousTransitions } from '@/domain/northstar/northstar';
import type { RelationshipContextAnswer } from '@/domain/safety/safety';
import type { AttemptResponse, Experiment, ExperimentLibraryEntry, IfThenPlan, Language, Moment } from '@/domain/types';
import { AsyncStorageStore } from '@/data/async-store';
import { detectLanguage, makeT, type TFunction } from '@/i18n';
import { newId, nowISO } from '@/lib/ids';
import type { Store } from '@/data/store';

const store: Store = new AsyncStorageStore();

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
  weeklyConsciousTransitions: number;
  // actions
  setLanguage: (lang: Language) => Promise<void>;
  grantConsent: (patch: ConsentPatch) => Promise<void>;
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
    ifThisThenThat: IfThenPlan;
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
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: AppData) => {
    setData(next);
    await store.save(next);
  }, []);

  const language: Language = data.profile?.language ?? 'tr';
  const userId = data.profile?.id ?? '';

  const value = useMemo<AppStateValue>(() => {
    const t = makeT(language);
    const priorityMoment = getPriorityMoment(data);
    const activeExperiment = getActiveExperiment(data);
    return {
      loading,
      data,
      language,
      t,
      canEnterLoop: data.profile ? canEnterLoopPredicate(data.profile) : false,
      loopBlock: data.profile ? loopBlockReason(data.profile) : 'age_not_confirmed',
      priorityMoment,
      activeExperiment,
      weeklyConsciousTransitions: countWeeklyConsciousTransitions(data.attempts, nowISO()),

      setLanguage: async (lang) => {
        await persist(updateProfile(data, { language: lang }, nowISO()));
      },
      grantConsent: async (patch) => {
        await persist(updateProfile(data, patch, nowISO()));
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
        const r = selectExperiment(data, {
          experimentId: newId(),
          userId,
          momentId: priorityMoment.id,
          entry: input.entry,
          ifThisThenThat: input.ifThisThenThat,
          relationshipAnswer: input.relationshipAnswer,
          nowISO: nowISO(),
        });
        if (r.ok) await persist(r.value);
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
