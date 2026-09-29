---
name: vertical-slice-delivery
description: Implement and verify the first real end-to-end product path before broad feature work.
---

# Vertical Slice Delivery

Read the approved docs and the vertical-slice tasks in IMPLEMENTATION_PLAN.

Implement only the smallest meaningful end-to-end journey:
- real UI/state,
- real backend/data path when required,
- real auth/authorization,
- persistence/reload when required,
- success and failure states,
- tests or reproducible verification.

Do not conceal mocks or placeholders. If an external dependency cannot be used, mark the slice PARTIAL rather than pretending it is complete.

Update PROJECT_STATUS with evidence.
