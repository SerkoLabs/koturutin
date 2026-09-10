# Decisions

Record material product/architecture decisions. Do not log trivial code choices.

## ADR template

### ADR-000 — Title
- Status: Proposed / Accepted / Superseded / Rejected
- Date:
- Context:
- Decision:
- Alternatives considered:
- Why this choice:
- Consequences:
- Revisit trigger:

---

## Seeded decisions for koturutin

> These ADRs capture the material product/architecture decisions derived from the product-research
> document and encoded in the planning docs (README, PRODUCT_SPEC, USER_FLOWS, ARCHITECTURE,
> DATABASE, IMPLEMENTATION_PLAN, VALIDATION_PLAN). They are `Accepted` as the planning baseline;
> any change is a scope decision requiring founder sign-off.

### ADR-001 — Position koturutin as a contextual routine lab, not a habit tracker or AI therapist
- Status: Accepted
- Date: 2026-09-09
- Context: The market is crowded with habit trackers (Fabulous, Routinery, Habitica, Finch),
  CBT/reflection apps (Liven, Wysa, Clarity, Rosebud, Daylio, Stoic, Viven) and single-behavior
  tools (one sec, Kwit, Smoke Free). The nearest competitor is Liven.
- Decision: Position as a bilingual "contextual routine lab": make automatic daily chains visible,
  offer ONE micro-experiment at the right transition moment, and learn outcomes with the user.
- Alternatives considered: habit-streak tracker; free-form AI therapist/chat; single-behavior quit app.
- Why this choice: differentiation is a user-verified contextual routine graph + right-moment single
  experiment + explainable learning — not "we also have AI".
- Consequences: no streaks, no free-form therapy, no morality labels; success measured in real life.
- Revisit trigger: validation shows users do not value the day-map/experiment loop.

### ADR-002 — Structured data first, AI as a bounded assistant; rule-based decision engine in v1
- Status: Accepted
- Date: 2026-09-09
- Context: Generative models are unreliable as memory/therapist and unsafe as crisis deciders.
- Decision: The product's core is structured data + an explainable rule-based decision engine.
  The LLM only parses narrative, summarizes weekly logs, ranks library options, and adapts copy —
  each with hard limits. No ML in the MVP.
- Alternatives considered: LLM-centric agent; ML personalization from day one.
- Why this choice: safety, explainability, correctness before breadth, lower cost/risk.
- Consequences: an on-device, testable rule engine; AI behind consent-gated Edge Functions.
- Revisit trigger: Stage Two adaptation research shows rules are insufficient and ML is justified.

### ADR-003 — Stack: Expo + React Native + TypeScript strict + Supabase
- Status: Accepted (versions to be confirmed with research-first at build time)
- Date: 2026-09-09
- Context: Playbook default mobile stack; bilingual mobile app with private sensitive data.
- Decision: Expo + React Native + Expo Router; Supabase (Postgres + Auth + RLS + Storage + Edge Functions).
- Alternatives considered: bare React Native; Firebase; custom backend.
- Why this choice: fast reversible path, strong auth/RLS story, Edge Functions for AI boundary.
- Consequences: EAS build/release; RLS + grants discipline mandatory; service_role server-side only.
- Revisit trigger: a hard requirement Supabase cannot meet (surfaced in ARCHITECTURE review).

### ADR-004 — Local-first for sensitive data; owner-only RLS; service_role server-side only
- Status: Accepted
- Date: 2026-09-09
- Context: Mood, craving, smoking, sleep, health status and free journal text are KVKK
  special-category data and GDPR Art. 9 data.
- Decision: Prefer on-device storage for raw sensitive logs/free text; encrypt any synced sensitive
  fields; RLS owner-only (auth.uid() = user_id) on every client-exposed table; service_role only in
  trusted Edge Functions; explicitly surface what leaves the device.
- Alternatives considered: cloud-first storage of all logs.
- Why this choice: data minimization, trust, regulatory fit.
- Consequences: sync/export design is deliberate; some features may be device-scoped in MVP.
- Revisit trigger: a required feature cannot work local-first (documented tradeoff).

### ADR-005 — Crisis detection is rule-based + tested copy; safety & privacy are always free
- Status: Accepted
- Date: 2026-09-09
- Context: Leaving crisis classification to a generative model is unsafe.
- Decision: Explicit risk phrases trigger a predefined, human-reviewed, tested safety flow that
  stops normal coaching and routes to local emergency + professional resources (Turkey: ALO 171,
  family physician). A relationship-safety gate guards the connection experiment. Safety and privacy
  are never behind a paywall.
