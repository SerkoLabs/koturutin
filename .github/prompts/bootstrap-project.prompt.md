Read `AGENTS.md` first and treat it as the canonical repository contract.

Start from the actual repository state and autonomously progress through the full lifecycle in the required order.

Do not ask for routine approval between stages or implementation phases. After each gate, fix in-scope failures, update `docs/PROJECT_STATUS.md`, determine the next eligible task, and continue automatically.

Do not write application code before Stage 07 passes. After Stage 07 passes, continue automatically through implementation, vertical slice, audits, core MVP, release readiness and beta readiness as far as repository/local access allows.

Stop only for an explicit stop condition defined in `AGENTS.md` such as credentials/assets only the user can provide, irreversible destructive action, meaningful unapproved spend, a major product-scope decision, externally consequential release/submission, or an unsolvable blocker.

Use permitted model fallbacks for critical reviews when the preferred model is unavailable; record the actual model and mark the gate `FALLBACK` instead of stopping.

Keep `docs/PROJECT_STATUS.md`, decisions, tests and verification evidence synchronized throughout the run.

Product idea:
${input:idea:Describe the app idea}
