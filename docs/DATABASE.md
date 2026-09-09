# Database Design

> Scope: koturutin MVP data layer (spine §5, §7, §8, §10). Backend is **Supabase**
> (Postgres + Auth + Row Level Security + Storage + Edge Functions), per `docs/DECISIONS.md`
> ADR-003/004/005. This document is **planning only** — no migrations, no schema is applied here.
> Migrations are written and run only after this document is approved (see *Migration strategy*).
>
> Version-sensitive facts (exact Postgres major, Supabase platform behavior, `gen_random_uuid`
> vs `pgcrypto`, `pg_cron`/`pg_net` availability, RLS/`auth.uid()` semantics) MUST be confirmed
> against current official Supabase/PostgreSQL docs at build time (research-first, AGENTS.md §6).
> Do not treat the version notes below as authoritative.
>
> Conventions: Postgres tables/columns are `snake_case`; TypeScript types are `PascalCase`
> (spine §5). Every user-owned table has `user_id` ownership, RLS enabled, and owner-only policies
> (`auth.uid() = user_id`). `service_role` is server-side only and never shipped in a client.

## Data classification

Mood, craving, smoking, sleep, health status and free-text are **Sensitive** — KVKK
special-category (health) data and GDPR Art. 9 data (spine §10; ADR-004). They receive the
strictest handling: owner-only RLS, local-first where possible, encryption of any synced field,
free-text never sent to a third-party model without explicit consent, and user-set retention.

- **Public:** `experiment_library` (curated, clinically/culturally reviewed reference content;
  NOT user data); the app i18n message catalog (intent-keyed copy, spine §11). Read-only to clients.
- **Private (personal, owner-only, not special-category):** `users` preferences
  (`language`, `timezone`, `notification_budget`, `quiet_windows`, consent flags,
  `retention_window_days`); `moments` structure (`name`, `decision_point`, `time_window_*`,
  `is_priority`, `verification_status`); routine-graph structure and non-clinical metadata
  (`confidence`, `evidence_count`, timestamps).
- **Sensitive (KVKK special-category / GDPR Art. 9):**
  - `users.smoking_stance`, `users.intent_target_behavior`
  - `moments.context`
  - `routine_edges.trigger`, `routine_edges.behavior`, `routine_edges.delayed_cost`
  - `experiments.if_this_then_that` (free-text plan may reveal behavior/health)
  - `attempts.reason`
  - `outcomes.craving`, `outcomes.energy`, `outcomes.mood`, `outcomes.connection_feeling`,
    `outcomes.free_note`
  - `observations.context`, `observations.behavior`, `observations.craving`, `observations.energy`
  - `insights.text` (derived from sensitive data → inherits the classification)
  - optional WHO-5 responses if stored (F-014) — treated as Sensitive.
- **Derived:** `insights` (AI-summarized patterns), `routine_edges.confidence` /
  `evidence_count`, `insights.confidence` / `evidence_count`. Derived from Sensitive/Private inputs;
  correlation only, never causation/diagnosis (spine §5, principle 7). Deletable via "delete AI memory".
- **Admin-only:** `safety_events` (audit; minimal, non-identifying PII; pathway/timestamp/resolution
  only — never raw crisis/free text). Backend-written, never client-readable (spine §5, §10).

## Roles

- **anonymous:** Unauthenticated. **No access** to any user-owned table, `experiment_library`, or
  `safety_events`. May reach only Supabase Auth endpoints (sign-up/sign-in). Safety & support
  resources (ALO 171, family physician, crisis, S-10 / F-010) are **static in-app content**, not DB
  rows, so they remain always-free and always-visible without a session (spine principle 8).
- **authenticated user:** Owns own rows only (`auth.uid() = user_id`). Full CRUD on their
  user-owned tables through RLS; **read-only** on `experiment_library`; **no** read/write on
  another user's rows; **no** access to `safety_events`; **no** write to `experiment_library`.
  `insights` are inserted by the backend — the user may read, correct (`user_confirmed`) and delete
  their own, but not insert arbitrary insights.
- **moderator/admin:** **No moderator/admin data-access role exists in MVP.** There is no in-app
  admin console and **no DB role that grants any admin access to users' content** (spine §13 has no
  community/UGC; PRODUCT_SPEC §7 "Admin/support"). A founder/QA operator may review
  `safety_events` (minimal PII) **only** via `service_role` server-side for safety-pathway QA, with
  **no** routine access to users' sensitive raw logs and **no** production data-mining role. This
  must be revisited before any future social/support-console feature.
- **service/backend:** Supabase **Edge Functions** using `service_role` (bypasses RLS). **Server-side
  only — never embedded in the Expo/React Native client** (ADR-004, AGENTS.md §8 "Never"). Used for:
  narrative-parsing drafts, weekly summarization (writes `insights`), rule-based safety-flow audit
  (writes `safety_events`), scheduled retention purge, and data export. All privileged logic lives in
  Edge Functions, not the client (AGENTS.md §13).

## Tables

> User-owned tables (`users`, `moments`, `routine_edges`, `experiments`, `attempts`, `outcomes`,
> `insights`, `observations`) all follow the same defaults unless noted: PK `id uuid` default
> `gen_random_uuid()`; `user_id uuid not null` owner column; `created_at timestamptz not null
> default now()`; `updated_at timestamptz not null default now()` maintained by a `set_updated_at`
> trigger; `deleted_at timestamptz null` soft-delete marker; RLS **enabled**, owner-only.
> `experiment_library` (reference) and `safety_events` (audit) are the two exceptions and are fully
> specified below.

### `users`
Purpose: One profile row per authenticated account — preferences, notification budget, quiet
windows, smoking stance, separated consent flags, and retention choice (spine §5; F-001).

