# Product Specification

> Scope: koturutin MVP (Stage One "Bir"). Source of truth: the authoritative product spine.
> This document is planning only. It defines detailed product behavior and testable acceptance
> criteria. Version-sensitive technology (Expo/React Native, Supabase, expo-notifications,
> LLM provider) is not pinned here; exact versions MUST be confirmed against current official
> documentation at build time (research-first), never guessed.

---

## 1. Product summary

koturutin is a bilingual (Turkish + English) **contextual routine lab** (bağlamsal rutin
laboratuvarı). It makes a person's automatic daily chains visible, proposes **one** small behavior
experiment at the right transition moment, and learns *with* the user what actually works — so they
make more conscious choices in real life and, over time, need the app less.

- **Positioning:** wellbeing & behavior-awareness support. It is **not** therapy, treatment,
  diagnosis, a habit-streak tracker, or a free-form AI therapist.
- **Product voice:** "Notice the moments your day goes on autopilot; at that exact moment try one
  small alternative that fits you; learn together what really works."
- **Core loop (4-part engine):** day map (gün haritası) → right moment (doğru an) →
  micro-experiment (mikro-deney) → learning (öğrenme).
- **The product = the 7-step learning loop:** tell your day → observe 3 days → confirm the map →
  choose one micro-experiment → remind at the right moment → learn the outcome → interpret the
  week together.
- **North Star metric:** weekly number of **successful conscious transitions** (a real-life
  choice) — never time-in-app, never streaks.
- **Structured data first, AI second:** structured records are the product's memory. AI is a
  bounded assistant (narrative parsing, summarization, library ranking, language adaptation, risk
  flagging) and is never the memory, the therapist, or the crisis decision-maker. Crisis routing is
  rule-based, never LLM-decided.
- **Platform (to confirm versions at build time):** Expo + React Native (TypeScript strict),
  Expo Router, Supabase (Postgres + Auth + RLS + Storage + Edge Functions), expo-notifications with
  an on-device rule engine, local-first storage for raw sensitive logs.

---

## 2. Personas / primary user

**Primary user — the reflective adult on autopilot.** An adult (18+) in Turkey or an
English-speaking context who senses that parts of their day run automatically (waking coffee +
cigarette, headphones on leaving home, balcony cigarette on arriving home, phone after a meal) and
wants to make more conscious choices *without* being shamed, tracked, or told their behavior is
"bad". They may hold one of four smoking stances — `quitting`, `reducing`, `noticing`, or
`not_ready` — and any of these is legitimate.

| Attribute | Description |
|---|---|
| Motivation | Wants awareness and small, fitting alternatives, not a treatment program or a streak game |
| Constraints | Low tolerance for notification noise; privacy-sensitive; may narrate in Turkish or English |
| Emotional needs | To feel understood, not judged; to correct the system when it is wrong |
| Anti-goals | Does not want diagnosis, moral labels, gamified pressure, or data harvesting |
| Sensitivity | Records mood, smoking, sleep, health status, and free journal text — all special-category |

**Secondary / support actors (MVP-relevant, minimal):**
- **Founder/QA operator** — reviews `safety_events`, validates copy, runs the validation plan.
  No production data-mining role. See §7 admin/support.
- **Clinical + legal reviewers** — approve safety, smoking, privacy, and crisis copy in TR and EN
  before release. Out-of-app process; referenced by F-010, F-011, F-012.

**Explicitly not a persona in MVP:** couples/relationship accounts, community members, clinicians
managing patients, minors.

**Age assurance:** Adulthood is **self-attested at onboarding** (18+, recorded as
`age_confirmed_18`); the app is for adults only. A **suspected-minor** account (e.g., a self-reported
age under 18) is not onboarded into the observation/experiment loop and is shown only
age-appropriate guidance and the always-visible safety resources (S-10). The exact statutory age
threshold under KVKK / GDPR Art. 8 is a build-time legal decision (see §9).

---

## 3. Product principles

These are non-negotiable. Violating any one is a P0/scope error (spine §1, all 10).

1. **Return the user to life.** The goal is to return the user to their life, not to maximize app
   engagement.
2. **No morality labels.** Podcasts, coffee, solitude, a cigarette are never declared "bad". The
   user chooses which behavior costs them; the system helps find a better option that still serves
   the behavior's *function*.
3. **No streak / failure language.** No "streak" or "you failed again" framing. A lapse (kayma) is
   learning data, never a reset-to-zero.
4. **One active experiment at a time.** Steps are small: 30 seconds–10 minutes (most 30s–5m;
   craving and sleep-transition families up to 10m).
5. **Structured data first, AI second.** AI is an assistant (parsing, summarizing, phrasing,
   flagging), never the memory, the therapist, or the crisis decision-maker.
6. **Right moment beats notification volume.** Max 2 proactive notifications/day at start; learn
   "not now".
7. **Correlation is correlation.** Patterns are shown as correlation, never as causation or
   diagnosis.
8. **Safety and privacy are always-free and always-visible.** Never behind a paywall.
9. **Rule-based, explainable decisions in v1 — no ML for MVP.** Every insight shows its evidence
   and a one-tap "this is wrong" correction.
10. **Nicotine dependence is not "just a morning routine".** Keep professional cessation support
    (Turkey: ALO 171) free and visible.

---

## 4. MVP scope

In scope for the MVP (spine §13 IN list), delivered as features F-001..F-014:

- Day narration (voice or cards) + user correction — **F-002**
- Three-day observation (very short logs) — **F-003**
- Day map (trigger, behavior, benefit, cost, confidence) — **F-004**
- Single active experiment (2–3 safe options by function + if-then plan) — **F-005**, **F-009**
- Rule-based notifications (chosen transition, quiet hours, budget, "not now" learning) — **F-006**,
  **F-013**
- Weekly learning (correlation language, user confirmation, next experiment) — **F-008**
- Safety pathways (smoking support, crisis routing, lock-screen privacy) — **F-010**
- Privacy & data control (delete/export, consent separation, model disclosure) — **F-011**
- Onboarding & intent + auth/account lifecycle — **F-001**
- Immediate outcome logging — **F-007**
- Bilingual TR + English (expert-reviewed natural copy in both) — **F-012**
- Optional, opt-in, non-diagnostic bi-weekly WHO-5 wellbeing check — **F-014**

**Always-free (never paywalled) even inside the MVP:** one day map, one active experiment, weekly
summary, data deletion, safety resources, privacy settings, account deletion, basic safety.

**Smallest first story that must be meaningful before code (spine §17):** Tell → Understand →
Confirm → Choose → Remind → Learn on a single real transition
("arriving home → balcony cigarette + coffee → 90-sec family contact, then conscious choice").

---

## 5. Non-goals

Explicitly out of MVP scope (spine §13 OUT list). None of these may be introduced without an
explicit scope change:

- Continuous location & passive sensor tracking.
- Free-form AI therapist & diagnosis.
- Community feed, couples accounts, social competition.
- Wearable integration.
- Many simultaneous goals & complex badge systems.
- Medication / nicotine-product / personal health advice.

Additional derived non-goals (consistent with the spine, resolved toward the smallest MVP):

- Server push notifications (v1 uses locally scheduled notices + on-device rule engine; server push
  is a later option).
- Multiple day maps per user, advanced pattern analytics, rich full experiment library, and data
  export beyond the always-free basic export are **later paid** capabilities, not MVP.
- Any addictive mechanic — "infinite streak", loss-aversion, guilt loops — is forbidden, not merely
  deferred.

---

## 6. Feature specifications

Response/enum vocabulary used below (spine §5): smoking stance =
`quitting`/`reducing`/`noticing`/`not_ready`; moment `verification_status` =
`hypothesis`/`confirmed`; attempt `response` = `offered`/`did`/`not_now`/`declined`; insight
evidence display type = `user_said`/`seen_together`/`experiment_result`.