- Alternatives considered: LLM-based risk classification as the primary gate.
- Why this choice: user safety and legal caution.
- Consequences: maintained rule set + tested bilingual copy; safety_events audit; legal/clinical review.
- Revisit trigger: never remove the rule-based gate; may ADD an LLM assist only as a non-authoritative signal.

### ADR-006 — Validate before code: a ~10-week discovery gate precedes implementation Stage 08
- Status: Accepted
- Date: 2026-09-09
- Context: The research states a bigger AI system will not fix a loop humans do not find meaningful.
- Decision: Execute docs/VALIDATION_PLAN.md (problem interviews, founder diary, concierge pilot,
  clickable prototype) and confirm four critical assumptions before writing application code.
- Alternatives considered: build the MVP first, validate later.
- Why this choice: de-risk the core loop cheaply; avoid building the wrong thing.
- Consequences: PROJECT_STATUS holds the Stage 08 gate until validation exit criteria are met.
- Revisit trigger: founder explicitly accepts the risk of building before validation (scope decision).

### ADR-007 — North Star = weekly successful conscious transitions; no engagement dark patterns
- Status: Accepted
- Date: 2026-09-09
- Context: Optimizing time-in-app conflicts with the product's purpose (return the user to life).
- Decision: North Star is weekly successful conscious transitions in real life. No infinite streaks,
  no loss-aversion mechanics. Retention/opt-out are tracked as load/trust signals, not as success.
- Alternatives considered: DAU/retention/time-in-app as primary success.
- Why this choice: aligns incentives with genuine user benefit and differentiation.
- Consequences: analytics + roadmap prioritize the value action, not stickiness.
- Revisit trigger: never adopt addictive mechanics; metric definitions may refine with data.

### ADR-008 — Bilingual (TR + EN) via language-neutral intent keys, not string translation
- Status: Accepted
- Date: 2026-09-09
- Context: The product launches bilingual; culture (family contact, tea/coffee rituals) matters.
- Decision: Content is modeled as behavior-intent keys (e.g. transition.home.arrival.connection),
  then written naturally per language with separate QA; safety copy reviewed by legal + clinical in both.
- Alternatives considered: translate an English base string-by-string.
- Why this choice: cultural fidelity and safe, natural copy in both languages.
- Consequences: a message catalog keyed by intent; per-language review workflow.
- Revisit trigger: adding a third language (re-check the key taxonomy).

### ADR-009 — Map the playbook's Sol/Astra routing onto Claude Code
- Status: Accepted
- Date: 2026-09-09
- Context: The playbook's docs/MODEL_ROUTING.md names GPT models (Sol/Astra); the founder builds with
  Claude Code, and the playbook explicitly permits Claude as the implementation agent.
- Decision: Routine planning/decomposition/implementation runs on the default Claude Code model;
  high-consequence gate reviews (architecture, DB/RLS authorization, security, first vertical-slice
  audit, release) run as a separate independent reviewer pass with a stronger model / higher
  reasoning effort. Never claim a specific reviewer ran unless it actually did.
- Alternatives considered: follow Sol/Astra literally with GPT models.
- Why this choice: the founder's toolchain is Claude Code; the playbook is model-agnostic for implementation.
- Consequences: gate reviews are explicit, independent passes; routing intent (cheap routine work,
  strong independent gates) is preserved.
- Revisit trigger: the founder chooses a different implementation toolchain.

### ADR-010 — Begin engineering (Stage 08+) in parallel with the validation gate still open
- Status: Accepted
- Date: 2026-09-09
- Context: ADR-006 set a validate-first gate (docs/VALIDATION_PLAN.md) before Stage 08. The founder
  (the user) then explicitly authorized building a runnable first vertical slice now, while asking
  that the external validation requirement NOT be fabricated. AGENTS.md §0 ranks an explicit user
  instruction above the self-imposed gate.
- Decision: Proceed into Stages 08–10 to build the first vertical slice. The pre-code validation
  (four critical assumptions; problem interviews → concierge pilot → clickable prototype) remains a
  REAL, unmet gate that stays required before beta/launch (Stage 15) — it is not marked complete and
  no validation evidence is invented.
- Alternatives considered: hold all code until validation completes (rejected — founder authorized
  parallel engineering); silently treat validation as done (rejected — dishonest, unsafe).
- Consequences: PROJECT_STATUS tracks engineering progress AND keeps the validation gate open as a
  blocker to beta; VALIDATION_PLAN is preserved verbatim.
