---
name: documentation-sync
description: Keep project planning, status and decision documents synchronized with material implementation changes.
---

# Documentation Sync

After a material implementation change:
- update PROJECT_STATUS,
- update acceptance/task status in IMPLEMENTATION_PLAN,
- update ARCHITECTURE or DATABASE only when behavior/design actually changed,
- append a DECISIONS entry for a material tradeoff,
- never rewrite historical decisions to hide drift.

Docs must describe the current intended system, not a fictional future state.