---

### F-001 — Onboarding & intent (Niyet)

- **User goal:** Understand what koturutin is, give informed consent, choose language and smoking
  stance, and set a first intent (a value + a target behavior) — reaching a signed-in account.
- **Trigger:** First app launch (S-11), or opening the app while signed out (S-12), or tapping
  "set/change my intent" (S-01) later.
- **Preconditions:** App installed; network available for auth (see Offline/degraded for the
  degraded path).
- **Happy path:**
  1. First-run value screens explain the product voice and the four principles that matter to trust
     (no morality labels, no streaks, safety always free, correlation-not-causation).
  2. User selects language (`tr`/`en`); copy switches immediately via intent keys (F-012).
  3. The onboarding flow records **self-attested age (18+, `age_confirmed_18`)** and the **required**
     `consent_health_processing` (explicit KVKK/GDPR Art. 9(2)(a) consent to process
     special-category health data as the core service, captured **before any observation/craving
     capture**). It then presents **three separated optional** consents, all OFF by default —
     `consent_personalization`, `consent_research`, and `consent_free_text_to_model` — plus a
     separate opt-in `analytics_enabled` (non-sensitive product events only). The user may proceed
     with all optional consents off; confirming 18+ and granting `consent_health_processing` is
     required to enter the loop (declining health-processing still allows viewing safety resources,
     S-10).
  4. User signs in / signs up (Supabase Auth). A `users` (User) row is created with language,
     timezone, default notification budget (≤2/day), empty quiet windows, and the recorded consent
     flags (including `age_confirmed_18`, the required `consent_health_processing`, and the
     `analytics_enabled` opt-in).
  5. User chooses a smoking stance (`quitting`/`reducing`/`noticing`/`not_ready`); this is stored
     and never used to shame.
  6. User states an intent: what to change and why → a value + a target behavior (not a clock time).
  7. App routes to Tell-your-day (F-002).
- **Alternate paths:**
  - User declines all optional consents → proceeds; personalization and research features stay off.
  - User skips setting an intent → allowed; app still proceeds to F-002 and prompts intent later.
  - Returning signed-in user → skips value/consent screens, lands on their current loop stage.
  - User changes language later in Settings (F-011/F-013) → re-renders from intent keys.
- **Validation:** Language ∈ {`tr`,`en`}. Smoking stance ∈ the four allowed values. Intent value
  and target behavior are free short text (length-bounded); empty allowed (skip). Email/auth input
  validated by Supabase Auth rules. Age is self-attested 18+ (`age_confirmed_18`) and must be
  confirmed before proceeding; `consent_health_processing` must be true to enter any
  observation/craving capture. **Suspected-minor policy:** a self-reported age under 18 is not
  onboarded into the loop and is shown only age-appropriate guidance and the always-visible safety
  resources (S-10).
- **Permissions:** No device permissions requested at onboarding. Notifications, microphone, and
  location are requested later, per-feature, only when first used (F-002, F-006, F-013).
- **Loading:** Auth submit shows a non-blocking spinner; value screens are static and instant.
- **Empty:** New account has no maps, moments, or experiments; onboarding is the empty state.
- **Error/retry:** Auth failure shows a plain, non-shaming message and a retry action; no sensitive
  content in the error.
- **Offline/degraded:** Value and consent screens render offline; sign-in requires network and
  clearly says so with retry. Language choice persists locally before account creation.
- **Analytics:** `onboarding_started`, `language_selected`, `consent_state_recorded`
  (per-consent booleans, no free text), `smoking_stance_set`, `intent_set`, `account_created`.
  Product-value events only; no surveillance.
- **Acceptance criteria:**
  - [ ] Given first launch, when the consent screen appears, then personalization, research, and
        free-text-to-model consents are all presented separately and default to OFF.
  - [ ] Given a user proceeds with all optional consents off, when the account is created, then
        the `users` row stores three consent flags all false and onboarding completes without
        blocking.
  - [ ] Given a language selection, when the user switches `tr`↔`en`, then all onboarding copy
        re-renders from intent keys with no hard-coded string remaining.
  - [ ] Given onboarding, when any screen is shown, then no microphone, location, or notification
        permission prompt is triggered.
  - [ ] Given a chosen smoking stance, when it is saved, then it is one of
        `quitting`/`reducing`/`noticing`/`not_ready` and no "bad/quit now" framing is shown for any
        stance.
- **Out of scope:** Social sign-in providers beyond what Supabase Auth offers by default; multiple
  intents/goals; onboarding tutorials/tours beyond the value + consent screens.

---

### F-002 — Day narration (Günü anlat)

- **User goal:** Describe a typical day using **optional voice input for day narration** or by cards,
  so the system can draft a timeline of transitions and repeating chains — not clock schedules.
- **Trigger:** After onboarding (F-001), or "tell/redo my day" from the home loop (S-02).
- **Preconditions:** Signed in; account exists. For voice, microphone permission (requested here,
  not at onboarding).
- **Happy path:**
  1. User chooses **cards** (default, no permission) or **voice** (requests microphone permission
     on first use).
  2. Cards path: user assembles day segments (waking, leaving home, arriving at work, break,
     arriving home, after meal, bedtime) and the behavior in each.
  3. Voice path: user narrates; audio is transcribed and sent to the narrative-parsing AI layer
     **only if** free-text-to-model consent is ON; otherwise on-device/card fallback is used.
  4. AI extracts candidate {time window, transition, behavior, candidate function} tuples. These
     are stored as **hypotheses**, never facts.
  5. A draft timeline is shown as clearly-labeled assumptions ("Did I get this right?").
  6. Draft `moments` (Moment, `verification_status = hypothesis`) and candidate `routine_edges`
     (RoutineEdge) are persisted for confirmation in F-004.
- **Alternate paths:**
  - Free-text-to-model consent OFF → voice transcript and free text stay on device; only structured
    card input flows to the map; AI parsing of raw free text is skipped and the UI says so.
  - Microphone permission denied → voice disabled, card path offered.
  - User edits/removes any drafted segment before saving.
- **Validation:** At least one transition + behavior required to produce a draft. Behavior/function
  text length-bounded. Transitions constrained to the known decision-point set (spine §7) plus a
  free "other" label.
- **Permissions:** Microphone (voice only, first use, revocable). No location. No contacts.
- **Loading:** Transcription/parsing shows progress; card assembly is instant.
- **Empty:** No prior narration → guided prompt with an example ("On waking I usually…"); example is
  illustrative, never asserted as the user's truth.
- **Error/retry:** Transcription/parse failure → keep any raw input, offer retry or switch to cards;
  never discard the user's words silently.
- **Offline/degraded:** Card path fully offline (draft stored locally, synced later). Voice/AI parse
  requires network; when offline, cards remain available and the AI step is deferred.
- **Analytics:** `narration_started` (mode: voice/cards), `narration_draft_created`,
  `ai_parse_used` (bool), `narration_edited`. No transcript content in analytics.
- **Acceptance criteria:**
  - [ ] Given free-text-to-model consent is OFF, when the user uses voice, then no raw transcript or
        free text is sent to any third-party model and the UI states that parsing stays on device.
  - [ ] Given a completed narration, when the draft timeline appears, then every extracted item is
        labeled as an assumption/hypothesis and none is presented as a confirmed fact.
  - [ ] Given microphone permission is denied, when the user opens narration, then the card path is
        available and no feature dead-ends.
  - [ ] Given at least one transition and behavior, when the user saves, then draft `moments` are
        persisted with `verification_status = hypothesis`.
