import { buildWeeklySummary } from './weekly';
import { emptyAppData, type AppData } from '@/domain/model';
import type { Attempt, Outcome } from '@/domain/types';

const NOW = '2026-09-09T12:00:00.000Z';

function attempt(id: string, response: Attempt['response'], respondedAt: string): Attempt {
  return {
    id, userId: 'u1', experimentId: 'e1', momentId: 'm1', offeredAt: respondedAt, response,
    respondedAt, reason: null, createdAt: respondedAt, updatedAt: respondedAt, deletedAt: null,
  };
}
function outcome(attemptId: string, connection: number | null, craving: number | null): Outcome {
  return {
    id: `o-${attemptId}`, userId: 'u1', attemptId, craving, energy: null, mood: null,
    connectionFeeling: connection, freeNote: null, capturedAt: NOW, createdAt: NOW, updatedAt: NOW, deletedAt: null,
  };
}

describe('buildWeeklySummary (rule-based, correlational)', () => {
  it('counts this week\'s responses and averages connection/craving on "did" outcomes', () => {
    const data: AppData = {
      ...emptyAppData(),
      attempts: [
        attempt('1', 'did', '2026-09-09T08:00:00.000Z'),
        attempt('2', 'did', '2026-09-07T08:00:00.000Z'),
        attempt('3', 'not_now', '2026-09-08T08:00:00.000Z'),
        attempt('4', 'declined', '2026-09-06T08:00:00.000Z'),
        attempt('5', 'did', '2026-08-30T08:00:00.000Z'), // outside 7 days
      ],
      outcomes: [outcome('1', 8, 2), outcome('2', 6, 4)],
    };
    const s = buildWeeklySummary(data, NOW);
    expect(s.offered).toBe(4); // #5 excluded
    expect(s.did).toBe(2);
    expect(s.notNow).toBe(1);
    expect(s.declined).toBe(1);
    expect(s.connectionAvgOnDid).toBe(7); // (8+6)/2
    expect(s.cravingAvgOnDid).toBe(3); // (2+4)/2
    expect(s.hasData).toBe(true);
  });

  it('reports no data cleanly for an empty week (no failure language)', () => {
    const s = buildWeeklySummary(emptyAppData(), NOW);
    expect(s.hasData).toBe(false);
    expect(s.did).toBe(0);
    expect(s.connectionAvgOnDid).toBeNull();
  });
});
