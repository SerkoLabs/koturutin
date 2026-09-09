# Implementation Plan

> **Product source of truth:** the authoritative product spine and the approved planning chain
> README → `docs/PRODUCT_SPEC.md` → `docs/USER_FLOWS.md` → `docs/ARCHITECTURE.md` → `docs/DATABASE.md`.
> This plan uses those documents' exact IDs: features **F-001…F-014** (PRODUCT_SPEC), screens
> **S-01…S-12** and flows **UF-001…UF-015** (USER_FLOWS), decisions **ADR-001…ADR-009**
> (`docs/DECISIONS.md`), and the core entities **users, moments, routine_edges, experiments,
> attempts, outcomes, insights, experiment_library, observations, safety_events**.

> **⛔ PRE-CODE GATE (product requirement — do not bypass).** No application code, migration, or
> dependency install may begin until **both** of the following are true:
> 1. the **Stage 07 gate** on this IMPLEMENTATION_PLAN passes (plan is consistent with the approved
>    design chain and the next task needs no architectural invention), **and**
> 2. the **pre-code validation gate** in `docs/VALIDATION_PLAN.md` (ADR-006) is cleared — the four
>    critical assumptions confirmed via problem interviews → founder diary → concierge pilot →
>    clickable prototype.
>
> Until both clear, `docs/PROJECT_STATUS.md` holds the Stage 08 transition. Phase 0 below is the
> first work that may run **after** the gate, not before it.

## Planning rules

- Dependency order (every task lists its blocking task IDs).
- Small reviewable tasks (one focused coding run each).
- No application code before this plan is accepted by its gate **and** the validation gate clears.
- The first vertical slice is explicit (Phase 3) and end-to-end with real auth/RLS and no hidden mocks.
- Quality/security/localization/safety work lives **inside** the feature phases that own it, not dumped
  at the end. Localization (F-012) is authored per-feature via intent keys from Phase 0 onward; the
  safety domain modules and pathways (F-010, crisis matcher, relationship-safety gate, smoking-stance
  routing) are built with the features that first need them (Phases 2–4) because spine §8/§10 require
  safety to be always-free and always-visible. Phase 6 finalizes localization/notification parity and
  Phase 7 **hardens and verifies** the already-implemented safety and authorization surfaces.

### Version policy (research-first)

Exact package/SDK/tooling versions (Expo, React Native, TypeScript, Supabase JS/CLI, expo-router,
expo-notifications, expo-secure-store, expo-localization, test runner, EAS) are **not pinned in this
plan**. They MUST be confirmed against **current official documentation at build time** (Stage 08),
recorded in `docs/DECISIONS.md`, and pinned in the lockfile (AGENTS.md §6; ARCHITECTURE §2; ADR-003).
Verification commands below are written tool-agnostically; concrete command strings are recorded in
`docs/PROJECT_STATUS.md` once tooling is chosen.

### Beta (must-have) vs post-beta scope

- **Beta / MVP (this plan, Phases 0–9):** all of F-001…F-014, the single active experiment loop,
  rule-based notifications, safety pathways, privacy/data control, TR + EN, and store readiness.
- **Post-beta (out of this plan; spine §12/§16, ADR-001/ADR-007):** multiple day maps, advanced
  patterns, voice-narration richness, rich library, adaptation/ML, research infrastructure. No
  community/social, no streaks, no dark patterns — ever.

---

## Phase 0 — Repository/tooling foundation

Corresponds to lifecycle Stage 08. Establishes a strict, testable, secrets-safe scaffold. No product
behavior yet.

### TASK-000 — Expo + TypeScript strict scaffold
- Purpose: Create the runnable Expo + React Native app skeleton with TypeScript strict mode so all
  later work is type-safe (ARCHITECTURE §2/§4; ADR-003; expo-supabase-mobile skill).
