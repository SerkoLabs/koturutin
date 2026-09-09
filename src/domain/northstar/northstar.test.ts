import { countWeeklyConsciousTransitions, countTotalConsciousTransitions } from './northstar';
import type { Attempt } from '@/domain/types';

const NOW = '2026-09-09T12:00:00.000Z';

function attempt(partial: Partial<Attempt>): Attempt {
  return {
    id: partial.id ?? 'a1',
    userId: 'u1',
    experimentId: 'e1',
    momentId: 'm1',
    offeredAt: partial.offeredAt ?? NOW,
    response: partial.response ?? 'offered',
    respondedAt: partial.respondedAt ?? null,
    reason: null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: partial.deletedAt ?? null,
  };
}

describe('countWeeklyConsciousTransitions', () => {
  it('counts only `did` responses within the trailing 7 days', () => {
    const attempts: Attempt[] = [
      attempt({ id: '1', response: 'did', respondedAt: '2026-09-09T08:00:00.000Z' }), // today
      attempt({ id: '2', response: 'did', respondedAt: '2026-09-04T08:00:00.000Z' }), // 5 days ago
      attempt({ id: '3', response: 'not_now', respondedAt: '2026-09-09T08:00:00.000Z' }), // not a success
      attempt({ id: '4', response: 'declined', respondedAt: '2026-09-09T08:00:00.000Z' }), // not a success
      attempt({ id: '5', response: 'did', respondedAt: '2026-09-01T08:00:00.000Z' }), // 8 days ago (outside)
    ];
    expect(countWeeklyConsciousTransitions(attempts, NOW)).toBe(2);
  });

  it('never counts streaks or engagement — only real "did" choices', () => {
    const attempts: Attempt[] = [
      attempt({ id: '1', response: 'offered', respondedAt: null }),
      attempt({ id: '2', response: 'not_now', respondedAt: NOW }),
    ];
    expect(countWeeklyConsciousTransitions(attempts, NOW)).toBe(0);
  });

  it('excludes soft-deleted attempts', () => {
    const attempts: Attempt[] = [
      attempt({ id: '1', response: 'did', respondedAt: NOW, deletedAt: NOW }),
    ];
    expect(countWeeklyConsciousTransitions(attempts, NOW)).toBe(0);
  });

  it('falls back to offeredAt when respondedAt is missing', () => {
    const attempts: Attempt[] = [
      attempt({ id: '1', response: 'did', offeredAt: '2026-09-08T10:00:00.000Z', respondedAt: null }),
    ];
    expect(countWeeklyConsciousTransitions(attempts, NOW)).toBe(1);
  });

  it('counts lifetime total independent of the week window', () => {
    const attempts: Attempt[] = [
      attempt({ id: '1', response: 'did', respondedAt: '2020-01-01T00:00:00.000Z' }),
      attempt({ id: '2', response: 'did', respondedAt: NOW }),
      attempt({ id: '3', response: 'not_now', respondedAt: NOW }),
    ];
    expect(countTotalConsciousTransitions(attempts)).toBe(2);
  });
});