- **Out of scope:** Always-on/background listening; automatic day detection from sensors; more than
  one saved day map.

---

### F-003 — Three-day observation (Kısa gözlem)

- **User goal:** Capture what actually happens across ~3 days with 10–20 second check-ins, so the
  map is grounded in real behavior — with **no prescription** on day 1.
- **Trigger:** After a draft day exists (F-002); user-initiated or a gentle, budgeted reminder at a
  chosen transition (respecting F-013 budget and quiet windows).
- **Preconditions:** A draft day map exists; signed in.
- **Happy path:**
  1. At (or when the user opens) a transition, a very short check-in captures: context, behavior,
     craving (0–10), energy, and timestamp.
  2. Each check-in is stored as an `observations` row.
  3. The app shows progress toward "3 days observed" without any streak or success framing.
  4. No experiment is suggested during observation; the tone is "we're learning together."
- **Alternate paths:**
  - User logs multiple check-ins per day, or misses a transition → allowed; missing data is neutral,
    never a failure.
  - User ends observation early and proceeds to map review (F-004) with partial data → allowed with
    a note that confidence is lower.
- **Validation:** Craving is an integer 0–10; energy from a small fixed scale; behavior/context are
  short bounded fields; timestamp server/device time in the user's timezone.
- **Permissions:** Notifications only if the user enabled reminders (F-013). No location/mic by
  default.
- **Loading:** Check-in submit is instant/optimistic; sync in background.
- **Empty:** No observations yet → "Your first few check-ins will shape the map" prompt; explicitly
  states nothing is judged.
- **Error/retry:** Save failure → keep the entry locally, retry on reconnect; never lose an entry.
- **Offline/degraded:** Fully usable offline; observations stored locally and synced when online
  (local-first for this sensitive data).
- **Analytics:** `observation_logged` (counts and coarse timing only), `observation_window_reached`
  (3 days). No craving/behavior content sent to surveillance analytics.
- **Acceptance criteria:**
  - [ ] Given the observation phase, when a check-in is completed, then it saves as an
        `observations` row with context, behavior, craving 0–10, energy, and timestamp, and no
        experiment is offered.
  - [ ] Given a missed transition, when the user returns, then no "streak broken" or "you failed"
        language appears anywhere.
  - [ ] Given the device is offline, when a check-in is submitted, then it is stored locally and
        later synced without data loss.
  - [ ] Given fewer than 3 days of data, when the user proceeds to map review, then the app allows
        it and marks confidence as lower rather than blocking.
- **Out of scope:** Passive/automatic logging; sensor- or location-triggered check-ins; more than
  the five capture fields.

---

### F-004 — Day map review & confirm (Gün haritası)

- **User goal:** See the system's assumptions ("Did I understand you right?"), correct functions and
  costs, and pick the one **priority** moment to work on.
- **Trigger:** After observation (F-003), or reopening the map (S-04).
- **Preconditions:** Draft `moments` and candidate `routine_edges` exist; ideally some
  `observations`.
- **Happy path:**
  1. The map shows each `moment` with its `routine_edges`: trigger → behavior → immediate benefit
     (function label) → delayed cost, plus a confidence indicator and `evidence_count`.
  2. Each item is shown as a correctable assumption; the user edits trigger, behavior, function
     (benefit), or cost in one tap.
  3. User confirms items; confirmed `moments` flip `verification_status` from `hypothesis` to
     `confirmed`.
  4. User selects exactly one **priority** moment (sets the priority flag on that `moment`;
     only one priority at a time).
  5. App routes to Choose experiment (F-005) for the priority moment.
- **Alternate paths:**
  - User rejects an assumption → it is removed or rewritten; rejection is captured as learning data.
  - User changes the priority moment later → previous priority flag is cleared (single priority
    invariant).
  - Low evidence → the map still displays with an explicit "low confidence" marker.
- **Validation:** Exactly one `moment` may carry the priority flag. Function/cost text bounded.
  Confidence derived from `evidence_count`, never presented as diagnosis.
- **Permissions:** None beyond auth.
- **Loading:** Map render shows a skeleton; edits save optimistically.
- **Empty:** No confirmed edges yet → prompt to add or confirm at least one chain before choosing an
  experiment.
- **Error/retry:** Save failure on confirm/edit → local retain + retry; the priority selection is
  not lost.
- **Offline/degraded:** Viewing and editing work offline against local data; confirmations sync
  later.
- **Analytics:** `map_viewed`, `assumption_confirmed`, `assumption_corrected`,
  `priority_moment_selected`. Correction rate is a trust signal (F-008), not a success metric.
- **Acceptance criteria:**
  - [ ] Given a drafted map, when the user confirms a chain, then the corresponding `moment`
        `verification_status` becomes `confirmed`.
  - [ ] Given the user selects a priority moment, when a second moment is set as priority, then the
        first priority flag is cleared so at most one moment is priority at any time.
  - [ ] Given any map item, when it is displayed, then it is shown as a correctable assumption with
        a visible evidence/confidence indicator, not as a fact or diagnosis.
  - [ ] Given a one-tap correction, when the user rewrites a function or cost, then the change
        persists and is recorded as learning data (not a "wrong answer").
- **Out of scope:** Multiple concurrent priority moments; graph analytics beyond
  trigger/behavior/benefit/cost/confidence; automated function inference presented without
  confirmation.

---

### F-005 — Choose one micro-experiment (Deney seç)

- **User goal:** For the priority moment, pick **one** of 2–3 safe alternatives that serve the same
  function at lower cost, and turn it into an if-this-then-that plan.
- **Trigger:** After confirming the map and priority moment (F-004), from S-05.
- **Preconditions:** A confirmed priority `moment` with an identified function; the
  `experiment_library` is available (F-009).
- **Happy path:**
  1. The system ranks 2–3 context-fit options from the curated `experiment_library` by the moment's
     function (AI content-selection layer, bounded — never free-form prescription).
  2. Each option shows function label, duration band (30 seconds–10 minutes; most 30s–5m; craving
     and sleep-transition families up to 10m), difficulty, and safety class in plain language.
  3. User picks exactly one; the app builds an `if_this_then_that` implementation intention
     ("When {trigger} at {moment}, I will {alternative}").
  4. An `experiments` (Experiment) row is created with `active = true`; any previously active
     experiment is deactivated (single-active invariant).
  5. If the chosen experiment is the **connection** family, the relationship-safety gate (F-010) is
     applied before activation.
- **Alternate paths:**
  - None of the 2–3 fit → user requests a different set (re-rank) or picks "not now".
  - User already has an active experiment → must confirm switching (deactivating the old one) since
    only one may be active.
  - Library has no safe option for the function/context → offer a supportive fallback and, for
    smoking, surface the cessation pathway (F-010).
- **Validation:** At most one `experiments` row with `active = true` per user. Chosen experiment
  must exist in the curated library and carry a safety class. The if-then plan references a
  confirmed moment.
- **Permissions:** None beyond auth.
- **Loading:** Ranking shows a short spinner; selection saves optimistically.
- **Empty:** No suitable library entries → explicit message + supportive/safety fallback rather than
  a fabricated suggestion.
- **Error/retry:** Save/activation failure → retry; never leave two experiments active.
- **Offline/degraded:** Library is read-only reference and can be cached for offline ranking of a
  small set; activation syncs when online.
- **Analytics:** `experiment_options_shown` (function, count), `experiment_selected`
  (library id, function), `experiment_switched`. No moral labeling in event data.
