# Architecture

> Scope: technical architecture for the **koturutin** MVP — a bilingual (Turkish + English)
> contextual routine lab (bağlamsal rutin laboratuvarı). This document derives entirely from the
> product spine and the approved planning docs. It uses the spine's exact IDs, entity names and
> terminology; it introduces no feature beyond MVP scope (spine §13).
>
> Sources of truth (higher wins): `README.md` → `docs/PRODUCT_SPEC.md` (features F-001…F-014) →
> `docs/USER_FLOWS.md` (screens S-01…S-12) → this file → `docs/DATABASE.md` → `docs/IMPLEMENTATION_PLAN.md`.
> Material architecture decisions here are (or must be) captured as ADRs in `docs/DECISIONS.md`
> (currently ADR-001…ADR-009). This is **planning only** — no application code, migrations, or
> dependency installs are performed in this stage.

---

## 1. Architecture goals

The architecture exists to make the spine's core loop — **day map → right moment → micro-experiment
→ learning** (spine §2) — safe, explainable, and cheap to change. Design priorities, in order:

1. **Correctness and safety before breadth.** One complete vertical slice (spine §17: arriving home →
   balcony cigarette+coffee → 90-second family-contact experiment → learn) works end-to-end before
   any breadth. The crisis and smoking-support pathways (spine §10) must never depend on unfinished
   or best-effort code.
2. **Structured data first, AI second** (spine §1.5, ADR-002). The product's memory and decisions are
   structured rows + an explainable on-device rule engine. The LLM is a bounded assistant behind
   consent gates; it is never the memory, the therapist, or the crisis decision-maker.
3. **Secure-by-default data access.** Every client-exposed table has RLS enabled and owner-only
   policies (`auth.uid() = user_id`); `service_role` is server-side only (spine §5, §10, ADR-004).
4. **Local-first for sensitive data.** Raw sensitive logs and free text prefer the device; what
   syncs to the cloud is explicit, minimized, and encrypted (spine §10, ADR-004).
5. **Explainability and reversibility.** Every insight/suggestion can show the evidence that drove it
   and offers a one-tap "this is wrong" correction (spine §1.9, §7). Prefer simple reversible choices;
   avoid speculative architecture and ML in the MVP.
6. **Right moment beats notification volume** (spine §1.6). Notification budget (≤2/day), quiet
   windows, and "not now" learning are architectural constraints, not UI afterthoughts.
7. **Bilingual by construction** (spine §11, ADR-008). Content is keyed by language-neutral intent
   keys, not string translation; safety copy is legal- + clinical-reviewed in both languages.
8. **Return the user to life** (spine §1.1, ADR-007). No engagement dark patterns, no streaks. The
   North Star is weekly successful conscious transitions, and analytics is minimal and privacy-first.

**Non-goals for the architecture (spine §13 OUT):** continuous location / passive sensor tracking,
a free-form AI therapist, community/social features, wearable integration, ML personalization, and
medication/nicotine-product/personal-health advice. Nothing in this design should make these easy to
add by accident.

---

## 2. Chosen stack and current-version verification

Chosen stack (spine §19, ADR-003). **All version numbers are deliberately omitted.** They are
version-sensitive decisions and MUST be confirmed against current official documentation at build
time (research-first, per AGENTS.md §6 and the `research-first` skill) — not guessed here.

| Layer | Choice | Rationale (spine ref) |
|---|---|---|
| Language | TypeScript, **strict mode** | Type safety across app + Edge Functions; shared types (§19) |
| App runtime | **Expo + React Native** | Managed workflow, EAS build/OTA, fast reversible path (§19) |
| Navigation | **Expo Router** (file-based) | Deep-link-ready, typed routes, matches screen model S-01…S-12 (§6, §19) |
| Local state | React state + a **lightweight store** (e.g. Zustand-class) | MVP-simple; no heavyweight global framework (§19, task instruction) |
| Server data | **Typed data layer** over the Supabase client | Single boundary for all remote reads/writes; keeps privileged logic out of UI |
| On-device storage | **expo-secure-store** (secrets/tokens) + a local **SQLite/local DB** (raw sensitive logs) | Local-first sensitive data (§10, ADR-004) |
| Backend | **Supabase**: Postgres + Auth + Row Level Security + Storage + **Edge Functions** | Strong auth/RLS story; Edge Functions are the trusted AI + service_role boundary (§19, ADR-003) |
| AI boundary | **Supabase Edge Function** calling an LLM provider | Narrative parsing / weekly summarization / library ranking under §9 limits; keys never on device (§9, §19) |
| i18n | Intent-key message catalog + **expo-localization** for locale | Bilingual by construction (§11, ADR-008) |
| Notifications | **expo-notifications**, locally scheduled | v1 on-device rule engine; server push deferred (§14 of this doc, spine §19) |
| Build/release | **EAS** with environment-separated config | dev / preview / production separation (§19) |

**Version-verification protocol (build time, before Stage 08):** for each of Expo SDK, React Native,
Expo Router, the Supabase JS client, Edge Function runtime (Deno), expo-notifications,
expo-localization, expo-secure-store, and the chosen local DB and store libraries, confirm the exact
current version and any breaking-change/deprecation notes from the **official** source
(Expo docs/changelog, Supabase docs, first-party repos). Record the confirmed versions and source
links in `docs/DECISIONS.md` (new ADR per material change) and pin them in the lockfile at Stage 08.
Never treat model memory as authoritative for a version fact.

**ADR discipline (task requirement):** material stack decisions — and any change to the choices in
this table — must be appended as ADRs in `docs/DECISIONS.md`. The current baseline is ADR-003
(stack), ADR-004 (local-first + RLS), ADR-002 (rule-engine + bounded AI). When build-time research
forces a substantive change (e.g. a library replaced, an approach reversed), add a new ADR that
supersedes the affected one rather than editing history silently.

---

## 3. System context

koturutin is a mobile-first, single-user-per-account application. There is no web client and no
multi-tenant/organization model in MVP.

