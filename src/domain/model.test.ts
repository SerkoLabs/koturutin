import {
  addConfirmedMoment,
  createProfile,
  emptyAppData,
  getActiveExperiment,
  getOutcomeForAttempt,
  getPriorityMoment,
  offerAttempt,
  recordOutcome,
  respondToAttempt,
  selectExperiment,
  updateProfile,
  type AppData,
} from './model';
import type { ExperimentLibraryEntry } from '@/domain/types';

const NOW = '2026-09-09T17:30:00.000Z';

const connectionEntry: ExperimentLibraryEntry = {
  id: 'lib-connection-home',
  intentKey: 'transition.home.arrival.connection',
  functionLabel: 'connection',
  family: 'greeting',
  durationBand: '30s-3m',
  minSeconds: 30,
  maxSeconds: 180,
  difficulty: 1,
  safetyClass: 'relationship_safety',
  clinicallyReviewed: true,
  culturallyReviewed: true,
  enabled: true,
};

function consented(): AppData {
  let d = createProfile(emptyAppData(), { id: 'u1', language: 'tr', timezone: 'Europe/Istanbul', nowISO: NOW });
  d = updateProfile(d, { ageConfirmed18: true, consentHealthProcessing: true }, NOW);
  return d;
}

function withConfirmedMoment(d: AppData): AppData {
  const r = addConfirmedMoment(d, {
    momentId: 'm1',
    userId: 'u1',
    name: 'Eve varış',
    decisionPoint: 'arriving_home',
    context: 'İşten döndüğümde',
    timeWindowStartMinute: 18 * 60,
    timeWindowEndMinute: 19 * 60,
    edges: [
      { id: 'edge1', trigger: 'Eve girince', behavior: 'Balkonda sigara ve kahve', functionLabel: 'relief_transition', delayedCost: 'Aile temasının ötelenmesi' },
    ],
    nowISO: NOW,
  });
  if (!r.ok) throw new Error('expected ok');
  return r.value;
}

describe('consent gate before capture', () => {
  it('refuses to create a moment until age + health consent are granted', () => {
    const d = createProfile(emptyAppData(), { id: 'u1', language: 'tr', timezone: 'Europe/Istanbul', nowISO: NOW });
    const r = addConfirmedMoment(d, {
      momentId: 'm1', userId: 'u1', name: 'x', decisionPoint: 'arriving_home', context: null,
      timeWindowStartMinute: null, timeWindowEndMinute: null, edges: [], nowISO: NOW,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('loop_locked');
  });

  it('stamps consentUpdatedAt when a consent flag changes', () => {
    const d = updateProfile(consented(), { consentFreeTextToModel: true }, '2026-09-10T00:00:00.000Z');
    expect(d.profile?.consentUpdatedAt).toBe('2026-09-10T00:00:00.000Z');
    expect(d.profile?.consentFreeTextToModel).toBe(true);
  });
});

describe('day map', () => {
  it('creates one confirmed priority moment with edges', () => {
    const d = withConfirmedMoment(consented());
    const m = getPriorityMoment(d);
    expect(m?.verificationStatus).toBe('confirmed');
    expect(m?.isPriority).toBe(true);
    expect(d.routineEdges).toHaveLength(1);
    expect(d.routineEdges[0].behavior).toContain('sigara');
  });
});

describe('experiment selection + relationship-safety gate + single active', () => {
  it('withholds a connection experiment when the context is not confirmed safe', () => {
    const d = withConfirmedMoment(consented());
    const r = selectExperiment(d, {
      experimentId: 'x1', userId: 'u1', momentId: 'm1', entry: connectionEntry,
      ifThisThenThat: { if: 'Eve girince', then: '90 saniye aile teması' },
      relationshipAnswer: 'unsure', nowISO: NOW,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe('relationship_unsafe');
      expect(r.routeToSupport).toBe(true);
    }
    // No experiment created.
    expect(getActiveExperiment(d)).toBeNull();
  });

  it('activates the connection experiment only when the context is safe', () => {
    const d = withConfirmedMoment(consented());
    const r = selectExperiment(d, {
      experimentId: 'x1', userId: 'u1', momentId: 'm1', entry: connectionEntry,
      ifThisThenThat: { if: 'Eve girince', then: '90 saniye aile teması' },
      relationshipAnswer: 'safe', nowISO: NOW,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const active = getActiveExperiment(r.value);
      expect(active?.functionLabel).toBe('connection');
      expect(active?.isActive).toBe(true);
    }
  });

  it('keeps at most one active experiment (retires the previous on new selection)', () => {
    let d = withConfirmedMoment(consented());
    const first = selectExperiment(d, {
      experimentId: 'x1', userId: 'u1', momentId: 'm1', entry: connectionEntry,
      ifThisThenThat: { if: 'a', then: 'b' }, relationshipAnswer: 'safe', nowISO: NOW,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    d = first.value;
    const standardEntry: ExperimentLibraryEntry = { ...connectionEntry, id: 'lib-2', functionLabel: 'relief_transition', safetyClass: 'standard', intentKey: 'transition.home.arrival.relief' };
    const second = selectExperiment(d, {
      experimentId: 'x2', userId: 'u1', momentId: 'm1', entry: standardEntry,
      ifThisThenThat: { if: 'a', then: 'c' }, relationshipAnswer: null, nowISO: NOW,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    const activeCount = second.value.experiments.filter((e) => e.isActive && !e.deletedAt).length;
    expect(activeCount).toBe(1);
    expect(getActiveExperiment(second.value)?.id).toBe('x2');
  });
});

describe('attempt + outcome loop', () => {
  it('offers, responds "did", records an outcome, and persists it', () => {
    let d = withConfirmedMoment(consented());
    const sel = selectExperiment(d, {
      experimentId: 'x1', userId: 'u1', momentId: 'm1', entry: connectionEntry,
      ifThisThenThat: { if: 'a', then: 'b' }, relationshipAnswer: 'safe', nowISO: NOW,
    });
    if (!sel.ok) throw new Error('sel');
    d = sel.value;
    d = offerAttempt(d, { attemptId: 'att1', userId: 'u1', experimentId: 'x1', momentId: 'm1', nowISO: NOW });
    d = respondToAttempt(d, { attemptId: 'att1', response: 'did', nowISO: NOW });
    d = recordOutcome(d, {
      outcomeId: 'o1', userId: 'u1', attemptId: 'att1', craving: 3, energy: 6, mood: 7,
      connectionFeeling: 8, freeNote: 'Çocukla bir dakika oturdum', nowISO: NOW,
    });
    expect(d.attempts[0].response).toBe('did');
    const o = getOutcomeForAttempt(d, 'att1');
    expect(o?.connectionFeeling).toBe(8);
    expect(o?.freeNote).toContain('Çocukla');
  });
});
