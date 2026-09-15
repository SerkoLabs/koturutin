/**
 * Safety logic (spine §9/§10, ADR-005) — RULE-BASED and human-reviewed. NEVER an LLM decision.
 *
 * Two responsibilities used by the vertical slice:
 *  1. Relationship-safety gate for the `connection` family (spine §10): the connection action is
 *     NOT assumed safe. It is offered only when the user explicitly confirms the context is safe;
 *     "unsafe" or "unsure" withholds it and routes to an alternative support path (S-10).
 *  2. A rule-based crisis / self-harm risk-phrase matcher used before persisting free text
 *     (UF-007): an explicit risk phrase STOPS the normal coaching flow and routes to local
 *     emergency + professional resources. Matching is deterministic and testable; it is a
 *     safety net, not a diagnosis, and can be extended/red-teamed (TASK-360).
 *
 * Pure module — no I/O, no React Native imports.
 */
import type { Language, SafetyClass } from '@/domain/types';

export function requiresRelationshipGate(safetyClass: SafetyClass): boolean {
  return safetyClass === 'relationship_safety';
}

export function requiresSmokingSupport(safetyClass: SafetyClass): boolean {
  return safetyClass === 'smoking_support';
}

export type RelationshipContextAnswer = 'safe' | 'unsure' | 'unsafe';

export interface RelationshipGateResult {
  allowConnectionAction: boolean;
  routeToSupport: boolean;
  reason: 'context_safe' | 'context_unsafe' | 'context_unsure';
}

/**
 * Only an explicit "safe" answer permits the connection action. Anything else (including "unsure")
 * withholds it and routes to support — the safe default (spine §10).
 */
export function evaluateRelationshipGate(answer: RelationshipContextAnswer): RelationshipGateResult {
  if (answer === 'safe') {
    return { allowConnectionAction: true, routeToSupport: false, reason: 'context_safe' };
  }
  return {
    allowConnectionAction: false,
    routeToSupport: true,
    reason: answer === 'unsafe' ? 'context_unsafe' : 'context_unsure',
  };
}

/**
 * Rule-based crisis / self-harm risk-phrase lists (Turkish + English). Intentionally conservative
 * and explicit. This is the tested copy/rule surface finalized under legal + clinical review
 * (TASK-360); it is deliberately NOT delegated to a generative model.
 */
const RISK_PATTERNS: Record<Language, RegExp[]> = {
  tr: [
    /intihar/i,
    /kendime zarar/i,
    /kendime\s+zarar\s+ver/i,
    /yaşamak istemiyorum/i,
    /yasamak istemiyorum/i,
    /ölmek istiyorum/i,
    /olmek istiyorum/i,
    /canıma kıy/i,
    /canima kiy/i,
    /hayatıma son/i,
    /hayatima son/i,
  ],
  en: [
    /suicide/i,
    /kill myself/i,
    /killing myself/i,
    /want to die/i,
    /end my life/i,
    /ending my life/i,
    /hurt myself/i,
    /harm myself/i,
    /self[-\s]?harm/i,
    /no reason to live/i,
  ],
};

export interface RiskScanResult {
  risk: boolean;
  matched: string | null;
}

/**
 * Scan free text for explicit risk phrases in BOTH language lists (a user may write in either).
 * Returns the matched fragment for observability without storing the whole sensitive note.
 */
export function scanForRiskPhrases(text: string | null | undefined): RiskScanResult {
  if (!text) return { risk: false, matched: null };
  const patterns = [...RISK_PATTERNS.tr, ...RISK_PATTERNS.en];
  for (const p of patterns) {
    const m = p.exec(text);
    if (m) return { risk: true, matched: m[0] };
  }
  return { risk: false, matched: null };
}