```
                         ┌──────────────────────────────────────────────┐
                         │            Mobile app (Expo / RN)             │
                         │                                                │
  User (TR/EN) ────────▶ │  UI (Expo Router screens S-01…S-12)           │
                         │  Local state + lightweight store               │
                         │  ┌──────────────────────────────────────────┐ │
                         │  │ On-device rule-based DECISION ENGINE       │ │  (no network,
                         │  │ - right moment / budget / quiet hours      │ │   no ML, testable)
                         │  │ - "not now" learning                       │ │
                         │  └──────────────────────────────────────────┘ │
                         │  ┌──────────────────────────────────────────┐ │
                         │  │ On-device CRISIS/SAFETY rule matcher       │ │  (rule-based +
                         │  │ (explicit phrase rules → tested copy)      │ │   tested copy,
                         │  └──────────────────────────────────────────┘ │   NOT the LLM)
                         │  Local sensitive store (SQLite) + SecureStore  │
                         │  Typed data layer  ─────────────┐              │
                         └─────────────────────────────────┼──────────────┘
                                                            │ HTTPS (TLS), user JWT
                                     ┌──────────────────────▼───────────────────────┐
                                     │                 Supabase                      │
                                     │  Auth (JWT) · Postgres + RLS · Storage         │
                                     │  ┌──────────────────────────────────────────┐ │
                                     │  │ Edge Functions (trusted server)            │ │
                                     │  │ - AI assist: narrative parse / weekly      │ │
                                     │  │   summary / library ranking (§9 limits)    │ │
                                     │  │ - holds service_role + provider API keys   │ │
                                     │  └───────────────┬──────────────────────────┘ │
                                     └──────────────────┼────────────────────────────┘
                                                        │ HTTPS (consent-gated only)
                                                        ▼
                                              ┌───────────────────────┐
                                              │  LLM provider (3rd     │
                                              │  party) — disclosed;   │
                                              │  free text OFF by      │
                                              │  default (§9, §10)     │
                                              └───────────────────────┘
```

**External actors and boundaries**

- **User** — owns all their data; can delete/export at any time (spine §10, F-011).
- **Supabase** — the only backend. Postgres holds structured, non-raw-sensitive data with owner-only
  RLS; Auth issues JWTs; Storage holds any user media (e.g. optional voice input) under private
  buckets; Edge Functions are the only place `service_role` and LLM keys exist.
- **LLM provider** — reached **only** from an Edge Function, **only** for the three allowed assist
  jobs, and **only** with consent-gated payloads (free text is off by default; spine §9).
- **Emergency/support resources** (ALO 171, family physician, crisis lines) — surfaced as static,
  reviewed, in-app content/deep links (F-010); not an integration.

The decision engine and the crisis/safety matcher run **on device** with **no network dependency**,
so the safety-critical and right-moment paths keep working offline and cannot be blocked by a backend
outage (spine §1.8, §10).

---

## 4. Module/directory boundaries

Proposed top-level structure (indicative; final names confirmed at Stage 08). Each critical user
behavior has exactly one implementation boundary.

```
app/                      Expo Router routes → screens S-01…S-12 (thin; no business logic)
  (onboarding)/           S-11 first-run, S-01 intent, S-12 auth
  (loop)/                 S-02 tell-day, S-03 observe, S-04 map, S-05 choose,
                          S-06 transition card, S-07 outcome, S-08 week review
  (support)/              S-10 safety & support
  (settings)/             S-09 settings & privacy
src/
  data/                   Typed data layer: the ONLY module that talks to Supabase.
                          One typed function per use case (read/write); maps rows↔TS types.
  domain/                 Pure TypeScript domain logic — no I/O, fully unit-testable:
    decision-engine/      Rule-based JITAI engine (inputs=adaptation variables → intervention|null)
    safety/               Crisis + relationship-safety + smoking rule matchers (tested copy IDs)
    map/                  RoutineEdge/Moment derivation & confirmation helpers
    insights/             Correlation phrasing guards (forbids causal language)
  state/                  Lightweight store slices + React hooks (session, active experiment, UI)
  local/                  On-device persistence: SQLite (sensitive logs) + SecureStore (tokens)
  i18n/                   Intent-key catalog (tr/en), locale resolution, tone selection
  notifications/          expo-notifications scheduling adapter (drives, not decides)
  ui/                     Presentational components; loading/empty/error/offline states
  config/                 Env schema + runtime validation (no secrets committed)
supabase/
  functions/              Edge Functions (ai-assist, weekly-summary, library-rank); service_role here
  migrations/             SQL migrations (created only after docs/DATABASE.md is approved)
```

**Dependency direction (enforced by review, and lint rules where feasible):**
`app` → `state`/`ui` → `domain`/`data`/`local`/`i18n`/`notifications`. `domain` depends on nothing
with I/O (keeps it pure and testable). UI never imports the Supabase client directly — it goes
through `src/data`. Privileged logic (anything needing `service_role`, or any LLM call) lives only in
`supabase/functions`, never in the app bundle (spine §5, ADR-002/004; AGENTS.md §8 "Never").

---

## 5. Navigation/routing

Expo Router (file-based) maps directly to the spine's screens (§6). Routes are typed; deep links are
minimal and privacy-safe.

| Route group | Screen | Purpose |
|---|---|---|
| `(onboarding)` | S-11 First-run | Value, language, age (18+), required health-processing consent, then optional consents (personalization/research/free-text) |
| `(onboarding)` | S-12 Auth/account | Sign in, account lifecycle, delete/export entry |
| `(onboarding)` | S-01 Intent | Choose what to change and why |
| `(loop)` | S-02 Tell-your-day | Narrate a typical day (voice or cards) |
| `(loop)` | S-03 Observation check-in | 10–20s capture over 3 days |
| `(loop)` | S-04 Day map | Confirm/correct assumptions, pick priority moment |
| `(loop)` | S-05 Choose experiment | Pick one of 2–3 function-fit options |
| `(loop)` | S-06 Transition card | do now / remind later / not suitable |
| `(loop)` | S-07 Immediate outcome | One-tap craving/energy/connection + optional note |
| `(loop)` | S-08 Week review | Correlation summary + next experiment |
| `(support)` | S-10 Safety & support | ALO 171 / family physician / crisis / relationship-safety |
| `(settings)` | S-09 Settings & privacy | Language, notification budget, quiet windows, consent, data delete/export |

**Routing rules**

- **Auth gate.** Unauthenticated users can reach only `(onboarding)` and S-10 (safety must be reachable
  before/without an account, spine §10 "always free, always visible"). Everything else requires a
  session.
- **Safety override.** When the on-device crisis matcher fires (F-010), the current loop is
  interrupted and the app routes to the crisis view regardless of where the user is (spine §10:
  "STOP the normal coaching flow"). This is a navigation-level guarantee, not a screen the user must
  find.