- Work: Initialize the Expo managed-workflow project; enable `tsconfig` strict (`strict`,
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` where feasible); create the module skeleton
  `src/{data,domain,state,local,i18n,notifications,ui,config}` and `supabase/{functions,migrations}`
  as empty typed placeholders; add a trivial typed entrypoint that renders a shell screen.
- Likely affected files/modules: `app/`, `src/**`, `supabase/**`, `tsconfig.json`, `package.json`,
  `app.json`/`app.config.ts`.
- Dependencies: none (first task after the pre-code gate).
- Acceptance criteria:
  - [ ] `tsconfig` has strict mode on and typecheck passes on the empty scaffold.
  - [ ] The module directories from ARCHITECTURE §4 exist with typed placeholders.
  - [ ] App boots to a placeholder screen on iOS and Android simulators.
  - [ ] Versions were confirmed against current official docs and recorded in `docs/DECISIONS.md`.
- Verification: `<install>`; `<typecheck>`; launch on one iOS and one Android target.
- Complexity: Small
- Risk notes: Version drift — mitigate by research-first confirmation and lockfile pinning. Do not add
  dependencies beyond the scaffold (AGENTS.md §8 "Never add dependencies without concrete need").

### TASK-010 — Lint, format, and module-boundary rules
- Purpose: Enforce consistent style and the ARCHITECTURE §4 dependency direction automatically.
- Work: Configure the linter + formatter; add import-boundary lint rules so `src/domain` imports no
  I/O modules and the UI never imports the Supabase client directly (must go through `src/data`); add
  editor/format config.
- Likely affected files/modules: lint/format config, `package.json` scripts, `src/**`.
- Dependencies: TASK-000.
- Acceptance criteria:
  - [ ] Lint and format run clean on the scaffold.
  - [ ] A test import that violates the `domain`→no-I/O or `ui`→data-only boundary fails lint.
  - [ ] Format is idempotent (running twice yields no diff).
- Verification: `<lint>`; `<format --check>`; add a deliberately-bad import in a scratch file and
  confirm lint fails, then remove it.
- Complexity: Small
- Risk notes: Overly strict rules can block legitimate work; keep the boundary rules to the documented
  direction only.

### TASK-020 — Test runner + unit and RLS-integration harness skeletons
- Purpose: Stand up the two test layers the product must prove: pure-domain unit tests and Supabase
  RLS allow/deny integration tests (ARCHITECTURE §20).
- Work: Configure the unit test runner with one passing domain smoke test; scaffold an RLS integration
  harness that can spin up a disposable/branch Supabase database and run SQL/JS allow-deny assertions
  (kept empty of real tables until Phase 3). Add coverage reporting for `src/domain`.
- Likely affected files/modules: test config, `src/domain/__tests__/`, `supabase/tests/` (or
  equivalent), `package.json` scripts.
- Dependencies: TASK-000.
- Acceptance criteria:
  - [ ] `<test>` runs and the domain smoke test passes.
  - [ ] The RLS harness can connect to a disposable/branch DB and run a trivial allow/deny assertion.
  - [ ] Test scripts are separated: unit vs RLS/integration.
- Verification: `<test>`; `<test:rls>` against a throwaway/branch database.
- Complexity: Medium
- Risk notes: The RLS harness needs a disposable database, not production; ensure it never targets a
  real project (secrets from env only).

### TASK-030 — Env schema, `.env.example`, and runtime config validation
- Purpose: Make configuration explicit and secrets-safe; fail fast on missing config (ARCHITECTURE
  §19; AGENTS.md §8 "keep secrets out of client code and git").
- Work: Implement `src/config` with a validated env schema (client-safe vars only: Supabase URL,
  anon/publishable key, analytics key); validate at startup with a clear error; commit `.env.example`
  with placeholder names and **no secret values**; document that `service_role` and the LLM provider
  key are Edge-Function-only and never appear in app/client env.
- Likely affected files/modules: `src/config/`, `.env.example`, `.gitignore`.
- Dependencies: TASK-000.
- Acceptance criteria:
  - [ ] Missing/invalid required env fails startup with an explicit message.
  - [ ] `.env.example` lists only client-safe placeholders; no real secrets are committed.
  - [ ] `service_role`/LLM key are documented as Edge-Function-only and absent from client config.
  - [ ] `.env*` (except `.env.example`) is git-ignored.
- Verification: `<typecheck>`; unit test for the config validator (valid + invalid cases); grep the
  repo/build output to confirm no privileged key is present.
- Complexity: Small
- Risk notes: A privileged key leaking into client config is a P0 (ARCHITECTURE R2); the schema must
  make that structurally impossible.

### TASK-040 — Supabase project config placeholders + local dev stack
- Purpose: Prepare Supabase configuration and local development without provisioning paid resources or
  committing secrets (ADR-003/ADR-004; AGENTS.md §13).
- Work: Add `supabase/config.toml` (or equivalent) for local dev; document the project-linking
  procedure using founder-provided keys at build time; establish the migrations directory and the
  Edge Functions directory conventions; add placeholders for the three planned functions
  (`ai-assist`, `weekly-summary`, `library-rank`) with no logic yet.
- Likely affected files/modules: `supabase/config.toml`, `supabase/migrations/`, `supabase/functions/`.
- Dependencies: TASK-000, TASK-030.
- Acceptance criteria:
  - [ ] The local Supabase stack starts from committed config with no secrets in the repo.
  - [ ] Function directories exist as typed placeholders; no `service_role` usage yet.
  - [ ] Linking to a real project is documented as a founder-credential step (stop condition, not done here).
- Verification: `<supabase start>` locally; confirm no secret values are committed (secret scan).
- Complexity: Small
- Risk notes: Real project provisioning + keys are founder-owned assets (stop condition per AGENTS.md
  §2); this task only prepares config.

### TASK-050 — CI baseline
- Purpose: Block merges on a red gate: install → typecheck → lint → unit tests → RLS tests → build
  (ARCHITECTURE §21; AGENTS.md §10).
- Work: Add a CI workflow that runs the pinned-lockfile install, typecheck (strict), lint, unit tests,
  the RLS allow/deny suite against a disposable/branch DB, and a build check; wire secret scanning.
  Secrets are injected out-of-band, never printed to logs.
- Likely affected files/modules: `.github/workflows/`, `package.json` scripts, `docs/PROJECT_STATUS.md`
  (record concrete commands).
- Dependencies: TASK-010, TASK-020, TASK-030.
- Acceptance criteria:
  - [ ] CI runs all stages and fails the build on any red stage.
  - [ ] Secret scanning runs and blocks on a detected secret.
  - [ ] No secret value appears in CI logs.
  - [ ] Concrete command strings are recorded in `docs/PROJECT_STATUS.md`.
- Verification: Open a PR with a deliberate type error and confirm CI fails; then a clean PR passes.
- Complexity: Medium
- Risk notes: RLS tests need a disposable DB in CI; ensure the branch/throwaway DB is torn down and is
  never a production project.

### TASK-060 — i18n intent-key catalog scaffold (F-012 foundation)
- Purpose: Establish the bilingual system as language-neutral intent keys from day one so every later
  screen is authored in TR + EN, not translated after the fact (spine §11; ADR-008; F-012).
- Work: Implement `src/i18n` with the intent-key catalog structure (e.g. `transition.home.arrival.connection`),
  locale resolution via expo-localization, a tone dimension (calm/direct/warm), a typed `t(key)`
  accessor that fails loudly on a missing key, and seed `tr`/`en` entries for shell/common strings.
- Likely affected files/modules: `src/i18n/`, catalog files (`tr`, `en`).
- Dependencies: TASK-000.
- Acceptance criteria:
  - [ ] `t()` resolves an intent key to TR and EN and is fully typed (unknown key is a type/lint error).
  - [ ] Locale resolves from device settings with a documented default and in-app override hook.
  - [ ] A missing key in either language is caught by a test/CI check (see TASK-340).
  - [ ] No user-facing string is hardcoded in shell components.
- Verification: `<typecheck>`; unit test for key resolution + missing-key detection in both languages.
- Complexity: Medium
- Risk notes: Safety/crisis copy is authored later under legal+clinical review (TASK-360); the scaffold
  must not ship placeholder safety copy as if approved.

---

## Phase 1 — App shell/navigation

Corresponds to lifecycle Stage 09. Real navigation, providers, and boundaries; no feature pretends to
work yet.

### TASK-070 — Expo Router route groups for S-01…S-12 shells
- Purpose: Create the navigable shell for every screen so flows UF-001…UF-015 have real destinations
  (ARCHITECTURE §5; spine §6).
- Work: Build the Expo Router groups `(onboarding)` [S-11, S-12, S-01], `(loop)` [S-02…S-08],
  `(support)` [S-10], `(settings)` [S-09] with typed routes and placeholder screens that render their
  purpose and use i18n keys. No business logic in `app/`.
- Likely affected files/modules: `app/(onboarding)/`, `app/(loop)/`, `app/(support)/`,
  `app/(settings)/`, `src/i18n`.
- Dependencies: TASK-060.
- Acceptance criteria:
  - [ ] All twelve screens S-01…S-12 are reachable via typed routes.
  - [ ] Screen titles/labels come from intent keys in TR and EN.
  - [ ] `app/` contains no data or decision logic.
- Verification: `<typecheck>`; manual navigation smoke on iOS + Android reaching each S-ID.
- Complexity: Medium
- Risk notes: Keep routes privacy-safe (no sensitive params in deep-link URLs; see TASK-190).

### TASK-080 — Providers and lightweight state slices
- Purpose: Wire session, i18n, theme, and the small ephemeral store (ARCHITECTURE §6) at the root.
- Work: Add a root layout with providers for auth/session status, i18n/locale, and a Zustand-class
  store holding session status, active-experiment reference, daily notification-budget counters, and
  quiet-window status. No Redux/heavy cache (documented in ARCHITECTURE §6).
- Likely affected files/modules: `app/_layout.tsx`, `src/state/`, `src/i18n`.
- Dependencies: TASK-070.
- Acceptance criteria:
  - [ ] Providers mount once at the root; store slices are typed and small.
  - [ ] Locale switching re-renders strings from intent keys.
  - [ ] No business rule lives in a component.
- Verification: `<typecheck>`; unit test for store slices; manual locale-switch check.
- Complexity: Medium
- Risk notes: Avoid premature state machinery; adding a cache/query lib is a new ADR, not a default.

### TASK-090 — Loading / empty / error / offline boundaries
- Purpose: Guarantee startup and failure states never crash the app (ARCHITECTURE §17; AGENTS.md §8).
- Work: Implement reusable `src/ui` states (loading, empty, error+retry, offline/degraded) and a global
  error boundary; ensure safety pathways and the (future) decision engine are reachable offline.
- Likely affected files/modules: `src/ui/`, `app/_layout.tsx`.
- Dependencies: TASK-080.
- Acceptance criteria:
  - [ ] Every shell screen renders loading, empty, and error+retry states.
  - [ ] A thrown render error is caught by the boundary, not a white screen.
  - [ ] Offline start still renders shell + the safety route (S-10).
- Verification: `<test>` for boundary components; manual airplane-mode start reaching S-10.
- Complexity: Medium
- Risk notes: Offline safety access is a spine §10 requirement; do not gate S-10 behind network/auth.

### TASK-100 — Navigation guards: auth gate + safety-override hook
- Purpose: Encode the two navigation-level guarantees: unauthenticated users reach only `(onboarding)`
  and S-10; the crisis matcher can interrupt any screen and route to the crisis view (ARCHITECTURE §5).
- Work: Add an auth-gate guard and a safety-override navigation hook wired to a **stub** crisis matcher
  interface in `src/domain/safety` (real rules land in Phase 4/Phase 7). The override is a
  navigation-level guarantee, not a screen the user must find.
- Likely affected files/modules: `app/_layout.tsx`, `src/state`, `src/domain/safety` (interface only).
- Dependencies: TASK-080, TASK-090.
- Acceptance criteria:
  - [ ] Unauthenticated navigation to a `(loop)`/`(settings)` route redirects to onboarding; S-10 stays reachable.
  - [ ] Firing the stub safety signal routes to the crisis view from any screen.
  - [ ] The override cannot be dismissed into normal coaching flow without passing the safety view.
- Verification: `<test>` for the guard logic (pure); manual: attempt deep navigation while signed out.
- Complexity: Medium
- Risk notes: The stub must be clearly marked and tracked for replacement (AGENTS.md §8 mock rule);
  real matcher + tested copy is TASK-300/TASK-360.

---

## Phase 2 — Authentication/user model

Real Supabase auth, the `users` row with consent flags, and the typed data boundary. This underpins
the vertical slice.

### TASK-110 — Supabase auth + secure session (S-12, UF-014)
- Purpose: Real sign-in/up with an explicit, secure session lifecycle (ARCHITECTURE §8; F-014).
- Work: Integrate Supabase Auth; store tokens in `expo-secure-store` (never in the SQLite content
  store or logs); implement explicit session bootstrap + refresh; handle offline-during-auth per
  UF-014; wire the S-12 screen.
- Likely affected files/modules: `app/(onboarding)/` [S-12], `src/data/auth`, `src/local` (SecureStore),
  `src/state` (session).
- Dependencies: TASK-100, TASK-040.
- Acceptance criteria:
  - [ ] A user can create an account and sign in against the dev Supabase project.
  - [ ] Tokens live only in SecureStore; refresh works after expiry; sign-out clears them.
  - [ ] Auth failure and offline states show a clear recoverable message (UF-014).
  - [ ] No token or credential is written to logs/analytics/SQLite.
- Verification: `<test>` for session-state reducer; manual sign-in/refresh/sign-out on device; grep
  logs to confirm no token leakage.
- Complexity: Medium
- Risk notes: Token mishandling is a MASVS issue (verified again in TASK-390). Auth method specifics
  confirmed research-first and recorded via ADR.

### TASK-120 — `users` row, consent flags, smoking stance, first-run (F-001, S-11/S-01, UF-001)
- Purpose: Model the user's preferences, consents, and safety settings with owner-only RLS (spine §5;
  F-001; ADR-004).
- Work: Migration for `users` (language `tr`/`en`, timezone, notification budget, quiet windows,
  privacy choices; the canonical consent set — **required** `consent_health_processing`,
  optional-OFF `consent_personalization`/`consent_research`/`consent_free_text_to_model`,
  `consent_updated_at`, opt-in-OFF `analytics_enabled`, and `age_confirmed_18`; smoking stance
  `quitting`/`reducing`/`noticing`/`not_ready`) with owner-only RLS (`auth.uid() = id`) and explicit
  grants; build S-11 onboarding — capture **age (self-attested 18+)** and the **required
  `consent_health_processing`** BEFORE any observation/craving capture, then the three optional
  model-use consents (default OFF); build S-01 intent capture; persist via `src/data` (spine §21 R2/R6).
- Likely affected files/modules: `supabase/migrations/`, `app/(onboarding)/` [S-11, S-01],
  `src/data/users`, `src/domain/map` (intent), `src/i18n`.
- Dependencies: TASK-110.
- Acceptance criteria:
  - [ ] A `users` row is created on first run with the three optional consents and `analytics_enabled` defaulting OFF (spine §9/§10).
  - [ ] Onboarding records `age_confirmed_18` and requires `consent_health_processing = true` before any observation/craving capture; declining leaves only safety resources (S-10) reachable.
  - [ ] Language selection switches copy immediately via intent keys; smoking stance is captured.
  - [ ] Owner-only RLS: the owner can read/write their row; another user's JWT and anon are denied.
  - [ ] Skipping the intent is allowed and still routes to F-002 (UF-001).
- Verification: `<test:rls>` allow/deny for `users`; unit test for onboarding state + the health-processing/age gate; manual first-run in TR + EN.
- Complexity: Medium
- Risk notes: Optional-consent-default-OFF and the **required** health-processing consent captured
  before capture are legal/privacy requirements (KVKK special-category, GDPR Art. 9(2)(a)); a
  default-ON optional consent, or capturing data before health-processing consent, is a P0 privacy defect.

### TASK-130 — Typed data layer boundary (`src/data`) baseline
- Purpose: Establish the single boundary that talks to Supabase, mapping rows (snake_case) ↔ TS types
  (PascalCase) and validating shape (ARCHITECTURE §4/§7; spine §5).
- Work: Implement the `src/data` pattern — one typed use-case function per read/write — with row↔type
  mappers and boundary validation; add the auth-context accessor; wire a write-queue interface for
  offline retries (used by later logging tasks). No feature tables yet beyond `users`.
- Likely affected files/modules: `src/data/`, `src/local` (write queue), `src/domain` types.
- Dependencies: TASK-120.
- Acceptance criteria:
  - [ ] All Supabase access is funneled through `src/data`; the lint boundary rule (TASK-010) holds.
  - [ ] Row↔type mappers are unit-tested for `users`.
  - [ ] Malformed rows are rejected at the boundary with a typed error.
- Verification: `<test>` for mappers + validation; `<lint>` confirms no direct client import in UI.
- Complexity: Medium
- Risk notes: This boundary is where RLS-respecting access is centralized; bypassing it later is a
  correctness/security risk.

---

## Phase 3 — First vertical slice

Corresponds to lifecycle Stage 10. **This phase proves the architecture end-to-end on one real
transition before any breadth work.**

### First vertical slice — explicit definition (spine §17)

**The single "arriving home" transition, end-to-end, with real auth and owner-only RLS and no hidden
mocks:**

`sign in (S-12) → create one confirmed "arriving home" moment (minimal S-02 → S-04) → pick one
experiment from the seeded library — the "90-second family contact, then conscious choice" connection
experiment — at "arriving home" (S-05), passing the relationship-safety gate → receive a right-moment
local reminder that is lock-screen-safe (S-06 via notification) → log an outcome (S-07) → reload the
app and see the attempt + outcome persisted, with owner-only RLS enforced.`

- **Success path:** each step persists a real row (`moments`, `experiments`, `attempts`, `outcomes`)
  owned by the signed-in user; reload re-fetches and shows the persisted outcome.
- **Failure paths handled (no hidden mocks):**
  - Notification permission denied → in-app fallback entry to the transition card; clear explanation.
  - Offline write → queued to the on-device store with a visible "saved on your device / not yet
    synced" state, then retried (never a silent loss).
  - RLS deny → another user's JWT / anon cannot read or write the slice rows (proven by test).
  - Relationship-unsafe context on the connection experiment → the connection action is **not**
    presented; an alternative support path (S-10) is offered instead.
- **Reproducible verification:** an automated e2e test (TASK-210) plus the RLS allow/deny suite; the
  slice contains no production-critical mock.

### TASK-140 — Slice DB migration + owner-only RLS (moments, experiments, attempts, outcomes, experiment_library)
- Purpose: Create the minimum schema the slice writes/reads, each with owner-only RLS and explicit
  grants (spine §5; DATABASE.md; AGENTS.md §13).
- Work: Migrations for `moments` (name, time window, context, verification status
  `hypothesis`/`confirmed`, priority flag), `experiments` (function label, duration band, difficulty,
  safety class, `if_this_then_that`, active flag with a **one-active-experiment** constraint),
  `attempts` (offered_at, transition, response `offered`/`did`/`not_now`/`declined`, reason),
  `outcomes` (craving 0–10, energy, mood, connection feeling, free note), and read-only
  `experiment_library`. Owner-only RLS (`auth.uid() = user_id`) + grants on every client-exposed table;
  `experiment_library` is read-only to clients; index policy-predicate/FK/filter columns. **`outcomes`
  is column-scoped: the client is not granted write on `outcomes.free_note`, and a `BEFORE INSERT OR
  UPDATE` trigger rejects a non-null `free_note` unless `consent_free_text_to_model = true` (spine §21 R3).**
- Likely affected files/modules: `supabase/migrations/`, `docs/DATABASE.md` (source), `src/data` types.
- Dependencies: TASK-130.
- Acceptance criteria:
  - [ ] RLS is enabled on every new client-exposed table; `experiment_library` is client-read-only.
  - [ ] The one-active-experiment invariant is enforced at the DB layer (constraint), not only in UI.
  - [ ] Sensitive `outcomes.free_note` handling matches ADR-004 (local-first) AND the R3 server-side barrier: no client column write on `free_note`; trigger blocks a non-null `free_note` when `consent_free_text_to_model = false` (deny test in TASK-350).
  - [ ] Indexes exist for FK/filter/policy-predicate columns.
- Verification: `<test:rls>` allow/deny per table; migration applies cleanly on a branch DB; attempt to
  activate a second experiment fails.
- Complexity: Large
- Risk notes: A table shipped without RLS is a P0 (ARCHITECTURE R1). Migrations only after DATABASE.md
  is approved; destructive changes need a rollback strategy (AGENTS.md §8 "Never").

### TASK-150 — Seed the experiment_library (arriving-home connection experiment + minimum families)
- Purpose: Provide the curated, read-only content the slice selects from (spine §8; F-009).
- Work: Seed `experiment_library` with the "90-second family contact, then conscious choice"
  connection experiment for the "arriving home" transition, plus at least one entry per function
  family needed for the slice; each entry carries its function label, duration band, safety class, and
  — for the connection family — the **relationship-safety requirement** consumed by the gate. Bilingual
  copy (TR + EN) via intent keys.
- Likely affected files/modules: `supabase/migrations/` (seed), `src/i18n` (library copy keys).
- Dependencies: TASK-140.
- Acceptance criteria:
  - [ ] The arriving-home connection experiment exists with TR + EN copy and a safety-gate flag.
  - [ ] Library rows are readable by any authenticated user but writable by none from the client.
  - [ ] No morality/causal language in any entry (spine §1.2/§5 phrasing rules).
- Verification: `<test:rls>` read-only enforcement; unit test that connection entries carry the safety flag.
- Complexity: Small
- Risk notes: Library content is clinically/culturally reviewed material (spine §8); placeholder
  content must be marked and replaced before beta.

### TASK-160 — Create one confirmed "arriving home" moment (minimal S-02 → S-04)
- Purpose: Let the user produce one confirmed `moments` row for the slice (F-002/F-004 minimal path).
- Work: A minimal card-based S-02 capture that creates a hypothesis `moments` row for "arriving home"
  plus its `routine_edges` (balcony + cigarette + coffee), and a minimal S-04 confirm step that flips
  verification status to `confirmed` and sets the priority flag. Full narration/observation come in
  Phase 4.
- Likely affected files/modules: `app/(loop)/` [S-02, S-04], `src/data/moments`, `src/domain/map`.
- Dependencies: TASK-140, TASK-130.
- Acceptance criteria:
  - [ ] The user creates and confirms one "arriving home" moment; status becomes `confirmed`.
  - [ ] The moment and its edges persist under owner-only RLS.
  - [ ] Copy renders in TR and EN via intent keys.
- Verification: `<test:rls>` for `moments`/`routine_edges`; manual create→confirm; reload shows the confirmed moment.
- Complexity: Medium
- Risk notes: Keep this minimal — full F-002/F-004 is Phase 4; do not over-build the slice.

### TASK-170 — Pick one experiment + relationship-safety gate (S-05, F-005/F-010 relationship-safety gate)
- Purpose: Select the single active experiment for the priority moment and enforce the relationship-
  safety gate for the connection family before activation (F-005/F-006; spine §10; UF-005/UF-011).
- Work: S-05 reads `experiment_library` (read-only) for the arriving-home function, presents the
  connection experiment, and — because it is the connection family — runs the relationship-safety gate
  (`src/domain/safety`); if the context is unsafe, the connection action is withheld and an alternative
  support path (S-10) is offered. On safe selection, create the single active `experiment` (if-then plan)
  bound to the confirmed moment.
- Likely affected files/modules: `app/(loop)/` [S-05], `app/(support)/` [S-10], `src/domain/safety`,
  `src/data/experiments`.
- Dependencies: TASK-150, TASK-160, TASK-100.
- Acceptance criteria:
  - [ ] Selecting the connection experiment always passes through the relationship-safety gate (UF-011).
  - [ ] An unsafe context withholds the connection action and routes to an alternative support path.
  - [ ] Exactly one active experiment exists after selection (DB constraint from TASK-140 holds).
  - [ ] The if-then plan and function label persist under owner-only RLS.
- Verification: `<test>` for the gate (safe vs unsafe); `<test:rls>` for `experiments`; manual select flow in TR + EN.
- Complexity: Medium
- Risk notes: The connection experiment is **not** assumed safe (spine §10); a missing gate is a P0
  safety defect. Gate copy is tested/approved (finalized in TASK-360).

### TASK-180 — Minimal decision rule + right-moment local notification (lock-screen safe)
- Purpose: Schedule a right-moment local reminder for the confirmed transition, respecting budget and
  quiet windows, with a lock-screen-safe payload (F-006/F-013; spine §10/§11; ARCHITECTURE §14).
- Work: Implement a minimal pure decision rule in `src/domain/decision-engine` (given the transition
  window + budget + quiet-window state → schedule/none) and a `src/notifications` adapter using
  expo-notifications that schedules a local notice carrying **only an opaque reference** (lock-screen
  copy like "A transition moment is coming up" / "Bir geçiş anı yaklaşıyor") — never the behavior text.
  Enforce ≤2 proactive notifications/day and quiet windows.
- Likely affected files/modules: `src/domain/decision-engine/`, `src/notifications/`, `src/state`
  (budget counters), `src/i18n` (notification copy).
- Dependencies: TASK-170.
- Acceptance criteria:
  - [ ] A local notification is scheduled for the arriving-home window within budget and outside quiet windows.
  - [ ] The notification payload contains no sensitive/behavior text — only an opaque reference.
  - [ ] Budget exhaustion or an active quiet window yields no proactive notification.
  - [ ] The engine rule is a pure, unit-tested function (no I/O).
- Verification: `<test>` for the decision rule (budget/quiet/none cases); manual scheduled-notification
  receipt on iOS + Android with lock-screen preview inspected.
- Complexity: Large
- Risk notes: Sensitive text on the lock screen is a P0 privacy defect (spine §10); verified again on
  real devices in TASK-370. Notification permission is requested per-feature (data minimization).

### TASK-190 — Transition card via notification deep-link (S-06), reveal-after-open
- Purpose: Open the transition card only after the app is opened/unlocked, resolving the opaque
  reference to the real content (F-006; ARCHITECTURE §5; spine §10/§11).
- Work: Handle the notification tap → deep-link to S-06 → resolve the opaque reference through
  `src/data` → render "do now / remind later / not suitable"; sensitive detail appears only in-app.
  Provide an in-app entry to S-06 as the fallback when notification permission is denied.
- Likely affected files/modules: `app/(loop)/` [S-06], `src/notifications` (handler), `src/data`.
- Dependencies: TASK-180.
- Acceptance criteria:
  - [ ] Tapping the notification opens S-06 with the real experiment content resolved in-app.
  - [ ] No sensitive content is derivable from the notification payload/URL.
  - [ ] With notification permission denied, the user still reaches S-06 in-app (UF-006 fallback).
- Verification: manual: tap notification → S-06 shows content; inspect the deep-link URL for absence of
  sensitive params; permission-denied fallback works.
- Complexity: Medium
- Risk notes: Deep links must be privacy-safe (no sensitive params) — a MASVS deep-link check
  (TASK-390).

### TASK-200 — Log outcome (S-07) + persist with owner-only RLS
- Purpose: Record the proximal outcome of the attempt and prove persistence + RLS on reload (F-007;
  spine §5; UF-007).
- Work: On "do now," record an `attempts` row (`response = did`) and an `outcomes` row (craving/energy/
  mood/connection + optional local-first free note); "remind later" records `not_now` and reschedules;
  "not suitable" records `declined`. Free notes are stored on-device and synced only per consent
  (ADR-004). Reload re-fetches and displays the persisted outcome.
- Likely affected files/modules: `app/(loop)/` [S-07], `src/data/attempts`, `src/data/outcomes`,
  `src/local` (free note), `src/state`.
- Dependencies: TASK-190, TASK-130.
- Acceptance criteria:
  - [ ] "do now" persists an attempt + outcome; reload shows them (owner-only RLS enforced).
  - [ ] "remind later" records `not_now` and reschedules within budget; "not suitable" records `declined`.
  - [ ] The free note is device-local unless free-text consent is ON.
  - [ ] A risk phrase in the note diverts to the crisis flow before saving coaching state (UF-007).
- Verification: `<test:rls>` for `attempts`/`outcomes`; e2e persistence on reload (part of TASK-210);
  unit test for the risk-phrase diversion.
- Complexity: Medium
- Risk notes: Silent loss of an outcome is unacceptable — offline writes queue and retry with a visible
  state (ARCHITECTURE §7).

### TASK-210 — Vertical-slice e2e test + failure-path coverage (no hidden mocks)
- Purpose: Prove the whole slice reproducibly with real auth/RLS and explicit failure handling
  (AGENTS.md §9; ARCHITECTURE §20).
- Work: Author an e2e test that runs the full slice against the dev/branch Supabase project: sign in →
  confirm the arriving-home moment → select the connection experiment (safe context) → schedule +
  resolve the right-moment card → log the outcome → reload and assert persistence. Add failure-path
  assertions: notification-permission-denied fallback, offline write queue + retry, RLS deny for a
  second user / anon, and the relationship-unsafe branch offering an alternative path. No
  production-critical mock.
- Likely affected files/modules: e2e test suite, `src/data`, `src/domain`, test harness config.
- Dependencies: TASK-200, TASK-170, TASK-180, TASK-020.
- Acceptance criteria:
  - [ ] The success path passes end-to-end against a real (branch/dev) backend with RLS on.
  - [ ] Each documented failure path is asserted (permission-denied, offline, RLS deny, unsafe context).
  - [ ] No hidden mock stands in for auth, DB, RLS, or the decision engine in the slice.
  - [ ] The test is runnable in CI against a disposable/branch DB.
- Verification: `<test:e2e>` locally and in CI; the RLS deny assertions are green.
- Complexity: Large
- Risk notes: This is the Stage 10 gate and the input to Audit #1; a passing demo with mocked backend
  does **not** satisfy it. On PASS, Audit #1 runs before Phase 4 breadth.

---

## Phase 4 — Core product features

Corresponds to lifecycle Stage 12. Implements the remaining features F-002…F-014 in dependency order,
extending (not duplicating) the slice. Localization is authored per-feature (F-012); the safety
pathways (F-010) and privacy controls (F-011) are delivered here because they must be always-visible.

### TASK-220 — F-002 Day narration full (cards + voice) → draft map (S-02, UF-002)
- Purpose: Let the user narrate a typical day by cards or voice and produce a draft `moments`/
  `routine_edges` map (spine §3.1; F-002).
- Work: Extend S-02 to full card-based narration and (consent + mic-permission-gated) voice capture;
  persist draft moments/edges for confirmation in F-004; card mode always works with no special
  permission (UF-002 fallback when free-text-to-model consent is OFF). A risk phrase in narration
  diverts to the crisis flow before any coaching content (UF-002).
- Likely affected files/modules: `app/(loop)/` [S-02], `src/data/moments`, `src/domain/map`,
  `src/domain/safety`, `src/i18n`.
- Dependencies: TASK-160, TASK-300 (crisis matcher available), TASK-060.
- Acceptance criteria:
  - [ ] Card narration works with no special permission; voice requires mic permission + consent.
  - [ ] Draft moments/edges persist for F-004 confirmation.
  - [ ] A risk phrase diverts to the crisis flow before coaching content appears (UF-002).
  - [ ] TR + EN via intent keys.
- Verification: `<test>` for draft-derivation + risk diversion; manual card + voice paths; `<test:rls>` for writes.
- Complexity: Large
- Risk notes: Voice/free-text goes to the model only with explicit consent (ADR-002/ADR-004); default OFF.

### TASK-230 — `ai-assist` narrative-parsing Edge Function (consent-gated, candidate-only)
- Purpose: Turn a day story into **candidate** routine nodes without turning anything into fact
  (spine §9; ADR-002; ARCHITECTURE §10).
- Work: Implement `supabase/functions/ai-assist` that, only when free-text-to-model consent is ON,
  parses narration into candidate time/transition/behavior/function suggestions and returns them for
  user confirmation; enforce the §9 limits (no auto-fact, no diagnosis, no causal language); hold the
  LLM key and `service_role` in the function environment only.
- Likely affected files/modules: `supabase/functions/ai-assist/`, `src/data` (typed caller).
- Dependencies: TASK-220, TASK-040.
- Acceptance criteria:
  - [ ] With consent OFF, the function is never called; card parsing is used instead.
  - [ ] Output is candidate-only and never persisted as confirmed without user action.
  - [ ] The LLM key/`service_role` exist only in the function env, never in the client.
  - [ ] A contract test enforces the §9 limits (no causal/diagnostic phrasing in output handling).
- Verification: function contract test (candidate-only, consent-gated); secret scan confirms no key in bundle.
- Complexity: Large
- Risk notes: Model output becoming "fact" without confirmation violates spine §9 (P1). Free text
  withheld without consent (ARCHITECTURE §20 AI-boundary test).

### TASK-240 — F-003 Three-day observation loop (S-03, UF-003)
- Purpose: Capture 10–20s check-ins over three days with no prescription on day 1 (spine §3.2; F-003).
- Work: Implement the `observations` table (context, behavior, craving, energy, timestamp) and the S-03
  lightweight capture; schedule budgeted, quiet-window-respecting prompts (via the notification adapter
  and F-013); allow early end → proceed to F-004 with partial data clearly labeled. Risk phrase diverts
  to crisis flow (UF-003).
- Likely affected files/modules: `supabase/migrations/` (observations), `app/(loop)/` [S-03],
  `src/data/observations`, `src/notifications`, `src/domain/safety`.
- Dependencies: TASK-140 (RLS pattern), TASK-180 (scheduling), TASK-300 (crisis matcher).
- Acceptance criteria:
  - [ ] `observations` has owner-only RLS; check-ins persist offline and sync when able.
  - [ ] No prescription/experiment is offered during observation.
  - [ ] Early end proceeds to F-004 with a clear lower-confidence label.
  - [ ] Reminders respect budget + quiet windows (F-013).
- Verification: `<test:rls>` for `observations`; unit test for the no-prescription rule; manual 3-day sim.
- Complexity: Medium
- Risk notes: Observation load is a validation assumption (spine §14); keep captures genuinely short.

### TASK-250 — F-004 Full day-map review & confirm + correlation guards (S-04, UF-004)
- Purpose: Let the user correct assumptions and confirm the map with trigger/behavior/benefit/cost/
  confidence, picking the priority moment (spine §3.3; F-004).
- Work: Extend S-04 to full review of `routine_edges` (immediate benefit/function label, delayed cost,
  confidence, evidence_count), user corrections, and priority-moment selection; enforce the
  `src/domain/insights` correlation-language guard (forbid causal/diagnostic phrasing) in TR + EN; route
  to F-005. "No chain feels right" allows re-narration or extended observation (UF-004).
- Likely affected files/modules: `app/(loop)/` [S-04], `src/data/routine_edges`, `src/domain/map`,
  `src/domain/insights`, `src/i18n`.
- Dependencies: TASK-240, TASK-160.
- Acceptance criteria:
  - [ ] The user can correct any edge's function/cost and confirm the map; priority moment is set.
  - [ ] Causal/diagnostic phrasing is rejected by the guard in both languages.
  - [ ] Correction rate is captured as a trust signal (feeds F-008), not a success metric.
  - [ ] "No chain feels right" offers re-narration/extended observation; the map is never forced.
- Verification: `<test>` for the correlation guard (TR + EN); `<test:rls>` for edges; manual confirm flow.
- Complexity: Large
- Risk notes: Causal phrasing is a spine §5/§9 violation (P1 trust defect).

### TASK-260 — F-009 Experiment library UI + ranking (S-05 full, UF-005)
- Purpose: Present the full curated library ranked 2–3 context-fit options per function (spine §8; F-009).
- Work: Complete `experiment_library` seeding across all function families (waking/energy, relief/
  transition, connection, attention/silence, craving, avoidance/procrastination, sleep); implement
  ranking of 2–3 options by function + context — via the `library-rank` Edge Function or an on-device
  ranker (chosen research-first, recorded as ADR). Graceful fallback + content-gap logging when a
  family is unseeded (UF-005). Connection entries carry the relationship-safety requirement; smoking
  context surfaces the support entry (no medical advice).
- Likely affected files/modules: `supabase/migrations/` (seed), `supabase/functions/library-rank/`
  (optional), `app/(loop)/` [S-05], `src/data`, `src/domain`.
- Dependencies: TASK-170, TASK-150.
- Acceptance criteria:
  - [ ] 2–3 context-fit options are ranked per priority function; library stays client-read-only.
  - [ ] An unseeded family falls back supportively and logs a content gap.
  - [ ] Ranking never free-form prescribes treatment/medication (spine §9 limit).
  - [ ] All entries bilingual with no morality/causal language.
- Verification: `<test>` for ranking + fallback; `<test:rls>` read-only; manual per-family selection.
- Complexity: Large
- Risk notes: Library content must be clinically/culturally reviewed before beta; mark placeholders.

### TASK-270 — F-006 + F-013 Full decision engine + "not now" learning + budget/quiet windows
- Purpose: Complete the explainable rule-based JITAI engine across all decision points with adaptation
  variables and back-off learning (spine §7; F-006/F-013; ARCHITECTURE §14).
- Work: Extend `src/domain/decision-engine` to all transitions (waking, leaving home, arriving at work,
  break, arriving home, after meal, bedtime) with adaptation variables (time window, optional consented
  location, last response, current craving/energy, 7-day notification load); intervention options
  (nothing/pause/delay/substitution/environment change/contact action/support referral); ≤2/day budget;
  quiet windows; "not now" → reschedule/back-off learning; one-tap "this is wrong" inference correction
  surfacing which data drove a suggestion.
- Likely affected files/modules: `src/domain/decision-engine/`, `src/notifications`, `src/state`,
  `app/(loop)/` [S-06], `src/data` (attempts/responses).
- Dependencies: TASK-180, TASK-200, TASK-260.
- Acceptance criteria:
  - [ ] Engine is a pure, fully unit-tested function: budget exhaustion → nothing; quiet window →
        nothing; repeated `not_now` → back-off/reschedule; correct option per transition + variables.
  - [ ] The user can see which data drove a suggestion and correct a wrong inference in one tap.
  - [ ] Location is used only with explicit permission; default no location.
  - [ ] Only one experiment is active at a time across all transitions.
- Verification: `<test>` covering every rule branch; manual "not now" back-off + inference-correction.
- Complexity: Large
- Risk notes: Engine correctness is safety/trust-critical (ARCHITECTURE §20). No ML in v1 (ADR-002).

### TASK-280 — F-008 Weekly learning summary (S-08, UF-008) + insights
- Purpose: Interpret the week in correlation language, user-confirmed, and pick the next experiment
  (spine §3.7; F-008).
- Work: Implement `insights` (text, evidence_count, confidence, user_confirmed) with evidence types
  `user_said`/`seen_together`/`experiment_result`; build the `weekly-summary` Edge Function that
  compresses logs into plain, non-judgmental, non-causal language (§9 limits); S-08 presents the
  pattern as correlation, the user confirms/corrects, then loops to F-005 for the next small experiment.
- Likely affected files/modules: `supabase/migrations/` (insights), `supabase/functions/weekly-summary/`,
  `app/(loop)/` [S-08], `src/data/insights`, `src/domain/insights`, `src/i18n`.
- Dependencies: TASK-250, TASK-270, TASK-200.
- Acceptance criteria:
  - [ ] The summary uses correlation language only; the guard rejects causal/diagnostic phrasing (TR+EN).
  - [ ] Every insight shows its evidence and a one-tap "this is wrong" correction.
  - [ ] The user confirms/corrects the summary; a next experiment can be chosen (loops to F-005).
  - [ ] `insights` has owner-only RLS.
- Verification: `<test>` for phrasing guard + evidence display; function contract test; `<test:rls>`.
- Complexity: Large
- Risk notes: Presenting correlation as causation/diagnosis is a P1 product-principle violation.

### TASK-290 — F-007 Full outcome logging polish (local-first free note)
- Purpose: Complete outcome capture beyond the slice: full craving/energy/mood/connection + local-first
  sensitive note handling (F-007; ADR-004).
- Work: Finalize S-07 capture and the on-device store for free notes (SQLite), sync/withhold per
  free-text consent; ensure no automatic outcome inference; longitudinal views belong to F-008 only.
- Likely affected files/modules: `app/(loop)/` [S-07], `src/local`, `src/data/outcomes`.
- Dependencies: TASK-200.
- Acceptance criteria:
  - [ ] Free notes are device-local by default; synced only when free-text consent is ON.
  - [ ] No outcome is auto-inferred; the user enters it.
  - [ ] Risk phrase in the note diverts to the crisis flow before saving (UF-007).
- Verification: `<test>` for consent-gated sync + risk diversion; manual note create offline → sync on consent.
- Complexity: Medium
- Risk notes: Sensitive note leaving the device without consent is a P0 privacy defect.

### TASK-300 — F-010 Safety & support pathways (S-10) + crisis matcher + smoking + relationship gate
- Purpose: Deliver the always-free, always-visible safety pathways and the rule-based safety domain
  modules the earlier features depend on (spine §10; F-010; ADR-005; UF-009/UF-010/UF-011).
- Work: Implement `src/domain/safety` for real: the crisis matcher (explicit risk phrases → predefined,
  human-reviewed, tested-copy pathway that STOPS coaching and routes to local emergency + professional
  resources), the relationship-safety gate (connection experiment alternative), and smoking-stance
  routing (`quitting`/`reducing`/`noticing`/`not_ready`) keeping ALO 171 + family physician +
  professional referral free and visible with **no** medical/withdrawal/medication advice. Build the
  S-10 screen (reachable offline and without auth) and the `safety_events` audit table (rule-triggered
  pathway, timestamp, pathway, resolution, minimal PII). This replaces the TASK-100 stub matcher.
- Likely affected files/modules: `app/(support)/` [S-10], `src/domain/safety/`,
  `supabase/migrations/` (safety_events), `src/data/safety_events`, `src/i18n` (safety copy), `app/_layout.tsx`.
- Dependencies: TASK-100, TASK-140.
- Acceptance criteria:
  - [ ] Crisis matching is rule-based (no LLM dependency) and stops normal coaching, routing to resources.
  - [ ] The relationship-safety gate withholds the connection action in unsafe contexts and offers an alternative.
  - [ ] Smoking pathway keeps ALO 171/family physician free and visible; gives no medical/med advice; a
        lapse does not reset a streak (there is no streak) and re-assesses trigger/readiness.
  - [ ] S-10 is reachable offline and without an account; safety is never behind a paywall.
  - [ ] `safety_events` logs pathway/resolution with minimal PII under owner-only RLS.
  - [ ] Safety copy is authored for legal + clinical review in TR + EN (final approval tracked to TASK-360).
- Verification: `<test>` for crisis/relationship/smoking matchers; `<test:rls>` for `safety_events`;
  manual offline S-10 reach.
- Complexity: Large
- Risk notes: Leaving crisis to a generative model is forbidden (ADR-005). Unapproved safety copy must
  not ship — approval is a legal/clinical stop point verified in Phase 7.

### TASK-310 — F-011 Privacy & data control (S-09/S-12, UF-012)
- Purpose: Give the user full control: consent separation, model-provider disclosure, retention,
  export, and deletion of routine nodes / AI memory / account (spine §10; F-011; ADR-004).
- Work: Build S-09 privacy controls — the canonical consent set (required `consent_health_processing`
  with withdrawal that stops the loop; separate optional `consent_personalization`/`consent_research`/
  `consent_free_text_to_model`; opt-in `analytics_enabled`) with easy withdrawal; disclose whether free
  text **and structured special-category data** go to a third-party model (training/secondary use
  default OFF; structured-data transmission gated by `consent_personalization`); user-chosen retention
  windows purged on **both** the cloud and the on-device local store (spine §21 R4); data export as a
  **client-side merge of cloud rows + the on-device local store** (spine §21 R5); delete any routine
  node, the AI memory, and the account (with the S-12 deletion entry). Deletions cascade per DATABASE.md.
- Likely affected files/modules: `app/(settings)/` [S-09], `app/(onboarding)/` [S-12],
  `src/data` (delete/export/local-purge use cases), `supabase/migrations/` (cascade/retention), `src/i18n`.
- Dependencies: TASK-120, TASK-300, TASK-140.
- Acceptance criteria:
  - [ ] The optional consents are separate, default OFF, and withdrawable; the required health-processing consent is withdrawable and its withdrawal stops the loop; withdrawal takes effect immediately.
  - [ ] Model-provider disclosure is visible; training/secondary use defaults OFF; structured-data-to-model is gated by `consent_personalization`.
  - [ ] The user can export their data (cloud + on-device merge — a locally-held unsynced free note appears in the export) and delete a node / the AI memory / the whole account.
  - [ ] Deletion cascades correctly and leaves no orphaned sensitive rows; retention windows are enforced on **both** cloud rows and the on-device local sensitive store (R4).
- Verification: `<test>` for consent-gating + export shape; `<test:rls>` deletion/cascade; manual delete-account flow.
- Complexity: Large
- Risk notes: Account deletion is also a store requirement (TASK-450). Incomplete deletion of
  special-category data is a P0 privacy/legal defect.

### TASK-320 — F-014 Optional bi-weekly WHO-5 wellbeing check (S-09 sub-view, UF-015)
- Purpose: Offer the optional, non-diagnostic WHO-5 (5 items, last two weeks) as an outcome measure
  (spine §10; F-014; UF-015).
- Work: Implement the optional bi-weekly WHO-5 (validated Turkish form) reached from S-09 Settings as a
  measurement sub-view (UF-015), with an **explicit in-flow opt-in** (beyond `consent_health_processing`)
  and clear "optional, not a diagnostic tool" framing; store the score under owner-only RLS; never gate
  any feature on it.
- Likely affected files/modules: `app/(settings)/` or `app/(loop)/` (entry), `src/data`,
  `supabase/migrations/`, `src/i18n`.
- Dependencies: TASK-310, TASK-140.
- Acceptance criteria:
  - [ ] WHO-5 is optional and clearly framed as non-diagnostic in TR + EN.
  - [ ] Score persists under owner-only RLS; no feature is blocked when it is skipped.
  - [ ] It is presented at most bi-weekly and never nags.
- Verification: `<test>` for scoring; `<test:rls>`; manual optional-skip path.
- Complexity: Small
- Risk notes: Must not be presented as a diagnosis (spine §10); wording reviewed with safety copy.

---

## Phase 5 — Social/community features

**N/A.** The spine explicitly places community feed, couples/social accounts, and social competition
**out of MVP** (spine §13 non-goals) and forbids engagement dark patterns and streaks (spine §1.3/§12,
ADR-001/ADR-007). There is no social/community surface to build. Re-open only via a documented scope
decision (new ADR) with founder sign-off — never as a default.

---

## Phase 6 — Notifications/localization

Finalizes the notification scheduling engine and TR/EN parity. Localization was authored per-feature
throughout Phases 0–4; this phase closes coverage and parity and hardens scheduling across all
transitions.

### TASK-330 — Notification scheduling engine hardening (rule-driven, budget/quiet, "not now")
- Purpose: Consolidate right-moment scheduling across all decision points with budget/quiet-window
  enforcement and lock-screen-safe payloads (F-006/F-013; ARCHITECTURE §14).
- Work: Harden the `src/notifications` adapter so it is purely engine-driven (drives, never decides);
  enforce ≤2 proactive/day and quiet windows globally; implement reschedule on "not now" back-off; keep
  every payload an opaque reference; handle permission changes and OS notification limits gracefully.
- Likely affected files/modules: `src/notifications/`, `src/domain/decision-engine`, `src/state`.
- Dependencies: TASK-270.
- Acceptance criteria:
  - [ ] Budget and quiet windows are enforced across all transitions, not per-screen.
  - [ ] No proactive notification carries sensitive/behavior text.
  - [ ] "not now" reschedules with back-off; permission revocation degrades gracefully to in-app entry.
- Verification: `<test>` for scheduling rules; manual multi-transition day on iOS + Android.
- Complexity: Medium
- Risk notes: Over-notifying violates spine §1.6/§6; the ≤2/day budget is a hard product rule.

### TASK-340 — TR/EN parity + bilingual QA workflow (F-012)
- Purpose: Guarantee complete, natural, reviewed TR + EN copy with no missing keys (spine §11; ADR-008).
- Work: Complete the intent-key catalog coverage for every screen S-01…S-12 and every notification;
  add a CI check that fails on any key missing in either language; run tone QA (calm/direct/warm) per
  language; establish the expert bilingual review workflow (culture: family contact, tea/coffee
  rituals) — EN is not a word-for-word copy. Safety copy review is completed in TASK-360.
- Likely affected files/modules: `src/i18n/` (catalog tr/en), CI config, `docs/PROJECT_STATUS.md`.
- Dependencies: TASK-060, and all Phase 1–4 UI tasks (keys authored).
- Acceptance criteria:
  - [ ] No user-facing string is hardcoded; every key resolves in TR and EN.
  - [ ] CI fails on a missing key in either language.
  - [ ] Tone variants exist where specified; cultural adaptation reviewed (not literal translation).
- Verification: `<test>` missing-key scan; `<lint>` no-hardcoded-string check; reviewer sign-off recorded.
- Complexity: Medium
- Risk notes: Literal translation breaks cultural fidelity (spine §11); safety copy needs legal+clinical
  approval before beta (TASK-360).

---

## Phase 7 — Moderation/security

> **Note on placement.** The safety-flow *implementation* (crisis matcher, relationship-safety gate,
> smoking-stance routing, S-10) lives in Phases 3–4 (TASK-170, TASK-300) because spine §8/§10 require
> safety to be always-free and always-visible — it is not deferred to the end. This phase **hardens and
> verifies** those already-built surfaces and delivers the full authorization/security test matrix,
> secrets hygiene, lock-screen privacy verification, and OWASP MASVS baseline. Runs with / feeds
> Audit #2.

### TASK-350 — RLS allow/deny test matrix for every client-exposed table
- Purpose: Prove, per table, that owner access is allowed and all unauthorized access is denied
  (spine §5/§10; ARCHITECTURE §9/§20; AGENTS.md §13).
- Work: Author allow/deny integration tests for **every** client-exposed table (users, moments,
  routine_edges, experiments, attempts, outcomes, insights, observations, safety_events, and
  experiment_library read-only): owner CRUD allowed; another user's JWT and the anon role denied read
  and write; `experiment_library` writes denied from the client; the one-active-experiment invariant
  enforced; **the `free_note` server-side barrier (spine §21 R3)** — a direct client INSERT/UPDATE of a
  non-null `outcomes.free_note` with `consent_free_text_to_model = false` is denied (column grant +
  trigger), and permitted with consent via the Edge Function. Wire into CI against a branch/disposable DB.
- Likely affected files/modules: `supabase/tests/` (or RLS harness), CI config.
- Dependencies: TASK-140, TASK-240, TASK-280, TASK-300, TASK-310, TASK-320, TASK-020.
- Acceptance criteria:
  - [ ] Every client-exposed table has an allow test and explicit deny tests (other user + anon).
  - [ ] `experiment_library` client writes are denied; reads allowed to authenticated users.
  - [ ] The one-active-experiment invariant is enforced by test.
  - [ ] The `free_note` barrier is tested on the **direct client path**: write denied with consent OFF (column grant + trigger), allowed with consent ON via the Edge Function (R3).
  - [ ] A table lacking a deny test fails the gate.
- Verification: `<test:rls>` full matrix in CI; a deliberately weakened policy makes a deny test fail.
- Complexity: Large
- Risk notes: Deny-path tests are mandatory (ARCHITECTURE §20); a missing/weak policy is a P0
  (ARCHITECTURE R1). Never weaken RLS to make a test pass (AGENTS.md §8).

### TASK-360 — Safety-flow verification, tested-copy QA, and red-team
- Purpose: Verify the rule-based safety flows behave correctly and their bilingual copy is approved
  (spine §9/§10; ADR-005).
- Work: Red-team the crisis matcher (risk-phrase coverage, no LLM reliance, STOP-coaching guarantee,
  navigation override from any screen), the relationship-safety gate, and smoking-stance routing;
  confirm the legal + clinical review sign-off on all crisis/smoking/privacy copy in TR + EN; review the
  `safety_events` audit for minimal-PII correctness; verify a lapse never resets a streak.
- Likely affected files/modules: `src/domain/safety/`, `src/i18n` (safety copy), `app/_layout.tsx`,
  `docs/DECISIONS.md`/`docs/PROJECT_STATUS.md` (sign-off record).
- Dependencies: TASK-300, TASK-100, TASK-340.
- Acceptance criteria:
  - [ ] Crisis flow triggers on the reviewed risk phrases, stops coaching, and routes to resources — with no LLM in the decision path.
  - [ ] The relationship-safety gate and smoking routing behave per spine §10 in tested cases.
  - [ ] Legal + clinical sign-off on bilingual safety copy is recorded; unapproved copy does not ship.
  - [ ] `safety_events` contains only minimal PII.
- Verification: `<test>` safety matcher suites (TR + EN); manual override from multiple screens;
  documented review sign-off.
- Complexity: Medium
- Risk notes: Copy approval is a legal/clinical stop point (AGENTS.md §2) — if sign-off is unavailable,
  hold beta rather than ship unreviewed safety copy.

### TASK-370 — Lock-screen privacy verification on real devices
- Purpose: Prove no sensitive/behavior text ever appears in a notification preview (spine §10;
  ARCHITECTURE §5/§22).
- Work: On real iOS and Android targets, inspect lock-screen and banner previews for every proactive
  notification type; confirm payloads are opaque references and sensitive detail appears only after
  open/unlock; test with previews hidden and shown.
- Likely affected files/modules: `src/notifications/`, test notes in `docs/PROJECT_STATUS.md`.
- Dependencies: TASK-330, TASK-190.
- Acceptance criteria:
  - [ ] No notification preview shows behavior/sensitive text on either platform.
  - [ ] Sensitive content is revealed only after the app is opened/unlocked.
- Verification: manual on ≥1 iOS + ≥1 Android device, with screenshots/notes recorded.
- Complexity: Small
- Risk notes: A sensitive lock-screen preview is a P0 privacy defect and a release blocker.

### TASK-380 — Secrets hygiene + secret scanning
- Purpose: Ensure privileged secrets never enter the client and anon/publishable keys rely on RLS, not
  secrecy (spine §5/§19; ARCHITECTURE §9/§19; AGENTS.md §8).
- Work: Verify `service_role` and the LLM provider key exist only in Edge Function/CI environments;
  confirm the client bundle contains only client-safe config; keep secret scanning green in CI; audit
  logs/analytics for accidental secret or token inclusion.
- Likely affected files/modules: `src/config`, CI config, `supabase/functions/*` env docs.
- Dependencies: TASK-030, TASK-050, TASK-230.
- Acceptance criteria:
  - [ ] No `service_role`/LLM key is present in the app bundle or client env (verified by scan + grep).
  - [ ] Secret scanning is green and blocks on any introduced secret.
  - [ ] No secret/token appears in logs, analytics, or CI output.
- Verification: secret scan in CI; inspect a built bundle for key strings; log audit.
- Complexity: Small
- Risk notes: A leaked `service_role`/LLM key is a full-compromise P0 (ARCHITECTURE R2).

### TASK-390 — OWASP MASVS baseline checks
- Purpose: Apply the mobile security baseline (AGENTS.md §12).
- Work: Verify secure local storage (tokens in SecureStore; sensitive logs in the encrypted on-device
  store; nothing sensitive in plaintext prefs/logs), token handling/refresh, minimal + justified native
  permissions (notifications; mic only for voice narration; optional location only with explicit
  opt-in), network/transport security, and privacy-safe deep links (no sensitive params).
- Likely affected files/modules: `src/local`, `src/data/auth`, `app.json`/`app.config.ts` (permissions),
  deep-link config.
- Dependencies: TASK-110, TASK-180, TASK-190, TASK-290.
- Acceptance criteria:
  - [ ] Tokens/sensitive data are in secure/encrypted storage only; none in plaintext.
  - [ ] Requested permissions are minimal, per-feature, and justified with rationale strings.
  - [ ] Deep links carry no sensitive parameters.
  - [ ] MASVS baseline findings are recorded and P0/P1 items resolved.
- Verification: security-review skill checklist; manual permission-prompt audit; deep-link inspection.
- Complexity: Medium
- Risk notes: Over-broad permissions violate data minimization (spine §10) and store policy (TASK-460).

---

## Phase 8 — Analytics/performance

Minimal, privacy-respecting instrumentation for the North Star, plus a performance pass. Delivered with
Stage 12/13.

### TASK-400 — Privacy-respecting minimal analytics (opt-in via `analytics_enabled`, swappable)
- Purpose: Instrument product-value events without surveillance (spine §15; ARCHITECTURE §16; ADR-007).
- Work: Add a thin, swappable analytics adapter emitting event-minimal events with **no** sensitive
  content (no free text, no raw craving/mood as identifiable payloads, no location); gated by the
  opt-in `analytics_enabled` flag (OFF by default), which is **separate** from the `consent_*` flags
  (spine §21 R2); the concrete EU-friendly/self-hostable vendor is chosen research-first and
  recorded as an ADR; analytics never gates or degrades safety/privacy features.
- Likely affected files/modules: `src/analytics` (adapter), `src/state`, `src/config`.
- Dependencies: TASK-310 (consent/settings), TASK-030.
- Acceptance criteria:
  - [ ] Events fire only when `analytics_enabled = true` and carry no sensitive content.
  - [ ] The adapter is swappable behind one interface; the vendor choice is recorded via ADR.
  - [ ] Disabling analytics never degrades safety/privacy features.
- Verification: `<test>` for the adapter (consent off → no emit; payload has no sensitive fields).
- Complexity: Medium
- Risk notes: Sensitive data in analytics is a P0 privacy defect (ARCHITECTURE §16).

### TASK-410 — North-star instrumentation (weekly successful conscious transitions)
- Purpose: Measure the North Star and activation/proximal-outcome signals, not engagement (spine §15;
  ADR-007).
- Work: Instrument the North Star (weekly successful conscious transitions — a real-life choice, i.e.
  attempt `did` at a chosen transition), activation (map confirmed + first experiment planned), and
  proximal outcome (craving/energy/connection change); explicitly avoid streak/time-in-app/loss-aversion
  metrics; track retention/opt-out only as load/trust signals.
- Likely affected files/modules: `src/analytics`, `src/domain` (event derivation), `src/data`.
- Dependencies: TASK-400, TASK-200, TASK-280.
- Acceptance criteria:
  - [ ] The North-Star event fires on a successful conscious transition and is countable weekly.
  - [ ] Activation and proximal-outcome events are instrumented.
  - [ ] No streak/time-in-app/dark-pattern metric exists; retention/opt-out are labeled trust signals.
- Verification: `<test>` for event derivation; a dashboard/query spec produces the weekly North-Star count.
- Complexity: Medium
- Risk notes: A dark-pattern metric slipping in violates spine §1/§12 (ARCHITECTURE R13).

### TASK-420 — Performance pass (cold start, loop responsiveness, on-device budgets)
- Purpose: Meet the ARCHITECTURE §23 performance assumptions on real devices.
- Work: Measure and tune cold start, loop-screen responsiveness, decision-engine evaluation time, and
  notification scheduling cost; ensure offline reads/writes stay responsive; confirm the on-device store
  scales for typical log volume.
- Likely affected files/modules: `src/domain`, `src/data`, `src/local`, `src/ui`.
- Dependencies: TASK-270, TASK-330, TASK-290.
- Acceptance criteria:
  - [ ] Cold start and loop navigation meet the documented targets on a mid-range device.
  - [ ] Decision-engine evaluation and scheduling are within budget with no UI jank.
  - [ ] Offline read/write paths remain responsive.
- Verification: manual profiling on ≥1 iOS + ≥1 Android device; recorded metrics vs targets.
- Complexity: Medium
- Risk notes: Keep optimizations from adding speculative complexity (AGENTS.md §1).

---

## Phase 9 — Store/release readiness

Corresponds to lifecycle Stage 14. All store-policy items are **research-first** against current
official Apple/Google policies (AGENTS.md §6/§12). Production submission and paid/store-account actions
are founder-owned stop conditions.

### TASK-430 — EAS build config + preview builds on real targets
- Purpose: Produce reproducible environment-separated builds (ARCHITECTURE §19/§21; ADR-003).
- Work: Configure EAS profiles for `development`/`preview`/`production` with environment-separated
  config and out-of-band secrets; produce preview builds and smoke-test on ≥1 real iOS and ≥1 real
  Android target (notifications + secure storage exercised).
- Likely affected files/modules: `eas.json`, `app.config.ts`, CI/CD notes in `docs/PROJECT_STATUS.md`.
- Dependencies: TASK-050, TASK-390.
- Acceptance criteria:
  - [ ] Preview builds are reproducible per environment with no committed secrets.
  - [ ] The app installs and runs the vertical slice on real iOS + Android targets.
  - [ ] Notifications and secure storage work on device.
- Verification: `<eas build --profile preview>`; on-device install + slice smoke test.
- Complexity: Medium
- Risk notes: Production build/submission requires founder-owned certificates/store accounts (stop
  condition); do not submit from CI in MVP.

### TASK-440 — Store privacy & data-safety disclosures (research-first)
- Purpose: Prepare accurate Apple privacy labels and Google Data Safety disclosures for special-category
  data (spine §10; AGENTS.md §12).
- Work: Confirm current Apple/Google disclosure requirements from official policies; document exactly
  what data is collected, whether it leaves the device, and model-provider usage; align disclosures with
  the actual consent-gated behavior (F-011) and analytics (TASK-400); reflect the **18+ age assurance /
  age rating** and the suspected-minor policy (spine §21 R6), confirming the exact KVKK/GDPR Art. 8
  requirement research-first (an Open Decision in PRODUCT_SPEC §9).
- Likely affected files/modules: store metadata docs, `docs/DECISIONS.md` (policy findings + links).
- Dependencies: TASK-310, TASK-400.
- Acceptance criteria:
  - [ ] Disclosures match actual data flows and consent behavior (no over- or under-statement).
  - [ ] Current official policy requirements are cited with source links.
  - [ ] Special-category/health-data handling is disclosed accurately (KVKK/GDPR-aware).
- Verification: cross-check disclosures against the data map and consent implementation; reviewer sign-off.
- Complexity: Medium
- Risk notes: Inaccurate disclosures are a store-rejection and legal risk; never assume policy from memory.

### TASK-450 — In-app account deletion + data export (store-required, research-first)
- Purpose: Meet the store requirement for in-app account deletion and provide data export (F-011;
  AGENTS.md §12).
- Work: Verify the F-011 account-deletion and export paths meet **current** store requirements
  (in-app-initiated deletion, deletion of server-side + on-device data, confirmation); document the
  deletion/retention behavior for reviewers.
- Likely affected files/modules: `app/(settings)`/`app/(onboarding)` [S-09/S-12], `src/data`,
  store metadata docs.
- Dependencies: TASK-310.
- Acceptance criteria:
  - [ ] Account deletion is initiable in-app and removes server + on-device data (cascade verified).
  - [ ] Data export produces the user's data in a documented format.
  - [ ] The flow meets current official store requirements (cited).
- Verification: manual delete-account on device; confirm rows/on-device data are gone; policy cross-check.
- Complexity: Medium
- Risk notes: Incomplete deletion of special-category data is a P0 legal + store defect.

### TASK-460 — Permissions justification (research-first)
- Purpose: Ensure every requested native permission is minimal, justified, and store-compliant
  (spine §10; AGENTS.md §12).
- Work: Document each permission (notifications; microphone only for voice narration; optional location
  only with explicit opt-in) with purpose strings; confirm current store requirements for these
  permissions and for health-adjacent data; ensure no permission is requested by default (per-feature).
- Likely affected files/modules: `app.config.ts` (permission + purpose strings), store metadata docs,
  `docs/DECISIONS.md`.
- Dependencies: TASK-390.
- Acceptance criteria:
  - [ ] Each permission has a clear, honest purpose string and is requested per-feature, not upfront.
  - [ ] No location/mic/contacts requested by default (data minimization).
  - [ ] Current store rules for these permissions are cited.
- Verification: manual permission-prompt walkthrough; policy cross-check with source links.
- Complexity: Small
- Risk notes: Unjustified permissions cause store rejection and violate spine §10 minimization.

### TASK-470 — Release-candidate smoke tests + release checklist + crash visibility
- Purpose: Produce a reproducible release candidate with no known release-blocking issue (Stage 14 gate).
- Work: Complete `templates/RELEASE_CHECKLIST` for koturutin; run release smoke tests (slice + safety +
  privacy + notifications) on real targets; wire crash/error visibility (research-first, EU-friendly
  reporter, no sensitive payloads); confirm rollback/hotfix path; record all findings in
  `docs/PROJECT_STATUS.md`.
- Likely affected files/modules: `docs/RELEASE_CHECKLIST.md`, `src/analytics`/error reporter,
  `docs/PROJECT_STATUS.md`.
- Dependencies: TASK-430, TASK-440, TASK-450, TASK-460, TASK-360, TASK-370.
- Acceptance criteria:
  - [ ] The release checklist is complete with evidence; smoke tests pass on real iOS + Android.
  - [ ] Crash/error visibility is active and carries no sensitive payloads.
  - [ ] A rollback/hotfix path is documented.
  - [ ] No known release-blocking policy/security/privacy issue remains.
- Verification: on-device release smoke tests; checklist review; crash-reporter test event.
- Complexity: Medium
- Risk notes: Public submission, store-account actions, and production secrets/certificates are
  founder-owned stop conditions (AGENTS.md §2); complete all repository-local work autonomously and
  report only the concrete external blockers.

---

## Gate summary

| Phase | Lifecycle stage | Exit gate |
|---|---|---|
| 0 | Stage 08 Foundation | install/typecheck/lint/test/build green (or PARTIAL w/ documented blocker); secrets safe; i18n scaffold + CI live |
| 1 | Stage 09 App shell | app starts; S-01…S-12 reachable; auth gate + safety-override hook; boundaries don't crash |
| 2 | (slice foundation) | real auth + secure session; `users` row + consents-OFF; owner-only RLS on `users`; data boundary in place |
| 3 | Stage 10 Vertical slice | the arriving-home slice passes end-to-end with real auth/RLS, success + failure paths, no hidden mocks → **Audit #1** |
| 4 | Stage 12 Core features | F-002…F-014 implemented with acceptance criteria; safety (F-010) + privacy (F-011) delivered; localization per-feature |
| 5 | — | **N/A** (out of MVP scope) |
| 6 | Stage 12 (notif/i18n) | scheduling hardened (budget/quiet/not-now, opaque payloads); full TR/EN parity with missing-key CI check |
| 7 | Stage 12/13 (security) | full RLS allow/deny matrix; safety flows verified + copy signed off; lock-screen privacy proven; secrets clean; MASVS baseline → **Audit #2** |
| 8 | Stage 12/13 (analytics/perf) | consent-gated minimal analytics; North-Star instrumented; performance targets met on device |
| 9 | Stage 14 Release readiness | reproducible EAS builds; accurate disclosures; in-app deletion/export; justified permissions; RC smoke tests green — external submission is a founder stop condition |
