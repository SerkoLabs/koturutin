/**
 * Consent & age gate (spine §21 R2/R6; ADR-004/ADR-005). Pure predicates that encode the
 * non-negotiable rule: NO observation/craving/experiment capture happens until the user is
 * confirmed 18+ AND has given the REQUIRED health-processing consent (KVKK/GDPR Art. 9(2)(a)).
 * The optional consents (personalization / research / free-text-to-model) and analytics are
 * separate and default OFF.
 */
import type { UserProfile } from '@/domain/types';

/** May the user enter the core loop (any special-category capture)? */
export function canEnterLoop(p: Pick<UserProfile, 'ageConfirmed18' | 'consentHealthProcessing'>): boolean {
  return p.ageConfirmed18 === true && p.consentHealthProcessing === true;
}

/** Precise reason the loop is blocked, for honest, non-shaming copy. */
export type LoopBlockReason = 'age_not_confirmed' | 'health_consent_missing' | null;

export function loopBlockReason(
  p: Pick<UserProfile, 'ageConfirmed18' | 'consentHealthProcessing'>,
): LoopBlockReason {
  if (!p.ageConfirmed18) return 'age_not_confirmed';
  if (!p.consentHealthProcessing) return 'health_consent_missing';
  return null;
}

/** May a free-text note leave the device (sync / go to a model)? Default OFF (spine §21 R3). */
export function freeTextMayLeaveDevice(p: Pick<UserProfile, 'consentFreeTextToModel'>): boolean {
  return p.consentFreeTextToModel === true;
}

/** May structured special-category data be sent to the third-party model? Default OFF. */
export function structuredDataMayGoToModel(p: Pick<UserProfile, 'consentPersonalization'>): boolean {
  return p.consentPersonalization === true;
}

/** May non-sensitive product analytics fire? Opt-in, separate from the consents. */
export function analyticsMayFire(p: Pick<UserProfile, 'analyticsEnabled'>): boolean {
  return p.analyticsEnabled === true;
}
