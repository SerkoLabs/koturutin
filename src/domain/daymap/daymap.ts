/**
 * Day-map narration (F-002, S-?; spine §3 "see the whole chain"). A DETERMINISTIC, PURE PROJECTION
 * over the user's existing local data — their non-deleted `moments`, the `routine_edges` for each,
 * and the `observations` attached to them. It builds NO parallel routine system and needs NO new storage:
 * the day map is derived on demand from the single AppData document (ADR-004 local-first).
 *
 * The goal is to make the automatic chain of the day VISIBLE — not to diagnose, prescribe, or blame.
 * Narration is template-based and local (no LLM): same input → same output.
 */
import type { AppData } from '@/domain/model';
import type { Moment, Observation, RoutineEdge } from '@/domain/types';

export type DayPart = 'morning' | 'commute' | 'daytime' | 'evening_return' | 'evening' | 'night';

/** Canonical chronological order of the day parts. */
export const DAY_PART_ORDER: readonly DayPart[] = [
  'morning',
  'commute',
  'daytime',
  'evening_return',
  'evening',
  'night',
] as const;

export interface DayMapSegment {
  dayPart: DayPart;
  moment: Moment;
  /** The confirmed routine chain for this moment (trigger → behavior → delayed cost). */
  edges: RoutineEdge[];
  /** Lightweight noticings the user logged against this moment (F-003). */
  observations: Observation[];
}

export interface DayMap {
  segments: DayMapSegment[];
  isEmpty: boolean;
  /** How many edges reduce the day's reflective "spaces" (attention-silence / avoidance). Used only
   *  to decide whether to add a gentle, non-clinical note — never a diagnosis. */
  reflectiveSpaceClosings: number;
}

/** Map a moment to a day part: prefer its decision point, else bucket by its time window. */
export function dayPartForMoment(m: Moment): DayPart {
  switch (m.decisionPoint) {
    case 'waking':
      return 'morning';
    case 'leaving_home':
      return 'commute';
    case 'arriving_at_work':
    case 'break':
      return 'daytime';
    case 'arriving_home':
      return 'evening_return';
    case 'after_meal':
      return 'evening';
    case 'bedtime':
      return 'night';
    default:
      break;
  }
  const start = m.timeWindowStartMinute;
  if (start === null) return 'daytime';
  if (start < 11 * 60) return 'morning';
  if (start < 17 * 60) return 'daytime';
  if (start < 22 * 60) return 'evening_return';
  return 'night';
}

/**
 * Project the AppData into an ordered day map. Pure + deterministic: no clock, no I/O. Moments are
 * ordered by day part, then by their time window, then by creation order (a stable tiebreaker) —
 * never by insertion/date alone, so a bedtime moment captured first still sorts after a morning one.
 */
export function buildDayMap(data: AppData): DayMap {
  const moments = data.moments.filter((m) => !m.deletedAt);
  const segments: DayMapSegment[] = moments.map((m) => ({
    dayPart: dayPartForMoment(m),
    moment: m,
    edges: data.routineEdges.filter((e) => e.momentId === m.id && !e.deletedAt),
    observations: data.observations.filter((o) => o.momentId === m.id && !o.deletedAt),
  }));

  segments.sort((a, b) => {
    const pa = DAY_PART_ORDER.indexOf(a.dayPart);
    const pb = DAY_PART_ORDER.indexOf(b.dayPart);
    if (pa !== pb) return pa - pb;
    const ta = a.moment.timeWindowStartMinute ?? Number.MAX_SAFE_INTEGER;
    const tb = b.moment.timeWindowStartMinute ?? Number.MAX_SAFE_INTEGER;
    if (ta !== tb) return ta - tb;
    return a.moment.createdAt.localeCompare(b.moment.createdAt);
  });

  const reflectiveSpaceClosings = segments.reduce(
    (n, s) => n + s.edges.filter((e) => e.functionLabel === 'attention_silence' || e.functionLabel === 'avoidance_procrastination').length,
    0,
  );

  return { segments, isEmpty: segments.length === 0, reflectiveSpaceClosings };
}

/** The language-resolved strings the narration needs. The UI supplies these from i18n so the domain
 *  stays pure and copy stays in one place. */
export interface NarrationCopy {
  opening: string;
  closing: string;
  /** A gentle, non-clinical note added only when the day already shows repeated space-closing. */
  spaceNote: string;
  /** The word joining behaviors in a chain, e.g. "ardından" / "then". */
  connector: string;
  dayPart: Record<DayPart, string>;
}

/**
 * Produce the day's narration as an ordered list of calm, non-judgmental sentences. Deterministic:
 * the same (map, copy) always yields the same array. Returns [] for an empty day (the UI shows a
 * dedicated empty state). Never diagnoses, never blames, never claims clinical assessment.
 */
export function narrateDay(map: DayMap, copy: NarrationCopy): string[] {
  if (map.isEmpty) return [];
  const out: string[] = [copy.opening];
  for (const seg of map.segments) {
    const behaviors = seg.edges.map((e) => e.behavior).filter((b) => b.length > 0);
    const chain = behaviors.length > 0 ? behaviors.join(` ${copy.connector} `) : seg.moment.name;
    out.push(`${copy.dayPart[seg.dayPart]}: ${chain}.`);
  }
  if (map.reflectiveSpaceClosings >= 1 && map.segments.length >= 2) out.push(copy.spaceNote);
  out.push(copy.closing);
  return out;
}
