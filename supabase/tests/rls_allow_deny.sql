-- koturutin — RLS allow/deny authorization checks (docs/DATABASE.md "Security tests"; TASK-350).
-- Run against a BRANCH / disposable database after applying migrations 0001–0003. Requires two
-- seeded auth users. RLS is exercised by impersonating a user with the `authenticated` role and a
-- JWT-claims sub, the standard Supabase pattern. Any failed check raises and aborts.
--
-- Seed (run once with service_role, replacing the UUIDs):
--   insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'); -- User A
--   insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000b'); -- User B
-- (the profile trigger creates public.users rows).

-- Helper to impersonate a user for the current transaction.
create or replace function tests.as_user(uid uuid) returns void
language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  cnt int;
  m_a uuid;
begin
  -- A creates a confirmed moment (ALLOW).
  perform tests.as_user(a);
  insert into public.moments (user_id, name, decision_point, verification_status, is_priority)
    values (a, 'Eve varış', 'arriving_home', 'confirmed', true) returning id into m_a;

  -- A reads only their own rows (ALLOW → sees 1).
  select count(*) into cnt from public.moments;
  if cnt <> 1 then raise exception 'A should see exactly its own moment, saw %', cnt; end if;

  -- B cannot see A's moment (DENY → sees 0).
  perform tests.as_user(b);
  select count(*) into cnt from public.moments where id = m_a;
  if cnt <> 0 then raise exception 'DENY failed: B can read A''s moment'; end if;

  -- B cannot insert a row owned by A (DENY → WITH CHECK).
  begin
    insert into public.moments (user_id, name, verification_status) values (a, 'x', 'hypothesis');
    raise exception 'DENY failed: B inserted a row owned by A';
  exception when others then null; -- expected
  end;

  -- experiment_library is read-only to clients (DENY write).
  perform tests.as_user(a);
  begin
    insert into public.experiment_library (intent_key, function_label, family, duration_band, min_seconds, max_seconds)
      values ('x.y.z', 'connection', 'greeting', '30s-3m', 30, 180);
    raise exception 'DENY failed: client wrote experiment_library';
  exception when insufficient_privilege then null; -- expected (no grant)
    when others then null;
  end;

  -- free_note barrier: with consent OFF, a non-null free_note is rejected (DENY, spine R3).
  perform tests.as_user(a);
  update public.users set consent_free_text_to_model = false where id = a;
  begin
    insert into public.outcomes (user_id, attempt_id, free_note)
      values (a, gen_random_uuid(), 'sensitive note');
    raise exception 'DENY failed: free_note persisted with consent OFF';
  exception when others then null; -- expected (column grant + trigger)
  end;

  raise notice 'RLS allow/deny checks passed.';
end;
$$;
