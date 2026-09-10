/**
 * WHO-5 Well-Being Index (spine §10/§15; F-014) — pure scoring. Five items, each answered 0–5
 * (0 = at no time … 5 = all of the time); the raw sum (0–25) × 4 gives a 0–100 percentage.
 * It is an OPTIONAL, non-diagnostic reflection — never a pass/fail score, never a diagnosis.
 */
export const WHO5_ITEM_COUNT = 5;
export const WHO5_MAX_ITEM = 5;

export function isValidWho5Answers(answers: number[]): boolean {
  return (
    answers.length === WHO5_ITEM_COUNT &&
    answers.every((a) => Number.isInteger(a) && a >= 0 && a <= WHO5_MAX_ITEM)
  );
}

/** Returns the 0–100 WHO-5 score, or null if the answers are incomplete/invalid. */
export function who5Score(answers: number[]): number | null {
  if (!isValidWho5Answers(answers)) return null;
  return answers.reduce((a, b) => a + b, 0) * 4;
}
