---
name: architecture-design
description: Design a minimal scalable architecture from approved product specs and user flows; no implementation code.
---

# Architecture Design

Input: README, PRODUCT_SPEC, USER_FLOWS.
Output: `docs/ARCHITECTURE.md`; material decisions may also append to `docs/DECISIONS.md`.

Use `templates/ARCHITECTURE.template.md`.

Prefer simple reversible choices. For version-sensitive stack decisions, activate `research-first`.

Every critical user behavior must have one clear implementation boundary. Include testing, observability, secrets, failure handling and deployment—not only component structure.

No application code in this skill.
