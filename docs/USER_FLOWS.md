# User Flows

> Navigation and user journeys for **koturutin** — a bilingual (Turkish + English) contextual
> routine lab. Originating product brief: `docs/SPINE.md` (background). Authoritative per AGENTS.md §5:
> the README → PRODUCT_SPEC → USER_FLOWS → ARCHITECTURE → DATABASE chain. This document uses the spine's exact
> screen IDs (S-01…S-12, spine §6), entity names (spine §5), decision-engine terms (spine §7)
> and safety rules (spine §10). No feature is introduced beyond the MVP scope (spine §13).
>
> Rendering note: flow diagrams are indented plain-text trees using `->` transitions and
> `├─ └─ │` branch markers (no fenced code blocks), per the task's diagram convention.

## Feature-ID reference (for acceptance-criteria traceability)

`docs/PRODUCT_SPEC.md` is the authoritative source for the F-001…F-014 feature IDs; this table is the
flow ↔ feature crosswalk showing the user flow(s) that reach each MVP feature (all in spine §13 scope —
nothing here expands it).

| F-ID | Feature (MVP) | Primary screen(s) | Reachable via |
|---|---|---|---|
| F-001 | Onboarding & intent (value, language, consent, smoking stance, choose what to change & why) | S-11 / S-01 | UF-001 |
| F-002 | Day narration (voice or cards) + narrative parsing to draft map | S-02 | UF-002 |
| F-003 | Three-day observation check-ins | S-03 | UF-003 |
| F-004 | Day map review & confirm (correct assumptions, pick priority moment) | S-04 | UF-004 |
| F-005 | Choose one micro-experiment (+ if-then plan; relationship-safety gate at Connection-family selection) | S-05 | UF-005 (also UF-011 gate) |
| F-006 | Right-moment reminder / decision engine (transition card: do / remind later / not suitable) | S-06 | UF-006 |
| F-007 | Log outcome (craving / energy / mood / connection) | S-07 | UF-007 |
| F-008 | Weekly learning summary (correlation language, user confirmation) | S-08 | UF-008 |
| F-009 | Experiment library (curated, function-fit options) | S-05 | UF-005 |
| F-010 | Safety & support pathways (smoking / ALO 171 + crisis / self-harm + relationship-safety) | S-10 | UF-009, UF-010, UF-011 |
| F-011 | Privacy & data control (auth, account lifecycle, consent management, model-provider disclosure, export, deletion, lock-screen privacy) | S-09 / S-12 | UF-012, UF-014 |
| F-012 | Bilingual content system (TR / EN intent keys) | all screens (language set in S-11) | UF-001 |
| F-013 | Notifications settings & budget (quiet windows, "not now" learning) | S-09 | UF-013 (also UF-001, UF-006) |
| F-014 | Optional bi-weekly WHO-5 wellbeing check (opt-in, non-diagnostic) | S-09 (WHO-5 sub-view) | UF-015 |

## Screen/state inventory

| ID | Screen/state | Purpose | Entry points | Exit points |
|---|---|---|---|---|
| S-01 | Intent (Niyet) | Choose what to change and why; produce a value + target behavior | S-11 onboarding complete; Home; S-08 "start a new area" | S-02 Tell-your-day; Home |
| S-02 | Tell-your-day (Günü anlat) | Narrate a typical day by voice or cards; produce a draft timeline of transitions | S-01 | S-03 (begin 3-day observation); Home (draft map pending) |
| S-03 | Observation check-in (Kısa gözlem) | 10–20s capture of context, behavior, craving, energy — no prescription on day 1 | Scheduled prompt during the 3-day window; S-02 completion; manual "add a moment" | Home; after enough evidence -> S-04 |
| S-04 | Day map (Gün haritası) | Review and correct system assumptions; mark moment `hypothesis`->`confirmed`; pick the priority moment | S-03 window complete; Home | S-05 Choose experiment; edit-node state; Home |
| S-05 | Choose experiment (Deney seç) | Pick one critical moment + one of 2–3 function-fit options; build an if-then plan; set as the single active experiment | S-04; S-08 "next experiment" | Home (reminder scheduled); S-04 |
| S-06 | Transition card (Geçiş kartı) | At the right moment: "do now / remind later / not suitable" + the chosen intervention | Lock-screen neutral notice (opened); Home active-experiment card | S-07 Immediate outcome (did); reschedule (remind later); adapt (not suitable); S-10 via relationship-safety gate |
| S-07 | Immediate outcome (Hemen sonrası) | One-tap craving/energy/mood/connection + optional note; proximal outcome | S-06 "did"; skipped-moment prompt | Home; feeds S-08 |
| S-08 | Week review (Hafta) | Show the weekly pattern in correlation language; user confirms/corrects; pick the next change | Weekly notification; Home | S-05 (next experiment); S-01 (new area); confirm/correct insight |
| S-09 | Settings & privacy | Language, notification budget, quiet windows, per-feature permissions, model consent, export/delete entry | Home/menu; onboarding consent; a permission prompt | S-12 (delete/export); S-10; Home |
| S-10 | Safety & support | ALO 171 / family physician; crisis resources; relationship-safety alternatives — always free, always visible | Persistent affordance (every screen); risk-phrase rule trigger; relationship-safety gate; smoking-support tap | External resource; back to prior screen (no coaching required) |
| S-11 | First-run / onboarding | Explain value; choose language; **attest 18+ (age_confirmed_18)**; **obtain the REQUIRED health-processing consent** before any capture; then optional consents (personalization / research / free-text-to-model) + analytics opt-in; set smoking stance | First launch; S-12 after first sign-in | S-01 Intent |
| S-12 | Auth / account | Sign in/up, session, account lifecycle, delete/export | Launch when unauthenticated; S-09 | S-11 (new user); Home (returning); Auth screen (after deletion/sign-out) |

