# Project Status

> Maintained by the active agent. Repository evidence wins over this file when they conflict.

- Lifecycle version: 1.1
- Project: koturutin — bilingual contextual routine lab (Expo + React Native + Supabase)
- Mode: Controlled (validate-first gate held)
- Current lifecycle stage: 07 — IMPLEMENTATION_PLAN drafted; planning Stages 02–07 complete as drafts
- Current implementation phase: N/A (no application code yet — correct per Stage 07 gate)
- Current task: N/A
- Gate status: Stages 02–07 documents drafted and cross-reviewed. **HELD**: pre-code validation gate
  (docs/VALIDATION_PLAN.md, ADR-006) must be cleared before Stage 08 implementation begins.
- Last audit: Planning-doc critique pass (product fidelity, playbook conformance, safety/privacy,
  cross-consistency) — see PR description / AI review notes.
- Blockers:
  - Discovery/validation not yet executed (four critical assumptions unconfirmed).
  - Founder-owned assets not yet provided: Supabase project + keys, Apple/Google developer accounts,
    signing certificates (needed at Stages 08 and 14, not now).
- Decisions requiring human input (stop conditions before Stage 08):
  - Approve proceeding past the validation gate (or confirm validation outcomes).
  - Any product-scope, business-model, or medical-claim change.
  - Provisioning credentials/paid accounts; any external spend; public release/submission.
- Next eligible action: Execute docs/VALIDATION_PLAN.md (problem interviews → founder diary →
  concierge pilot → clickable prototype). Do NOT let a coding agent write application code before
  the validation exit criteria are met. When cleared, run: "Read AGENTS.md and continue the lifecycle
  for this repository. Do not skip gates." to enter Stage 08.

## Planning artifacts (source of truth)

- README.md — product promise, user, MVP, non-goals, success metric.
- docs/PRODUCT_SPEC.md — feature specs F-001…F-014 with acceptance criteria.
- docs/USER_FLOWS.md — screens S-01…S-12, flows UF-001…UF-014.
- docs/ARCHITECTURE.md — Expo + Supabase, rule-based decision engine, AI boundary, security/privacy.
- docs/DATABASE.md — entities, owner-only RLS, retention, experiment_library seed, allow/deny tests.
- docs/IMPLEMENTATION_PLAN.md — phases 0–9, first vertical slice explicit.
- docs/VALIDATION_PLAN.md — pre-code validation (hard gate, ADR-006).
- BUILD_PLAN.md — founder-facing master plan (Turkish).
- docs/DECISIONS.md — ADR-001…ADR-009.

## Quality commands

Populate after tooling is chosen in Stage 08 (Expo + Supabase).

- install:
- dev:
- lint:
- typecheck:
- test:
- build:
- e2e:
- database tests:

## Changelog

- 2026-09-09 — Installed the AI App Development Playbook OS into koturutin; drafted planning Stages
  02–07 plus VALIDATION_PLAN and the Turkish BUILD_PLAN; seeded ADR-001…ADR-009; set the validate-first
  gate before Stage 08.
