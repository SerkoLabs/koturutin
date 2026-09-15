-- koturutin — permanent, ISOLATED schema on a SHARED Supabase project (docs/DATABASE.md; ADR-012).
-- HARD isolation rules (founder directive):
--   * All koturutin objects live under the dedicated `koturutin` schema. Never in `public`.
--   * Do NOT touch other apps' schemas/tables/functions/triggers/policies/storage.
--   * NO global trigger on `auth.users`. koturutin.users is NOT FK-bound to auth.users precisely so
--     that no referential-integrity trigger is added to the shared auth.users. The profile row is
--     created explicitly by the app (client INSERT with CHECK id = auth.uid()) — idempotent, koturutin-only.
--   * `id`/`user_id` still equal auth.uid(); all access is isolated by RLS (auth.uid() = user_id).

create schema if not exists koturutin;

-- Shared updated_at trigger (koturutin-local; search_path pinned).
create or replace function koturutin.set_updated_at() returns trigger
language plpgsql set search_path = koturutin as $$
begin new.updated_at = now(); return new; end; $$;

-- users (profile) — id = auth.uid(); no FK to auth.users (keeps shared auth untouched) ----------
create table if not exists koturutin.users (
  id uuid primary key,
  language text not null default 'tr' check (language in ('tr','en')),
  timezone text not null default 'Europe/Istanbul',
  notification_budget smallint not null default 2 check (notification_budget between 0 and 2),
  quiet_windows jsonb not null default '[]'::jsonb check (jsonb_typeof(quiet_windows) = 'array'),
  smoking_stance text check (smoking_stance in ('quitting','reducing','noticing','not_ready')),
  intent_value text,
  intent_target_behavior text,
  consent_health_processing boolean not null default false,
  consent_personalization boolean not null default false,
  consent_research boolean not null default false,
  consent_free_text_to_model boolean not null default false,
  consent_updated_at timestamptz,
  analytics_enabled boolean not null default false,
  age_confirmed_18 boolean not null default false,
  retention_window_days integer not null default 180 check (retention_window_days between 30 and 3650),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger trg_users_updated before update on koturutin.users
  for each row execute function koturutin.set_updated_at();

-- moments -------------------------------------------------------------------
create table if not exists koturutin.moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references koturutin.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  decision_point text check (decision_point in
    ('waking','leaving_home','arriving_at_work','break','arriving_home','after_meal','bedtime')),
  time_window_start_minute smallint check (time_window_start_minute between 0 and 1439),
  time_window_end_minute smallint check (time_window_end_minute between 0 and 1440),
  context text,
  verification_status text not null default 'hypothesis' check (verification_status in ('hypothesis','confirmed')),
  is_priority boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_moments_user_id on koturutin.moments(user_id);
create index if not exists idx_moments_user_status on koturutin.moments(user_id, verification_status);
create unique index if not exists uniq_moments_one_priority on koturutin.moments(user_id)
  where is_priority and deleted_at is null;
create trigger trg_moments_updated before update on koturutin.moments
  for each row execute function koturutin.set_updated_at();

-- routine_edges -------------------------------------------------------------
create table if not exists koturutin.routine_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references koturutin.users(id) on delete cascade,
  moment_id uuid not null references koturutin.moments(id) on delete cascade,
  trigger text not null check (char_length(trigger) between 1 and 240),
  behavior text not null check (char_length(behavior) between 1 and 240),
  function_label text check (function_label in
    ('waking_energy','relief_transition','connection','attention_silence','craving','avoidance_procrastination','sleep_transition')),
  delayed_cost text,
  confidence smallint not null default 0 check (confidence between 0 and 100),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  user_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_routine_edges_user_id on koturutin.routine_edges(user_id);
create index if not exists idx_routine_edges_moment_id on koturutin.routine_edges(moment_id);
create trigger trg_routine_edges_updated before update on koturutin.routine_edges
  for each row execute function koturutin.set_updated_at();

-- experiment_library (curated reference; read-only to clients) ----------------
create table if not exists koturutin.experiment_library (
  id uuid primary key default gen_random_uuid(),
  intent_key text not null unique check (intent_key ~ '^[a-z0-9]+(\.[a-z0-9_]+)+$'),
  function_label text not null check (function_label in
    ('waking_energy','relief_transition','connection','attention_silence','craving','avoidance_procrastination','sleep_transition')),
  family text not null check (char_length(family) between 1 and 60),
  duration_band text not null check (char_length(duration_band) between 1 and 20),
  min_seconds integer not null check (min_seconds > 0),
  max_seconds integer not null check (max_seconds >= min_seconds and max_seconds <= 600),
  difficulty smallint not null default 1 check (difficulty between 1 and 5),
  safety_class text not null default 'standard' check (safety_class in ('standard','smoking_support','relationship_safety')),
  clinically_reviewed boolean not null default false,
  culturally_reviewed boolean not null default false,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_experiment_library_function on koturutin.experiment_library(function_label) where enabled;
create trigger trg_experiment_library_updated before update on koturutin.experiment_library
  for each row execute function koturutin.set_updated_at();

-- experiments ---------------------------------------------------------------
create table if not exists koturutin.experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references koturutin.users(id) on delete cascade,
  moment_id uuid not null references koturutin.moments(id) on delete cascade,
  library_id uuid references koturutin.experiment_library(id) on delete restrict,
  function_label text not null check (function_label in
    ('waking_energy','relief_transition','connection','attention_silence','craving','avoidance_procrastination','sleep_transition')),
  duration_band text not null check (char_length(duration_band) between 1 and 20),
  difficulty smallint not null default 1 check (difficulty between 1 and 5),
  safety_class text not null default 'standard' check (safety_class in ('standard','smoking_support','relationship_safety')),
  if_this_then_that jsonb not null check (if_this_then_that ? 'if' and if_this_then_that ? 'then'),
  is_active boolean not null default false,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_experiments_user_id on koturutin.experiments(user_id);
create index if not exists idx_experiments_moment_id on koturutin.experiments(moment_id);
create index if not exists idx_experiments_library_id on koturutin.experiments(library_id);
create unique index if not exists uniq_experiments_one_active on koturutin.experiments(user_id)
  where is_active and deleted_at is null;
create trigger trg_experiments_updated before update on koturutin.experiments
  for each row execute function koturutin.set_updated_at();

-- attempts ------------------------------------------------------------------
create table if not exists koturutin.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references koturutin.users(id) on delete cascade,
  experiment_id uuid not null references koturutin.experiments(id) on delete cascade,
  moment_id uuid references koturutin.moments(id) on delete set null,
  offered_at timestamptz not null default now(),
  response text not null default 'offered' check (response in ('offered','did','not_now','declined')),
  responded_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_attempts_user_id on koturutin.attempts(user_id);
create index if not exists idx_attempts_experiment_id on koturutin.attempts(experiment_id);
create index if not exists idx_attempts_user_offered_at on koturutin.attempts(user_id, offered_at);
create trigger trg_attempts_updated before update on koturutin.attempts
  for each row execute function koturutin.set_updated_at();

-- outcomes ------------------------------------------------------------------
create table if not exists koturutin.outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references koturutin.users(id) on delete cascade,
  attempt_id uuid not null unique references koturutin.attempts(id) on delete cascade,
  craving smallint check (craving between 0 and 10),
  energy smallint check (energy between 0 and 10),
  mood smallint check (mood between 0 and 10),
  connection_feeling smallint check (connection_feeling between 0 and 10),
  free_note text,                                   -- Sensitive; guarded in 0002 (R3)
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_outcomes_user_id on koturutin.outcomes(user_id);
create index if not exists idx_outcomes_user_captured_at on koturutin.outcomes(user_id, captured_at);
create trigger trg_outcomes_updated before update on koturutin.outcomes
  for each row execute function koturutin.set_updated_at();

-- observations --------------------------------------------------------------
create table if not exists koturutin.observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references koturutin.users(id) on delete cascade,
  moment_id uuid references koturutin.moments(id) on delete set null,
  context text,
  behavior text,
  craving smallint check (craving between 0 and 10),
  energy smallint check (energy between 0 and 10),
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_observations_user_id on koturutin.observations(user_id);
create index if not exists idx_observations_user_captured_at on koturutin.observations(user_id, captured_at);
create trigger trg_observations_updated before update on koturutin.observations
  for each row execute function koturutin.set_updated_at();

-- insights (backend-inserted) -----------------------------------------------
create table if not exists koturutin.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references koturutin.users(id) on delete cascade,
  text text not null,
  evidence_type text not null check (evidence_type in ('user_said','seen_together','experiment_result')),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  confidence smallint not null default 0 check (confidence between 0 and 100),
  user_confirmed boolean,
  related_moment_id uuid references koturutin.moments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_insights_user_id on koturutin.insights(user_id);
create trigger trg_insights_updated before update on koturutin.insights
  for each row execute function koturutin.set_updated_at();

-- who5 (optional wellbeing) --------------------------------------------------
create table if not exists koturutin.who5 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references koturutin.users(id) on delete cascade,
  answers smallint[] not null check (array_length(answers,1) = 5),
  score smallint not null check (score between 0 and 100),
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_who5_user_id on koturutin.who5(user_id);

-- safety_events (backend-only audit) ----------------------------------------
create table if not exists koturutin.safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  pathway text not null check (pathway in ('smoking_support','crisis','relationship_safety')),
  triggered_by text not null default 'rule' check (triggered_by in ('rule','user_action')),
  resolution text,
  created_at timestamptz not null default now()
);
