# AI Run Log

Use this file during model/cost/quality experiments. Do not invent token or cost numbers. If the client does not expose them, record `not exposed` and copy actual cost later from the provider dashboard.

## Experiment goals

- Compare planning quality against API cost.
- Confirm whether the repository instructions are followed without repeated prompting.
- Measure how often Astra escalation is actually needed.
- Detect rework caused by weak planning before implementation begins.

## Run template

### RUN-000 — <short name>
- Date:
- Repository / commit:
- Lifecycle stage:
- Agent/profile:
- Requested model:
- Actual model shown by client:
- Reasoning effort:
- User instruction:
- Files in scope:
- Result:
- Gate: PASS / PARTIAL / FAIL
- P0 findings:
- P1 findings:
- P2 findings:
- P3 findings:
- Input tokens: not exposed
- Cached input tokens: not exposed
- Output tokens: not exposed
- Provider cost: fill from provider dashboard
- Duration:
- Human quality score (1–10):
- Rework required:
- Notes:

## Quality scoring rubric

- 10: complete, precise, internally consistent, no material rework.
- 8–9: strong; only small corrections.
- 6–7: usable but requires meaningful correction.
- 4–5: substantial gaps or contradictions.
- 1–3: unusable or unsafe.

## Cost comparison

Judge cost per accepted gate rather than raw token count. A more expensive review can be economical if it prevents a large implementation rework.
