import {
  evaluateRelationshipGate,
  requiresRelationshipGate,
  requiresSmokingSupport,
  scanForRiskPhrases,
} from './safety';

describe('relationship-safety gate (spine §10)', () => {
  it('only an explicit "safe" answer permits the connection action', () => {
    expect(evaluateRelationshipGate('safe')).toEqual({
      allowConnectionAction: true,
      routeToSupport: false,
      reason: 'context_safe',
    });
  });

  it('withholds the connection action and routes to support when unsafe', () => {
    const r = evaluateRelationshipGate('unsafe');
    expect(r.allowConnectionAction).toBe(false);
    expect(r.routeToSupport).toBe(true);
    expect(r.reason).toBe('context_unsafe');
  });

  it('treats "unsure" as not-safe (safe default) and routes to support', () => {
    const r = evaluateRelationshipGate('unsure');
    expect(r.allowConnectionAction).toBe(false);
    expect(r.routeToSupport).toBe(true);
  });

  it('flags which safety classes require which gate', () => {
    expect(requiresRelationshipGate('relationship_safety')).toBe(true);
    expect(requiresRelationshipGate('standard')).toBe(false);
    expect(requiresSmokingSupport('smoking_support')).toBe(true);
    expect(requiresSmokingSupport('standard')).toBe(false);
  });
});

describe('rule-based crisis risk-phrase matcher (never an LLM)', () => {
  it('detects explicit Turkish risk phrases', () => {
    expect(scanForRiskPhrases('bugün çok kötüyüm, kendime zarar vermek istiyorum').risk).toBe(true);
    expect(scanForRiskPhrases('artık yaşamak istemiyorum').risk).toBe(true);
  });

  it('detects explicit English risk phrases', () => {
    expect(scanForRiskPhrases('I want to die').risk).toBe(true);
    expect(scanForRiskPhrases('thinking about self-harm').risk).toBe(true);
  });

  it('does not flag ordinary reflective notes', () => {
    expect(scanForRiskPhrases('balkona çıkmadan önce eşimle 90 saniye konuştum, iyi geldi').risk).toBe(false);
    expect(scanForRiskPhrases('I chose to sit with my child for a minute').risk).toBe(false);
    expect(scanForRiskPhrases('').risk).toBe(false);
    expect(scanForRiskPhrases(null).risk).toBe(false);
  });

  it('returns the matched fragment for observability without the whole note', () => {
    const r = scanForRiskPhrases('I keep thinking I should kill myself lately');
    expect(r.risk).toBe(true);
    expect(r.matched?.toLowerCase()).toContain('kill myself');
  });
});