| Column | Type | Null? | Default | Constraints | Notes |
|---|---|---:|---|---|---|
| id | uuid | no | — | PK; FK → `auth.users(id)` ON DELETE CASCADE | Same value as the Supabase Auth user id; the ownership anchor for all tables |
| language | text | no | `'tr'` | CHECK (language IN ('tr','en')) | Spine §5/§11 |
| timezone | text | no | `'Europe/Istanbul'` | — | IANA tz; drives right-moment scheduling & quiet windows |
| notification_budget | smallint | no | `2` | CHECK (notification_budget BETWEEN 0 AND 2) | ≤2 proactive/day at start (spine §7); may be reduced by user/"not now" |
| quiet_windows | jsonb | no | `'[]'::jsonb` | CHECK (jsonb_typeof(quiet_windows) = 'array') | Array of `{start,end,days}` protecting sleep/meetings/family (spine §7) |
| smoking_stance | text | yes | `null` | CHECK (smoking_stance IN ('quitting','reducing','noticing','not_ready')) | **Sensitive**; set at onboarding (F-001) |
| intent_value | text | yes | `null` | — | First-intent value (S-01); **Private** |
| intent_target_behavior | text | yes | `null` | — | First-intent target behavior (S-01); **Sensitive** (may name smoking/health) |
| consent_health_processing | boolean | no | `false` | — | **Required before any capture**: explicit KVKK/GDPR Art.9(2)(a) consent to process special-category (health) data as the CORE service. Must be `true` to proceed past onboarding into any observation/craving capture (F-001); declined → user may still view safety resources (S-10) but cannot use the loop. Expresses the base "wellbeing" purpose — required, not an optional OFF-by-default toggle |
| consent_personalization | boolean | no | `false` | — | Optional consent, OFF by default (F-001) |
| consent_research | boolean | no | `false` | — | Optional consent, OFF by default (F-001) |
| consent_free_text_to_model | boolean | no | `false` | — | Optional consent, OFF by default; gates free-text→LLM (spine §9/§10) |
| consent_updated_at | timestamptz | yes | `null` | — | Set whenever any consent flag changes (withdrawal audit) |
| analytics_enabled | boolean | no | `false` | — | **Opt-in**, OFF by default; gates **non-sensitive** minimal product events only (never special-category). Separate from the `consent_*` flags (F-011) |
| age_confirmed_18 | boolean | no | `false` | — | Self-attested 18+ recorded at onboarding (age assurance, F-001); suspected-minor accounts are not onboarded into the loop (spine §21 R6) |
| retention_window_days | integer | no | `180` | CHECK (retention_window_days BETWEEN 30 AND 3650) | User-chosen retention for raw sensitive logs (spine §10) |
| created_at | timestamptz | no | `now()` | — | |
| updated_at | timestamptz | no | `now()` | — | `set_updated_at` trigger |
| deleted_at | timestamptz | yes | `null` | — | Pending-deletion grace marker; terminal account delete is a hard cascade (see below) |

- **Primary key:** `id`.
- **Foreign keys:** `id` → `auth.users(id)` ON DELETE CASCADE (deleting the Auth user removes the profile and, via downstream cascades, all owned data).
- **Unique constraints:** `id` (PK). One profile per Auth user (guaranteed by shared PK).
- **Check constraints:** `language`, `notification_budget`, `smoking_stance`, `quiet_windows` type, `retention_window_days` as above.
- **Indexes:** PK on `id` only (all lookups are by `auth.uid()`).
- **Relationships:** 1→many to every user-owned table via their `user_id`.
- **created_at / updated_at:** present; `updated_at` via trigger.
- **Soft delete:** `deleted_at` marks a pending-deletion grace window; the actual account deletion is a **hard** delete (right to erasure, spine §10).
- **Ownership:** the row *is* the owner (`id = auth.uid()`).
- **Data classification:** Private, except `smoking_stance` and `intent_target_behavior` (Sensitive).
- **Delete/cascade behavior:** hard delete of the row (or of `auth.users`) cascades to all user-owned tables; `safety_events.user_id` is set NULL (de-identified audit retained). Row is **created by a `SECURITY DEFINER` trigger on `auth.users` insert** (backend), not by a client INSERT.

### `moments`
Purpose: A recurring transition point ("geçiş anı") in the user's day — the map's nodes (spine §5; F-002/F-004; S-04).

| Column | Type | Null? | Default | Constraints | Notes |
|---|---|---:|---|---|---|
| id | uuid | no | `gen_random_uuid()` | PK | |
| user_id | uuid | no | — | FK → `users(id)` ON DELETE CASCADE | Owner |
| name | text | no | — | CHECK (char_length(name) BETWEEN 1 AND 120) | User's own words for the moment |
| decision_point | text | yes | `null` | CHECK (decision_point IN ('waking','leaving_home','arriving_at_work','break','arriving_home','after_meal','bedtime')) | Rule-engine decision point (spine §7); null = custom |
| time_window_start | time | yes | `null` | — | Optional local-time window start (spine §7 simple clock) |
| time_window_end | time | yes | `null` | CHECK (time_window_end IS NULL OR time_window_start IS NULL OR time_window_end > time_window_start) | Optional window end |
| context | text | yes | `null` | — | **Sensitive** free text |
| verification_status | text | no | `'hypothesis'` | CHECK (verification_status IN ('hypothesis','confirmed')) | Flips to `confirmed` on user confirmation (F-004) |
| is_priority | boolean | no | `false` | — | Exactly one priority moment enforced by partial unique index (spine §3, R-11) |
| created_at | timestamptz | no | `now()` | — | |
| updated_at | timestamptz | no | `now()` | — | trigger |
| deleted_at | timestamptz | yes | `null` | — | Soft delete of a routine node |

