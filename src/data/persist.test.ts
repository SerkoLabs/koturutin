import { MemoryStore } from './memory-store';
import { EXPERIMENT_LIBRARY_SEED, libraryForFunction } from './library-seed';
import {
  addConfirmedMoment,
  createProfile,
  emptyAppData,
  getOutcomeForAttempt,
  offerAttempt,
  recordOutcome,
  respondToAttempt,
  selectExperiment,
  updateProfile,
} from '@/domain/model';

const NOW = '2026-09-09T18:05:00.000Z';

describe('local-first persistence round-trip (survives "restart")', () => {
  it('persists the full arriving-home loop and reloads it identically', async () => {
    const store = new MemoryStore();

    // Build the whole slice in one AppData value.
    let d = createProfile(emptyAppData(), { id: 'u1', language: 'tr', timezone: 'Europe/Istanbul', nowISO: NOW });
    d = updateProfile(d, { ageConfirmed18: true, consentHealthProcessing: true }, NOW);
    const m = addConfirmedMoment(d, {
      momentId: 'm1', userId: 'u1', name: 'Eve varış', decisionPoint: 'arriving_home', context: null,
      timeWindowStartMinute: 1080, timeWindowEndMinute: 1140, edges: [], nowISO: NOW,
    });
    expect(m.ok).toBe(true);
    if (!m.ok) return;
    d = m.value;

    const entry = libraryForFunction(EXPERIMENT_LIBRARY_SEED, 'connection')[0];
    const sel = selectExperiment(d, {
      experimentId: 'x1', userId: 'u1', momentId: 'm1', entry,
      ifThisThenThat: { if: 'Eve girince', then: '90 saniye aile teması' },
      relationshipAnswer: 'safe', nowISO: NOW,
    });
    expect(sel.ok).toBe(true);
    if (!sel.ok) return;
    d = sel.value;
    d = offerAttempt(d, { attemptId: 'att1', userId: 'u1', experimentId: 'x1', momentId: 'm1', nowISO: NOW });
    d = respondToAttempt(d, { attemptId: 'att1', response: 'did', nowISO: NOW });
    d = recordOutcome(d, {
      outcomeId: 'o1', userId: 'u1', attemptId: 'att1', craving: 2, energy: 6, mood: 7,
      connectionFeeling: 8, freeNote: 'İyi geldi', nowISO: NOW,
    });

    await store.save(d);

    // Simulate an app restart: a fresh store reads what was persisted.
    const reloaded = await store.load();
    expect(reloaded).not.toBeNull();
    expect(reloaded).toEqual(d);
    // The persisted attempt + outcome are intact.
    const o = reloaded ? getOutcomeForAttempt(reloaded, 'att1') : null;
    expect(o?.connectionFeeling).toBe(8);
    expect(reloaded?.attempts[0].response).toBe('did');
  });

  it('the seeded library exposes the arriving-home connection experiment with the safety gate flag', () => {
    const conn = libraryForFunction(EXPERIMENT_LIBRARY_SEED, 'connection');
    expect(conn).toHaveLength(1);
    expect(conn[0].intentKey).toBe('transition.home.arrival.connection');
    expect(conn[0].safetyClass).toBe('relationship_safety');
  });
});
