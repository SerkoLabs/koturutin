---
name: quality-audit
description: Perform an evidence-driven independent audit of implemented work, classify P0-P3 findings, and decide the lifecycle gate.
---

# Quality Audit

Default to review-first; do not modify code unless the user/task explicitly asks to fix findings.

Use `templates/AUDIT_REPORT.template.md`.

Inspect:
requirements, placeholders, runtime risks, typing, navigation, auth, authorization, data/RLS, secrets, race conditions, state handling, accessibility, localization, privacy, analytics, performance, dependencies and release risks.

Severity:
- P0 release/security/data loss/app unusable
- P1 major core-flow or authorization failure
- P2 meaningful quality/performance/maintainability
- P3 polish

No forward gate with unresolved P0/P1.