- **Primary key:** `id`.
- **Foreign keys:** `user_id` → `users(id)` ON DELETE CASCADE.
- **Unique constraints:** partial unique `uniq_moments_one_priority` ON `(user_id)` WHERE `is_priority AND deleted_at IS NULL` — **at most one active priority moment per user**.
- **Check constraints:** `decision_point`, `verification_status`, name length, time-window ordering.
- **Indexes:** `idx_moments_user_id (user_id)`; `idx_moments_user_status (user_id, verification_status)`; the partial unique index above.
- **Relationships:** 1→many `routine_edges`, `experiments`, `observations`; referenced by `attempts`, `insights`.
- **created_at / updated_at:** present.
- **Soft delete:** `deleted_at`; purged by retention job / node delete.
- **Ownership:** `user_id`.
- **Data classification:** Private, except `context` (Sensitive).
- **Delete/cascade behavior:** deleting a moment cascades to its `routine_edges` and dependent `experiments`; sets `attempts.moment_id`, `observations.moment_id`, `insights.related_moment_id` to NULL.

### `routine_edges`
Purpose: A trigger→behavior link inside a moment — the map's edges with function label, delayed cost, and confidence (spine §5; F-004; S-04).

| Column | Type | Null? | Default | Constraints | Notes |
|---|---|---:|---|---|---|
| id | uuid | no | `gen_random_uuid()` | PK | |
| user_id | uuid | no | — | FK → `users(id)` ON DELETE CASCADE | Owner |
| moment_id | uuid | no | — | FK → `moments(id)` ON DELETE CASCADE | Edge belongs to a moment |
| trigger | text | no | — | CHECK (char_length(trigger) BETWEEN 1 AND 240) | **Sensitive** |
| behavior | text | no | — | CHECK (char_length(behavior) BETWEEN 1 AND 240) | **Sensitive** (may be smoking/health) |
| function_label | text | yes | `null` | CHECK (function_label IN ('waking_energy','relief_transition','connection','attention_silence','craving','avoidance_procrastination','sleep_transition')) | Immediate benefit / function (spine §8); no morality label |
| delayed_cost | text | yes | `null` | — | **Sensitive** |
| confidence | smallint | no | `0` | CHECK (confidence BETWEEN 0 AND 100) | Derived from `evidence_count`; shown as confidence, never diagnosis |
| evidence_count | integer | no | `0` | CHECK (evidence_count >= 0) | Supporting observation count |
| user_confirmed | boolean | no | `false` | — | One-tap function correction (principle 9) |
| created_at | timestamptz | no | `now()` | — | |
| updated_at | timestamptz | no | `now()` | — | trigger |
| deleted_at | timestamptz | yes | `null` | — | Soft delete |

