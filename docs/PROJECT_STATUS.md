# Project Status

> Maintained by the active agent. Repository evidence wins over this file when they conflict.

- Lifecycle version: 1.1
- Project: koturutin — bilingual contextual routine lab (Expo + React Native + Supabase)
- Mode: Controlled — engineering underway (ADR-010); external validation gate still open (ADR-006)
- Current lifecycle stage: 10 — first vertical slice implemented (local-first); Stages 08–09 complete
- Current implementation phase: Phase 3 (first vertical slice) — local-first path complete;
  live-Supabase e2e (TASK-210) blocked on founder credentials
- Current task: Audit #1 (Stage 11) is the next gate for the slice
- Gate status:
  - Planning Stages 02–07: PASS (documents drafted + cross-reviewed; PR #1).
  - Stage 08 Foundation: PASS — Expo SDK 57 + RN 0.76-line + TypeScript strict scaffold; ESLint
    (eslint-config-expo), Jest (node), env validation, i18n intent-key catalog, design primitives.
  - Stage 09 App shell: PASS — Expo Router navigation, providers, onboarding + loop + support routes.
  - Stage 10 First vertical slice: PARTIAL — the arriving-home loop runs end-to-end on-device with
    real persistence across restart, the rule-based decision engine, the relationship-safety gate,
    the consent/age gate, and the rule-based crisis diversion. The live-backend e2e + RLS assertions
    (TASK-210) are HELD on founder Supabase credentials.
  - **Validation gate (ADR-006): OPEN.** The pre-code discovery (four critical assumptions) is NOT
    done and NOT fabricated; it remains required before beta (Stage 15). See docs/VALIDATION_PLAN.md.
- Verification (this run):
  - `npm run typecheck` (tsc --noEmit): PASS.
  - `npm test` (jest): PASS — 6 suites, 36 tests (decision engine, safety gate + crisis matcher,
    consent/age gate, North Star, app-data model, local-first persistence round-trip).
  - `npm run lint` (expo lint): PASS.
  - `npx expo export -p android`: PASS — the app bundles for the Android target.
  - Device/emulator run + lock-screen notification preview: NOT run here (needs a device; TASK-370).
- Independent security/privacy/safety review (2026-09-09): no P0. Safety/consent/lock-screen/RLS
  logic verified correct. Actioned in this run:
  - P1 (server-side capture-consent gate missing) — FIXED: added `user_capture_allowed()` +
    BEFORE INSERT capture-gate triggers on all special-category tables (supabase/migrations/0002).
  - P2 (inconclusive free_note deny test) — FIXED: the test now exercises the trigger in isolation
    and adds a capture-gate deny case (supabase/tests/rls_allow_deny.sql).
  - P3 (deep-link could reach loop writers; crisis scan only on outcome note; `set_updated_at`
    search_path) — FIXED: added `(loop)/_layout.tsx` route guard + defensive gates in AppState;
    extended the rule-based crisis scan to capture free-text; pinned the trigger search_path.
  - **P2 (at-rest encryption / MASVS-STORAGE-1) — TRACKED as a PRE-BETA RELEASE BLOCKER:** the local
    document is plaintext in AsyncStorage; move to encrypted storage (expo-secure-store + encrypted
    SQLite/MMKV) behind the Store port before real user data / beta. Deferred within the slice per
    the review; must land before Stage 14/15.
- Blockers (real, external):
  - Supabase project + publishable/anon key (enables cloud sync, live auth, TASK-210 RLS e2e).
  - Android/iOS device or emulator (on-device run, notification lock-screen verification TASK-370).
  - Apple/Google developer accounts + signing (Stage 14 release; not needed now).
  - Discovery/validation evidence (ADR-006) before beta.
- Decisions requiring human input (stop conditions): provisioning credentials/paid accounts; any
  product-scope/business-model/medical-claim change; public release/submission; approving beta before
  validation.
- Next eligible action: run Audit #1 (Stage 11) on the slice, then continue Phase 4 breadth
  (full F-002 narration + F-003 observation + F-008 weekly summary), authoring per-feature i18n and
  safety copy for review. Wire the Supabase SyncingStore + TASK-210 when credentials arrive.

## Implementation status by task (Phase 0–3)

- TASK-000 Expo+TS strict scaffold — DONE
- TASK-010 Lint/format/module boundaries — DONE (eslint-config-expo)
- TASK-020 Test runner + harness — DONE (jest node; RLS harness authored in supabase/tests)
- TASK-030 Env schema + validation — DONE (src/config/env.ts, .env.example)
- TASK-040 Supabase config placeholders — DONE (guarded client; migrations authored)
- TASK-050 CI baseline — PARTIAL (playbook-integrity CI green; a JS typecheck/lint/test CI is the next add)
- TASK-060 i18n intent-key catalog — DONE (src/i18n; TR authored, EN mirrored)
- TASK-070 Router shells S-01…S-12 — PARTIAL (slice screens live: onboarding, loop, support)
- TASK-080 Providers + state — DONE (src/state/AppState.tsx)
- TASK-090 Loading/empty/error boundaries — PARTIAL (loading + gate states; broader boundaries in Phase 4)
- TASK-100 Auth gate + safety-override hook — PARTIAL (consent/age gate live; Supabase auth pending creds)
- TASK-120 users row + consent flags + first-run — DONE locally (model + onboarding); migration authored
- TASK-130 Typed data layer boundary — DONE (src/data)
- TASK-140 Slice migration + owner-only RLS + free_note barrier — DONE (supabase/migrations 0001/0002)
- TASK-150 Seed experiment_library — DONE (src/data/library-seed.ts + migration 0003)
- TASK-160 Create+confirm arriving-home moment — DONE (src/app/(loop)/capture.tsx + model)
- TASK-170 Select experiment + relationship-safety gate — DONE (select.tsx + domain/safety + model)
- TASK-180 Decision rule + right-moment notification — DONE (pure engine tested; notifications adapter; device send pending)
- TASK-190 Transition card via deep-link, reveal-after-open — PARTIAL (in-app card done; notification tap deep-link pending device)
- TASK-200 Log outcome + persist + risk-phrase diversion — DONE (outcome.tsx + model + safety scan)
- TASK-210 Vertical-slice e2e against live backend + RLS asserts — BLOCKED (founder Supabase credentials)

## Quality commands

- install: `npm ci`
- dev: `npx expo start`
- lint: `npm run lint`
- typecheck: `npm run typecheck`
- test: `npm test`
- build (bundle check): `npx expo export -p android`
- e2e: pending live Supabase (TASK-210)
- database tests: `supabase/tests/rls_allow_deny.sql` (run against a branch DB after `supabase db push`)

## Changelog

- 2026-09-09 — Planning Stages 02–07 drafted; playbook OS installed; ADR-001…ADR-009; PR #1.
- 2026-09-09 — Founder authorized engineering (ADR-010); built the local-first first vertical slice
  (Stages 08–10): Expo+TS strict, rule-based decision engine, relationship-safety gate, consent/age
  gate, rule-based crisis diversion, North Star count, on-device persistence; Supabase schema + RLS +
  free_note barrier + seed authored (ADR-011). typecheck/lint/jest green; Android bundle exports.
  Validation gate (ADR-006) kept open; TASK-210 held on credentials.
