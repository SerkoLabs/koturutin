-- koturutin — RLS, grants and barriers for the ISOLATED koturutin schema (docs/DATABASE.md; ADR-012).
-- Every table has RLS ON, owner-only (auth.uid() = user_id). No object outside `koturutin` is modified.
-- Schema USAGE is granted to anon+authenticated so PostgREST can expose the schema; anon receives NO
-- table privileges (fully denied). service_role bypasses RLS and is used only in trusted server code.

grant usage on schema koturutin to anon, authenticated;

alter table koturutin.users              enable row level security;
alter table koturutin.moments            enable row level security;
alter table koturutin.routine_edges      enable row level security;
alter table koturutin.experiments        enable row level security;
alter table koturutin.attempts           enable row level security;
alter table koturutin.outcomes           enable row level security;
alter table koturutin.observations       enable row level security;
alter table koturutin.insights           enable row level security;
alter table koturutin.who5               enable row level security;
alter table koturutin.experiment_library enable row level security;
alter table koturutin.safety_events      enable row level security;

-- users: the row IS the owner. The client may create ONLY its own profile row (idempotent upsert,
-- no global auth trigger). No cross-user access.
create policy users_select on koturutin.users for select using (auth.uid() = id);
create policy users_insert on koturutin.users for insert with check (auth.uid() = id);
create policy users_update on koturutin.users for update using (auth.uid() = id) with check (auth.uid() = id);
create policy users_delete on koturutin.users for delete using (auth.uid() = id);
grant select, insert, update, delete on koturutin.users to authenticated;

-- Owner-only CRUD tables
create policy moments_select on koturutin.moments for select using (auth.uid() = user_id);
create policy moments_insert on koturutin.moments for insert with check (auth.uid() = user_id);
create policy moments_update on koturutin.moments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy moments_delete on koturutin.moments for delete using (auth.uid() = user_id);
grant select, insert, update, delete on koturutin.moments to authenticated;

create policy routine_edges_select on koturutin.routine_edges for select using (auth.uid() = user_id);
create policy routine_edges_insert on koturutin.routine_edges for insert with check (auth.uid() = user_id);
create policy routine_edges_update on koturutin.routine_edges for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy routine_edges_delete on koturutin.routine_edges for delete using (auth.uid() = user_id);
grant select, insert, update, delete on koturutin.routine_edges to authenticated;

create policy experiments_select on koturutin.experiments for select using (auth.uid() = user_id);
create policy experiments_insert on koturutin.experiments for insert with check (auth.uid() = user_id);
create policy experiments_update on koturutin.experiments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy experiments_delete on koturutin.experiments for delete using (auth.uid() = user_id);
grant select, insert, update, delete on koturutin.experiments to authenticated;

create policy attempts_select on koturutin.attempts for select using (auth.uid() = user_id);
create policy attempts_insert on koturutin.attempts for insert with check (auth.uid() = user_id);
create policy attempts_update on koturutin.attempts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy attempts_delete on koturutin.attempts for delete using (auth.uid() = user_id);
grant select, insert, update, delete on koturutin.attempts to authenticated;

create policy observations_select on koturutin.observations for select using (auth.uid() = user_id);
create policy observations_insert on koturutin.observations for insert with check (auth.uid() = user_id);
create policy observations_update on koturutin.observations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy observations_delete on koturutin.observations for delete using (auth.uid() = user_id);
grant select, insert, update, delete on koturutin.observations to authenticated;

create policy who5_select on koturutin.who5 for select using (auth.uid() = user_id);
create policy who5_insert on koturutin.who5 for insert with check (auth.uid() = user_id);
create policy who5_delete on koturutin.who5 for delete using (auth.uid() = user_id);
grant select, insert, delete on koturutin.who5 to authenticated;

-- outcomes: owner-only rows; free_note is COLUMN-REVOKED from the client (spine §21 R3).
create policy outcomes_select on koturutin.outcomes for select using (auth.uid() = user_id);
create policy outcomes_insert on koturutin.outcomes for insert with check (auth.uid() = user_id);
create policy outcomes_update on koturutin.outcomes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy outcomes_delete on koturutin.outcomes for delete using (auth.uid() = user_id);
grant select, delete on koturutin.outcomes to authenticated;
grant insert (id, user_id, attempt_id, craving, energy, mood, connection_feeling, captured_at, created_at, updated_at, deleted_at)
  on koturutin.outcomes to authenticated;
grant update (craving, energy, mood, connection_feeling, captured_at, updated_at, deleted_at)
  on koturutin.outcomes to authenticated;

-- insights: client reads/deletes own and updates ONLY user_confirmed; INSERT is backend-only.
create policy insights_select on koturutin.insights for select using (auth.uid() = user_id);
create policy insights_update on koturutin.insights for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy insights_delete on koturutin.insights for delete using (auth.uid() = user_id);
grant select, delete on koturutin.insights to authenticated;
grant update (user_confirmed, updated_at) on koturutin.insights to authenticated;

-- experiment_library: read-only reference; enabled rows readable by any authenticated user.
create policy experiment_library_select on koturutin.experiment_library for select to authenticated using (enabled);
grant select on koturutin.experiment_library to authenticated;

-- safety_events: RLS ON, NO policies + NO client grants → fully client-inaccessible (server-only).

-- capture-consent gate (spine §21 R2/R6): no special-category capture without age + health consent.
create or replace function koturutin.user_capture_allowed(uid uuid) returns boolean
language sql stable security definer set search_path = koturutin as $$
  select coalesce((select age_confirmed_18 and consent_health_processing from koturutin.users where id = uid), false);
$$;
create or replace function koturutin.enforce_capture_consent() returns trigger
language plpgsql security definer set search_path = koturutin as $$
begin
  if not koturutin.user_capture_allowed(new.user_id) then
    raise exception 'capture requires age_confirmed_18 and consent_health_processing (spine R2/R6)';
  end if;
  return new;
end; $$;
create trigger trg_moments_capture_gate       before insert on koturutin.moments       for each row execute function koturutin.enforce_capture_consent();
create trigger trg_routine_edges_capture_gate before insert on koturutin.routine_edges for each row execute function koturutin.enforce_capture_consent();
create trigger trg_experiments_capture_gate   before insert on koturutin.experiments   for each row execute function koturutin.enforce_capture_consent();
create trigger trg_attempts_capture_gate      before insert on koturutin.attempts      for each row execute function koturutin.enforce_capture_consent();
create trigger trg_observations_capture_gate  before insert on koturutin.observations  for each row execute function koturutin.enforce_capture_consent();
create trigger trg_outcomes_capture_gate      before insert on koturutin.outcomes      for each row execute function koturutin.enforce_capture_consent();
create trigger trg_who5_capture_gate          before insert on koturutin.who5          for each row execute function koturutin.enforce_capture_consent();

-- free_note server-side barrier (spine §21 R3): defense in depth beyond the column grant.
create or replace function koturutin.enforce_free_note_consent() returns trigger
language plpgsql security definer set search_path = koturutin as $$
declare has_consent boolean;
begin
  if new.free_note is not null then
    select consent_free_text_to_model into has_consent from koturutin.users where id = new.user_id;
    if not coalesce(has_consent, false) then
      raise exception 'free_note requires consent_free_text_to_model = true (spine R3)';
    end if;
  end if;
  return new;
end; $$;
create trigger trg_outcomes_free_note before insert or update on koturutin.outcomes
  for each row execute function koturutin.enforce_free_note_consent();