- **Primary key:** `id`.
- **Foreign keys:** `user_id` → `users(id)` ON DELETE CASCADE; `moment_id` → `moments(id)` ON DELETE CASCADE.
- **Unique constraints:** none (a moment may have multiple trigger→behavior edges).
- **Check constraints:** `function_label`, `confidence`, `evidence_count`, text lengths.
- **Indexes:** `idx_routine_edges_user_id (user_id)`; `idx_routine_edges_moment_id (moment_id)`.
- **Relationships:** many→1 `moments`; belongs to `users`.
- **created_at / updated_at:** present.
- **Soft delete:** `deleted_at`.
- **Ownership:** `user_id` (denormalized for RLS predicate + index; must equal the parent moment's owner).
- **Data classification:** `trigger`, `behavior`, `delayed_cost` Sensitive; rest Private/Derived.
- **Delete/cascade behavior:** cascades from `users` and `moments`.

### `experiments`
Purpose: The chosen behavior alternative for a critical moment — function, duration band, difficulty, safety class, if-then plan; **only one active per user** (spine §5, principle 4; F-005; S-05).

| Column | Type | Null? | Default | Constraints | Notes |
|---|---|---:|---|---|---|
| id | uuid | no | `gen_random_uuid()` | PK | |
| user_id | uuid | no | — | FK → `users(id)` ON DELETE CASCADE | Owner |
| moment_id | uuid | no | — | FK → `moments(id)` ON DELETE CASCADE | The transition this experiment targets |
| library_id | uuid | yes | `null` | FK → `experiment_library(id)` ON DELETE RESTRICT | Source curated option (protects referential integrity) |
| function_label | text | no | — | CHECK (function_label IN ('waking_energy','relief_transition','connection','attention_silence','craving','avoidance_procrastination','sleep_transition')) | Serves the same function at lower cost |
| duration_band | text | no | — | CHECK (char_length(duration_band) BETWEEN 1 AND 20) | e.g. `'30s-3m'` (spine §8) |
| difficulty | smallint | no | `1` | CHECK (difficulty BETWEEN 1 AND 5) | |
| safety_class | text | no | `'standard'` | CHECK (safety_class IN ('standard','smoking_support','relationship_safety')) | Gates activation (spine §10; R-5) |
| if_this_then_that | jsonb | no | — | CHECK (if_this_then_that ? 'if' AND if_this_then_that ? 'then') | Implementation intention `{if,then}`; **Sensitive** |
| is_active | boolean | no | `false` | — | At most one active per user (partial unique index) |
| started_at | timestamptz | yes | `null` | — | Set when activated |
| ended_at | timestamptz | yes | `null` | — | Set when retired/completed |
| created_at | timestamptz | no | `now()` | — | |
| updated_at | timestamptz | no | `now()` | — | trigger |
| deleted_at | timestamptz | yes | `null` | — | Soft delete |

- **Primary key:** `id`.
- **Foreign keys:** `user_id` → `users(id)` ON DELETE CASCADE; `moment_id` → `moments(id)` ON DELETE CASCADE; `library_id` → `experiment_library(id)` ON DELETE RESTRICT.
- **Unique constraints:** partial unique `uniq_experiments_one_active` ON `(user_id)` WHERE `is_active AND deleted_at IS NULL` — **at most one active experiment per user** (spine principle 4; R-11). A user may have zero active (before choosing); once chosen, exactly one.
- **Check constraints:** `function_label`, `duration_band`, `difficulty`, `safety_class`, `if_this_then_that` shape.
- **Indexes:** `idx_experiments_user_id (user_id)`; `idx_experiments_moment_id (moment_id)`; `idx_experiments_library_id (library_id)`; the partial unique index above.
- **Relationships:** many→1 `moments`, `experiment_library`; 1→many `attempts`.
- **created_at / updated_at:** present.
- **Soft delete:** `deleted_at`.
- **Ownership:** `user_id`.
- **Data classification:** `if_this_then_that` Sensitive; rest Private.
- **Delete/cascade behavior:** cascades from `users`/`moments`; deleting an experiment cascades to its `attempts`. Cannot delete an in-use `experiment_library` row (RESTRICT).

### `attempts`
Purpose: An offer at a decision point plus the user's response (spine §5; F-006; S-06).

| Column | Type | Null? | Default | Constraints | Notes |
|---|---|---:|---|---|---|
| id | uuid | no | `gen_random_uuid()` | PK | |
| user_id | uuid | no | — | FK → `users(id)` ON DELETE CASCADE | Owner |
| experiment_id | uuid | no | — | FK → `experiments(id)` ON DELETE CASCADE | The experiment offered |
| moment_id | uuid | yes | `null` | FK → `moments(id)` ON DELETE SET NULL | The transition (spine "transition") |
| offered_at | timestamptz | no | `now()` | — | When the transition card was offered |
| response | text | no | `'offered'` | CHECK (response IN ('offered','did','not_now','declined')) | No streak/failure semantics (principle 3) |
| responded_at | timestamptz | yes | `null` | — | When the user responded |
| reason | text | yes | `null` | — | **Sensitive** free text |
| created_at | timestamptz | no | `now()` | — | |
| updated_at | timestamptz | no | `now()` | — | trigger |
| deleted_at | timestamptz | yes | `null` | — | Soft delete |

- **Primary key:** `id`.
- **Foreign keys:** `user_id` → `users(id)` ON DELETE CASCADE; `experiment_id` → `experiments(id)` ON DELETE CASCADE; `moment_id` → `moments(id)` ON DELETE SET NULL.
- **Unique constraints:** none.
- **Check constraints:** `response` enum.
- **Indexes:** `idx_attempts_user_id (user_id)`; `idx_attempts_experiment_id (experiment_id)`; `idx_attempts_moment_id (moment_id)`; `idx_attempts_user_offered_at (user_id, offered_at)` for weekly review (F-008).
- **Relationships:** many→1 `experiments`, `moments`; 1→1 `outcomes`.
- **created_at / updated_at:** present.
- **Soft delete:** `deleted_at`.
- **Ownership:** `user_id`.
- **Data classification:** `reason` Sensitive; rest Private.
- **Delete/cascade behavior:** cascades from `users`/`experiments`; deleting an attempt cascades to its `outcome`.

### `outcomes`
Purpose: Proximal (immediate) result of an attempt — craving/energy/mood/connection + optional note (spine §5; F-007; S-07). **Sensitive**.

| Column | Type | Null? | Default | Constraints | Notes |
|---|---|---:|---|---|---|
| id | uuid | no | `gen_random_uuid()` | PK | |
| user_id | uuid | no | — | FK → `users(id)` ON DELETE CASCADE | Owner |
| attempt_id | uuid | no | — | FK → `attempts(id)` ON DELETE CASCADE; UNIQUE | One outcome per attempt |
| craving | smallint | yes | `null` | CHECK (craving BETWEEN 0 AND 10) | **Sensitive** |
| energy | smallint | yes | `null` | CHECK (energy BETWEEN 0 AND 10) | **Sensitive** |
| mood | smallint | yes | `null` | CHECK (mood BETWEEN 0 AND 10) | **Sensitive** |
| connection_feeling | smallint | yes | `null` | CHECK (connection_feeling BETWEEN 0 AND 10) | **Sensitive** |
| free_note | text | yes | `null` | — | **Sensitive**; local-first — synced only with consent (F-007/F-011) |
| captured_at | timestamptz | no | `now()` | — | |
| created_at | timestamptz | no | `now()` | — | |
| updated_at | timestamptz | no | `now()` | — | trigger |
| deleted_at | timestamptz | yes | `null` | — | Soft delete |

- **Primary key:** `id`.
- **Foreign keys:** `user_id` → `users(id)` ON DELETE CASCADE; `attempt_id` → `attempts(id)` ON DELETE CASCADE.
- **Unique constraints:** `UNIQUE (attempt_id)` — one outcome per attempt.
- **Check constraints:** all 0–10 range checks.
- **Indexes:** `idx_outcomes_user_id (user_id)`; unique index on `attempt_id`; `idx_outcomes_user_captured_at (user_id, captured_at)`.
- **Relationships:** 1→1 `attempts`.
- **created_at / updated_at:** present.
- **Soft delete:** `deleted_at`.
- **Ownership:** `user_id`.
- **Data classification:** **Sensitive** (all state fields + note).
- **Delete/cascade behavior:** cascades from `users`/`attempts`.
- **`free_note` server-side barrier (spine §21 R3 — defense in depth):** the sensitive `free_note`
  (Art. 9 free text) is on-device by default and never reaches the cloud without consent. Enforcement
  is NOT client-only:
  1. **Column-scoped grant:** the `authenticated` role is *not* granted write on `outcomes.free_note`
     — the client's INSERT/UPDATE privilege is column-scoped to the structured fields; `free_note`
     writes go only through a `SECURITY DEFINER` consent-checking Edge Function.
  2. **Trigger guard:** a `BEFORE INSERT OR UPDATE` trigger on `outcomes` raises an exception if
     `NEW.free_note IS NOT NULL` unless the owner's `consent_free_text_to_model = true`.
  So a buggy or tampered client cannot persist `free_note` to the cloud with consent OFF. See the
  RLS/grants section and the allow/deny security tests below.

### `insights`
Purpose: A surfaced pattern from weekly summarization — text, evidence type/count, confidence, user confirmation (spine §5; F-008; S-08). **Derived from Sensitive data.**

| Column | Type | Null? | Default | Constraints | Notes |
|---|---|---:|---|---|---|
| id | uuid | no | `gen_random_uuid()` | PK | |
| user_id | uuid | no | — | FK → `users(id)` ON DELETE CASCADE | Owner |
| text | text | no | — | — | Correlation language only; validated vs forbidden-phrasing list (principle 7; F-008) |
| evidence_type | text | no | — | CHECK (evidence_type IN ('user_said','seen_together','experiment_result')) | Evidence display type (spine §5) |
| evidence_count | integer | no | `0` | CHECK (evidence_count >= 0) | |
| confidence | smallint | no | `0` | CHECK (confidence BETWEEN 0 AND 100) | Shown as confidence, never diagnosis |
| user_confirmed | boolean | yes | `null` | — | null = unreviewed, true = confirmed, false = "this is wrong" (principle 9) |
| related_moment_id | uuid | yes | `null` | FK → `moments(id)` ON DELETE SET NULL | Optional subject moment |
| created_at | timestamptz | no | `now()` | — | |
| updated_at | timestamptz | no | `now()` | — | trigger |
| deleted_at | timestamptz | yes | `null` | — | Soft delete ("delete AI memory") |

- **Primary key:** `id`.
- **Foreign keys:** `user_id` → `users(id)` ON DELETE CASCADE; `related_moment_id` → `moments(id)` ON DELETE SET NULL.
- **Unique constraints:** none.
- **Check constraints:** `evidence_type`, `evidence_count`, `confidence`.
- **Indexes:** `idx_insights_user_id (user_id)`; `idx_insights_user_created_at (user_id, created_at)`.
- **Relationships:** optional many→1 `moments`.
- **created_at / updated_at:** present.
- **Soft delete:** `deleted_at`; "delete the AI memory" (spine §10) soft-deletes then purges insights.
- **Ownership:** `user_id`.
- **Data classification:** Derived + Sensitive (`text`).
- **Delete/cascade behavior:** cascades from `users`. **Inserted by the backend** (summarization Edge Function, `service_role`); the client may only SELECT/UPDATE(`user_confirmed`)/DELETE its own rows.

### `observations`
Purpose: The 3-day observation check-ins — short context/behavior/craving/energy captures with no prescription (spine §5, §3 step 2; F-003; S-03). Kept as its own table for MVP clarity.

| Column | Type | Null? | Default | Constraints | Notes |
|---|---|---:|---|---|---|
| id | uuid | no | `gen_random_uuid()` | PK | |
| user_id | uuid | no | — | FK → `users(id)` ON DELETE CASCADE | Owner |
| moment_id | uuid | yes | `null` | FK → `moments(id)` ON DELETE SET NULL | Optional linked moment |
| context | text | yes | `null` | — | **Sensitive** |
| behavior | text | yes | `null` | — | **Sensitive** |
| craving | smallint | yes | `null` | CHECK (craving BETWEEN 0 AND 10) | **Sensitive** |
| energy | smallint | yes | `null` | CHECK (energy BETWEEN 0 AND 10) | **Sensitive** |
| captured_at | timestamptz | no | `now()` | — | Timestamp of the check-in |
| created_at | timestamptz | no | `now()` | — | |
| updated_at | timestamptz | no | `now()` | — | trigger |
| deleted_at | timestamptz | yes | `null` | — | Soft delete |

- **Primary key:** `id`.
- **Foreign keys:** `user_id` → `users(id)` ON DELETE CASCADE; `moment_id` → `moments(id)` ON DELETE SET NULL.
- **Unique constraints:** none.
- **Check constraints:** `craving`, `energy` ranges.
- **Indexes:** `idx_observations_user_id (user_id)`; `idx_observations_moment_id (moment_id)`; `idx_observations_user_captured_at (user_id, captured_at)`.
- **Relationships:** optional many→1 `moments`.
- **created_at / updated_at:** present.
- **Soft delete:** `deleted_at`.
- **Ownership:** `user_id`.
- **Data classification:** **Sensitive**.
- **Delete/cascade behavior:** cascades from `users`.

### `experiment_library`
Purpose: Curated, clinically & culturally reviewed micro-experiments by function — **reference data, NOT user data**; read-only to clients (spine §5, §8; F-009).

| Column | Type | Null? | Default | Constraints | Notes |
|---|---|---:|---|---|---|
| id | uuid | no | `gen_random_uuid()` | PK | |
| intent_key | text | no | — | UNIQUE; CHECK (intent_key ~ '^[a-z0-9]+(\.[a-z0-9_]+)+$') | Language-neutral key (spine §11); copy resolved from i18n catalog |
| function_label | text | no | — | CHECK (function_label IN ('waking_energy','relief_transition','connection','attention_silence','craving','avoidance_procrastination','sleep_transition')) | Spine §8 |
| family | text | no | — | CHECK (char_length(family) BETWEEN 1 AND 60) | Micro-experiment family (spine §8) |
| duration_band | text | no | — | CHECK (char_length(duration_band) BETWEEN 1 AND 20) | e.g. `'30s-3m'` |
| min_seconds | integer | no | — | CHECK (min_seconds > 0) | Steps run 30s–10m; most 30s–5m (principle 4, spine §21 R8) |
| max_seconds | integer | no | — | CHECK (max_seconds >= min_seconds AND max_seconds <= 600) | ≤10 min (craving & sleep-transition families up to 10m) |
| difficulty | smallint | no | `1` | CHECK (difficulty BETWEEN 1 AND 5) | |
| safety_class | text | no | `'standard'` | CHECK (safety_class IN ('standard','smoking_support','relationship_safety')) | Connection→relationship-safety; support→smoking-support (spine §10) |
| clinically_reviewed | boolean | no | `false` | — | Must be true before `enabled` |
| culturally_reviewed | boolean | no | `false` | — | TR + EN cultural review (spine §11) |
| enabled | boolean | no | `false` | — | Only enabled, reviewed rows are offered |
| created_at | timestamptz | no | `now()` | — | |
| updated_at | timestamptz | no | `now()` | — | trigger |

- **Primary key:** `id`.
- **Foreign keys:** none (reference data). Referenced by `experiments.library_id`.
- **Unique constraints:** `UNIQUE (intent_key)`.
- **Check constraints:** `function_label`, `safety_class`, duration bounds, `intent_key` format, difficulty.
- **Indexes:** unique index on `intent_key`; `idx_experiment_library_function (function_label)` (ranking filter); `idx_experiment_library_enabled (enabled)`.
- **Relationships:** 1→many `experiments` (via `library_id`, RESTRICT).
- **created_at / updated_at:** present; maintained by migrations/maintainers.
- **Soft delete:** none for clients; retire an entry by setting `enabled = false`.
- **Ownership:** none (no `user_id`). Global reference content.
- **Data classification:** **Public** (curated, non-personal). Read-only to authenticated clients.
- **Delete/cascade behavior:** rows are not user-deletable; managed only by migrations/`service_role`. `ON DELETE RESTRICT` from `experiments` prevents deleting an in-use entry.

### `safety_events`
Purpose: Minimal audit that a rule-triggered safety flow was shown — smoking-support / crisis / relationship-safety — for QA and observability (spine §5, §10; F-010; ADR-005). **Minimal, non-identifying PII; backend-only.**

| Column | Type | Null? | Default | Constraints | Notes |
|---|---|---:|---|---|---|
| id | uuid | no | `gen_random_uuid()` | PK | |
| user_id | uuid | yes | `null` | FK → `users(id)` ON DELETE SET NULL | Nullable; set NULL on account delete (de-identify, retain audit) |
| pathway | text | no | — | CHECK (pathway IN ('smoking_support','crisis','relationship_safety')) | Which safety flow |
| triggered_by | text | no | `'rule'` | CHECK (triggered_by IN ('rule','user_action')) | Crisis is rule-based, never LLM-decided (ADR-005) |
| resolution | text | yes | `null` | CHECK (resolution IN ('shown','acknowledged','routed_external','dismissed')) | Set by backend |
| occurred_at | timestamptz | no | `now()` | — | |
| created_at | timestamptz | no | `now()` | — | |
| updated_at | timestamptz | no | `now()` | — | trigger |

- **Primary key:** `id`.
- **Foreign keys:** `user_id` → `users(id)` ON DELETE SET NULL.
- **Unique constraints:** none.
- **Check constraints:** `pathway`, `triggered_by`, `resolution` enums.
- **Indexes:** `idx_safety_events_pathway_occurred (pathway, occurred_at)`; `idx_safety_events_user_id (user_id)`.
- **Relationships:** optional many→1 `users`.
- **created_at / updated_at:** present.
- **Soft delete:** none (audit); removed only by its own short retention job.
- **Ownership:** system/backend-owned audit (not user-editable).
- **Data classification:** **Admin-only** audit. **No raw crisis text, no free text, no sensitive detail stored** — enums + timestamps only (spine §5 "minimal PII").
- **Delete/cascade behavior:** **inserted by backend (`service_role`) only; never client-readable.** On account delete, `user_id` is set NULL so the de-identified audit survives per its stated purpose/retention; the audit itself is purged on its own retention schedule.

## RLS / authorization matrix

RLS is **enabled on every table**. Owner-only policy predicate is `auth.uid() = user_id`
(for `users`: `auth.uid() = id`); INSERT policies use a matching `WITH CHECK`. `service_role`
**bypasses RLS** and is used only inside Edge Functions. Legend: ✅ allowed (policy), ❌ denied
(no policy / no grant), ⚙️ backend-only via `service_role`.

| Resource | Role | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|---|
| users | anonymous | ❌ | ❌ | ❌ | ❌ | No session |
| users | authenticated (owner) | ✅ own (`id=auth.uid()`) | ❌ | ✅ own | ✅ own | Row created by trigger; owner cannot INSERT arbitrary rows; DELETE triggers account cascade |
| users | service/backend | ⚙️ | ⚙️ | ⚙️ | ⚙️ | Trigger creates row; export/purge |
| moments | anonymous | ❌ | ❌ | ❌ | ❌ | |
| moments | authenticated (owner) | ✅ own | ✅ own (`WITH CHECK user_id=auth.uid()`) | ✅ own | ✅ own | Drafts may also be written by backend |
| moments | service/backend | ⚙️ | ⚙️ | ⚙️ | ⚙️ | Narrative-parsing drafts |
| routine_edges | anonymous | ❌ | ❌ | ❌ | ❌ | |
| routine_edges | authenticated (owner) | ✅ own | ✅ own | ✅ own | ✅ own | |
| routine_edges | service/backend | ⚙️ | ⚙️ | ⚙️ | ⚙️ | |
| experiments | anonymous | ❌ | ❌ | ❌ | ❌ | |
| experiments | authenticated (owner) | ✅ own | ✅ own | ✅ own | ✅ own | Single-active enforced by partial unique index |
| experiments | service/backend | ⚙️ | ⚙️ | ⚙️ | ⚙️ | |
| attempts | anonymous | ❌ | ❌ | ❌ | ❌ | |
| attempts | authenticated (owner) | ✅ own | ✅ own | ✅ own | ✅ own | |
| attempts | service/backend | ⚙️ | ⚙️ | ⚙️ | ⚙️ | |
| outcomes | anonymous | ❌ | ❌ | ❌ | ❌ | |
| outcomes | authenticated (owner) | ✅ own | ✅ own (structured cols only) | ✅ own (structured cols only) | ✅ own | Sensitive; `free_note` write is column-revoked — Edge-Function + trigger gated by `consent_free_text_to_model` (R3) |
| outcomes | service/backend | ⚙️ | ⚙️ | ⚙️ | ⚙️ | |
| insights | anonymous | ❌ | ❌ | ❌ | ❌ | |
| insights | authenticated (owner) | ✅ own | ❌ | ✅ own (`user_confirmed`) | ✅ own | Insert is backend-only; owner corrects/deletes ("delete AI memory") |
| insights | service/backend | ⚙️ | ⚙️ | ⚙️ | ⚙️ | Summarization writes insights |
| observations | anonymous | ❌ | ❌ | ❌ | ❌ | |
| observations | authenticated (owner) | ✅ own | ✅ own | ✅ own | ✅ own | |
| observations | service/backend | ⚙️ | ⚙️ | ⚙️ | ⚙️ | |
| experiment_library | anonymous | ❌ | ❌ | ❌ | ❌ | Require auth |
| experiment_library | authenticated | ✅ (`enabled = true`) | ❌ | ❌ | ❌ | **Read-only; no client writes** |
| experiment_library | service/backend | ⚙️ | ⚙️ | ⚙️ | ⚙️ | Seeded/maintained via migrations |
| safety_events | anonymous | ❌ | ❌ | ❌ | ❌ | |
| safety_events | authenticated | ❌ | ❌ | ❌ | ❌ | **No client read (own or others) and no client write** |
| safety_events | service/backend | ⚙️ | ⚙️ | ⚙️ | ⚙️ | Backend inserts audit; founder/QA reads via `service_role` |

**Grants (explicit, in addition to RLS — both are required on Supabase):**

- Baseline: `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;` then grant explicitly.
- `anon`: **no table grants** (auth endpoints only).
- `authenticated`:
  - `GRANT SELECT, UPDATE, DELETE ON users;` (no INSERT — profile is trigger-created).
  - `GRANT SELECT, INSERT, UPDATE, DELETE ON moments, routine_edges, experiments, attempts, observations;`
  - **`outcomes` is column-scoped (R3 free_note barrier):** `GRANT SELECT, DELETE ON outcomes;` and
    `GRANT INSERT, UPDATE (craving, energy, mood, connection_feeling, captured_at) ON outcomes;` — the
    client has **no** write privilege on `outcomes.free_note`. `free_note` is written only by a
    `SECURITY DEFINER` consent-checking Edge Function, and a `BEFORE INSERT OR UPDATE` trigger rejects
    a non-null `free_note` unless the owner's `consent_free_text_to_model = true`.
  - `GRANT SELECT, DELETE ON insights;` **and column-scoped** `GRANT UPDATE (user_confirmed) ON insights;` (no INSERT, no update of other columns).
  - `GRANT SELECT ON experiment_library;` (no INSERT/UPDATE/DELETE).
  - **No grant on `safety_events`.**
- `service_role`: implicit full access (bypasses RLS); used **only** inside Edge Functions, never shipped to the client. Business logic that must bypass RLS (insights insert, safety audit, export, purge) lives server-side.
- RLS policies pair with grants: a grant without a matching policy still returns zero rows / rejects the write. Both layers are defined so neither alone is the sole control.

## Storage buckets

**MVP: no storage buckets are required.** Day narration is processed transiently; the voice
transcript and raw free-text stay **on device** by default and are sent to a model only with
explicit `consent_free_text_to_model` (spine §9/§10; F-002). Nothing user-facing needs object
storage for the MVP loop.

**Post-MVP (deferred — voice narration is a Stage Two / paid capability, spine §12, §16):** if
stored voice narration is later introduced, use a **private** bucket with **owner-only** object
policies keyed by a user-id path prefix (`voice/{auth.uid()}/...`). Voice audio is **Sensitive**.

| Bucket | Public? | Allowed uploads | Read policy | Write policy | Delete policy |
|---|---:|---|---|---|---|
| `voice-narrations` *(post-MVP, deferred)* | No (private) | `audio/m4a`, `audio/mp4`, `audio/wav`; size cap TBD | Owner only: object path prefix = `auth.uid()` | Owner only: `WITH CHECK` path prefix = `auth.uid()`; per-feature mic consent required | Owner only; cascade-deleted on account delete |

## Retention/deletion

- **User-chosen retention window** (`users.retention_window_days`, default 180), enforced on **both**
  stores (R4):
  - **Cloud:** a scheduled Edge Function (e.g. `pg_cron` + backend, availability to confirm at build
    time) hard-purges soft-deleted rows and raw sensitive cloud logs (`observations`, `attempts`,
    `outcomes`, and orphaned `moments`/`routine_edges`) older than each user's window.
  - **On-device:** the local sensitive store (SQLite/secure store — the rawest special-category data,
    incl. `free_note` and unsynced logs) is purged on the **same** window, run on app launch and
    periodically. Local-first data must not outlive the retention window either. No indefinite raw-log
    hoarding on device or in the cloud (spine §10).
- **Soft delete then purge:** user "delete this routine node" sets `deleted_at`; a short grace
  window then hard-purges. Soft-deleted rows are excluded from all reads (policies/queries filter
  `deleted_at IS NULL`).
- **Delete AI memory:** soft-delete + purge all `insights` (and re-derivable `routine_edges`
  confidence) for the user, without deleting the account (spine §10; F-011).
- **Account deletion (right to erasure):** deleting `auth.users` / the `users` row **hard-cascades**
  to every user-owned table (`ON DELETE CASCADE`); `safety_events.user_id` is set NULL (de-identified
  audit retained on its own retention schedule). Deletion **confirms the cascade before executing and
  is never falsely reported complete on failure** (PRODUCT_SPEC §7; AGENTS.md §8).
- **Export (complete SAR / portability, R5):** always-free basic export is a **client-side merge** of
  (a) the Edge Function's cloud rows for the requesting user (`auth.uid()`; no other user's data is
  reachable) **and** (b) the on-device local sensitive store — including free notes and any unsynced
  local-first fields that never reached the cloud. A cloud-only export would silently omit the most
  sensitive data, so the merge is required for a complete KVKK/GDPR Art. 15/20 response (spine §12; F-011).
