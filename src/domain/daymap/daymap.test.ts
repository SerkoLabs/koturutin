import { emptyAppData, normalizeAppData, type AppData } from '@/domain/model';
import type { Moment, Observation, RoutineEdge } from '@/domain/types';
import { buildDayMap, narrateDay, type DayMap, type NarrationCopy } from './daymap';

const COPY: NarrationCopy = {
  opening: 'OPEN',
  closing: 'CLOSE',
  spaceNote: 'SPACE',
  connector: 've',
  dayPart: {
    morning: 'Sabah',
    commute: 'Yol',
    daytime: 'Gündüz',
    evening_return: 'Eve dönüş',
    evening: 'Akşam',
    night: 'Gece',
  },
};

function moment(id: string, over: Partial<Moment> = {}): Moment {
  return {
    id,
    userId: 'u1',
    name: id,
    decisionPoint: null,
    timeWindowStartMinute: null,
    timeWindowEndMinute: null,
    context: null,
    verificationStatus: 'confirmed',
    isPriority: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    deletedAt: null,
    ...over,
  };
}

function edge(id: string, momentId: string, behavior: string, over: Partial<RoutineEdge> = {}): RoutineEdge {
  return {
    id,
    userId: 'u1',
    momentId,
    trigger: 't-' + id,
    behavior,
    functionLabel: null,
    delayedCost: null,
    confidence: 0,
    evidenceCount: 0,
    userConfirmed: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    deletedAt: null,
    ...over,
  };
}

function observation(id: string, momentId: string | null): Observation {
  return {
    id,
    userId: 'u1',
    momentId,
    context: 'c',
    behavior: 'b',
    craving: 5,
    energy: 5,
    capturedAt: '2026-09-02T08:00:00.000Z',
    createdAt: '2026-09-02T08:00:00.000Z',
    updatedAt: '2026-09-02T08:00:00.000Z',
    deletedAt: null,
  };
}

describe('buildDayMap projection', () => {
  it('1. empty day → safe empty map and empty narration', () => {
    const map = buildDayMap(emptyAppData());
    expect(map.isEmpty).toBe(true);
    expect(map.segments).toHaveLength(0);
    expect(narrateDay(map, COPY)).toEqual([]);
  });

  it('2. a single routine → one segment carrying its edge chain', () => {
    const d: AppData = {
      ...emptyAppData(),
      moments: [moment('m1', { decisionPoint: 'arriving_home' })],
      routineEdges: [edge('e1', 'm1', 'Balkonda sigara')],
    };
    const map = buildDayMap(d);
    expect(map.segments).toHaveLength(1);
    expect(map.segments[0].dayPart).toBe('evening_return');
    expect(map.segments[0].edges).toHaveLength(1);
  });

  it('3. multiple moments → chronological order by day part (not insertion order)', () => {
    const d: AppData = {
      ...emptyAppData(),
      // Inserted bedtime-first, morning-second, midday-third:
      moments: [
        moment('night', { decisionPoint: 'bedtime' }),
        moment('morning', { decisionPoint: 'waking' }),
        moment('mid', { decisionPoint: 'break' }),
      ],
    };
    const map = buildDayMap(d);
    expect(map.segments.map((s) => s.moment.id)).toEqual(['morning', 'mid', 'night']);
  });

  it('4. edges within one moment are grouped in that segment in order', () => {
    const d: AppData = {
      ...emptyAppData(),
      moments: [moment('m1', { decisionPoint: 'waking' })],
      routineEdges: [edge('e1', 'm1', 'Telefon'), edge('e2', 'm1', 'Sigara'), edge('e3', 'm1', 'Kahve')],
    };
    const map = buildDayMap(d);
    expect(map.segments).toHaveLength(1);
    expect(map.segments[0].edges.map((e) => e.behavior)).toEqual(['Telefon', 'Sigara', 'Kahve']);
    const lines = narrateDay(map, COPY);
    expect(lines).toContain('Sabah: Telefon ve Sigara ve Kahve.');
  });

  it('5. ordering uses day part/time, not createdAt date', () => {
    const d: AppData = {
      ...emptyAppData(),
      moments: [
        moment('later-created-morning', { decisionPoint: 'waking', createdAt: '2026-09-10T00:00:00.000Z' }),
        moment('earlier-created-night', { decisionPoint: 'bedtime', createdAt: '2026-09-01T00:00:00.000Z' }),
      ],
    };
    const map = buildDayMap(d);
    expect(map.segments.map((s) => s.moment.id)).toEqual(['later-created-morning', 'earlier-created-night']);
  });

  it('6. missing optional fields (no decisionPoint, no window, no edges) → no crash, sensible defaults', () => {
    const d: AppData = { ...emptyAppData(), moments: [moment('bare')] };
    const map = buildDayMap(d);
    expect(map.segments[0].dayPart).toBe('daytime'); // fallback bucket
    const lines = narrateDay(map, COPY);
    expect(lines).toContain('Gündüz: bare.'); // chain falls back to the moment name
  });

  it('7. deterministic narration → same input yields identical output', () => {
    const d: AppData = {
      ...emptyAppData(),
      moments: [moment('m1', { decisionPoint: 'waking' }), moment('m2', { decisionPoint: 'arriving_home' })],
      routineEdges: [edge('e1', 'm1', 'Sigara'), edge('e2', 'm2', 'Telefon', { functionLabel: 'attention_silence' })],
    };
    const map = buildDayMap(d);
    expect(narrateDay(map, COPY)).toEqual(narrateDay(map, COPY));
  });

  it('7b. adds the gentle space note only when repeated space-closing appears across ≥2 segments', () => {
    const withClosing: AppData = {
      ...emptyAppData(),
      moments: [moment('m1', { decisionPoint: 'waking' }), moment('m2', { decisionPoint: 'leaving_home' })],
      routineEdges: [edge('e1', 'm1', 'Podcast', { functionLabel: 'attention_silence' })],
    };
    expect(narrateDay(buildDayMap(withClosing), COPY)).toContain('SPACE');

    const noClosing: AppData = {
      ...emptyAppData(),
      moments: [moment('m1', { decisionPoint: 'waking' })],
      routineEdges: [edge('e1', 'm1', 'Kahve', { functionLabel: 'waking_energy' })],
    };
    expect(narrateDay(buildDayMap(noClosing), COPY)).not.toContain('SPACE');
  });

  it('8. works on a normalized legacy document (backward compatible)', () => {
    const legacy = normalizeAppData({
      version: 1,
      moments: [moment('m1', { decisionPoint: 'arriving_home' })],
      routineEdges: [edge('e1', 'm1', 'Telefon')],
    } as Partial<AppData>);
    const map: DayMap = buildDayMap(legacy);
    expect(map.isEmpty).toBe(false);
    expect(map.segments[0].moment.id).toBe('m1');
  });

  it('attaches observations to their moment and ignores deleted rows', () => {
    const d: AppData = {
      ...emptyAppData(),
      moments: [moment('m1', { decisionPoint: 'waking' }), moment('gone', { decisionPoint: 'bedtime', deletedAt: '2026-09-05T00:00:00.000Z' })],
      routineEdges: [edge('eDead', 'm1', 'x', { deletedAt: '2026-09-05T00:00:00.000Z' })],
      observations: [observation('o1', 'm1'), observation('oNull', null)],
    };
    const map = buildDayMap(d);
    expect(map.segments).toHaveLength(1); // deleted moment excluded
    expect(map.segments[0].edges).toHaveLength(0); // deleted edge excluded
    expect(map.segments[0].observations.map((o) => o.id)).toEqual(['o1']); // null-moment obs not attached
  });
});