- **Deep links / notifications.** A right-moment notification (F-006/F-013) deep-links to S-06 and
  reveals sensitive detail **only after the app is opened and unlocked** (spine §10, §11 lock-screen
  privacy). Notification payloads carry an opaque reference, never the behavior text.
- **Loop is resumable.** Users can leave and re-enter the loop; the map (S-04) and active experiment
  are reachable from a home entry point. Only **one** experiment is active at a time (spine §1.4).

---

## 6. State management

Deliberately simple for the MVP (spine §19; ADR-002 favors correctness/explainability over
machinery). Three tiers:

1. **Server-owned state** — canonical structured rows (Moment, RoutineEdge, Experiment, Attempt,
   Insight, etc.). Read/written only through the typed data layer (`src/data`). The UI treats these
   as source-of-truth-on-fetch; no optimistic global cache framework in MVP.
2. **Device-owned sensitive state** — raw Outcome free notes and other sensitive logs live in the
   on-device store (SQLite/SecureStore) and are **not** in server state unless the user has consented
   to sync (spine §10, ADR-004). The store treats device-local and synced data as distinct sources.
3. **Ephemeral UI state** — a lightweight store (Zustand-class) holds session/auth status, the
   current active experiment reference, notification-budget counters for the day, quiet-window status,
   and per-screen UI flags. React component state handles purely local form/interaction concerns.

**Rules**

- The **decision engine** and **safety matchers** are pure functions in `src/domain`; they read a
  snapshot of adaptation variables from the store and return a result. They hold no state themselves,
  which keeps them unit-testable (spine §7 explainability; testing strategy §20).
- No business rule lives in a React component. Screens render state and dispatch intents; they do not
  decide when to intervene, whether copy is causal, or whether a safety gate applies.
- Store slices are typed and small; there is intentionally **no** Redux/RTK, no saga, no heavy
  normalized cache. Adding one is a documented decision (new ADR), not a default.

---

## 7. Data fetching/cache

- **Single boundary.** All remote data access goes through `src/data`, a set of typed use-case
  functions (e.g. `getConfirmedMap(userId)`, `saveAttempt(attempt)`, `getActiveExperiment(userId)`).
  Each function maps Postgres rows (snake_case) to TS types (PascalCase) per spine §5 and validates
  shape at the boundary.
- **Caching.** MVP uses lightweight in-memory caching within a session (fetch-on-open, refetch on
  focus for the loop screens). No offline write-sync engine in MVP; the loop is designed to tolerate
  read staleness. Whether to adopt a query/cache library (e.g. TanStack Query-class) is deferred (§24)
  — not required for the vertical slice.
- **Offline/degraded behavior** (AGENTS.md §8; PRODUCT_SPEC states per feature):
  - Safety pathways (S-10), the decision engine, and the crisis matcher work **fully offline**.
  - Reads that fail fall back to the last cached value where safe; the experiment_library uses cached
    entries and a supportive fallback if unavailable (F-009).
  - Writes that fail (e.g. logging an Attempt/Outcome) are queued to the on-device store and retried;
    the user always gets a clear "saved on your device / not yet synced" state, never a silent loss.
- **AI calls are not "data fetching."** LLM assist is an explicit, consent-gated Edge Function call
  (see §10), never issued implicitly by a screen render or a cache miss.

---

## 8. Authentication/session

- **Provider:** Supabase Auth issues JWTs. MVP auth method (email OTP/magic link vs. password vs.
  a provider) is confirmed at build time with current Supabase docs and recorded via ADR; the
  architecture does not depend on the specific method.
- **Session bootstrap & refresh (explicit, per expo-supabase-mobile skill):** on launch the app reads
  a persisted session from **expo-secure-store** (never AsyncStorage for tokens), initializes the
  Supabase client, and enables automatic token refresh. Refresh failures downgrade to the
  unauthenticated state and route to S-12 without crashing.
- **Token storage:** access/refresh tokens live only in SecureStore (OS keychain/keystore). Tokens are
  never written to logs, analytics, or the local SQLite content store.
- **Every request is user-scoped.** The app's Supabase client always acts as the signed-in user (JWT),
  so RLS applies to every read/write. The app **never** holds the anon key's trust as a secret and
  **never** holds `service_role` (see §9).
- **Account lifecycle (F-001/F-011, S-12):** sign in, sign out, **export**, and **delete
  account** are first-class. Delete removes server rows (cascade per DATABASE.md) and instructs the
  device to wipe the local sensitive store and SecureStore. Deletion and export are always free
  (spine §10, §12).

---

## 9. Authorization boundary

This is a safety-critical section (spine §5, §10; ADR-004; AGENTS.md §13). The authorization model is
**defense-in-depth**: the database is the enforcement point, not the client.

**Principles**

1. **RLS on every client-exposed table — no exceptions.** Every table reachable by the app has Row
   Level Security **enabled** with **owner-only** policies keyed on `auth.uid() = user_id`. A table
   without an explicit, reviewed policy is treated as a P0 defect. The full policy matrix (per-table,
   per-operation allow/deny) is specified in `docs/DATABASE.md`; this document sets the invariant.
2. **`service_role` is server-side only.** The service_role key exists **only** inside Supabase Edge
   Functions' environment. It is never in the app bundle, never in client config, never in a public
   env var, never returned to the client (spine §5, §10; AGENTS.md §8 "Never expose service-role").
   Edge Functions that need elevated access do so behind explicit authorization checks and touch only
   the minimum rows required for the requested job.
3. **The publishable / anon key is protected by DB authorization, not by secrecy** (expo-supabase-mobile
   skill). It ships in the app and is assumed public. Its safety comes entirely from RLS + grants:
   with only the anon/user JWT, a caller can reach **only** their own rows and only the operations the
   policies allow. Security must never rely on that key staying hidden.
4. **Explicit grants + RLS together.** Grants (table/column privileges) and RLS policies are both
   designed explicitly in DATABASE.md; neither alone is sufficient. Policy-predicate columns and FKs
   are indexed for correctness and performance.
5. **Reference/read-only data.** `experiment_library` is curated, non-user data (spine §5). It is
   readable by authenticated users (read-only grant, no write policy) and writable only server-side
   during content seeding. It contains no PII.
6. **Audit table.** `safety_events` records that a safety pathway was shown (which pathway, timestamp,
   resolution) with **minimal PII** (spine §5). It is owner-scoped under RLS like other user tables;
   it is not a place for free text or sensitive content.