- **`safety_events` retention:** short, separate window; enums/timestamps only; purged on schedule.
- Any synced Sensitive field is encrypted; the app surfaces "what leaves the device" (ADR-004).

## Migration strategy

- **No migrations are written or run during this design stage** (AGENTS.md §8/§13; this is a planning
  doc). Migrations are authored **after this document is approved**, as versioned SQL in
  `supabase/migrations/` and applied via the Supabase CLI / MCP `apply_migration`.
- **Ordered application:** (1) required extensions (`pgcrypto`/`gen_random_uuid`, and
  `pg_cron`/`pg_net` if used) — **confirm availability & names against current Supabase docs**;
  (2) tables + PK/FK + CHECK constraints; (3) partial unique indexes (single-active experiment,
  single-priority moment) and query/FK/policy-predicate indexes; (4) `ENABLE ROW LEVEL SECURITY`
  + policies on every table; (5) explicit `REVOKE`/`GRANT` grants; (6) `set_updated_at` triggers and
  the `SECURITY DEFINER` `auth.users`→`users` insert trigger; (7) idempotent seed of
  `experiment_library`.
- **Reversibility:** every migration ships with a rollback path; destructive operations require an
  explicit migration + rollback strategy and are never run ad hoc (AGENTS.md §8).
- **Version-sensitive:** confirm Postgres major, RLS/`auth.uid()` behavior, extension availability,
  and CLI workflow against current official Supabase/PostgreSQL docs at build time — do not assume.