- **Acceptance criteria:**
  - [ ] Given a priority moment with a function, when options are shown, then exactly 2–3 options
        are presented, each drawn from the curated `experiment_library` with a visible duration band
        and safety class.
  - [ ] Given the user selects an option, when it is activated, then exactly one `experiments` row
        has `active = true` and any prior active experiment is deactivated.
  - [ ] Given a selected experiment, when it is saved, then an `if_this_then_that` plan referencing
        the confirmed moment is stored.
  - [ ] Given the connection experiment family, when the user selects it, then the relationship-
        safety gate (F-010) runs before activation.
  - [ ] Given no safe library option exists for the context, when options would be shown, then a
        supportive/safety fallback appears and no free-form treatment is invented.
- **Out of scope:** More than one active experiment; free-form AI-generated experiments outside the
  curated library; medication or nicotine-product suggestions.

---

### F-006 — Right-moment reminder / decision engine (Geçiş kartı)

> This feature implements the rule-based, explainable decision engine of spine §7. **No ML in the
> MVP.** All rules are inspectable and every suggestion can be traced to the data that drove it.

- **User goal:** At the right transition moment, receive at most a short, privacy-safe nudge and,
  on opening, a transition card offering "do now / remind later / not suitable".
- **Trigger:** A **decision point** approaches: one of the user-selected transitions — waking,
  leaving home, arriving at work, break, arriving home, after meal, bedtime — evaluated by the
  on-device rule engine against the user's chosen priority moment and active experiment.
- **Preconditions:** An active experiment (F-005) bound to a confirmed priority moment; notification
  permission granted (F-013); the daily budget not exhausted; not inside a quiet window.
- **Decision engine specification (rule-based, v1):**
  - **Decision points:** the seven transitions above; only user-selected ones are eligible.
  - **Adaptation variables (inputs to rules):** time window; optional location (only with explicit
    permission — off by default); last response (`offered`/`did`/`not_now`/`declined`); current
    craving/energy (from recent check-ins); notification load over the last 7 days.
  - **Intervention options (rule outputs):** send nothing; short pause; delay; substitution;
    environment change; contact action; support referral. "Send nothing" is a first-class option.
  - **Budget:** ≤2 proactive notifications/day at start; the engine reduces or reschedules when the
    user says "not now".
  - **Quiet windows:** protect meetings, sleep, and family time; no proactive notice fires inside a
    quiet window.
  - **Explainability:** the card can show which adaptation variables drove the suggestion; the user
    corrects a wrong inference in one tap.
- **Happy path:**
  1. Engine evaluates the decision point; if within the transition window, budget available, and not
     in a quiet window, it schedules **at most one** privacy-safe lock-screen notice
     ("A transition moment is coming up" / "Bir geçiş anı yaklaşıyor").
  2. User opens the app; the transition card (S-06) shows the specific experiment prompt
     (sensitive detail appears only after opening).
  3. User chooses: **do now** → proceed to outcome (F-007); **remind later** (`not_now`) → the
     engine reschedules and lowers future load; **not suitable** (`declined`) → capture reason,
     do not repeat that push pattern.
  4. Each offer creates an `attempts` (Attempt) row with `offered_at`, transition, and `response`.
- **Alternate paths:**
  - Budget exhausted for the day → engine chooses "send nothing"; the card is still available
    if the user opens the app manually.
  - Inside a quiet window → no proactive notice; deferred to the next eligible window.
  - Repeated `not_now` → engine reduces frequency and may shift the offered window.
  - User taps "why this?" → explainability panel lists the adaptation variables used; user can
    correct an inference in one tap.
- **Validation:** No more than the configured daily budget of proactive notifications. `response`
  ∈ {`offered`,`did`,`not_now`,`declined`}. Lock-screen text is drawn only from the approved
  non-sensitive copy set (F-012). Location used only if permission is explicitly granted.
- **Permissions:** Notifications (F-013). Location only if the user opted in for a location-aware
  rule; never required.
- **Loading:** Card render is instant from local data; no network needed to show the prompt.
- **Empty:** No active experiment → engine does not schedule proactive nudges; card prompts the user
  to choose an experiment.
- **Error/retry:** If a scheduled notice fails to fire, the in-app card remains the fallback; no
  duplicate notice is issued to compensate.
- **Offline/degraded:** The rule engine runs **on device**; scheduling, budget, quiet windows, and
  "not now" learning all work offline. Location-aware rules degrade to time-only when location is
  unavailable.
- **Analytics:** `nudge_scheduled`, `nudge_suppressed` (reason: budget/quiet/none), `card_opened`,
  `attempt_response` (`did`/`not_now`/`declined`), `explainability_opened`, `inference_corrected`.
  Successful conscious transitions feed the North Star metric.
- **Acceptance criteria:**
  - [ ] Given a confirmed priority moment, when the transition window opens and the daily budget is
        not exhausted, then at most one lock-screen notice appears with no sensitive text.
  - [ ] Given the daily notification budget is exhausted, when a decision point is reached, then the
        engine chooses "send nothing" and issues no proactive notice.
  - [ ] Given the current time falls inside a quiet window, when a decision point is reached, then no
        proactive notice fires.
  - [ ] Given a user repeatedly responds `not_now`, when future decision points are evaluated, then
        the engine reduces frequency and/or reschedules, and records each response as an `attempts`
        row.
  - [ ] Given a shown suggestion, when the user opens "why this?", then the exact adaptation
        variables used are listed and a one-tap correction is available.
  - [ ] Given the device is offline, when a decision point is reached, then budget, quiet windows,
        and scheduling are enforced entirely on device.
- **Out of scope:** Any ML/learned model; server-driven push in v1; more than the seven decision
  points; always-on location tracking.

---

### F-007 — Log outcome (Hemen sonrası)

- **User goal:** Right after an attempt, capture in one tap whether it happened and the immediate
  before/after state (craving, energy, mood, connection feeling), plus an optional short note.
- **Trigger:** After "do now" on the transition card (F-006), or the user logs an outcome manually
  from S-07.
- **Preconditions:** A corresponding `attempts` row exists (or is created for a manual log).
- **Happy path:**
  1. User marks the attempt as **did it / not now / didn't fit me**, updating the `attempts`
     `response` (`did`/`not_now`/`declined`).
  2. User taps one-tap before/after values: craving (0–10), energy, mood, connection feeling.
  3. An `outcomes` (Outcome) row is stored linked to the attempt; the free note is treated as
     sensitive (local-first / consented).
  4. Confirmation is neutral and non-judgmental ("Thanks — this is learning data").
- **Alternate paths:**
  - User logs "didn't fit me" → captured as valuable data, framed as learning, never as failure.
  - User skips the state sliders → outcome saved with response only.
  - User adds a free note → stored locally; only synced/sent to model per consent (F-011).
- **Validation:** craving integer 0–10; energy/mood/connection from small fixed scales; `response`
  ∈ the allowed set; free note length-bounded and flagged sensitive.
- **Permissions:** None beyond auth. Note stays local unless consent allows sync.
- **Loading:** One-tap save is optimistic/instant.
- **Empty:** No outcomes yet → the first outcome is framed as the start of learning, not a score.
- **Error/retry:** Save failure → local retain + retry; never lose an outcome or its note.
- **Offline/degraded:** Fully offline-capable; local-first for the sensitive note and state values.
- **Analytics:** `outcome_logged` (response, coarse state deltas), `outcome_note_added` (bool only).
  Note content never enters analytics.
- **Acceptance criteria:**
  - [ ] Given a completed attempt, when the user logs the outcome, then the `attempts.response` is
        set to one of `did`/`not_now`/`declined` and a linked `outcomes` row is created.
  - [ ] Given a "didn't fit me" outcome, when it is saved, then no failure/streak-reset language is
        shown and it is framed as learning data.
  - [ ] Given the user adds a free note, when free-text-to-model consent is OFF, then the note is
        stored locally and is not sent to any third-party model.
  - [ ] Given the device is offline, when an outcome is logged, then it persists locally and syncs
        later without loss.