7. **Privileged logic never in the client.** Any decision that must be trusted (e.g. anything using
   service_role, any LLM invocation, any content-seeding write) lives in an Edge Function. The client
   can request these; it cannot perform them (spine §5; AGENTS.md §13).

**Testability requirement (feeds §20):** for every client-exposed table we must be able to state and
test an **allow** path (owner CRUD succeeds) and a **deny** path (another user's JWT, and the anon
role, are refused read and write). These become explicit RLS allow/deny tests in DATABASE.md and the
test suite. "We can state the unauthorized path" is a gate condition for Stage 06.

---

## 10. Backend/API responsibilities

The backend is Supabase. There is **no** custom application server in MVP. Responsibilities split
cleanly between the database and Edge Functions.

**Postgres + RLS (data plane)**
- Stores structured entities (spine §5). Enforces ownership and access via RLS + grants (§9).
- Enforces integrity via constraints (e.g. **only one active experiment per user**, spine §1.4 —
  implemented as a DB constraint/partial unique index specified in DATABASE.md, not left to the
  client).
- No business logic that belongs on-device (the decision engine and safety matchers are **not** in
  the database; they are on-device pure functions).

**Edge Functions (trusted server plane).** Each is a small, single-purpose, authenticated function.
The app calls them with the user JWT; the function verifies the caller and does the minimum work.

| Edge Function | Job | Hard limits (spine §9) |
|---|---|---|
| `ai-assist` (narrative parse) | Turn voice/text day-story → candidate time/transition/behavior/function nodes for F-002/F-004 | Output is **candidate only**; never a fact until user-confirmed. Free text sent to the LLM **only** with `consent_free_text_to_model` = true. |
| `weekly-summary` | Compress the week's structured logs into plain, non-judgmental language for F-008 | **No causality, diagnosis, or personality labels.** Correlation phrasing enforced; forbidden phrasing rejected (spine §5, §9). **Sending structured special-category data (craving/mood/energy/connection/behavior/function labels) to the third-party model is gated by `consent_personalization`;** OFF → on-device structured-counts fallback, no structured data leaves the device (spine §21 R2). |
| `free_note` write | Persist a sensitive free note for an outcome (F-007) | Runs `SECURITY DEFINER`; writes `outcomes.free_note` **only** if the owner's `consent_free_text_to_model` = true (the client has no column privilege on `free_note`; a DB trigger also guards it — spine §21 R3). |
| `library-rank` | Rank 2–3 context-fit options from the reviewed `experiment_library` for F-005 | Ranks curated library entries only; **never free-form prescribes** treatment/medication. |

**Cross-cutting Edge Function rules**
- Hold `service_role` and the LLM provider key in the function environment only (§9, §19).
- **Crisis detection is NOT here and NOT the LLM.** Risk flagging may surface at most a
  *non-authoritative* signal, but the crisis decision is the on-device rule-based + tested-copy path
  (spine §9 "LIMIT", §10; ADR-005). See §14/§22.
- Validate all input; return typed, minimal responses; log to observability without sensitive content
  (§18).
- Default-off secondary/training use: payloads sent to the provider carry no permission for training
  or secondary use, and free text is withheld unless the free-text-to-model consent flag is on
  (spine §9, §10).

---

## 11. Database/storage interface

- The app reaches Postgres only through the Supabase client, wrapped by `src/data` (§7). Row shapes
  are snake_case in the DB and mapped to PascalCase TS types (spine §5). Generated types (from the
  Supabase schema) back the typed data layer; the mapping is validated at the boundary.
- **Entities** (owned by the user, private-by-default, RLS-protected) per spine §5: `users`,
  `moments`, `routine_edges`, `experiments`, `attempts`, `outcomes`, `insights`, `observations`,
  `safety_events`; plus the curated read-only `experiment_library`. Field-level design, constraints,
  indexes, cascade and retention behavior are specified in `docs/DATABASE.md` (Stage 06), not here.
- **Sensitive fields are local-first** (spine §10, ADR-004): raw `outcomes.free_note` and other free
  text default to the on-device store and are only mirrored to Postgres when the user consents; any
  synced sensitive field is encrypted (§22). The data layer distinguishes "device-only" from
  "sync-eligible" fields so the two paths cannot be confused.
- **`free_note` write is server-guarded, not client-trusted (spine §21 R3):** the `authenticated`
  client has no write privilege on `outcomes.free_note`; writes go through a consent-checking Edge
  Function and a DB trigger rejects a non-null `free_note` unless `consent_free_text_to_model` is true.
- **Data export is a client-side merge (spine §21 R5):** a complete export combines the Edge
  Function's cloud rows with the on-device local store (incl. unsynced free notes), so device-only
  sensitive data is not silently omitted from a KVKK/GDPR Art. 15/20 response.
- **Migrations** are the only way schema changes happen, and only **after** DATABASE.md is approved
  (AGENTS.md §8, expo-supabase-mobile skill). Destructive changes require an explicit migration +
  rollback strategy.

---

## 12. Media/storage

- MVP media is limited to **optional voice input** for day narration (F-002) if the user grants the
  microphone permission (requested per-feature, only on first use; spine §10 data minimization).
- If used, audio is captured locally and treated as **sensitive**. The default is on-device
  processing/transient use; audio is uploaded to a **private** Supabase Storage bucket only if the
  user has consented, and is deleted promptly after parsing. Bucket access is governed by explicit
  per-object policies scoped to the owner (`auth.uid()`); no public buckets (AGENTS.md §13,
  expo-supabase-mobile skill).
- No images, avatars, or user-generated shareable media in MVP (spine §13 OUT — no social features).
- Storage object policies and retention for any audio are specified alongside table policies in
  DATABASE.md. If voice input adds meaningful complexity, it may be deferred to a cards-only MVP
  (documented tradeoff) — the loop does not depend on voice.

---

## 13. Background jobs

MVP deliberately minimizes background work.

- **Notification scheduling** is handled on-device by `expo-notifications` (local notifications), fed
  by the on-device decision engine (§14). This is scheduling, not a server job.
- **Weekly summary** (F-008) is generated **on demand** when the user opens S-08 (an `ai-assist`/
  `weekly-summary` Edge Function call), not by a scheduled server cron in MVP. This keeps the LLM
  boundary explicit and consent-gated and avoids background data movement.