## Seed/reference data

`experiment_library` is seeded (idempotent upsert by `intent_key`) from spine §8. Only
`clinically_reviewed = true AND culturally_reviewed = true` rows may be `enabled = true`; copy is
resolved per language from the intent-keyed i18n catalog (spine §11), not duplicated per-language in
the DB. No user data is seeded.

| function_label | Families (spine §8) | duration_band | Default safety_class |
|---|---|---|---|
| `waking_energy` | light, water, short_movement, sensory_activation, delay_first_behavior | 30s–3m | standard |
| `relief_transition` | breath, muscle_release, change_clothes, short_walk, set_boundary | 60s–5m | standard |
| `connection` | eye_contact, greeting, one_question, short_play, appreciation | 30s–3m | **relationship_safety** (gate before activation, R-5) |
| `attention_silence` | one_stop_silence, sensory_orientation, conscious_listening | 30s–5m | standard |
| `craving` | urge_surfing, delay, change_environment, change_mouth_taste, support | 1–10m | `support` family → **smoking_support** (ALO 171 / family physician; spine §10) |
| `avoidance_procrastination` | two_minute_start, shrink_task, visible_first_step | 30s–2m | standard |
| `sleep_transition` | screen_threshold, light_and_prep, closing_note | 2–10m | standard |

