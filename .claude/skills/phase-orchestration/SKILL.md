---
name: phase-orchestration
description: Determine the project's current lifecycle stage, enforce phase gates, and update PROJECT_STATUS. Use when starting work, continuing a project, or deciding what should happen next.
---

# Phase Orchestration

1. Read `/AGENTS.md`.
2. Read `/docs/AI_DEVELOPMENT_PLAYBOOK.md`.
3. Read `/docs/PROJECT_STATUS.md`.
4. Inspect repository evidence.
5. Find the earliest incomplete mandatory lifecycle stage.
6. Reconcile with the user's explicit task.
7. Do only the allowed work.
8. Evaluate the stage gate with evidence.
9. Update `/docs/PROJECT_STATUS.md`.
10. Report the next eligible action.

Never infer completion from the existence of a file alone. Check its contents against the gate.

If status and repository disagree, correct status from repository truth and record the correction.
