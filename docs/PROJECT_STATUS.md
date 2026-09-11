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
  - `npm test` (jest): PASS — 11 suites, 69 tests (decision engine, safety gate + crisis matcher,
    consent/age gate, North Star, WHO-5, weekly summary, app-data model, local-first persistence
    round-trip, sync mapping/merge, SyncingStore reconciliation, **notification prefs + engine integration**).
  - `npm run lint` (expo lint): PASS.
  - `npx expo export -p android`: PASS — bundles for Android (1392 modules) with the SyncingStore + F-013 screen.
  - **Live Postgres (project hcbrunppfgakxxpyzbqn), 2026-09-10:** the permanent isolated `koturutin`
    schema migrations (0001/0002/0003) were APPLIED and a 12-point isolation + authorization matrix
    run via role impersonation — ALL PASS (see TASK-210 below); test rows cleaned up (zero residue).
  - Device/emulator run + lock-screen notification preview: NOT run here (needs a device; TASK-370).
- **Audit #1 (Stage 11, 2026-09-09): CONDITIONAL → resolved.** Independent QA of the slice.
  Actioned: P1 (right-moment notification path unwired) — FIXED: `decideNotification` + the
  notification adapter are now wired on experiment activation (schedule) and a tap→S-06 handler in
  `_layout.tsx` (TASK-180/190). P2s — FIXED: experiment copy resolved from intent keys (no hardcoded
  literals / raw-key fallback, F-012); the if-then plan now references the confirmed moment (F-005);
  the last outcome is surfaced on Home after reload; added tests for the single-priority invariant and
  the not_now/declined transitions; enlarged touch targets to ≥44 with non-color-only selection.
  Tracked (pre-beta): enforce `experiment_library.enabled` only with both review flags; always-visible
  safety affordance on loop screens (Phase 7). Stage 11 PASS on slice scope; live-backend RLS e2e
  (TASK-210) now unblockable with the provided Supabase credentials.
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
  - **Cloud sync activation — 2 minimal founder steps on the shared project (ADR-012):**
    1. Enable an auth method (e.g. anonymous sign-in) so a session / `auth.uid()` exists for RLS.
    2. Add `koturutin` to PostgREST "Exposed schemas" (Dashboard → Settings → API). Deliberately NOT
       done via SQL — it is project-wide config the other apps rely on. Until both are done the app is
       fully local-first and `SyncingStore.sync()` cleanly SKIPS.
    (The isolated schema itself is already applied + proven on live Postgres — no dedicated project
    is needed; the founder directed the shared project be used with schema isolation.)
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
- TASK-050 CI baseline — DONE (.github/workflows/ci.yml: npm ci + typecheck + lint + test; playbook-integrity CI also green)
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
- TASK-210 Vertical-slice e2e against live backend + RLS asserts — **DONE (schema+authorization);
  device e2e pending.** The permanent, ISOLATED `koturutin` schema (ADR-012) is APPLIED to the shared
  project `hcbrunppfgakxxpyzbqn` (migrations 0001 schema/tables, 0002 RLS/grants/barriers, 0003 seed).
  A 12-point isolation + authorization matrix ran on live Postgres via role impersonation, ALL PASS:
  u1 insert/read own (allow); read `experiment_library` (allow, 3 rows) but write denied; `safety_events`
  read denied; `free_note` column write denied; u2 read u1's rows → 0 (deny); u2 insert row owned by u1
  → RLS WITH CHECK deny; anon read denied; free_note trigger denies with consent OFF and allows with
  consent ON; capture-consent gate denies capture without age+health consent. Isolation diff: nothing in
  `public` changed (94 tables, unchanged), NO trigger added to `auth.users`, all koturutin functions +
  35 policies + 17 triggers live under `koturutin`. Test rows cleaned up → zero residue (only the 3
  seeded library rows remain). The app's **SyncingStore** (local-first push/pull/merge/retry, free_note
  never uploaded) is implemented + unit-tested (src/data/syncing-store.ts + supabase/sync-mapping.ts)
  and wired into AppState via `.schema('koturutin')`. Remaining (founder-gated, see Blockers): enable an
  auth method + expose `koturutin` to PostgREST, then run the in-app sign-in→persist→reload e2e on a device.

### Phase 4 (Stage 12) core features — in progress
- F-003 Three-day observation (S-03) — DONE locally (src/app/(loop)/observe.tsx + model addObservation + tests)
- F-008 Weekly learning summary (S-08) — DONE locally, rule-based/correlational, no LLM
  (src/domain/summary/weekly.ts + tests; src/app/(loop)/week.tsx)
- F-011 Privacy & data control (S-09) — PARTIAL (src/app/(settings)/settings.tsx: consent management,
  language, client-side export via Share, health-consent withdrawal, delete-all-data/account). "Delete
  AI memory" deferred until insights are persisted; cloud delete/export via Edge Function pending creds.
- F-014 Optional WHO-5 wellbeing check (S-09 sub-view, UF-015) — DONE locally: opt-in, non-diagnostic
  5-item reflection with pure scoring (src/domain/who5 + tests) and a calm result; gated on consent.
- F-013 Notification settings (S-09) — DONE locally: a settings screen to control the decision
  engine's inputs — daily proactive budget (0–2; "0" fully disables proactive nudges) and one
  same-day quiet interval — persisted to the profile and synced via the users row (src/app/(settings)/
  notifications.tsx + model.setNotificationPrefs + tests; engine-integration tests included).
- F-002 full day narration — NEXT.

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
- 2026-09-10 — Isolated `koturutin` schema (ADR-012) APPLIED to the shared project and PROVEN on live
  Postgres (12-point isolation+authorization matrix, all pass; zero residue; public/auth.users
  untouched). Rewrote migrations 0001/0002/0003 to the `koturutin` schema (no auth.users FK/trigger).
  Built + unit-tested the local-first SyncingStore (push/pull/merge/retry, free_note never uploaded)
  and wired it into AppState via `.schema('koturutin')`. typecheck/lint/61 tests green; Android bundle
  exports. Cloud sync activation now needs 2 founder dashboard steps (auth method + Exposed schemas).
