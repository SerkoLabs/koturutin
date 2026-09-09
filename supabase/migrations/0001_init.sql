-- koturutin — initial schema (Stage 06 → migration). Mirrors docs/DATABASE.md.
-- Authored after DATABASE.md was approved (AGENTS.md §8/§13). Applied via the Supabase CLI /
-- MCP apply_migration against the founder's project (BLOCKED until credentials are provided).
-- RLS + grants + the free_note barrier are in 0002_rls.sql; the library seed in 0003.

create extension if not exists pgcrypto;      -- gen_random_uuid()
-- Note: confirm extension availability/names against current Supabase docs at apply time.

-- Shared updated_at trigger -------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- users ---------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'tr' check (language in ('tr','en')),
  timezone text not null default 'Europe/Istanbul',
  notification_budget smallint not null default 2 check (notification_budget between 0 and 2),
  quiet_windows jsonb not null default '[]'::jsonb check (jsonb_typeof(quiet_windows) = 'array'),
  smoking_stance text check (smoking_stance in ('quitting','reducing','noticing','not_ready')),
  intent_value text,
  intent_target_behavior text,
  -- Canonical consent model (spine §21 R2)
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
create trigger trg_users_updated before update on public.users
  for each row execute function set_updated_at();

-- Profile row is created by a SECURITY DEFINER trigger on auth.users insert (backend), not the client.
create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- moments -------------------------------------------------------------------
create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  decision_point text check (decision_point in
    ('waking','leaving_home','arriving_at_work','break','arriving_home','after_meal','bedtime')),
  time_window_start time,
  time_window_end time check (time_window_end is null or time_window_start is null or time_window_end > time_window_start),
  context text,
  verification_status text not null default 'hypothesis' check (verification_status in ('hypothesis','confirmed')),
  is_priority boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_moments_user_id on public.moments(user_id);
create index if not exists idx_moments_user_status on public.moments(user_id, verification_status);
-- At most one active priority moment per user (spine §3, R-11).
create unique index if not exists uniq_moments_one_priority on public.moments(user_id)
  where is_priority and deleted_at is null;
create trigger trg_moments_updated before update on public.moments
  for each row execute function set_updated_at();

-- routine_edges -------------------------------------------------------------
create table if not exists public.routine_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  moment_id uuid not null references public.moments(id) on delete cascade,
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
create index if not exists idx_routine_edges_user_id on public.routine_edges(user_id);
create index if not exists idx_routine_edges_moment_id on public.routine_edges(moment_id);
create trigger trg_routine_edges_updated before update on public.routine_edges
  for each row execute function set_updated_at();

-- experiment_library (curated reference data; NOT user data) -----------------
create table if not exists public.experiment_library (
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
create index if not exists idx_experiment_library_function on public.experiment_library(function_label) where enabled;
create trigger trg_experiment_library_updated before update on public.experiment_library
  for each row execute function set_updated_at();

-- experiments ---------------------------------------------------------------
create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  moment_id uuid not null references public.moments(id) on delete cascade,
  library_id uuid references public.experiment_library(id) on delete restrict,
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
create index if not exists idx_experiments_user_id on public.experiments(user_id);
create index if not exists idx_experiments_moment_id on public.experiments(moment_id);
create index if not exists idx_experiments_library_id on public.experiments(library_id);
-- At most one active experiment per user (spine principle 4, R-11).
create unique index if not exists uniq_experiments_one_active on public.experiments(user_id)
  where is_active and deleted_at is null;
create trigger trg_experiments_updated before update on public.experiments
  for each row execute function set_updated_at();

-- attempts ------------------------------------------------------------------
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  moment_id uuid references public.moments(id) on delete set null,
  offered_at timestamptz not null default now(),
  response text not null default 'offered' check (response in ('offered','did','not_now','declined')),
  responded_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_attempts_user_id on public.attempts(user_id);
create index if not exists idx_attempts_experiment_id on public.attempts(experiment_id);
create index if not exists idx_attempts_moment_id on public.attempts(moment_id);
create index if not exists idx_attempts_user_offered_at on public.attempts(user_id, offered_at);
create trigger trg_attempts_updated before update on public.attempts
  for each row execute function set_updated_at();

-- outcomes ------------------------------------------------------------------
create table if not exists public.outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  attempt_id uuid not null unique references public.attempts(id) on delete cascade,
  craving smallint check (craving between 0 and 10),
  energy smallint check (energy between 0 and 10),
  mood smallint check (mood between 0 and 10),
  connection_feeling smallint check (connection_feeling between 0 and 10),
  free_note text,                                   -- Sensitive; guarded in 0002_rls.sql (R3)
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_outcomes_user_id on public.outcomes(user_id);
create index if not exists idx_outcomes_user_captured_at on public.outcomes(user_id, captured_at);
create trigger trg_outcomes_updated before update on public.outcomes
  for each row execute function set_updated_at();

-- observations --------------------------------------------------------------
create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  moment_id uuid references public.moments(id) on delete set null,
  context text,
  behavior text,
  craving smallint check (craving between 0 and 10),
  energy smallint check (energy between 0 and 10),
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_observations_user_id on public.observations(user_id);
create index if not exists idx_observations_moment_id on public.observations(moment_id);
create index if not exists idx_observations_user_captured_at on public.observations(user_id, captured_at);
create trigger trg_observations_updated before update on public.observations
  for each row execute function set_updated_at();

-- insights ------------------------------------------------------------------
create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  text text not null,
  evidence_type text not null check (evidence_type in ('user_said','seen_together','experiment_result')),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  confidence smallint not null default 0 check (confidence between 0 and 100),
  user_confirmed boolean,
  related_moment_id uuid references public.moments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_insights_user_id on public.insights(user_id);
create index if not exists idx_insights_user_created_at on public.insights(user_id, created_at);
create trigger trg_insights_updated before update on public.insights
  for each row execute function set_updated_at();

-- safety_events (minimal, non-identifying audit; backend-only) ---------------
create table if not exists public.safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  pathway text not null check (pathway in ('smoking_support','crisis','relationship_safety')),
  triggered_by text not null default 'rule' check (triggered_by in ('rule','user_action')),
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_safety_events_updated before update on public.safety_events
  for each row execute function set_updated_at();