> Note: the optional WHO-5 wellbeing check (F-014, UF-015) is a measurement sub-view reached from S-09 Settings & privacy; it adds no new top-level screen.

## UF-001 — First run & intent
- User intent: understand what the app is (and is not), choose a language, decide what leaves the device, and name what they want to change and why.
- Starting state: fresh install, or first launch immediately after account creation.
- Preconditions: app installed; account exists or is created via UF-014; onboarding copy is bundled (works offline); the three optional model-use consents default OFF (spine §9, §10, §21 R2).

Flow:

    Launch (unauthenticated)
      -> UF-014 Auth / account (sign in or create account)  [returns authenticated]
      -> S-11 First-run onboarding
          -> Value screens: "contextual routine lab — not therapy, treatment, diagnosis or a streak tracker"
          -> Language select (tr / en)  [prefilled from device locale, user can override]
          -> Age attestation (18+)  ->  set age_confirmed_18  [under-18 -> not onboarded into the loop; only safety resources S-10]
          -> REQUIRED consent: process special-category health data (consent_health_processing, KVKK/GDPR Art.9(2)(a))
              ├─ Granted -> continue (this is the base "wellbeing" purpose; captured BEFORE any observation/craving capture)
              └─ Declined -> stop the loop; offer only safety resources (S-10) and account deletion
          -> Optional consent panel (personalization / research / free-text-to-model)  [all default OFF, each independent]
          -> Analytics opt-in (analytics_enabled)  [OFF by default; non-sensitive events only]
          -> Smoking stance (quitting / reducing / noticing / not_ready)  [skippable]
          -> Notification permission?  [explain the <=2/day budget BEFORE the OS prompt]
              ├─ Granted -> store permission; scheduling available
              └─ Denied  -> continue; in-app reminders only; re-request path lives in S-09
      -> S-01 Intent
          -> Choose what to change + why  ->  value + target behavior (no morality labels)
          -> Save intent
      -> Decision: narrate the day now?
          ├─ Yes -> UF-002 Day narration
          └─ No  -> Home (empty draft-map state + "Tell your day" call to action)

### Error/recovery branches
- Free-text-to-model consent declined -> narration proceeds via cards only; voice/AI parsing disabled with a plain explanation (UF-002 fallback).
- Notification permission denied -> no core-loop step is blocked; right-moment reminders degrade to in-app only; re-enable from S-09.
- Onboarding interrupted (app closed mid-flow) -> resume at the last completed step on next launch; no partial data lost.
- Device-locale/user-language mismatch -> user override wins and persists to `users.language`.
- Offline during account creation -> handled in UF-014; onboarding content itself renders offline.

### Analytics checkpoints
- `onboarding_started`, `language_selected`, `consent_set` (per purpose, records default-OFF baseline), `smoking_stance_set`, `notif_permission_result`, `onboarding_completed`, `intent_set`.
- No intent free-text or consent content is placed in event payloads (event-minimal, spine §19).

### Related acceptance criteria
- [ ] F-001: First launch shows value + language + age (18+) + the REQUIRED `consent_health_processing` (captured before any capture) + the three optional model-use consents (default OFF, toggle independently) + analytics opt-in (OFF).
- [ ] F-001: Declining `consent_health_processing` stops the loop and leaves only safety resources (S-10) + account deletion reachable; under-18 is not onboarded into the loop.
- [ ] F-001: Declining the notification permission blocks no core-loop step.
- [ ] F-001: Onboarding is resumable after interruption with no data loss.
- [ ] F-001: An intent (value + target behavior) is persisted and visible before day narration begins.
- [ ] F-013: The ≤2/day budget is explained before the OS notification prompt is shown.

## UF-002 — Day narration to draft map
- User intent: describe a typical day so the system can propose (never assert) recurring transitions and chains.
- Starting state: authenticated, intent saved, on S-02.
- Preconditions: intent exists (UF-001); if using voice, microphone permission is requested per-feature and free-text-to-model consent is ON; otherwise card mode is available with no special permission.

Flow:

    S-02 Tell-your-day
      -> Choose input mode
          ├─ Voice -> request microphone permission (per-feature, data-minimized)
          │            ├─ Granted -> record short day-story
          │            └─ Denied  -> fall back to Cards
          └─ Cards -> tap prebuilt transition cards (waking, leaving home, arriving at work, break, arriving home, after meal, bedtime) + free notes
      -> Send narrative for parsing (Edge Function, bounded AI — spine §9)
          ├─ Network OK -> AI extracts candidate {time window, transition, behavior, candidate function}
          └─ Network lost / parse error -> keep card entries locally; queue parse; show "we'll finish organizing when you're back online"
      -> Draft map preview  [candidates shown as PROPOSALS, labeled "Did I understand you right?" — never facts]
          -> Risk-phrase scan on narrative text
              ├─ Risk phrase present -> UF-010 Crisis flow (STOP normal flow)
              └─ None -> continue
      -> Save draft `moments` (status = hypothesis) + draft `routine_edges`
      -> Prompt: begin the 3-day observation
          ├─ Start now -> UF-003
          └─ Later     -> Home (draft map pending; observation can start anytime)