- **No server-side schedulers, no passive/background sensor collection** (spine §13 OUT: no continuous
  location / passive sensor tracking). Any future scheduled server push is deferred (§24).
- **Retention/cleanup** (spine §10 user-chosen retention, `retention_window_days`) runs on **two**
  stores (spine §21 R4): (a) cloud rows are hard-purged past the window by a reviewed scheduled Edge
  Function; (b) the **on-device** local sensitive store (raw notes, unsynced logs) is purged on the
  **same** window, run on app launch and periodically, so device-local special-category data does not
  outlive the window either. User-initiated actions (delete routine node / AI memory / account;
  export) run immediately; there is no passive/background *sensor* collection.

---

## 14. Notifications

Notifications implement the spine's "right moment beats volume" principle (§1.6, §7) and must protect
lock-screen privacy (§10, §11). v1 is **entirely on-device**.

**v1 design (MVP)**
- **Locally scheduled** via `expo-notifications`. There is **no server push in v1** (deferred, §24).
- The schedule is produced by the **on-device rule-based decision engine** (below), which decides,
  per candidate transition, whether to fire an intervention **or nothing**.
- **Notification budget:** ≤2 proactive notifications/day at start (spine §1.6, §7). The daily counter
  lives in device state; when exhausted, the engine returns "send nothing."
- **Quiet windows:** meetings, sleep, family time are protected (spine §7); no proactive notification
  is scheduled inside a quiet window.
- **"Not now" learning:** a `not_now` response (F-006) reduces or reschedules future offers at that
  transition — a rule-based adjustment (e.g. back off frequency, shift the window), recorded and
  inspectable, not ML (spine §7).
- **Lock-screen privacy:** the on-lock-screen text is non-sensitive only — e.g. "A transition moment
  is coming up" / "Bir geçiş anı yaklaşıyor" (spine §11). The notification never contains "smoke a
  cigarette" / "talk to your partner." Sensitive detail (S-06 content) is revealed **only after the
  app is opened and unlocked** (§5 routing rule).
- **Permission is minimal and explicit:** notifications are requested only when the user enables
  reminders (F-013); denial degrades gracefully (the loop still works via manual entry).

### The rule-based decision engine (explicit, testable, on-device — no ML)

A pure module in `src/domain/decision-engine`. It is the architectural embodiment of spine §7's
JITAI framing and carries **no ML in the MVP** (spine §1.9, ADR-002).

- **Inputs (adaptation variables, spine §7):** the candidate decision point/transition (waking,
  leaving home, arriving at work, break, arriving home, after meal, bedtime); its time window;
  optional location **only** if the user explicitly granted it; the last response at this transition;
  current craving/energy (when known); and the notification load over the last 7 days; plus the daily
  budget counter and quiet-window state.
- **Output:** **one intervention option, or nothing.** Options (spine §7): send nothing, short pause,
  delay, substitution, environment change, contact action, support referral. "Nothing" is a
  first-class, common output.
- **Decision rules** are explicit and inspectable: budget/quiet-window/`not_now` back-off gates run
  first (they can only *suppress*), then the transition + adaptation variables select at most one
  option. The relationship-safety gate (spine §10) can veto a contact/connection intervention.
- **Explainability:** the engine returns, with any suggestion, the variables that drove it, so the UI
  can show "why this appeared" and offer the one-tap "this is wrong" correction (spine §1.9, §7).
- **Determinism & testability:** given the same inputs it returns the same output — enabling
  exhaustive unit tests (budget exhaustion → nothing; inside quiet window → nothing; repeated
  `not_now` → back-off; connection option in a relationship-unsafe context → vetoed). See §20.

**Server push (deferred, §24):** if adopted later it must preserve every constraint above (budget,
quiet windows, lock-screen privacy, on-device decisioning) and is out of MVP scope.

---

## 15. Localization

Bilingual (Turkish + English) is cross-cutting, not a translation layer (spine §11, ADR-008).

- **Intent-key catalog.** All user-facing copy is addressed by **language-neutral intent keys** (e.g.
  `transition.home.arrival.connection`), resolved per language. English is **not** a word-for-word
  copy of Turkish; each language is authored naturally, with cultural adaptation (family contact,
  tea/coffee rituals) written for Turkey (spine §11).
- **Tone options** (calm / direct / warm) are a dimension of the catalog with **separate QA per
  language** (spine §11). Copy is never manipulative, fear-based, or shaming (spine §9 language limit).
- **Locale resolution** uses `expo-localization` for the device locale, overridable in S-09; the
  chosen language switches copy immediately from intent keys (F-001, F-012).
- **Safety copy is special.** Crisis, smoking-support, and privacy texts are approved by **legal +
  clinical review** in both languages (spine §10, §11) and are versioned; they are referenced by
  stable IDs from the on-device safety matcher (§14/§22) so the exact reviewed wording is what ships.
- **Notification copy** follows the same catalog and the lock-screen-privacy rule (§14). The library
  and AI-adapted copy are constrained to the catalog's intent keys and tone; the LLM may simplify
  within a language but not invent unsafe or causal phrasing (spine §9).
