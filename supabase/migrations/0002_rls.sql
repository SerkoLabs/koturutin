-- koturutin — RLS, grants, and the free_note server-side barrier (docs/DATABASE.md; spine §21 R3).
-- Both grants AND RLS are explicit (AGENTS.md §13). service_role bypasses RLS and is used ONLY in
-- trusted Edge Functions, never shipped to the client.

-- Baseline: no client table privileges until granted explicitly.
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;

-- Enable RLS on every table --------------------------------------------------
alter table public.users              enable row level security;
alter table public.moments            enable row level security;
alter table public.routine_edges      enable row level security;
alter table public.experiments        enable row level security;
alter table public.attempts           enable row level security;
alter table public.outcomes           enable row level security;
alter table public.observations       enable row level security;
alter table public.insights           enable row level security;
alter table public.experiment_library enable row level security;
alter table public.safety_events      enable row level security;

-- users: the row IS the owner (id = auth.uid()); no client INSERT (trigger-created) -----------
create policy users_select on public.users for select using (auth.uid() = id);
create policy users_update on public.users for update using (auth.uid() = id) with check (auth.uid() = id);
create policy users_delete on public.users for delete using (auth.uid() = id);
grant select, update, delete on public.users to authenticated;

-- Owner-only CRUD tables (auth.uid() = user_id) -----------------------------------------------
-- moments
create policy moments_select on public.moments for select using (auth.uid() = user_id);
create policy moments_insert on public.moments for insert with check (auth.uid() = user_id);
create policy moments_update on public.moments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy moments_delete on public.moments for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.moments to authenticated;

-- routine_edges
create policy routine_edges_select on public.routine_edges for select using (auth.uid() = user_id);
create policy routine_edges_insert on public.routine_edges for insert with check (auth.uid() = user_id);
create policy routine_edges_update on public.routine_edges for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy routine_edges_delete on public.routine_edges for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.routine_edges to authenticated;

-- experiments
create policy experiments_select on public.experiments for select using (auth.uid() = user_id);
create policy experiments_insert on public.experiments for insert with check (auth.uid() = user_id);
create policy experiments_update on public.experiments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy experiments_delete on public.experiments for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.experiments to authenticated;

-- attempts
create policy attempts_select on public.attempts for select using (auth.uid() = user_id);
create policy attempts_insert on public.attempts for insert with check (auth.uid() = user_id);
create policy attempts_update on public.attempts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy attempts_delete on public.attempts for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.attempts to authenticated;

-- observations
create policy observations_select on public.observations for select using (auth.uid() = user_id);
create policy observations_insert on public.observations for insert with check (auth.uid() = user_id);
create policy observations_update on public.observations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy observations_delete on public.observations for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.observations to authenticated;

-- outcomes: owner-only rows, but free_note is COLUMN-REVOKED from the client (spine §21 R3) ----
create policy outcomes_select on public.outcomes for select using (auth.uid() = user_id);
create policy outcomes_insert on public.outcomes for insert with check (auth.uid() = user_id);
create policy outcomes_update on public.outcomes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy outcomes_delete on public.outcomes for delete using (auth.uid() = user_id);
grant select, delete on public.outcomes to authenticated;
-- Column-scoped write: the client may write the structured fields but NOT free_note.
grant insert (id, user_id, attempt_id, craving, energy, mood, connection_feeling, captured_at, created_at, updated_at, deleted_at)
  on public.outcomes to authenticated;
grant update (craving, energy, mood, connection_feeling, captured_at, updated_at, deleted_at)
  on public.outcomes to authenticated;

-- insights: client may read/delete own and update ONLY user_confirmed; INSERT is backend-only ---
create policy insights_select on public.insights for select using (auth.uid() = user_id);
create policy insights_update on public.insights for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy insights_delete on public.insights for delete using (auth.uid() = user_id);
-- (no insights_insert policy → clients cannot insert; the summarization Edge Function uses service_role)
grant select, delete on public.insights to authenticated;
grant update (user_confirmed, updated_at) on public.insights to authenticated;

-- experiment_library: read-only reference; enabled rows readable by any authenticated user -------
create policy experiment_library_select on public.experiment_library for select to authenticated using (enabled);
grant select on public.experiment_library to authenticated;
-- (no insert/update/delete policies or grants → clients cannot write; seeded via migrations)

-- safety_events: no client access at all (backend inserts via service_role; founder/QA reads there)
-- (RLS enabled with NO policies for authenticated/anon → all client access denied; no grants.)

-- Server-side capture-consent gate (spine §21 R2/R6) ------------------------------------------
-- The age(18+) + required health-processing consent gate must hold at the TRUST BOUNDARY, not
-- only in the client UI: a valid JWT could otherwise insert its own special-category rows with
-- consent false. Mirror the free_note pattern with a SECURITY DEFINER predicate + BEFORE INSERT
-- triggers on every table that captures special-category data.
create or replace function public.user_capture_allowed(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select age_confirmed_18 and consent_health_processing from public.users where id = uid),
    false
  );
$$;

create or replace function public.enforce_capture_consent() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.user_capture_allowed(new.user_id) then
    raise exception 'capture requires age_confirmed_18 and consent_health_processing (spine R2/R6)';
  end if;
  return new;
end;
$$;

create trigger trg_moments_capture_gate       before insert on public.moments       for each row execute function public.enforce_capture_consent();
create trigger trg_routine_edges_capture_gate before insert on public.routine_edges for each row execute function public.enforce_capture_consent();
create trigger trg_experiments_capture_gate   before insert on public.experiments   for each row execute function public.enforce_capture_consent();
create trigger trg_attempts_capture_gate      before insert on public.attempts      for each row execute function public.enforce_capture_consent();
create trigger trg_observations_capture_gate  before insert on public.observations  for each row execute function public.enforce_capture_consent();
create trigger trg_outcomes_capture_gate      before insert on public.outcomes      for each row execute function public.enforce_capture_consent();

-- free_note server-side barrier (defense in depth beyond the column grant) ---------------------
create or replace function public.enforce_free_note_consent() returns trigger
language plpgsql security definer set search_path = public as $$
declare has_consent boolean;
begin
  if new.free_note is not null then
    select consent_free_text_to_model into has_consent from public.users where id = new.user_id;
    if not coalesce(has_consent, false) then
      raise exception 'free_note requires consent_free_text_to_model = true (spine R3)';
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_outcomes_free_note before insert or update on public.outcomes
  for each row execute function public.enforce_free_note_consent();
