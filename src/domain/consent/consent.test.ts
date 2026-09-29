import {
  analyticsMayFire,
  canEnterLoop,
  freeTextMayLeaveDevice,
  loopBlockReason,
  structuredDataMayGoToModel,
} from './consent';

describe('consent & age gate (spine §21 R2/R6)', () => {
  it('blocks the loop until 18+ AND health-processing consent are both true', () => {
    expect(canEnterLoop({ ageConfirmed18: false, consentHealthProcessing: false })).toBe(false);
    expect(canEnterLoop({ ageConfirmed18: true, consentHealthProcessing: false })).toBe(false);
    expect(canEnterLoop({ ageConfirmed18: false, consentHealthProcessing: true })).toBe(false);
    expect(canEnterLoop({ ageConfirmed18: true, consentHealthProcessing: true })).toBe(true);
  });

  it('reports the precise block reason for honest copy', () => {
    expect(loopBlockReason({ ageConfirmed18: false, consentHealthProcessing: false })).toBe('age_not_confirmed');
    expect(loopBlockReason({ ageConfirmed18: true, consentHealthProcessing: false })).toBe('health_consent_missing');
    expect(loopBlockReason({ ageConfirmed18: true, consentHealthProcessing: true })).toBeNull();
  });

  it('keeps free text on-device unless free-text consent is ON (default OFF)', () => {
    expect(freeTextMayLeaveDevice({ consentFreeTextToModel: false })).toBe(false);
    expect(freeTextMayLeaveDevice({ consentFreeTextToModel: true })).toBe(true);
  });

  it('gates structured-data-to-model behind personalization consent (default OFF)', () => {
    expect(structuredDataMayGoToModel({ consentPersonalization: false })).toBe(false);
    expect(structuredDataMayGoToModel({ consentPersonalization: true })).toBe(true);
  });

  it('treats analytics as separate opt-in', () => {
    expect(analyticsMayFire({ analyticsEnabled: false })).toBe(false);
    expect(analyticsMayFire({ analyticsEnabled: true })).toBe(true);
  });
});