- **Correlation-language enforcement** (spine §5, §9): a domain guard (`src/domain/insights`) rejects
  causal/diagnostic phrasing in insights/summaries in both languages (allowed: "this alternative
  seems to work on some days"; forbidden: causation claims).

---

## 16. Analytics

Privacy-respecting, minimal, and EU-friendly by design (spine §12, §15; ADR-007). Analytics measures
product **value**, never engagement for its own sake, and is never surveillance.

- **North Star:** weekly **successful conscious transitions** (real-life choices), not time-in-app,
  not streaks (spine §0, §15, ADR-007).
- **Event-minimal.** Only product-value events are captured, e.g.: map confirmed + first experiment
  planned (activation); attempt response (`offered`/`did`/`not_now`/`declined`); proximal outcome
  logged; weekly summary confirmed/corrected. Correction rate and notification opt-out are **load/
  trust** signals, not success (spine §15).
- **No sensitive content in analytics.** No free text, no raw craving/mood values as identifiable
  analytics payloads, no location. Events carry the minimum needed for the value metric, associated
  to the owner under the same privacy rules as other data.
- **Safety signals** (wrong-insight, sensitive-notification incident, unwanted-suggestion,
  support-referral shown) are tracked via `safety_events`-derived counters for QA (spine §15, §5),
  with minimal PII — these gate release (spine §14: zero serious privacy/clinical-referral incidents
  or stop the release).
- **Opt-in and separate from the consent_* flags (spine §21 R2):** analytics is gated by its own
  `analytics_enabled` flag (opt-in, OFF by default) and carries **non-sensitive** product events only —
  it is not authorized by, and does not piggy-back on, `consent_health_processing`/`consent_personalization`/
  `consent_research`/`consent_free_text_to_model`. Analytics is not gated behind, nor does it degrade, safety/privacy features (always
  free). The concrete analytics tool is chosen at build time favoring an EU-friendly / self-hostable /
  privacy-first option and recorded via ADR; the architecture treats analytics as a thin, swappable
  sink behind an interface.

---

## 17. Error handling

- **Every screen handles loading / empty / error / retry / offline** where applicable (AGENTS.md §8;
  PRODUCT_SPEC specifies per feature). Errors are actionable and non-blaming (never "you failed" —
  spine §1.3).
- **Typed results at boundaries.** The data layer and Edge Function client return typed
  success/error results; UI maps them to friendly, localized copy (intent keys). External input
  (LLM output, remote rows, notification payloads) is validated before use.
- **Fail safe, not silent.** A failed write to Postgres queues to the on-device store and shows a
  clear "saved on your device / not yet synced" state — never a silent loss (spine trust; §7).
- **Safety paths never depend on the network.** If the backend or LLM is unreachable, the crisis
  matcher, relationship-safety gate, smoking-support content, and the decision engine still function
  (spine §1.8, §10). Safety content is bundled/cached on-device.
- **LLM failures degrade gracefully.** If `ai-assist`/`weekly-summary`/`library-rank` fails or times
  out, the app falls back to structured data and the reviewed library's supportive fallback (F-005,
  F-008, F-009) — the product remains usable because AI is an assistant, not the memory (ADR-002).
- **Error boundaries** at the navigation shell prevent a screen crash from taking down the app;
  startup/session-refresh failures downgrade to unauthenticated rather than crash (§8).

---

## 18. Logging/observability

- **On-device:** structured, non-sensitive diagnostic logs (event type, screen, coarse timing,
  error class). **Never** log free text, tokens, craving/mood values, location, or any special-category
  content (spine §10; §22). Logs are opt-in for sharing and redaction-by-construction.
- **Crash/error reporting:** a crash reporter is selected at build time (privacy-configured,
  EU-friendly; recorded via ADR). PII/sensitive content is stripped before send.
- **Edge Functions:** log request id, function name, caller (user id only where necessary for
  support), outcome, and latency — **no prompt/response free text** and no provider payload content by
  default. Failures and rate/limit events are observable for reliability.
- **`safety_events` as first-class observability** (spine §5, §15): every time a safety pathway is
  shown (smoking-support / crisis / relationship-safety), the audit records which pathway, timestamp,
  and resolution with minimal PII. These power the safety-signal metrics (§16) and the release stop
  condition (spine §14). This is the one place safety behavior is provably auditable, so it is part of
  the architecture, not optional.
- **Critical product events** (activation, proximal outcome, weekly confirmation) are observable at
  the value-metric level (§16) without surveillance-grade detail.

---

## 19. Environment/secrets

- **EAS environment separation** (spine §19; expo-supabase-mobile skill): `development`, `preview`,
  and `production` builds carry separate configuration (Supabase project URL, publishable/anon key,
  analytics keys). Managed via EAS environment configuration; no secrets committed to git.
- **Client config is public by assumption.** Only the Supabase URL and the **publishable/anon** key
  ship in the app; their safety comes from RLS + grants, not secrecy (§9). A committed `.env.example`
  documents required client variables with **no real values** (AGENTS.md §8).
- **Server secrets never touch the client.** `service_role` and the LLM provider API key exist **only**
  as Edge Function environment secrets, set in the Supabase dashboard/CLI, never in the app bundle,
  repo, or client env (spine §5, §19; AGENTS.md §8 "Never").
- **Runtime config validation** (`src/config`): required env vars are validated at startup against a
  schema; a missing/malformed client var fails fast in dev/preview with a clear message rather than a
  silent misconfiguration.
- **Provisioning is user-owned and gated.** The Supabase project + keys, Apple/Google developer
  accounts, and signing certificates are founder-provided at Stages 08/14 (PROJECT_STATUS blockers);
  the architecture assumes them but does not fabricate them (AGENTS.md stop conditions).

---

## 20. Testing strategy

Testing centers on the two things that must be provably correct: the **on-device rule logic** and the
**authorization boundary** — plus one real end-to-end slice (AGENTS.md §9, §10; spine §7, §17).

| Layer | What is tested | Why (spine/gate) |
|---|---|---|
| **Unit — decision engine** | The rule-based engine as a pure function: budget exhaustion → nothing; inside quiet window → nothing; repeated `not_now` → back-off/reschedule; correct option selection per transition + adaptation variables; connection option vetoed in a relationship-unsafe context | Engine is safety- and trust-critical and deterministic (§14, spine §7) |
| **Unit — safety matchers** | Crisis phrase rules → correct tested-copy pathway; relationship-safety gate; smoking-stance routing; **no reliance on the LLM** | Crisis must be rule-based + tested copy (spine §9/§10, ADR-005) |
| **Unit — insight/i18n guards** | Correlation-language guard rejects causal/diagnostic phrasing (TR + EN); intent-key resolution/tone | spine §5, §9, §11 |
| **RLS allow/deny (integration)** | For **every** client-exposed table: owner CRUD **allowed**; another user's JWT and the anon role **denied** read and write; `experiment_library` read-only; one-active-experiment constraint enforced | Authorization gate (spine §5/§10, §9 of this doc; AGENTS.md §13) |
| **Vertical-slice e2e** | The spine §17 slice: sign in → tell day → confirm one map → choose the 90-second connection experiment at "arriving home" → receive/open the right-moment card → log outcome → see it persisted on reload, with real auth/RLS and no hidden mock | Vertical-slice rule (AGENTS.md §9); proves the architecture works |
| **AI boundary (contract)** | Edge Functions enforce their §9 limits: candidate-only parsing (no auto-fact), summaries carry no causal/diagnostic language, ranking stays within the curated library, free text withheld without consent | spine §9; AGENTS.md §8 (validate external input) |

- **Deny-path tests are mandatory**, not optional — a table whose unauthorized path cannot be
  demonstrated fails the Stage 06 gate (§9).
