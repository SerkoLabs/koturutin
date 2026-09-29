---
name: security-review
description: Review application security, privacy, authorization, secrets, mobile storage, network and database access controls.
---

# Security Review

Threat-model the changed scope before listing generic advice.

For mobile apps, use OWASP MASVS categories as a coverage baseline:
storage, crypto, auth, network, platform, code, resilience and privacy as applicable.

For Supabase, review both grants and RLS policies. Test unauthorized as well as authorized paths.

Check:
- secret exposure,
- client trust boundaries,
- token/session storage,
- injection/input validation,
- object-level authorization,
- file upload/storage policies,
- privileged functions,
- dependency risk,
- logs/PII,
- deletion/retention.

Return evidence and minimal remediations.
