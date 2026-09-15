---
name: expo-supabase-mobile
description: Apply Expo/React Native + Supabase-specific engineering and security rules when that stack is selected.
---

# Expo + Supabase Mobile

Use current official Expo and Supabase docs for version-sensitive APIs.

Architecture expectations:
- TypeScript strict mode where feasible.
- Secrets that grant privileged access never ship in the app bundle.
- Publishable/anon-style client credentials are protected by database authorization, not secrecy.
- `service_role` stays in trusted server/edge-function environments.
- Auth session bootstrap and refresh behavior is explicit.
- Client-exposed data has deliberate grants + RLS.
- Storage buckets have explicit object access policies.
- Native permissions are minimal and justified.
- EAS/release configuration is separated by environment.
- Test on at least one realistic iOS/Android target before release when both are supported.

Database changes happen through reviewed migrations only after DATABASE.md exists.