- Tests never weaken auth/RLS/security to pass (AGENTS.md §8 "Never"). No production-critical mock in
  the vertical slice.
- Real device/simulator targets: at least one realistic iOS and one Android target are exercised for
  notifications and secure storage before release (expo-supabase-mobile skill; spine §19).

---

## 21. CI/CD and environments

- **Environments:** `development` (local/dev client + dev Supabase project or branch), `preview`
  (internal testing via EAS), `production`. Config is environment-separated (§19).
- **CI (per push/PR):** install (pinned lockfile) → typecheck (strict) → lint → unit tests
  (decision engine, safety, guards) → RLS allow/deny tests against a disposable/branch database →
  build check. A red gate blocks merge (AGENTS.md §10). Commands are recorded in
  `docs/PROJECT_STATUS.md` once tooling is chosen (Stage 08).
- **Database changes** flow only through reviewed migrations after DATABASE.md is approved; CI runs
  RLS/authorization tests on the migrated schema (§9, §11).
- **CD:** EAS Build produces preview builds for internal testers; production builds/submissions are
  gated on Stage 14 and require founder-owned store credentials/certificates (stop condition,
  PROJECT_STATUS). No auto-submission to stores from CI in MVP.
- **Edge Functions** are versioned in `supabase/functions` and deployed via the Supabase CLI per
  environment; secrets are set out-of-band (§19), never in CI logs.
- **Store-policy checks** (Apple/Google privacy, permissions, account deletion, data-safety
  disclosures) are verified against **current official policies** at Stage 14, not assumed from memory
  (AGENTS.md §12, §6).

---

## 22. Security/privacy

Security-critical, drawing on OWASP MASVS for mobile and the spine's regulatory posture (KVKK special
-category + GDPR Art. 9). Sensitive data = mood, craving, smoking, sleep, health status, and free
journal text (spine §10).

**Authorization & backend (see §9)**
- RLS enabled + owner-only policies on **every** client-exposed table; explicit grants; `service_role`
  server-side only; the publishable/anon key is protected by DB authorization, not secrecy.
- Privileged logic and all LLM calls live only in Edge Functions.

**OWASP MASVS baseline (mobile, AGENTS.md §12)**
- **Storage (MASVS-STORAGE):** tokens only in SecureStore (keychain/keystore); sensitive logs in the
  on-device store with encryption; no sensitive data in plaintext prefs, logs, or analytics.
- **Crypto (MASVS-CRYPTO):** use platform-provided secure storage and vetted libraries; synced
  sensitive fields are encrypted (below); no home-grown crypto.
- **Auth/session (MASVS-AUTH):** explicit session bootstrap/refresh; safe downgrade on failure; no
  long-lived secrets in the bundle (§8, §9).
- **Network (MASVS-NETWORK):** TLS for all Supabase/Edge/LLM traffic; validate server responses.
- **Platform (MASVS-PLATFORM):** minimal, per-feature permissions (no location/mic/contacts by
  default — requested only when a feature first needs them; spine §10 data minimization); privacy-safe
  deep links and notifications (§5, §14).
- **Code/resilience (MASVS-CODE/RESILIENCE):** validate all external input (LLM output, rows,
  notification payloads); pin dependency versions; keep no debug/secret artifacts in release builds.

**Local-first sensitive data (spine §10, ADR-004)**
- Raw sensitive logs and free text prefer the **device** (SQLite + SecureStore). They are **not**
  synced by default.
- **What syncs to the cloud is explicit and surfaced to the user** (F-011 "what leaves the device"):
  structured, minimized signals needed for the loop (e.g. an Attempt's response category, coarse
  proximal-outcome values under consent) may sync; raw free notes and audio do **not** sync unless the
  user turns on the relevant consent.
- **Any synced sensitive field is encrypted** (application-level encryption before it leaves the
  device, in addition to TLS in transit and Supabase at-rest encryption).

**Consent & purpose separation (spine §10, §21 R2)**
- **Canonical consent model** — distinct flags on `users`, withdrawing one never silently re-enables
  another, withdrawal is easy (S-09/F-011):
  - `consent_health_processing` — **required** (KVKK/GDPR Art. 9(2)(a)) explicit consent to process
    special-category health data as the core service, captured at onboarding **before any capture**;
    it expresses the base "wellbeing" purpose and is not an optional OFF-by-default toggle. Withdrawing
    it stops the observation/experiment loop (the user retains safety resources).
  - `consent_personalization` (OFF) — AI personalization **and** transmission of structured
    special-category data to the third-party model for `weekly-summary`/`library-rank`; OFF →
    on-device structured-counts fallback.
  - `consent_research` (OFF) — optional research use.
  - `consent_free_text_to_model` (OFF) — sending free text to the model.
  - `analytics_enabled` (opt-in, OFF) — non-sensitive product events only; separate from the consents (§16).
  - `age_confirmed_18` — self-attested 18+ recorded at onboarding (age assurance).
- **Model-provider disclosure:** the app states plainly whether free text goes to a third-party model
  and which boundary handles it (§10). **Secondary/training use is default OFF** (opt-out-by-default),
  and payloads sent to the provider carry no training/secondary-use permission (spine §9, §10).

**Crisis & safety are rule-based and never gated**
- Crisis detection is an **on-device rule-based matcher + human-reviewed, tested copy**, never the LLM
  (spine §9/§10, ADR-005). On an explicit risk phrase it stops the normal coaching flow and routes to
  local emergency + professional resources (Turkey: ALO 171, family physician). A **relationship-
  safety gate** guards the connection experiment. Smoking/dependence keeps professional cessation
  support free and visible and never resets a "streak" on a lapse (spine §1.3, §1.10, §10).
- **Safety and privacy are always free and always visible** — never behind a paywall (spine §1.8,
  §12). Safety content works offline (§17).

**User control & retention (spine §10, F-011)**
- Delete any routine node, the AI memory, and the account; export data — all free. Deletion cascades
  server rows (DATABASE.md) and wipes the local sensitive store + tokens (§8). Retention windows are
  user-chosen; no indefinite raw-log hoarding.

**Regulatory note (stop condition, not agent-decided):** v1 makes **no** therapy/treatment/diagnosis
claim. If intended use drifts toward a medical purpose, EU medical-device-software qualification may
change — this is a legal/stop decision for the founder, flagged here, not derived by the agent (spine
§10; AGENTS.md stop conditions).

---

## 23. Performance