Note: crisis handling is **not** an `experiment_library` row — it is a rule-based safety flow with
human-reviewed, tested copy (ADR-005); the library contains no medical/medication advice (spine §13 OUT).

## Security tests

Concrete allow/deny cases to implement as automated RLS/authorization tests (allow AND deny paths,
AGENTS.md §13). Cross-user cases use two seeded accounts, **User A** and **User B**.

- **allow:**
  - A (authenticated) `SELECT`s their own `moments`, `routine_edges`, `experiments`, `attempts`, `outcomes`, `observations`, `insights` → sees only own rows.
  - A `INSERT`s a `moments`/`observations`/`attempts`/`outcomes` row with `user_id = auth.uid()` → succeeds.
  - A `UPDATE`s `insights.user_confirmed` on their own insight (the "this is wrong" correction) → succeeds.
  - Any authenticated user `SELECT`s `experiment_library` rows where `enabled = true` → succeeds.
  - A requests export → receives only A's rows; A deletes account → cascade removes all A-owned rows.
  - A holds a `free_note` **only on-device** (unsynced) and requests export → the merged export
    **includes** that local free note (R5 export completeness).
  - With `consent_free_text_to_model = true`, A writes a `free_note` via the permitted consent-checking
    Edge Function → succeeds and syncs.
