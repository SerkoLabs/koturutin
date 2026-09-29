---
name: database-design
description: Design database schema, ownership, authorization/RLS, storage, indexes and deletion semantics before migrations.
---

# Database Design

Input: README, PRODUCT_SPEC, USER_FLOWS, ARCHITECTURE.
Output: `docs/DATABASE.md`.

Use `templates/DATABASE.template.md`.

If persistence is not needed, create DATABASE.md with `N/A` and justification.

For Supabase:
- explicit grants and RLS for every exposed object,
- service role server-side only,
- allow and deny test cases,
- storage object policies,
- indexes for common relationship/filter/policy predicates when justified.

Do not run migrations while producing the design.