- **Perceived latency:** the loop screens (S-01…S-08) render from local/lightweight state; the
  decision engine and safety matchers are pure in-memory functions (sub-frame cost) with **no network
  dependency**, so right-moment and safety interactions feel instant even offline (§14, §17).
- **AI calls are explicit and bounded.** `ai-assist`/`weekly-summary`/`library-rank` are on-demand,
  user-initiated (e.g. opening S-08), shown with a clear loading state and a fast structured fallback
  on timeout (§17). No LLM call on hot paths (notifications, card display, outcome logging).
- **Cold start:** minimize by lazy-loading non-critical screens via Expo Router route groups and
  deferring heavy work; session bootstrap reads a single SecureStore entry (§8).
- **Database:** index policy-predicate columns, FKs, and common filters (per DATABASE.md) so
  owner-scoped queries stay cheap; the data volume per user is small (short logs, spine §3).
- **Battery/data:** no background polling, no passive sensors, no server push in v1 (§13, §14) — the
  app is idle unless the user acts or a locally scheduled notification fires.
- **Bundle:** keep dependencies minimal (AGENTS.md §8 "Never add dependencies without a concrete
  need"); avoid heavy state/cache libraries in MVP (§6).

Performance targets are set as concrete numbers during Stage 08+ once real device targets are chosen;
the architecture is designed so that hot paths are local and cheap by construction.

---

## 24. Deferred architecture / non-decisions

Explicitly **out of MVP** (spine §13 OUT; §16 roadmap Stage Two) — recorded so they are not added by
accident and so re-introducing one is a deliberate ADR:

- **Server push notifications** — v1 is on-device only; server push (and any server scheduler) is
  deferred. If added, it must preserve budget, quiet windows, lock-screen privacy, and on-device
  decisioning (§14).
- **ML / adaptive personalization** — no ML in MVP; the engine is rule-based (spine §1.9, ADR-002).
  Adaptation research (micro-randomized designs) is Stage Two, under ethics/scientific review
  (spine §14, §16).
- **Query/cache framework, offline write-sync engine, global state framework** — not needed for the
  vertical slice (§6, §7); adopt later only with a documented need.
- **Voice narration/output, rich media** — beyond optional voice input; deferred (spine §12 paid,
  §16 Stage Two).
- **Multiple day maps, advanced pattern library, export tooling as a product surface** — MVP is one
  map + one active experiment (spine §12, §13).
- **Community/social, couples accounts, wearables, continuous location/passive sensors** — permanent
  non-goals for this product line (spine §13 OUT); not merely deferred.
- **Auth method specifics, analytics vendor, crash reporter, LLM provider** — chosen at build time via
  research-first and recorded as ADRs; the architecture keeps each behind a thin, swappable boundary.

---

## 25. Risks and mitigations

| # | Risk | Impact | Mitigation (architecture) |
|---|---|---|---|
| R1 | A client-exposed table ships without RLS / with a wrong policy | Data breach (special-category data) | RLS-on-every-table invariant (§9); mandatory allow/deny tests per table (§20); Stage 06 authorization gate blocks release; CI runs RLS tests (§21) |
| R2 | `service_role` or LLM key leaks into the client bundle | Full data compromise | Keys only in Edge Function env (§9, §19); client config assumed public; security review + secret-scanning gate (§21, ADR-005/routing) |
| R3 | LLM emits causal/diagnostic/unsafe or fabricated content | User harm, false claims (spine §5, §9) | AI is bounded (§10 limits); correlation-language guard rejects causal phrasing (§15); candidate-only parsing needs user confirmation; structured fallback on failure (§17) |
| R4 | Crisis handled by the LLM or a network-dependent path | Safety failure | Crisis is on-device rule-based + tested reviewed copy, offline-capable, never the LLM (§14, §22, ADR-005); safety_events audit + release stop on incidents (§18, spine §14) |
| R5 | Sensitive free text/audio synced or sent to a third party without consent | Privacy/regulatory breach (KVKK/GDPR) | Local-first defaults; data layer separates device-only vs sync-eligible fields; canonical consent model (required health-processing + personalization/research/free-text, §21 R2); server-guarded free_note (§21 R3); training/secondary use default OFF; synced sensitive fields encrypted (§11, §22) |
| R6 | Notification spam / wrong-moment / sensitive lock-screen preview | Erodes trust; violates spine §1.6, §10 | On-device engine enforces ≤2/day budget, quiet windows, `not_now` back-off; lock-screen copy non-sensitive; detail only after unlock (§14) |
| R7 | Wrong inference presented as fact; user cannot correct it | Trust loss (spine §1.9) | Every insight shows evidence + one-tap "this is wrong"; engine returns the driving variables; user confirms map/priority/summary (§14, §15) |
| R8 | Relationship-safety not considered for the connection experiment | User endangered (spine §10) | Relationship-safety gate vetoes connection interventions in a violence/control context; enforced in the engine and library metadata; unit-tested (§14, §20) |
| R9 | More than one experiment active at once | Product-principle violation (spine §1.4) | DB constraint / partial unique index enforces one active experiment (§10, DATABASE.md), not left to the client |
| R10 | Guessed/incompatible library versions cause build/security issues | Delivery risk | Versions confirmed research-first at build time and pinned; recorded via ADR (§2) |
| R11 | Backend/LLM outage blocks safety or the core loop | Availability/safety risk | Safety, decision engine, and manual logging are offline-capable; reads fall back to cache; writes queue on-device with clear status (§7, §17) |
| R12 | Scope creep toward therapy/medical use | Legal + product-integrity risk | No medical claim in v1; medical-purpose drift is a founder legal/stop decision, flagged not derived (§22, spine §10) |
| R13 | Engagement/dark-pattern metrics slip in | Contradicts product purpose (spine §1.1, §12) | North Star = weekly conscious transitions; analytics event-minimal; retention/opt-out are trust signals, no streaks/loss-aversion (§16, ADR-007) |
| R14 | Account/data deletion incomplete (server or device) | Privacy/regulatory failure | Delete cascades server rows and wipes local store + tokens; export always free; verified in tests (§8, §22) |

---

*End of ARCHITECTURE.md. Next in the lifecycle: `docs/DATABASE.md` (Stage 06) specifies field-level
schema, the full RLS policy + grant matrix, storage object policies, cascade/retention, and the
concrete allow/deny tests this document requires. Material changes to any stack choice here must be
recorded as an ADR in `docs/DECISIONS.md`.*
