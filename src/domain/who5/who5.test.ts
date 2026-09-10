import { isValidWho5Answers, who5Score } from './who5';

describe('WHO-5 scoring (F-014)', () => {
  it('scores the raw sum × 4 (0–100)', () => {
    expect(who5Score([5, 5, 5, 5, 5])).toBe(100);
    expect(who5Score([0, 0, 0, 0, 0])).toBe(0);
    expect(who5Score([3, 2, 4, 1, 5])).toBe(60); // sum 15 × 4
  });

  it('rejects incomplete or out-of-range answers', () => {
    expect(who5Score([1, 2, 3, 4])).toBeNull(); // too few
    expect(who5Score([0, 0, 0, 0, 6])).toBeNull(); // out of range
    expect(isValidWho5Answers([0, 1, 2, 3, 4])).toBe(true);
    expect(isValidWho5Answers([0, 1, 2, 3])).toBe(false);
  });
});