### Error/recovery branches
- Voice permission denied or unsupported device -> silent fallback to card mode; no loss of function.
- AI parse fails or returns low confidence -> present the raw card entries for manual structuring; never fabricate transitions.
- Free-text-to-model consent OFF -> voice/AI parse unavailable; card mode only; explain why.
- Offline -> narrative and cards persist locally (local-first); parsing is queued and retried; user can proceed to UF-003.
- User disagrees with every candidate -> "none of these fit" clears proposals and returns to card entry.

### Analytics checkpoints
- `narration_started` (mode = voice|cards), `mic_permission_result`, `narration_submitted`, `parse_result` (status = ok|low_confidence|failed|queued_offline), `draft_map_created`.
- Never log narrative content or transcripts; counts and statuses only.

### Related acceptance criteria
- [ ] F-002: Parsed candidates are shown as reversible proposals ("Did I understand you right?"), never persisted as confirmed facts.
- [ ] F-002: Card mode produces a usable draft map with no microphone or model access.
- [ ] F-002: A risk phrase detected in narration diverts to UF-010 before any coaching content is shown.
- [ ] F-002: Offline narration is retained locally and parsing retries without user data loss.

## UF-003 — Three-day observation loop
- User intent: capture what actually happens at transitions with minimal effort, so the map is grounded in evidence, not assumption.
- Starting state: authenticated, a draft map exists, observation window active.
- Preconditions: draft `moments` exist (UF-002); observation check-ins are lightweight (spine §5) and work offline; no prescription is offered during observation (spine §3 step 2).

Flow:

    Observation window (rolling ~3 days)
      -> Scheduled short prompt at a candidate transition  [respects budget + quiet windows, UF-013]
          OR user opens "add a moment" manually
      -> S-03 Observation check-in (10–20s)
          -> Capture context / behavior / craving (0–10) / energy  [one-tap where possible]
          -> Risk-phrase scan on any free note
              ├─ Risk phrase -> UF-010 Crisis flow (STOP)
              └─ None -> continue
      -> Save `observations` (local-first; synced only per consent)
      -> Decision: enough evidence for a repeating chain?
          ├─ Not yet -> back to Home; keep collecting
          └─ Yes (>=1 chain seen across days) -> prompt "Ready to check the map?"
                                                    -> UF-004 Confirm map

### Error/recovery branches
- Missed prompt -> no penalty, no streak language; the moment can be logged later or skipped ("It did not happen today. What did this moment teach us?").
- Offline -> check-ins persist on-device and sync later; observation never requires network.
- Too few observations after the window -> extend gently or proceed to UF-004 with lower confidence, clearly labeled.
- User adds an unplanned moment -> allowed; creates/updates a `moments` hypothesis.

### Analytics checkpoints
- `observation_prompt_shown`, `observation_checkin_logged` (with day index toward 3), `observation_skipped`, `observation_window_ready`.
- Store state values as coded fields only; never log free notes.

### Related acceptance criteria
- [ ] F-003: A check-in completes in ≤20 seconds and offers no experiment/prescription during the observation window.
- [ ] F-003: Missed or skipped check-ins produce no "failure"/streak-reset language (spine §1.3).
- [ ] F-003: Check-ins are captured and stored offline and reconcile on reconnect.
- [ ] F-003: The map-readiness prompt appears only after ≥1 repeating chain is observed.

## UF-004 — Confirm map
- User intent: correct the system's assumptions, understand each chain in plain language, and choose the one moment to work on.
- Starting state: authenticated, observation evidence collected, on S-04.
- Preconditions: draft `moments` + `routine_edges` with evidence exist; correlations are shown as correlations, each with its evidence and a one-tap correction (spine §1.7, §1.9).

Flow:

    S-04 Day map
      -> For each candidate chain, show: trigger -> behavior, immediate benefit (function label), possible delayed cost, confidence, evidence_count
          -> Present as "some days this seems to happen" (correlation, never causation)
      -> User reviews each node
          ├─ Correct -> confirm (moment.status = confirmed)
          ├─ Wrong function/benefit -> one-tap correct (edit function label / benefit / cost)
          └─ Not real -> delete node
      -> Pick the priority moment (moment.priority = true)  [exactly one]
      -> Decision: proceed to an experiment?
          ├─ Yes -> UF-005 Select experiment
          └─ No  -> Home (map confirmed, no active experiment yet)

### Error/recovery branches
- User corrects a wrong inference -> the correction is stored as `user_said` evidence and reshapes the edge immediately; the system does not re-assert the old guess.
- No chain feels right -> user may re-run narration (UF-002) or extend observation (UF-003); the map is never forced.
- Conflicting corrections vs. observed data -> user's correction wins; confidence recomputed and shown honestly.
- Offline -> confirmation edits persist locally; sync later.

### Analytics checkpoints
- `map_review_shown`, `map_node_confirmed`, `map_node_corrected`, `map_node_deleted`, `priority_moment_set`, `map_confirmed` (activation signal — spine §15).
- Log node counts and correction counts; never log node text content beyond coded function labels.

