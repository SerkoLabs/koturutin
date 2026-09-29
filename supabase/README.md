# Supabase — koturutin backend (pending founder credentials)

The app runs **local-first** and does not require this backend for the current vertical slice.
These migrations are the real, reviewed schema (aligned to `docs/DATABASE.md`) and are applied once
the founder provisions a Supabase project.

## What is here

- `migrations/0001_init.sql` — schema: all entities, constraints, indexes, the single-active /
  single-priority partial unique indexes, and the `auth.users → public.users` profile trigger.
- `migrations/0002_rls.sql` — RLS enabled on every table, owner-only policies, explicit grants,
  the **column-revoked `free_note`** write + the consent-checking trigger (spine §21 R3), and the
  read-only `experiment_library` / backend-only `safety_events` rules.
- `migrations/0003_seed_experiment_library.sql` — placeholder curated content (review flags false).
- `tests/rls_allow_deny.sql` — the allow/deny authorization checks (TASK-350) to run against a
  branch/disposable DB with two seeded users.

## Blocked on founder-owned assets (a real gate, not fabricated)

Applying these migrations, running auth against a live project, and the end-to-end RLS assertions
(IMPLEMENTATION_PLAN **TASK-210**) require:

1. A Supabase project (URL + publishable/anon key) → set `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`).
2. The `service_role` key kept **only** in Edge Function environments (never in the app bundle).

## Apply (when credentials exist)

```
supabase link --project-ref <ref>
supabase db push            # applies migrations/*.sql in order
# then run supabase/tests/rls_allow_deny.sql against a branch DB (see that file)
```

Confirm Postgres/extension/CLI specifics against current official Supabase docs at apply time
(research-first) — do not assume versions.