- Revisit trigger: validation completes (unblocks beta), or the founder pauses engineering.

### ADR-011 — Local-first-first vertical slice; Supabase authored but deferred to credentials
- Status: Accepted
- Date: 2026-09-09
- Context: The vertical slice must be genuinely runnable now, but a live Supabase project needs
  founder-owned credentials (a stop condition). The architecture is already local-first for sensitive
  data (ADR-004).
- Decision: Implement the whole loop against an on-device store (AsyncStorage) behind a `Store` port,
  so the slice runs and persists across restart with no backend. Author the real Supabase schema,
  RLS, grants, the free_note barrier and seed as migrations (supabase/migrations), plus a guarded
  client and the allow/deny test script — but do NOT present a live backend as wired. Auth-against-a-
  live-project and the end-to-end RLS assertions (TASK-210) stay blocked on credentials.
- Alternatives considered: SQLite for the local store now (deferred — the Store port makes swapping
  trivial later; ARCHITECTURE §11 still names SQLite as the target engine); mock a fake backend
  (rejected — AGENTS.md §8 forbids passing mocks off as finished integration).
- Consequences: a real, testable, runnable slice today; a clean path to enable cloud sync by
  implementing a SyncingStore over the same port once credentials exist.
- Revisit trigger: founder provisions Supabase (wire the SyncingStore + run TASK-210); or a hard
  requirement forces the local engine to SQLite sooner.

### ADR-012 — koturutin lives in an isolated `koturutin` Postgres schema on a SHARED Supabase project
- Status: Accepted
- Date: 2026-09-10
- Context: The founder directed koturutin to use the EXISTING, shared Supabase project
  (`hcbrunppfgakxxpyzbqn`, "Karışık Tablolar") — which already hosts other apps' tables in `public`
  — but demanded HARD isolation: no other app's schema/table/trigger/function/policy may be touched,
  nothing in `public`, and explicitly NO global `auth.users` signup trigger.
- Decision:
  - Create a dedicated `koturutin` schema; every table, index, constraint, function, trigger and RLS
    policy is namespaced under it (migrations 0001/0002/0003). Nothing is created in `public`.
  - `koturutin.users.id` is a plain `uuid` equal to `auth.uid()` with NO foreign key to
    `auth.users` — precisely so no referential-integrity trigger is added to the shared `auth.users`.
    The profile row is created explicitly by the client (INSERT WITH CHECK `id = auth.uid()`),
    idempotent and koturutin-only; there is no auto-provisioning of other apps' users.
  - Isolation is enforced by RLS `auth.uid() = user_id` on every table; SECURITY DEFINER functions
    pin `search_path = koturutin`; `experiment_library` is client read-only; `safety_events` has RLS
    on with zero policies/grants (server-only); `outcomes.free_note` is column-revoked from the
    client + guarded by a consent trigger.
  - The client talks to the schema via `.schema('koturutin')` (KOTURUTIN_SCHEMA). PostgREST
    "Exposed schemas" is a project-wide config that is NOT changed via SQL (it would risk the other
    apps' REST access): adding `koturutin` to Exposed schemas is the single, minimal founder dashboard
    step required to activate the REST sync path.
  - Sync is a local-first `SyncingStore` layered over the on-device store (ADR-004): local remains
    the primary source of truth; sync() pull→merge(union + last-write-wins)→push under RLS, retries
    with backoff, is non-destructive on failure, and cleanly SKIPS with no session / unexposed schema.
    free_note is never uploaded from the client.
- Alternatives considered: a dedicated koturutin Supabase project (rejected by the founder — the
  shared project is to be used); FK koturutin.users→auth.users (rejected — would add a trigger to the
  shared auth.users); route sync through an Edge Function to avoid exposing the schema (kept as a
  future option; the founder preferred `.schema('koturutin')`); altering PostgREST db-schemas via SQL
  (rejected — clobber risk to other apps' REST access).
- Consequences: full isolation on shared infrastructure, proven on live Postgres (owner-only,
  cross-user deny, capture-consent gate, free_note barrier, read-only library, closed safety_events —
  all pass; `public` unchanged at 94 tables; `auth.users` gained no triggers). Two founder
  prerequisites remain before cloud sync is live: (1) enable an auth method (e.g. anonymous sign-in)
  so a session/`auth.uid()` exists; (2) add `koturutin` to PostgREST Exposed schemas.
- Revisit trigger: if REST exposure is undesirable, move sync to an Edge Function; add soft-delete
  tombstone sync + a cloud-delete path before enabling bidirectional sync with real user data.