### Related acceptance criteria
- [ ] F-004: Every displayed pattern shows its evidence and offers a one-tap "this is wrong" correction (spine §1.9).
- [ ] F-004: Chains are phrased as correlation ("seems to work on some days"), never as causation or diagnosis (spine §5 forbidden phrasing).
- [ ] F-004: Exactly one moment can be marked priority before an experiment is chosen.
- [ ] F-004: Confirming the map emits the `map_confirmed` activation event.

## UF-005 — Select experiment
- User intent: choose one small alternative that serves the same function at lower cost, and set a concrete if-then plan.
- Starting state: authenticated, map confirmed, priority moment set, on S-05.
- Preconditions: a priority `moment` exists; options are ranked from the curated `experiment_library` by function (bounded AI content selection — spine §9); only one experiment may be active at a time (spine §1.4).

Flow:

    S-05 Choose experiment
      -> System ranks 2–3 options for the priority moment's function (from experiment_library, duration 30s–10m; most 30s–5m)
          -> Options presented as equal, low-cost, non-moralizing alternatives
      -> Relationship-safety pre-check: is the chosen option a Connection-family experiment?
          ├─ Yes -> UF-011 Relationship-safety gate  ->  if unsafe, offer alternative support path (S-10) instead
          └─ No  -> continue
      -> Smoking-family option chosen while stance = quitting/reducing?
          ├─ Yes -> attach visible smoking-support entry (UF-009); no medical/withdrawal advice
          └─ No  -> continue
      -> User picks ONE option
      -> Build if_this_then_that plan (trigger cue + tiny action)
      -> Check single-active rule
          ├─ No active experiment -> set active
          └─ One already active -> ask "pause the current one and switch?"  ->  confirm to replace
      -> Schedule right-moment reminder for the transition  [within quiet windows + budget, UF-013]
      -> Home (active experiment shown)

### Error/recovery branches
- Library has no reviewed option for the function -> present a safe generic pause/delay option; never free-form prescribe (spine §9 limit).
- User declines all options -> return to S-04 to pick a different moment or keep observing; no experiment forced.
- Attempt to run a second experiment -> blocked by the single-active rule; explicit replace confirmation required.
- Offline -> selection and if-then plan persist locally; reminder scheduling uses the on-device engine.

### Analytics checkpoints
- `experiment_options_shown` (function family + option count), `experiment_selected`, `if_then_plan_saved`, `experiment_activated` (first activation is the `first_experiment_planned` activation signal), `experiment_replaced`.
- `relationship_gate_entered` and `smoking_support_attached` where applicable.

### Related acceptance criteria
- [ ] F-005: Exactly one experiment can be active; selecting another requires an explicit replace confirmation (spine §1.4).
- [ ] F-009: Options come only from the curated `experiment_library`; the system never free-form prescribes treatment/medication (spine §9).
- [ ] F-005 / F-010: A Connection-family selection always passes through the relationship-safety gate (UF-011) before activation.
- [ ] F-005: Activating the first experiment emits the `first_experiment_planned` activation event.

## UF-006 — Right-moment decision (lock screen -> transition card -> do / remind later / not suitable)
- User intent: at the real transition, decide in the moment whether to try the small alternative.
- Starting state: authenticated, one active experiment with a scheduled transition.
- Preconditions: rule-based on-device engine (spine §7), ≤2 proactive notifications/day, quiet windows respected; lock-screen previews carry no sensitive content (spine §5, §10, §11).

Flow:

    On-device rule engine evaluates the decision point
      -> Inputs: time window, last response, current craving/energy, 7-day notification load, optional location (only if permission granted)
      -> Decision: send a proactive notice now?
          ├─ Budget exhausted OR inside quiet window OR rule says "send nothing" -> suppress (no notice)
          └─ Send -> schedule LOCAL notification
      -> Lock-screen notice (neutral): "A transition moment is coming up" / "Bir gecis ani yaklasiyor"
          -> User opens the app  (sensitive detail appears ONLY after open)
      -> S-06 Transition card
          -> Relationship-safety gate if experiment is Connection-family
              ├─ Unsafe context -> UF-011 -> alternative support path (S-10); do NOT present the connection action
              └─ Safe / not applicable -> show the experiment action + if-then cue
          -> Smoking-family + high craving -> surface UF-009 support entry alongside the option (no medical advice)
      -> User response
          ├─ Do now -> record Attempt(response = did) -> UF-007 Log outcome  [north-star candidate: conscious transition]
          ├─ Remind later -> record Attempt(response = not_now); reschedule within budget; feed UF-013 "not now" learning
          └─ Not suitable -> record Attempt(response = declined) + reason; adapt future timing/option

### Error/recovery branches
- Network loss -> the engine and transition card run fully on-device; no server round-trip needed to decide or record the attempt.
- Notification permission denied -> no lock-screen notice; the active-experiment card is still reachable in-app from Home.
- Location permission absent -> engine simply omits the location variable; behavior degrades gracefully (data minimization, spine §10).
- User ignores the notice -> counts as no response; later a gentle skipped-moment prompt ("What did this moment teach us?") may appear, never a failure message.
- Risk phrase entered in any reason/note -> UF-010 Crisis flow (STOP).

### Analytics checkpoints
- `decision_evaluated` (outcome = suppressed_budget | suppressed_quiet | suppressed_rule | sent), `transition_notice_sent`, `transition_card_opened`, `transition_response` (did | not_now | declined).
- `conscious_transition_success` on `did` (north-star metric — spine §0, §15). `relationship_gate_blocked` where the connection action was withheld.
- Lock-screen payloads contain no sensitive text; verified as an event property, not the content itself.