- **deny:**
  - **A `SELECT`s User B's `moment_id`** (or any B-owned row) → **0 rows** (owner-only SELECT).
  - A `INSERT`s a row with `user_id = <B's id>` → **rejected** by `WITH CHECK`.
  - A `UPDATE`s / `DELETE`s User B's `outcomes` / `attempts` / `insights` → affects **0 rows**.
  - A (or `anon`) `INSERT`/`UPDATE`/`DELETE` on `experiment_library` → **rejected** (read-only to clients).
  - A `UPDATE`s an `insights` column other than `user_confirmed`, or `INSERT`s an `insights` row → **rejected** (backend-only insert; column-scoped grant).
  - Any authenticated `SELECT`/`INSERT`/`UPDATE`/`DELETE` on `safety_events` (own or others') → **rejected** (backend-only; no client read of others or self).
  - `anon` `SELECT` on any user-owned table or `experiment_library` → **rejected** (no session, no grant).
  - A activates a second `experiments` row (`is_active = true`) while one is active → **rejected** by the partial unique index (single-active invariant, R-11).
  - A flags a second `moments` row `is_priority = true` → **rejected** by the partial unique index (single-priority invariant, R-11).
  - Writing an out-of-enum value (`response`, `verification_status`, `evidence_type`, `safety_class`, `pathway`) or an out-of-range score (`craving`/`energy`/`mood`/`connection_feeling` outside 0–10) → **rejected** by CHECK constraints.
  - **`free_note` barrier — direct client path (R3):** A (authenticated) attempts a direct
    `INSERT`/`UPDATE` on `outcomes` with a non-null `free_note` while `consent_free_text_to_model = false`
    → **rejected** (column privilege on `free_note` is not granted to `authenticated`; the trigger also
    raises). This covers the direct client data-layer path, not just the sync/parse path.
  - **`free_note` barrier — trigger guard:** even via the Edge Function, an attempt to persist a
    non-null `free_note` while `consent_free_text_to_model = false` → **rejected** by the
    `BEFORE INSERT OR UPDATE` trigger.
  - Consent-gated sync/parse: with `consent_free_text_to_model = false`, the narrative sync/parse path
    must not persist `outcomes.free_note` / raw transcript to the cloud → verified by an Edge Function test.