- **Out of scope:** Longitudinal charts on this screen (that belongs to F-008); automatic outcome
  inference; sending notes to a model without consent.

---

### F-008 — Weekly learning summary (Hafta)

- **User goal:** Once a week, understand which moments were easier or harder (as **correlation**),
  confirm or correct the reading, and pick the next small experiment.
- **Trigger:** End of a weekly window (S-08), or user-initiated review.
- **Preconditions:** At least some `attempts`/`outcomes` in the week; an active or recently active
  experiment.
- **Happy path:**
  1. The AI summarization layer compresses the week's logs into plain, non-judgmental language
     (no causality, no diagnosis, no personality labels).
  2. Insights are shown with an evidence display type (`user_said`/`seen_together`/
     `experiment_result`), an `evidence_count`, and a confidence indicator.
  3. Copy uses correlation phrasing (e.g., "You chose your alternative in three of five similar
     moments." / "This alternative seems to work on some days."). Causation phrasing is forbidden.
  4. Each insight has a one-tap "this is wrong" correction; corrected insights update
     `user_confirmed`.
  5. User picks the next small experiment (loops back to F-005) or continues the current one.
- **Alternate paths:**
  - Sparse data → summary says so honestly and offers "keep observing" instead of forcing an
    insight.
  - User corrects/rejects an insight → `insights.user_confirmed` reflects the correction; rejected
    insights are not re-asserted.
  - User skips choosing a next experiment → current experiment continues.
- **Validation:** Every displayed `insights` row carries text, `evidence_count`, confidence, and a
  `user_confirmed` state. Summary output is validated against a forbidden-phrasing list (no
  causation/diagnosis) before display.
- **Permissions:** None beyond auth. Summarization uses only consented data: sending **structured**
  special-category labels (craving/mood/energy/connection/behavior/function) to the third-party
  model is gated by `consent_personalization` (OFF → on-device structured-counts fallback only; no
  structured special-category data leaves the device), and sending **free text** is gated by
  `consent_free_text_to_model` (OFF → free text never leaves the device).
- **Loading:** Summary generation shows progress; cached last summary shown meanwhile if present.
- **Empty:** No data this week → "Nothing to summarize yet — a few check-ins will help" (neutral).
- **Error/retry:** Summarization failure → show structured counts from local data as a fallback and
  offer retry; never fabricate an insight.
- **Offline/degraded:** Structured weekly counts (from local data) render offline; AI-phrased
  narrative requires network and is deferred when offline.
- **Analytics:** `weekly_summary_viewed`, `insight_confirmed`, `insight_corrected`,
  `next_experiment_selected`. Correction rate is a trust signal.
- **Acceptance criteria:**
  - [ ] Given a weekly summary, when an insight is displayed, then it shows an evidence type
        (`user_said`/`seen_together`/`experiment_result`), an evidence count, and a confidence
        indicator.
  - [ ] Given any generated insight, when it is rendered, then it uses correlation phrasing and no
        causation, diagnosis, or personality-label phrasing appears (validated against the forbidden
        list).
  - [ ] Given an insight the user marks wrong, when the correction is saved, then
        `insights.user_confirmed` reflects it and the insight is not re-asserted unchanged.
  - [ ] Given insufficient data for the week, when the summary is opened, then it honestly states
        there is little to summarize and offers to keep observing rather than inventing an insight.
- **Out of scope:** Predictive/causal analytics; cross-user comparisons; long-term trend dashboards
  beyond the weekly view.

---

### F-009 — Experiment library (Deney kütüphanesi)

- **User goal:** (System-facing, surfaced to the user only through ranked options) A curated,
  read-only reference of clinically & culturally reviewed micro-experiments organized by function.
- **Trigger:** Read during F-005 ranking; not a standalone user-editable screen in MVP.
- **Preconditions:** Library seeded and reviewed; bilingual copy approved (F-012).
- **Happy path:**
  1. The library stores curated entries by **function family**: Waking & energy; Relief &
     transition; Connection; Attention & silence; Craving; Avoidance & procrastination; Sleep
     transition.
  2. Each entry carries function label, micro-experiment family, duration band, difficulty, and a
     **safety class**.
  3. F-005 reads the library (read-only) to rank 2–3 context-fit options.
  4. Entries are reference content, **not user data**, and are never modified from the client.
- **Alternate paths:**
  - A function has no entry matching the context → F-005 shows a supportive fallback; the library is
    never fabricated at runtime.
  - Connection-family entries carry the relationship-safety requirement consumed by F-010.
- **Validation:** Every library entry has a function family (from the seven), a duration band, and a
  safety class before it can be surfaced. No entry may recommend medication or nicotine products.
- **Permissions:** None; read-only reference.
- **Loading:** Library reads are fast (cacheable, read-only).
- **Empty:** If a family is unseeded, F-005 falls back gracefully and logs a content gap for review.
- **Error/retry:** Read failure → use cached entries; if none, F-005 shows the supportive fallback.
- **Offline/degraded:** Cacheable for offline ranking of a small set.
- **Analytics:** `library_option_ranked` (function, entry id). No user content involved.
- **Acceptance criteria:**
  - [ ] Given the library, when any entry is surfaced, then it carries a function family (one of the
        seven), a duration band, a difficulty, and a safety class.
  - [ ] Given a client session, when the app runs, then no client path can create, edit, or delete
        library entries (read-only reference, not user data).
  - [ ] Given a connection-family entry, when it is offered, then it is marked to require the
        relationship-safety gate (F-010).
  - [ ] Given any library entry, when reviewed, then it contains no medication or nicotine-product
        advice.
- **Out of scope:** User-generated experiments; a browsable full catalog UI (that is a later paid
  capability); runtime AI-authored library entries.

---

### F-010 — Safety & support pathways (Güvenlik ve destek)

> Safety non-negotiables. This feature is **always free and always visible** and is never behind a
> paywall or personalization gate.

- **User goal:** Always be able to reach appropriate support — smoking cessation, crisis resources,
  and relationship-safe alternatives — with copy that is trustworthy and tested, never LLM-improvised.
- **Trigger:** Always-visible entry point (S-10); the smoking pathway on any smoking context; the
  crisis pathway on explicit risk phrasing; the relationship-safety gate whenever the connection
  experiment is chosen (F-005).
- **Preconditions:** None for viewing resources (available even signed-out where feasible). Crisis
  and smoking copy approved by legal + clinical review in TR and EN.
- **Happy path — smoking / dependence:**
  1. The four stances are handled separately: `quitting`, `reducing`, `noticing`, `not_ready` —
     each gets appropriate framing; none is shamed.
  2. **ALO 171** and the **family physician / professional referral** are always free and visible.
  3. The app gives **no individual medical advice** about withdrawal or medication.
  4. On a lapse, no streak resets — the app re-assesses trigger strength and readiness.
- **Happy path — mental health & crisis:**
  1. On explicit self-harm / acute-risk phrasing, the normal coaching flow **stops**.
  2. The user is routed to local emergency resources using **rule-based** detection and
     **human-reviewed, tested copy** — the crisis decision is never made by the generative model.
  3. A `safety_events` row records that the crisis pathway was shown (minimal PII).
- **Happy path — relationship-safety gate:**
  1. Before any connection experiment activates, the app checks for a violence/control/conflict
     context (a short, non-judgmental gate).
  2. If such a context is indicated, the connection experiment is **not** assumed safe; an
     alternative support path is offered instead.
- **Alternate paths:**
  - Ambiguous risk phrasing → err toward showing support resources; never suppress the safety path
    to keep the coaching flow going.
  - User dismisses a resource → resources remain reachable from the always-visible entry point.
- **Validation:** Crisis routing is triggered by a maintained rule-based phrase set, not a
  probabilistic classifier's sole judgment. All safety/crisis/smoking copy comes only from the
  approved, reviewed copy set (F-012). `safety_events` stores pathway + timestamp + resolution with
  minimal PII.
- **Permissions:** None. Dialing ALO 171 uses the device dialer only on explicit user tap.
- **Loading:** Safety resources render instantly from bundled/approved content (not fetched
  from a model).
- **Empty:** Never empty — resources are always present, including offline.
- **Error/retry:** If any dynamic content fails, bundled safety copy still displays; safety never
  depends on network or AI availability.
- **Offline/degraded:** All safety resources and crisis routing copy are available offline (bundled).
- **Analytics:** `safety_pathway_shown` (pathway type), `crisis_pathway_shown`,
  `relationship_gate_shown`, `relationship_gate_diverted`. Minimal, non-identifying;
  recorded to `safety_events` for QA.
- **Acceptance criteria:**
  - [ ] Given any smoking stance, when the smoking pathway is shown, then ALO 171 and family-
        physician/professional referral are visible and free, and no individual medical or
        medication advice is given.
  - [ ] Given explicit self-harm / acute-risk phrasing, when it is detected, then the normal
        coaching flow stops and rule-based, human-reviewed crisis copy routes the user to local
        emergency resources.
  - [ ] Given the crisis pathway, when it is triggered, then the routing decision comes from the
        rule set and tested copy, not from a generative-model decision, and a `safety_events` row is
        recorded.
  - [ ] Given the connection experiment, when the user selects it, then the relationship-safety gate
        runs first and, in a violence/control/conflict context, offers an alternative support path
        instead of the connection experiment.
  - [ ] Given a lapse in smoking behavior, when it is logged, then no streak is reset and the app
        re-assesses trigger strength and readiness.
  - [ ] Given the device is offline, when the user opens safety & support, then all resources and
        crisis copy still display.
- **Out of scope:** In-app clinical treatment; therapist chat; AI-authored crisis text; diagnosis;
  any claim of treating, curing, or quitting addiction.

---

### F-011 — Privacy & data control (Gizlilik ve veri kontrolü)

- **User goal:** Control what is collected, what leaves the device, and be able to delete or export
  data and the account — with special-category data handled to KVKK/GDPR standards.
- **Trigger:** Settings & privacy (S-09); consent screens (F-001); any first per-feature permission
  request.
- **Preconditions:** Signed in for account-scoped controls; consent state stored on the `users` row.
- **Happy path:**
  1. Settings shows the **separated** consents — the **required** `consent_health_processing`
     (core-service special-category health-data processing; withdrawing it stops the
     observation/craving loop, not an optional OFF-by-default toggle), and the optional
     `consent_personalization`, `consent_research`, and `consent_free_text_to_model`, each
     independently toggleable and withdrawable — plus a separate opt-in `analytics_enabled`
     (non-sensitive product events only, distinct from the consent flags).
  2. A clear **"what leaves the device"** surface lists which fields sync to the cloud vs stay local.
  3. **Model-provider disclosure** states whether free text goes to a third-party model; secondary/
     training use is **opt-out-by-default (OFF)**.
  4. User can **delete** any routine node (moment/edge), the AI memory (derived
     insights/summaries), and the whole account; user can **export** their data (always-free basic
     export).
  5. User-chosen **retention windows** are honored; no indefinite raw-log hoarding.
- **Alternate paths:**
  - User withdraws a consent → dependent processing stops immediately; already-derived data handled
    per the consent's stated purpose and retention.
  - User deletes a single routine node → cascades are shown and confirmed before deletion.
  - User requests account deletion → see §7 account deletion/export.
- **Validation:** Data minimization enforced: location/microphone/contacts are **not** requested by
  default; each is per-feature with a separate permission. Sensitive fields (mood, smoking, sleep,
  health status, free journal text) are flagged special-category. Retention windows are bounded and
  user-set.
- **Permissions:** This feature governs all permissions; it requests none itself.
- **Loading:** Settings render instantly; export/delete show progress with clear completion states.
- **Empty:** New account shows the default (privacy-forward) state — optional consents off, no
  location/mic granted.
- **Error/retry:** Export/delete failure → clear error + retry; a partially completed deletion is
  never reported as complete.
- **Offline/degraded:** Consent toggles and the "what leaves the device" surface render offline;
  export/delete that require the server queue and complete when online, with honest status.
- **Analytics:** `consent_changed` (per-consent booleans), `data_export_requested`,
  `node_deleted`, `account_deletion_requested`, `retention_window_set`. No sensitive values in
  analytics.
- **Acceptance criteria:**
  - [ ] Given settings, when consents are shown, then `consent_health_processing`,
        `consent_personalization`, `consent_research`, and `consent_free_text_to_model` are
        separated; the optional three can each be independently turned on/off and withdrawn, and
        withdrawing the required `consent_health_processing` stops the observation/craving loop;
        `analytics_enabled` is a separate opt-in for non-sensitive events only.
  - [ ] Given default state, when the app runs, then no location, microphone, or contacts permission
        is requested until the specific feature that needs it is first used.
  - [ ] Given the privacy surface, when the user opens "what leaves the device", then it lists which
        fields sync to the cloud and which stay local, and states whether free text goes to a
        third-party model with training/secondary use defaulting OFF.
  - [ ] Given a delete request, when the user deletes a routine node, the AI memory, or the account,
        then the deletion is confirmed with its cascade and, on success, the data is removed
        (deletion is never falsely reported as complete).
  - [ ] Given a user-set retention window, when it elapses, then raw logs beyond it are not retained
        indefinitely.
- **Out of scope:** Selling data; third-party ad tracking; cross-user data sharing; retention
  defaults that keep raw logs indefinitely.

---

### F-012 — Bilingual content system (TR + EN)

- **User goal:** Use the app fully in Turkish or English with natural, expert-reviewed copy — not a
  word-for-word translation — including safe, tested notification and safety text.
- **Trigger:** Language selection at onboarding (F-001) and in Settings (F-011/F-013); every string
  render.
- **Preconditions:** A message catalog keyed by **language-neutral intent keys** (e.g.
  `transition.home.arrival.connection`); TR and EN copy reviewed.
- **Happy path:**
  1. All user-facing copy resolves through intent keys; no hard-coded display strings.
  2. Tone options (calm / direct / warm) are available with **separate QA per language**.
  3. Cultural adaptation: family contact, tea/coffee rituals written naturally for Turkey; English
     is authored, not machine-translated from Turkish.
  4. Safety copy (crisis, smoking, privacy) is approved by **legal + clinical review in both
     languages** before release.
  5. Notification copy uses the approved non-sensitive set (lock-screen), e.g. "A transition moment
     is coming up" / "Bir geçiş anı yaklaşıyor".
- **Alternate paths:**
  - Missing key for the active language → fall back to the other language with a logged content gap,
    never a raw key shown to the user.
  - AI language-adaptation simplifies tone but is bounded: never manipulative, fear-based, or
    shaming.
- **Validation:** Every shipped screen must have both TR and EN entries for its keys before release.
  Safety/notification strings must come only from the reviewed set. Locale detected via
  expo-localization; user override always wins.
- **Permissions:** None.
- **Loading:** Language switch is instant (in-memory catalog).
- **Empty:** No missing-key screen should ship; a missing key falls back and is logged.
- **Error/retry:** Catalog load failure → use bundled default-language catalog; never show raw keys.
- **Offline/degraded:** Catalog is bundled/local; full bilingual UI works offline.
- **Analytics:** `language_selected`, `tone_selected`, `missing_key_logged` (key id only). No copy
  content in analytics.
- **Acceptance criteria:**
  - [ ] Given any user-facing screen, when it renders in `tr` or `en`, then all strings resolve from
        intent keys and no raw key or hard-coded string is shown.
  - [ ] Given a safety, crisis, or notification string, when it is displayed, then it comes only
        from the legal+clinical-reviewed copy set in the active language.
  - [ ] Given a lock-screen notification, when it fires, then its text is from the approved
        non-sensitive set (no behavior or sensitive detail).
  - [ ] Given the user overrides device locale, when they choose a language, then the override wins
        over the detected locale.
- **Out of scope:** Additional languages beyond TR/EN in MVP; user-editable copy; machine
  translation as the source of shipped copy.

---

### F-013 — Notifications settings & budget (Bildirim ayarları)

- **User goal:** Control notification permission, the daily budget, and quiet windows so the right-
  moment engine (F-006) never becomes noise, and preview text is never sensitive on the lock screen.
- **Trigger:** First reminder need (permission request), Settings (S-09), or engine scheduling.
- **Preconditions:** Signed in; the engine (F-006) reads these settings.
- **Happy path:**
  1. Notification permission is requested only when reminders are first needed (not at onboarding).
  2. The daily **budget** defaults to ≤2 proactive notifications/day; the user can lower it.
  3. The user defines **quiet windows** (meetings, sleep, family time); no proactive notice fires
     inside them.
  4. **Lock-screen privacy** is enforced: previews use only approved non-sensitive copy; "smoke a
     cigarette" / "talk to your partner" style text never appears in a preview.
  5. **"Not now" learning:** repeated `not_now` reduces frequency and reschedules (engine behavior,
     surfaced here as a setting/explanation).
- **Alternate paths:**
  - Permission denied → the app still works; the in-app transition card (F-006) is the fallback and
    the UI explains that proactive nudges are off.
  - User sets budget to 0 → no proactive notices; card remains available on manual open.
  - Overlapping quiet windows → merged; the stricter (quiet) state wins.
- **Validation:** Budget is an integer ≥ 0 and ≤ the configured start maximum (2 at start). Quiet
  windows are valid time ranges in the user's timezone. Preview text validated against the approved
  non-sensitive set.
- **Permissions:** Notifications (OS-level). No other permission.
- **Loading:** Settings render instantly; permission prompt is OS-driven.
- **Empty:** No quiet windows set → engine still respects budget; user is invited to add sleep/work
  windows.
- **Error/retry:** Scheduling failure → in-app card fallback; settings changes retried on save.
- **Offline/degraded:** Budget and quiet-window enforcement run on device (F-006); fully offline.
- **Analytics:** `notif_permission_result`, `budget_set` (value), `quiet_window_set`,
  `lockscreen_privacy_enforced`. No message content.
- **Acceptance criteria:**
  - [ ] Given default settings, when the app starts, then the proactive notification budget is at
        most 2 per day and can be lowered by the user.
  - [ ] Given a quiet window, when a decision point falls inside it, then no proactive notice fires.
  - [ ] Given any lock-screen notification, when it appears, then the preview text contains no
        behavior name or sensitive detail (only approved non-sensitive copy).
  - [ ] Given repeated `not_now` responses, when future scheduling runs, then notification frequency
        is reduced and/or rescheduled.
  - [ ] Given notification permission is denied, when reminders would fire, then the app still
        functions via the in-app transition card and explains that proactive nudges are off.
- **Out of scope:** Server push in v1; unlimited notifications; marketing/engagement pushes; badge
  count pressure.

---

### F-014 — Optional WHO-5 wellbeing check

- **User goal:** Optionally answer the 5-item WHO-5 Well-Being Index every two weeks as an outcome
  measure — never as a diagnostic tool.
- **Trigger:** Opt-in prompt roughly every two weeks (budget-respecting), or user-initiated from
  Settings/measurement.
- **Preconditions:** User opted in via an explicit in-flow WHO-5 opt-in; `consent_health_processing`
  applies (WHO-5 collects special-category data); validated Turkish WHO-5 form used for `tr`.
- **Happy path:**
  1. User opts in; the 5-item questionnaire (last two weeks) is presented in the active language
     using the validated form.
  2. Responses are stored as a wellbeing outcome measure, framed as tracking, not diagnosis.
  3. The result is shown neutrally (e.g., a simple score/trend) with an explicit "this is not a
     diagnosis" note.
- **Alternate paths:**
  - User skips or declines → no penalty; the prompt frequency is respected and never nagging.
  - User opts out entirely → no further WHO-5 prompts.
- **Validation:** All 5 items answered before a score is computed; scoring follows the standard
  WHO-5 method; TR uses the validated Turkish form. It is optional and clearly non-diagnostic.
- **Permissions:** None beyond auth; governed by `consent_health_processing` plus the explicit
  in-flow WHO-5 opt-in (F-011).
- **Loading:** Instant; static questionnaire.
- **Empty:** No WHO-5 history → invite (once, gently) to try it; no pressure.
- **Error/retry:** Save failure → local retain + retry; partial answers not scored.
- **Offline/degraded:** Questionnaire works offline; results sync later.
- **Analytics:** `who5_started`, `who5_completed` (score bucket only), `who5_opted_out`. No item-
  level content in surveillance analytics.
- **Acceptance criteria:**
  - [ ] Given the WHO-5 check, when it is presented, then it is optional, uses the 5-item last-two-
        weeks form (validated Turkish form for `tr`), and is labeled as not a diagnostic tool.
  - [ ] Given a completed WHO-5, when the score is shown, then it is presented neutrally with an
        explicit non-diagnosis note.
  - [ ] Given the user declines or opts out, when the next cycle arrives, then their choice is
        respected and no nagging or penalty occurs.
  - [ ] Given fewer than 5 answered items, when the user submits, then no score is computed.
- **Out of scope:** Any diagnostic interpretation; clinical thresholds/alerts; using WHO-5 to gate
  features or drive engagement.

---

## 7. Cross-cutting behavior

- **Onboarding & consent:** Value + principles intro, language selection, **age self-attestation
  (18+, `age_confirmed_18`)**, and the consent set — the **required** `consent_health_processing`
  (core-service special-category health-data processing, captured before any observation/craving
  capture) plus **three separated optional** consents (`consent_personalization`, `consent_research`,
  `consent_free_text_to_model`) all defaulting OFF and a separate opt-in `analytics_enabled`
  (non-sensitive events only) — then auth and smoking-stance + intent (F-001). No device permissions
  requested at onboarding; each is requested per-feature at first use. Consent is easily withdrawable
  at any time (F-011).
- **Account lifecycle:** Supabase Auth. Every table is owned by a user and **private-by-default with
  RLS**; `service_role` is never in the client. Sign-in, sign-out, and account
  deletion/export are first-class (F-001, F-011). A returning user resumes at their current loop
  stage. Single-active invariants (one active experiment, one priority moment) are enforced per
  account.
- **Accessibility:** All interactive elements meet target size and labeling; screen-reader labels on
  controls; sufficient color contrast; supports OS dynamic type; check-ins and the transition card
  are operable without fine timing pressure; no reliance on color alone to convey state.
- **Localization (TR/EN intent keys):** All copy resolves through language-neutral **intent keys**
  (e.g. `transition.home.arrival.connection`); TR and EN authored separately (not word-for-word),
  with tone options and per-language QA (F-012). Missing keys fall back and are logged, never shown
  raw. Safety/crisis/notification copy is legal+clinical reviewed in both languages.
- **Notifications:** On-device rule engine (F-006) with a **budget** (≤2/day at start, user-lowerable),
  **quiet windows** (no proactive notice inside them), **"not now" learning** (repeated `not_now`
  reduces frequency/reschedules), and **lock-screen privacy** (previews carry only approved
  non-sensitive copy; sensitive detail appears only after opening the app). v1 uses locally
  scheduled notices; server push is out of MVP.
- **Privacy:** Sensitive/special-category data = mood, smoking, sleep, health status, free journal
  text. **KVKK** treats health data as special-category (stricter); **GDPR Art. 9** +
  data-minimization apply for EU users. Rules: data minimization (no location/mic/contacts by
  default — per-feature separate permission); user control (delete any routine node, the AI memory,
  the account; export data); lock-screen privacy; explicit consent & purpose separation (required
  health-processing vs personalization vs research vs free-text-to-model, plus a separate
  `analytics_enabled` opt-in for non-sensitive events) with easy withdrawal; **local-first** for raw sensitive records
  with a clear "what leaves the device" surface and encryption of cloud-synced fields;
  **model-provider disclosure** (state whether free text goes to a third-party model; training/
  secondary use default OFF); user-chosen retention windows with no indefinite raw-log hoarding
  (F-011). WHO governance translated to product governance: explain why a suggestion appears; right
  to correct a wrong inference.
- **Moderation:** **N/A for MVP.** There is no user-generated content, community feed, or social
  interaction in scope (spine §13 OUT: community feed, couples accounts, social competition). Because
  no content is shared between users, no content-moderation, reporting, or community-safety system is
  required. This must be revisited before any future social/community feature is introduced.
- **Payments:** **Free MVP, ethical model.** Always-free (never paywalled): one day map, one active
  experiment, weekly summary, data deletion, safety resources, privacy settings, account deletion,
  basic safety. No payments are implemented in MVP. Later paid capabilities (multiple maps, advanced
  patterns, rich/advanced voice narration & output (beyond basic voice input), rich library, richer export) will be price-tested with
  willingness-to-pay interviews. **Forbidden mechanics:** infinite streaks, loss-aversion, guilt
  loops, or any addictive/dark-pattern design — they contradict the product's purpose.
- **Account deletion/export:** The user can export their data (always-free basic export) and delete
  any routine node, the derived AI memory, or the entire account (F-011). Deletion confirms its
  cascade before executing and is never falsely reported as complete on failure. `safety_events`
  retains only minimal, non-identifying audit data per its stated purpose and retention.
- **Admin/support:** No in-app admin console in MVP. A founder/QA operator reviews `safety_events`
  (minimal PII) for observability and QA of the safety pathways, and validates copy — with no
  routine access to users' sensitive raw logs and no production data-mining role. Support/contact
  and the always-visible safety resources (F-010) are the user's escalation path.

---

## 8. Product risks

| ID | Risk | Impact | Mitigation |
|---|---|---|---|
| R-1 | AI narrative parsing turns a hypothesis into an assumed fact | Erodes trust; violates principle 5/9 | Everything from AI is a `hypothesis` until user-confirmed (F-002, F-004); one-tap correction everywhere |
| R-2 | Notifications become noise | User disables all notices; product fails on principle 6 | On-device budget (≤2/day), quiet windows, "not now" learning (F-006, F-013) |
| R-3 | Lock-screen leaks sensitive behavior | Privacy harm | Approved non-sensitive lock-screen copy only; sensitive detail only after opening (F-006, F-013) |
| R-4 | Crisis mishandled by generative model | Serious safety harm; release-blocking | Crisis routing is rule-based + human-reviewed tested copy, never LLM-decided (F-010) |
| R-5 | Connection experiment offered in an unsafe relationship | Real-world harm | Relationship-safety gate before activation; alternative support path (F-005, F-010) |
| R-6 | Correlation read as causation/diagnosis | Misleading; violates principle 7; possible medical-device drift | Forbidden-phrasing validation on summaries; evidence types + confidence shown (F-008) |
| R-7 | Streak/failure framing creeps in | Contradicts principle 3; drives shame | No streak logic anywhere; lapse = learning data; copy review (F-003, F-007, F-008) |
| R-8 | Free text sent to a third-party model without consent | KVKK/GDPR Art. 9 violation | Free-text-to-model consent OFF by default; local-first; model-provider disclosure (F-002, F-007, F-011) |
| R-9 | Special-category data over-collected/over-retained | Regulatory + trust harm | Data minimization, per-feature permissions, user-set retention, delete/export (F-011) |
| R-10 | Medical-purpose drift changes regulatory status | Legal/stop decision | No therapy/treatment/diagnosis claims; drift is a flagged legal/stop decision, not agent-derived |
| R-11 | Two experiments or two priority moments become active | Confusing state; breaks principle 4 | Single-active invariants enforced at write time (F-004, F-005) |
| R-12 | Bilingual copy gap ships a raw key or unreviewed safety text | Trust + safety harm | Both-language coverage gate before release; reviewed-only safety/notification set (F-012) |
| R-13 | WHO-5 read as a diagnosis | Clinical misrepresentation | Explicit non-diagnostic framing; optional; validated TR form (F-014) |

---

## 9. Open decisions

> These are resolved toward the smallest MVP where possible; items marked "confirm at build time"
> require research-first verification against current official docs, or a legal/clinical decision the
> agent must not derive alone.

1. **Exact framework/library/service versions** (Expo, React Native, Expo Router, Supabase client,
   expo-notifications, expo-localization, expo-secure-store) — confirm with current official
   documentation at build time; do not guess version numbers.
2. **LLM provider and model** for narrative parsing, summarization, and library ranking — confirm
   provider, model, region/data-residency terms, and that crisis classification stays rule-based;
   the model-provider disclosure copy (F-011) depends on this. Legal/clinical + privacy decision.
3. **Crisis phrase set and emergency-resource list** (Turkey and English contexts) — must be defined
   and human-reviewed with tested copy before release (F-010). This is a clinical/legal decision,
   not agent-derived.
4. **Retention window defaults and bounds** — the exact user-selectable windows and any regulatory
   minimums/maximums under KVKK/GDPR — legal decision to confirm (F-011).
5. **Local-first vs cloud-sync boundary per field** — precisely which sensitive fields stay on
   device vs sync encrypted (raw journal note, craving/energy, observations) — to finalize in
   ARCHITECTURE/DATABASE, consistent with §7 privacy.
6. **Observation window length** — the spine says "3 days"; confirm whether the MVP fixes exactly 3
   days or allows a short range, and the minimum data before F-004/F-008 (resolved default: allow
   proceeding with partial data at lower confidence).
7. **WHO-5 cadence and prompt policy** — confirm the bi-weekly cadence interacts correctly with the
   notification budget and never nags (F-014).
8. **Analytics vendor** — a privacy-respecting, EU-friendly, event-minimal analytics choice that
   records product-value events (not surveillance) — confirm at build time.
9. **Willingness-to-pay / future paid tier boundaries** — deferred to price-testing interviews;
   changing the free/paid line is a product-promise decision requiring explicit user approval, not
   an MVP task.
10. **Age assurance / minimum age** — the MVP records **self-attested 18+** at onboarding
    (`age_confirmed_18`) and applies the suspected-minor policy in §2 and F-001. The exact minimum
    age and any parental-consent requirement under **KVKK / GDPR Art. 8** is a **legal decision to
    confirm at build time**, not agent-derived; the store data-safety disclosure reflects it.
11. **WHO-5 scope & in-flow opt-in** — WHO-5 appeared as an **optional measure** in the research
    (spine §10/§15) and is promoted here to an **optional MVP measurement feature** (F-014). Because
    it collects special-category data, it requires an **explicit in-flow opt-in** in addition to
    `consent_health_processing`; it is non-diagnostic and never gates other features.