### Related acceptance criteria
- [ ] F-013: No more than 2 proactive notifications fire per day; quiet windows are never violated (spine §1.6, §7).
- [ ] F-006: Lock-screen previews never reveal the behavior/action ("smoke a cigarette" / "talk to your partner"); sensitive detail is shown only after the app is opened (spine §5, §10).
- [ ] F-006: The decision engine and transition card function offline; an attempt records without network.
- [ ] F-006: A "did" response records `Attempt(did)` and increments the weekly successful-conscious-transition count.
- [ ] F-010: A Connection-family experiment routes through the relationship-safety gate at the moment of offer.

## UF-007 — Log outcome
- User intent: quickly record how the moment felt so learning is grounded in proximal outcomes.
- Starting state: authenticated, immediately after a "did" response (or a skipped-moment prompt), on S-07.
- Preconditions: an `attempts` row exists for this moment; outcome capture is one-tap; free note is sensitive and local-first / consented (spine §5).

Flow:

    S-07 Immediate outcome
      -> One-tap capture: craving (0–10), energy, mood, connection feeling
      -> Optional free note (sensitive)
          -> Risk-phrase scan
              ├─ Risk phrase -> UF-010 Crisis flow (STOP)
              └─ None -> continue
      -> Save `outcomes` linked to the attempt (local-first; synced only per consent)
      -> Show a neutral, non-judgmental acknowledgement (no praise/streak language)
      -> Return to Home; data feeds UF-008 weekly review

### Error/recovery branches
- User skips outcome logging -> allowed; the attempt still counts; the outcome is simply empty (no penalty).
- Offline -> outcome persists on-device and syncs later; logging never blocks on network.
- Free-text-to-model consent OFF -> the note stays on-device and is never sent for summarization; weekly review then uses coded fields only.
- Accidental entry -> the outcome is editable/clearable before it informs an insight.

### Analytics checkpoints
- `outcome_logged` (which coded fields were filled), `outcome_skipped`, `proximal_delta` (craving/energy/connection change vs. baseline, coded).
- Free notes are never included in analytics payloads.

### Related acceptance criteria
- [ ] F-007: Outcome capture is one-tap for craving/energy/mood/connection and completes without a network call.
- [ ] F-007: A free note is treated as sensitive: stored local-first and sent for AI summarization only when free-text-to-model consent is ON.
- [ ] F-007: Skipping outcome logging never triggers failure/streak language.
- [ ] F-007: A risk phrase in the note diverts to UF-010 before saving coaching state.

## UF-008 — Weekly review & next experiment
- User intent: understand what got easier or harder this week (as correlation), confirm or correct it, and choose the next small change.
- Starting state: authenticated, ≥1 week of attempts/outcomes exists, on S-08.
- Preconditions: weekly summary uses bounded AI summarization (no causality/diagnosis/personality labels — spine §9); insights show evidence type and require user confirmation (spine §3 step 7, §5).

Flow:

    Weekly notification (in budget) OR user opens S-08 Week review
      -> Generate summary
          ├─ Network OK -> Edge Function summarizes the week in plain, non-judgmental language
          └─ Offline / error -> show last cached summary + coded weekly counts; queue regeneration
      -> Present insights, each with evidence type: user_said | seen_together | experiment_result
          -> Phrased as correlation: "You chose your alternative in three of five similar moments"
      -> For each insight:
          ├─ Confirm -> insight.user_confirmed = true
          └─ Correct -> one-tap "this is wrong" -> insight adjusted/dismissed
      -> Choose the next step
          ├─ Continue / adjust current experiment -> UF-005 (re-plan)
          ├─ New priority moment -> UF-004 -> UF-005
          └─ New area entirely -> S-01 Intent (UF-001 intent step)
      -> Home

### Error/recovery branches
- Insufficient data for a believable insight -> show "not enough yet" rather than inventing a pattern (spine §14 assumption 4).
- Summary reads as causal/judgmental -> blocked by copy rules; correlation-only phrasing enforced; user can flag it wrong.
- Offline -> cached summary + local counts shown; regeneration retried later.
- User rejects the whole summary -> nothing is asserted; the week is left as raw logs the user controls.

### Analytics checkpoints
- `week_review_shown`, `insight_confirmed`, `insight_corrected`, `next_experiment_selected` (continue | new_moment | new_area).
- `weekly_conscious_transitions` (north-star rollup). No streak or time-in-app metric is recorded as success (spine §15).

### Related acceptance criteria
- [ ] F-008: Every insight displays its evidence type and requires explicit confirm/correct; corrections set `user_confirmed`/dismiss (spine §5).
- [ ] F-008: Summaries never contain causal, diagnostic, or personality-label statements (spine §9 limit).
- [ ] F-008: With insufficient data the review says so instead of fabricating a pattern.
- [ ] F-008: The review offers a single next step and never uses streak/loss-aversion mechanics (spine §12).

## UF-009 — Smoking support pathway
- User intent: get respectful, non-medical support for nicotine dependence without being told a cigarette is "bad" or given individual medical advice.
- Starting state: authenticated; entered from smoking stance, a craving/smoking experiment, a lapse, or an explicit tap; on/through S-10.
- Preconditions: professional cessation support is free and visible (spine §1.10, §10); the app gives no individual medical advice about withdrawal or medication (spine §9, §10, §13 non-goals).

