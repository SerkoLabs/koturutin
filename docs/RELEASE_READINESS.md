# Release Readiness — Stage 14 (Google Play, Android-first)

> Status: **NOT production-ready yet.** The app runs end-to-end, is local-first, encrypted at rest,
> and CI-green — but a real store release needs founder-owned accounts/keys, store-compliance
> artifacts, and two genuine pre-release blockers to be cleared first. This document is the honest
> checklist. Verified against current sources (Sept 2026), not policy memory.

## Recommended path: CLOSED test track first, not production

koturutin handles **special-category (health-adjacent) data** (mood, craving, routines, optional
WHO-5) and offers behaviour-change micro-experiments. Two things make a **production** launch
premature right now:

1. **`experiment_library` content is PLACEHOLDER** — the seeded experiments are marked
   `clinically_reviewed = false` and `culturally_reviewed = false`. Shipping unreviewed
   behaviour-change/health content to the public is a real user-safety and store-policy risk.
2. **Pre-code validation (ADR-006 / `docs/VALIDATION_PLAN.md`) is not done.** The four critical
   assumptions were never marked validated; the playbook requires this before beta.

→ **Ship to Google Play's `internal` (closed) testing track as a `draft` first** (that is what
`eas.json` is configured for), gather real-device + small-group feedback, complete the content review
and validation, then promote to production. This is safe, standard, and unblocks momentum now.

## Do we need Google auth? Expo token? (direct answers)

- **Google / any login — NOT required for the first release.** The app is local-first and fully
  usable with **no account**. Login only exists to enable optional cloud sync/backup, which is itself
  gated (ADR-013) and not active. Recommendation: **release local-only first**, add auth + sync later.
  (If/when auth is added, Google Play's *account-deletion* requirement for account-based apps applies —
  a web URL to request deletion — so local-only also keeps compliance simpler now.)
- **Expo access token (`EXPO_TOKEN`) — YES, needed to build/submit via EAS**, plus a **Google Play
  service account key** for `eas submit`. Both are founder-provided secrets (see below). They are the
  build/submission mechanics; they do not change the app's behaviour.

## What is already DONE in-repo (no founder assets needed)

- Android build config: `package = com.serkolabs.koturutin`, `versionCode = 1`, app icon + adaptive
  icon (fore/back/monochrome) + splash, `expo-secure-store` config plugin. (`app.json`)
- **Target API level: satisfied.** New Play submissions must target **Android 16 (API 36)** since
  2026-08-31; **Expo SDK 57 defaults to compileSdk/targetSdk 36**, so no override is required (can be
  pinned with `expo-build-properties` if desired).
- `eas.json` with `development` / `preview` (internal APK) / `production` (AAB — Play requires an app
  bundle, not APK) profiles, and a `submit` profile targeting the **internal** track as a **draft**.
- Secrets are gitignored: `google-service-account*.json`, `*.keystore`, `*.jks/.p12/.key/.pem`,
  `.env*.local`. NEVER commit these.
- Privacy policy DRAFT: `docs/PRIVACY.md` (bilingual; must be legally reviewed + hosted at a public URL).
- Data-safety mapping: below (the founder transcribes it into the Play Console form).

## Founder-only steps (accounts / keys / store forms — I cannot do these)

1. **Expo account + `EXPO_TOKEN`.** Create an Expo account, run `eas init` in the repo (creates the EAS
   project id), and generate a personal access token; set `EXPO_TOKEN` where builds run (locally or CI).
2. **Google Play Developer account** (one-time US$25) — only the founder can create/own it.
3. **Google Play service account key** for `eas submit` → save as `google-service-account.json` at the
   repo root (gitignored). See Expo's guide (link below).
4. **App signing:** let EAS manage the upload/signing keystore (recommended) on first `eas build`.
5. **Store listing metadata** (TR + EN): title, short + full description, feature graphic, phone
   screenshots, category, contact email. (Draft copy can be prepared from README/PRODUCT_SPEC.)
6. **Privacy policy URL:** host `docs/PRIVACY.md` (after legal review) at a public URL; put it in the
   Play listing AND the Data safety form.
7. **Data safety form** in Play Console — see mapping below.
8. **Health apps declaration form** in Play Console — koturutin handles health-related data, so this
   declaration is required *in addition to* the Data safety form. (Founder attests actual behaviour.)
9. **Content rating** questionnaire, target audience (18+), and ads declaration (no ads).

## Google Play Data safety — mapping (founder transcribes into the console)

Reflect the app's ACTUAL behaviour (must stay consistent with the code):

- **Data collected / stored:** "Health & fitness" (mood, craving, energy, routine notes, optional
  WHO-5). Also app preferences (language, notification settings, consents).
- **Stored on-device, encrypted at rest** (tweetnacl secretbox; key in the OS keystore).
- **Data sharing: NONE.** No third-party sharing; no ads; no analytics SDK emitting data (the
  `analyticsEnabled` flag currently drives no emitter).
- **Data transmitted off-device:** NONE in the current build — cloud sync is not active (no auth
  wired). If/when cloud sync is enabled, update the form to declare the synced fields + in-transit
  encryption, and add the explicit cloud-backup consent + disclosure (ADR-013) FIRST.
- **Account deletion:** the app provides on-device "delete my account and all data". No cloud account
  exists in this build. (If auth is added, provide a web deletion request URL.)
- **Free-text notes** never leave the device (column-revoked + consent trigger + client mapper omits
  them).

## Permissions to verify on the generated build (needs a build/prebuild)

- `INTERNET` (default) and `POST_NOTIFICATIONS` (from `expo-notifications`, Android 13+). No location,
  contacts, camera, mic, storage, or background-location permissions are used — confirm the generated
  `AndroidManifest.xml` during the first EAS build and drop anything unexpected.

## Hard PRE-RELEASE (pre-beta) blockers — must clear before PRODUCTION

- [ ] `experiment_library` content **clinically + culturally reviewed** (flip both review flags true;
      requires a qualified reviewer — a founder/expert decision, not code).
- [ ] **Validation evidence (ADR-006)** captured per `docs/VALIDATION_PLAN.md`.
- [ ] **On-device verification (TASK-370):** run the app on real Android hardware — the loop, the
      lock-screen notification preview, and Keychain/Keystore at-rest storage.
- [ ] Legal review + public hosting of the **privacy policy**.
- [ ] (If cloud sync is to be on at launch) the ADR-013 cloud-activation gates.

## Build & submit commands (once the founder assets exist)

```
eas init                      # one-time: creates the EAS project id
eas build -p android --profile preview      # internal APK for quick device testing
eas build -p android --profile production   # AAB for the store
eas submit -p android --profile production  # uploads to the internal track as a draft
```

## Sources (verified Sept 2026)

- [Target API level requirements — Play Console Help](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)
- [Publish your health app on Google Play — Android Developers](https://developer.android.com/health-and-fitness/health-connect/publish)
- [Health Content and Services — Play Console Help](https://support.google.com/googleplay/android-developer/answer/16679511?hl=en)
- [Submit to the Google Play Store with EAS Submit — Expo](https://docs.expo.dev/submit/android/)
- [Creating a Google Service Account — Expo FYI](https://github.com/expo/fyi/blob/main/creating-google-service-account.md)
- [Expo SDK 57 changelog](https://expo.dev/changelog/sdk-57)