Flow:

    Entry: smoking stance (quitting/reducing) OR craving-family experiment OR lapse logged OR explicit "get support" tap
      -> S-10 Safety & support (smoking section)
          -> Show free, visible resources: ALO 171, aile hekimi (family physician), professional referral
          -> Offer function-serving micro-options for craving (delay, change mouth taste, urge surfing, change environment) — NOT bans, NOT moral labels
      -> On a lapse:
          -> Do NOT reset a streak (there are no streaks)
          -> Re-assess trigger strength + readiness (may adjust the active experiment via UF-005)
      -> Record `safety_events` (pathway = smoking_support; minimal PII)
      -> Return to prior screen (coaching optional, never forced)

### Error/recovery branches
- User is `not_ready` -> offer information and resources only; no pressure, no experiment pushed.
- Offline -> resource contacts (ALO 171, family-physician guidance) are bundled and shown offline; the audit event queues.
- Request for medication/withdrawal advice -> declined with a referral to ALO 171 / family physician; never answered as medical advice (spine §10, §13).
- Repeated lapses -> re-assessment prompt, never a punitive message.

### Analytics checkpoints
- `smoking_support_shown` (source = stance | experiment | lapse | manual), `smoking_resource_opened` (which resource), `safety_event` (pathway = smoking_support).
- Minimal PII in the safety audit; no free-text content.

### Related acceptance criteria
- [ ] F-010: ALO 171 + family physician + professional referral are reachable free of charge and never behind a paywall (spine §1.8, §10).
- [ ] F-010: The app never provides individual medical advice about withdrawal or medication (spine §9, §13).
- [ ] F-010: A lapse never resets a streak; it triggers a trigger-strength/readiness re-assessment (spine §10).
- [ ] F-010: A `safety_events` row (pathway = smoking_support) is written with minimal PII.

## UF-010 — Crisis / self-harm safety flow
- User intent: when a user expresses acute risk, be routed immediately to real help instead of coaching.
- Starting state: any screen where free text is entered (narration UF-002, check-in UF-003, outcome note UF-007, reasons in UF-006).
- Preconditions: crisis detection is rule-based on explicit risk phrases, with human-reviewed, tested copy — never left to the generative model alone (spine §9, §10; ADR-005).

Flow:

    Explicit risk phrase detected by the RULE-BASED matcher (not an LLM classifier)
      -> STOP the normal coaching flow immediately (no experiment, no summary, no upsell)
      -> S-10 Safety & support (crisis section)
          -> Show pre-approved, tested crisis copy (TR + EN) + local emergency resources
          -> Make the resources actionable (call / open) and unmissable
      -> Record `safety_events` (pathway = crisis; minimal PII, no risk-text stored verbatim)
      -> Offer a calm return path; do NOT auto-resume coaching
          └─ User chooses when/if to continue

### Error/recovery branches
- False positive -> the user can dismiss; safety resources remain one tap away from every screen; no data harm done.
- Offline -> crisis copy and emergency resource numbers are bundled and shown offline; the audit event queues.
- LLM disagrees with the rule -> the rule wins; the generative model can never suppress or override the safety flow (spine §9 limit, §10).
- Risk phrase during onboarding (before full setup) -> the safety flow still fires; it does not depend on a completed map.

### Analytics checkpoints
- `crisis_flow_triggered` (source screen), `crisis_resource_opened`, `safety_event` (pathway = crisis).
- No verbatim risk text is ever logged; only that the pathway fired (spine §10 minimal PII).

### Related acceptance criteria
- [ ] F-010: Explicit risk phrasing halts the normal flow and shows human-reviewed, tested crisis copy in the active language (spine §10).
- [ ] F-010: Crisis routing is decided by a rule set, not by a generative classifier alone; the LLM cannot override it (spine §9; ADR-005).
- [ ] F-010: Crisis resources are available offline and from every screen, always free.
- [ ] F-010: A `safety_events` row (pathway = crisis) is written without storing the risk text verbatim.

## UF-011 — Relationship-safety gate
- User intent: avoid being pushed toward contact/connection in a context where that could be unsafe.
- Starting state: authenticated; a Connection-family experiment is being selected (UF-005) or offered at the moment (UF-006).
- Preconditions: connection experiments are NOT assumed safe; a violence/control/conflict context must divert to an alternative support path (spine §10).

Flow:

    Trigger: a Connection-family experiment is about to be selected or offered
      -> Gate check (brief, non-interrogating): is contact safe right now?
          ├─ Safe -> proceed with the connection experiment (back to UF-005 activation or UF-006 offer)
          └─ Unsafe / unsure (violence, control, conflict) ->
                  -> Do NOT present the connection action
                  -> S-10 Safety & support (relationship-safety alternatives)
                      -> Offer an alternative support path (self-directed relief / boundary / external support), never "just talk to them"
                  -> Record `safety_events` (pathway = relationship_safety; minimal PII)
                  -> Suggest a different-function experiment instead (e.g. Relief & transition) via UF-005

### Error/recovery branches
- User declines to answer the gate -> default to the safe alternative path, not the connection action.
- Context changes later -> the gate re-runs whenever a connection experiment is next offered; it is not a one-time flag that unlocks forever.
- Offline -> the gate and alternative resources render on-device; the audit event queues.
- Gate mistakenly blocks a safe context -> user can proceed after the explicit safe confirmation; no data harm.

### Analytics checkpoints
- `relationship_gate_shown`, `relationship_gate_result` (safe | diverted), `safety_event` (pathway = relationship_safety), `alternative_experiment_offered`.
- Minimal PII; no relationship free-text logged.

### Related acceptance criteria
- [ ] F-010: A Connection-family experiment is never selected or offered without passing the relationship-safety gate (spine §10).
- [ ] F-010: In an unsafe/unsure context the connection action is withheld and an alternative support path is offered instead.
- [ ] F-010: The gate re-evaluates on each new connection offer rather than permanently unlocking.
- [ ] F-010: A `safety_events` row (pathway = relationship_safety) is written with minimal PII.

## UF-012 — Account deletion / export
- User intent: get their data out, or remove routine nodes / AI memory / the whole account, on demand and for free.
- Starting state: authenticated, in S-09 Settings & privacy.
- Preconditions: deletion and export are always free and visible (spine §10); deletion is a destructive, irreversible action requiring explicit confirmation; cascade behavior is defined in `docs/DATABASE.md`.

Flow:

    S-09 Settings & privacy -> Data & account
      -> Choose an action
          ├─ Export my data
          │     -> Generate export: client-side merge of the Edge Function's cloud rows + the on-device local sensitive store (free notes, unsynced fields); owner-scoped only
          │     ├─ Success -> deliver the export file; confirm what was included
          │     └─ Failure -> show retry; nothing deleted; state clearly it failed
          ├─ Delete a routine node -> confirm -> remove the moment/edge (learning re-derived, no streak reset)
          ├─ Delete AI memory -> confirm -> purge parsed/summarized derived data; raw local logs handled per choice
          └─ Delete account -> S-12 Auth / account
                -> Explicit destructive confirmation ("this cannot be undone")
                -> Re-authenticate if required
                -> Delete account + cascade owned data (per DATABASE cascade rules)
                -> Sign out to the Auth screen; confirm deletion completed

### Error/recovery branches
- Export generation fails -> retry offered; no data is deleted as a side effect.
- Deletion interrupted (network/app close) -> deletion is idempotent and resumes/reconciles; partial state is never silently left claiming success.
- Offline -> account/server-side deletion is queued with a clear "will complete when online" state; local sensitive data can be wiped on-device immediately.
- Accidental tap -> the destructive confirmation (and re-auth for account deletion) prevents one-tap loss.

### Analytics checkpoints
- `data_export_requested`, `data_export_result` (success | failed), `routine_node_deleted`, `ai_memory_deleted`, `account_deletion_requested`, `account_deleted`.
- These are lifecycle/trust signals; no exported content is logged.

### Related acceptance criteria
- [ ] F-011: Export and deletion are reachable free from Settings and never paywalled (spine §10, §12).
- [ ] F-011: Account deletion requires explicit destructive confirmation (and re-auth where required) and cascades owned data per `docs/DATABASE.md`.
- [ ] F-011: The export is a client-side merge of the Edge Function's cloud rows and the on-device local store; a locally-held unsynced free note appears in the export.
- [ ] F-011: A user can delete a single routine node or the AI memory without deleting the account.
- [ ] F-011: A failed export deletes nothing and reports failure honestly.

## UF-013 — Notification budget & not-now learning
- User intent: keep proactive nudges rare, well-timed, and respectful; teach the app when not to interrupt.
- Starting state: authenticated, in S-09 (or implicitly via responses in UF-006).
- Preconditions: starting budget ≤2 proactive notifications/day; quiet windows protect meetings/sleep/family time; "not now" reduces or reschedules (spine §1.6, §7). Retention/opt-out are load/trust signals, not success (spine §15).

Flow:

    S-09 Settings & privacy -> Notifications
      -> Configure: notification budget (default <=2/day), quiet windows (sleep / meetings / family)
      -> Toggle: enable / disable proactive notifications entirely (opt-out honored)
    Implicit learning from UF-006 responses
      -> "Remind later" (not_now) -> engine reduces frequency and reschedules to a better window
      -> Repeated "not suitable" (declined) at a time -> engine deprioritizes that window
      -> Engine recomputes using last response + 7-day notification load
          ├─ Load high / user said not-now -> send fewer / send nothing
          └─ Fit improving -> keep the schedule within budget + quiet windows

### Error/recovery branches
- User sets budget to 0 / disables notifications -> fully honored; the loop continues via in-app cards only, no nagging.
- Quiet window overlaps a transition -> the notice is suppressed or shifted; quiet windows always win.
- Permission revoked at OS level -> app detects it, surfaces an in-app-only mode, and offers a re-enable path.
- Offline -> the on-device engine still enforces budget and quiet windows; nothing depends on a server.

### Analytics checkpoints
- `notif_budget_set`, `quiet_window_set`, `notifications_opted_out`, `not_now_learned`, `window_deprioritized`, `notification_suppressed` (reason = budget | quiet | rule | opt_out).
- Tracked explicitly as load/trust signals, never counted as engagement success (spine §15).

### Related acceptance criteria
- [ ] F-013: The default proactive budget is ≤2/day and is user-adjustable, including full opt-out (spine §1.6, §7).
- [ ] F-013: A "not now" response measurably reduces frequency and/or reschedules the next notice.
- [ ] F-013: Quiet windows always suppress or shift a notice; they are never overridden by the engine.
- [ ] F-013: Budget and quiet-window enforcement work offline on the device rule engine.

## UF-014 — Auth / account lifecycle
- User intent: securely sign in, resume sessions, and manage the account across its lifecycle.
- Starting state: app launch when unauthenticated, or a session action from S-09/S-12.
- Preconditions: data is owner-only (RLS `auth.uid() = user_id`); `service_role` is never in the client (spine §5; ADR-004); new users route to onboarding, returning users to Home.

Flow:

    Launch
      -> Session present + valid?
          ├─ Yes -> Home (returning user)
          └─ No  -> S-12 Auth / account
                -> Choose: sign in / create account / reset password
                    ├─ Create account
                    │     ├─ Success -> UF-001 (S-11 onboarding -> S-01 intent)
                    │     └─ Failure (network / validation / taken) -> show error + retry; no partial account state
                    ├─ Sign in
                    │     ├─ Success -> Home
                    │     └─ Failure (bad creds / network) -> error + retry; lockout guidance if applicable
                    └─ Reset password -> send reset -> return to sign in
      -> Session lifecycle (any time)
          ├─ Token refresh -> transparent
          ├─ Session expired -> prompt re-authentication; local sensitive data stays on-device
          ├─ Sign out -> clear session -> S-12 Auth screen (local sensitive data remains unless deletion requested)
          └─ Delete account -> UF-012 (destructive path)

### Error/recovery branches
- Offline at launch with a cached valid session -> local-first screens (Home, observation, transition card, outcome logging) work; server-dependent actions (AI parse, weekly summary, account changes) queue or show an offline state.
- Sign-in/create failure -> clear, non-leaky error messages; retry; never leave a half-created account claiming success.
- Session expiry mid-task -> re-auth prompt; in-progress local data (check-in, outcome) is preserved and reconciled after re-auth.
- Multiple devices -> owner-only RLS ensures a user only ever sees their own rows; no cross-account leakage.

### Analytics checkpoints
- `auth_screen_shown`, `account_created`, `sign_in_result` (success | failed), `password_reset_requested`, `session_restored`, `session_expired`, `sign_out`.
- No credentials or tokens are ever logged.

### Related acceptance criteria
- [ ] F-011: All user data is owner-scoped via RLS (`auth.uid() = user_id`); `service_role` never ships in the client (spine §5; ADR-004).
- [ ] F-011: A new account routes into onboarding (UF-001); a returning valid session routes to Home.
- [ ] F-011: A failed sign-in/create leaves no partial account and returns a clear, non-leaky error.
- [ ] F-011: With a cached valid session offline, local-first core-loop screens remain usable; server-only actions degrade gracefully.

## UF-015 — Optional WHO-5 wellbeing check
- User intent: optionally reflect on general wellbeing over the past two weeks with a short, standard, non-diagnostic measure — entirely by choice, never required to use the loop.
- Starting state: authenticated, in S-09 Settings & privacy, with `consent_health_processing` already granted (the core-service consent).
- Preconditions: WHO-5 is optional and opt-in; it is non-diagnostic (a wellbeing reflection, never a diagnosis or pass/fail score); it collects special-category health data, so it requires an explicit in-flow opt-in in ADDITION to `consent_health_processing` (spine §10, §15); it is a measurement sub-view of S-09 (no new top-level screen).

Flow:

    S-09 Settings & privacy -> Optional wellbeing check (WHO-5)
      -> Explain what WHO-5 is (a short, standard wellbeing reflection) and what it is NOT (not a diagnosis, not a score to optimize, not part of the core loop)
      -> Explicit in-flow opt-in  [separate from consent_health_processing; declining changes nothing else]
          ├─ Declined -> return to S-09; nothing shown, nothing recorded
          └─ Opted in -> present the 5 WHO-5 items (each 0–5, "over the last two weeks")
      -> Compute the raw 0–25 / 0–100 index on-device  [shown as a neutral reflection, never a diagnosis]
      -> Save the wellbeing measure (local-first; synced only per consent)  [special-category data]
      -> Offer an optional bi-weekly reminder cadence  [within the notification budget + quiet windows, UF-013]
      -> Return to S-09

### Error/recovery branches
- In-flow opt-in declined -> no items are shown and nothing is stored; the core loop is unaffected.
- Partial completion -> the user may cancel at any item; a partial WHO-5 is discarded, not scored.
- Offline -> items and the computed index persist on-device and sync later per consent; the check never requires network.
- Opt-in revoked later -> future checks stop; existing measures follow the standard export/deletion paths (UF-012).

### Analytics checkpoints
- `who5_offered`, `who5_optin_result` (opted_in | declined), `who5_completed`, `who5_skipped`.
- Only coded index bands and that the measure was taken are recorded; raw item responses and special-category values are never placed in analytics payloads (spine §19).

### Related acceptance criteria
- [ ] F-014: WHO-5 is optional, reached only from S-09, and never blocks or gates the core loop.
- [ ] F-014: WHO-5 requires an explicit in-flow opt-in in addition to `consent_health_processing` before any item is shown.
- [ ] F-014: WHO-5 is presented as a non-diagnostic wellbeing reflection, never as a diagnosis or pass/fail score.
- [ ] F-014: WHO-5 measures are special-category data stored local-first and exported/deleted via the standard privacy paths (UF-012).
