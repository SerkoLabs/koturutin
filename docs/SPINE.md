<!-- Originating product brief. Authoritative chain per AGENTS.md §5 is README → PRODUCT_SPEC → USER_FLOWS → ARCHITECTURE → DATABASE. -->

# koturutin — Authoritative Product Spine (source of truth for all planning docs)

> This is the ORIGINATING product brief for koturutin — the naming + content spine the planning
> documents were generated from. It defines the exact IDs, entity names, terminology and constraints.
> Derived from the product-research document "Otomatik Pilot Rutin Dönüşüm Uygulaması" (Sept 2026).
>
> Source-of-truth note: within the repository, the AUTHORITATIVE document chain per AGENTS.md §5 is
> README → docs/PRODUCT_SPEC.md → docs/USER_FLOWS.md → docs/ARCHITECTURE.md → docs/DATABASE.md. This
> spine is the background brief those docs were built from; where a citation says "spine §X" it
> refers to a section here. Feature IDs are authoritative in PRODUCT_SPEC (see §21 R1). If this
> brief and an approved doc ever disagree, the approved doc chain wins and this brief is updated.

## 0. One-line identity
A bilingual (Turkish + English) **contextual routine lab**: it makes a person's automatic daily
chains visible, proposes ONE small behavior experiment at the right transition moment, and learns
with the user what actually works — so they make more conscious choices *in real life* and,
over time, need the app less.

- Repo / working name: **koturutin**. Category (working term): "contextual routine guide /
  bağlamsal rutin rehberi". Public positioning: **wellbeing & behavior-awareness support** —
  NOT therapy, treatment, diagnosis, or a habit-streak tracker, and NOT a free-form AI therapist.
- Positioning sentence (product voice): "Notice the moments your day goes on autopilot; at that
  exact moment try one small alternative that fits you; learn together what really works."
- North Star metric: **weekly number of successful conscious transitions** (a real-life choice),
  NOT time-in-app, NOT streaks.

## 1. Non-negotiable product principles (violating any is a P0/scope error)
1. Goal is to return the user to their life, not to maximize app engagement.
2. No morality labels: podcasts, coffee, solitude, a cigarette are never declared "bad". The user
   chooses which behavior costs them; the system helps find a better option that still serves the
   behavior's *function*.
3. No "streak" / "you failed again" language. A lapse is learning data, never a reset-to-zero.
4. One active experiment at a time. Steps are small: 30 seconds–10 minutes (most 30s–5m; craving & sleep-transition families up to 10m).
5. Structured data first, AI second. AI is an assistant (parsing, summarizing, phrasing, flagging),
   never the memory, the therapist, or the crisis decision-maker.
6. Right *moment* beats notification *volume*. Max 2 proactive notifications/day at start; learn
   "not now".
7. Correlation is shown as correlation, never as causation or diagnosis.
8. Safety and privacy are always-free and always-visible; never behind a paywall.
9. Rule-based, explainable decisions in v1 — no ML needed for MVP. Every insight shows its evidence
   and a one-tap "this is wrong" correction.
10. Nicotine dependence is not treated like "just a morning routine": keep professional cessation
    support (Turkey: ALO 171) free and visible.

## 2. Core loop (the 4-part engine)
day map (gün haritası) → right moment (doğru an) → micro-experiment (mikro-deney) → learning (öğrenme).

## 3. The 7-step learning loop (this is the product)
1. **Tell your day** — user narrates a typical day (voice or short cards). System looks for
   transitions and repeating chains, not clock times.
2. **Observe 3 days** — 10–20 second check-ins capture behavior, craving, energy, context. No
   prescription on day 1.
3. **Confirm the map** — system says "Did I understand you right?" and shows its assumptions; user
   corrects functions and picks the priority moment.
4. **Choose one micro-experiment** — user picks 1 of 2–3 options that serve the same need at lower cost.
5. **Remind at the right moment** — rule-based v1; a short lock-screen notice when the chosen
   transition approaches; sensitive detail only appears after the app is opened.
6. **Learn the outcome** — "did it / not now / didn't fit me" + one-tap before/after state.
7. **Interpret the week together** — which moments were easier/harder (as correlation), and the
   next small change. User confirms or corrects.

## 4. First-map transition hypotheses (examples only; must be user-confirmed, never assumed true)
| Transition (moment) | Current behavior | Possible short benefit | Possible long cost | First experiment direction |
|---|---|---|---|---|
| On waking | Coffee + cigarette | Fast arousal, ritual, solitude | Nicotine loop, choiceless start | Don't ban; 2-min wake step + briefly delay first cigarette |
| Leaving home | Headphones + nonstop content | Escape from boredom/thought, energy | Shrinking mental space, automatic consumption | A pause of silence, or conscious listening if user chooses |
| Arriving at work | Fixed work rituals | Reduce uncertainty, start fast | Stress carried all day | 30-sec direction-setting before first task |
| Arriving home | Balcony + cigarette + coffee | Transition, relief, personal space | Deferring family contact, dependency cue | 90-sec contact or physical discharge first, then conscious choice |
| After a meal | Cigarette | Sense of completion, strong contextual cue | Automatic consumption, health risk | Change mouth taste, 3-min movement, brief delay, professional quit path |

## 5. Data model / core entities (Postgres tables snake_case; TS types PascalCase)
Every table is owned by a user and is private-by-default with RLS. `service_role` never in client.
- **users** (User): preferences & safety settings — language (`tr`/`en`), timezone, notification
  budget, quiet windows, privacy choices, consent flags (personalization / research / free-text-to-model),
  smoking stance (`quitting`/`reducing`/`noticing`/`not_ready`).
- **moments** (Moment): a recurring transition point — name, time window, context, verification
  status (`hypothesis`/`confirmed`), priority flag.
- **routine_edges** (RoutineEdge): trigger→behavior link — trigger, behavior, immediate benefit
  (function label), delayed cost, confidence, evidence_count.
- **experiments** (Experiment): a chosen behavior alternative — function label, duration band,
  difficulty, safety class, `if_this_then_that` plan, active flag (only one active at a time).
- **attempts** (Attempt): an offer at a decision point + response — offered_at, transition,
  response (`offered`/`did`/`not_now`/`declined`), reason.
- **outcomes** (Outcome): proximal result of an attempt — craving 0–10, energy, mood, connection
  feeling, free note (sensitive; local-first / consented).
- **insights** (Insight): a surfaced pattern — text, evidence_count, confidence, user_confirmed.
- **experiment_library** (curated, read-only reference): clinically/culturally reviewed experiments
  by function; NOT user data. Function families in §8.
- **observations** (the 3-day check-ins): context, behavior, craving, energy, timestamp. (May be
  modeled as lightweight attempts+outcomes without an experiment; keep as its own table for MVP clarity.)
- **safety_events** (audit): rule-triggered safety flow shown (smoking-support / crisis / relationship-safety),
  timestamp, which pathway, resolution — for QA/observability, minimal PII.
Evidence display types for insights: `user_said`, `seen_together`, `experiment_result`. Correct
phrasing: "this alternative seems to work on some days"; forbidden phrasing: "talking to your child
reduces your cigarette craving" (implies causation).

## 6. First 8 screens (from the doc) + supporting screens
Primary loop screens:
- S-01 Intent (Niyet): choose what to change and why → value + target behavior
- S-02 Tell-your-day (Günü anlat): build typical day by talking or cards → draft timeline
- S-03 Observation check-in (Kısa gözlem): 10–20s capture → context/behavior/state
- S-04 Day map (Gün haritası): correct system assumptions → confirmed routine chain
- S-05 Choose experiment (Deney seç): pick one critical moment + one alternative → implementation intention
- S-06 Transition card (Geçiş kartı): "do now / remind later / not suitable" → decision + intervention
- S-07 Immediate outcome (Hemen sonrası): one-tap craving/energy/connection → proximal outcome
- S-08 Week review (Hafta): check the pattern, pick next experiment → user-confirmed learning
Supporting screens:
- S-09 Settings & privacy (dil, bildirim bütçesi, sessiz saat, veri silme/dışa aktarım, model consent)
- S-10 Safety & support (ALO 171 / aile hekimi; crisis resources; relationship-safety alternatives)
- S-11 First-run / onboarding (value, consent, language)
- S-12 Auth / account (sign in, account lifecycle, delete/export)

## 7. Rule-based decision engine (v1, explainable, no ML)
- **Decision points**: user-selected transitions — waking, leaving home, arriving at work, break,
  arriving home, after meal, bedtime.
- **Adaptation variables**: time window, optional location (only with explicit permission), last
  response, current craving/energy, notification load over last 7 days.
- **Intervention options**: send nothing, short pause, delay, substitution, environment change,
  contact action, support referral.
- **Starting budget**: ≤2 proactive notifications/day; reduce or reschedule as user says "not now".
- **Quiet windows**: protect meetings, sleep, family time.
- **Trust/explainability**: system can show which data drove a suggestion; user corrects inference in one tap.
- Just-in-time adaptive intervention framing: long-term outcome, proximal outcome, decision point,
  intervention options, adaptation variables, decision rules — all explicit and inspectable.

## 8. Experiment library (function → families → duration)
| Function | Micro-experiment families | Duration |
|---|---|---|
| Waking & energy | light, water, short movement, sensory activation, delay first behavior | 30s–3m |
| Relief & transition | breath, muscle release, change clothes, short walk, set a boundary | 60s–5m |
| Connection | eye contact, greeting, one question, short play, appreciation | 30s–3m |
| Attention & silence | one stop of silence, sensory orientation, conscious listening | 30s–5m |
| Craving | urge surfing, delay, change environment, change mouth taste, support | 1–10m |
| Avoidance & procrastination | 2-minute start, shrink the task, visible first step | 30s–2m |
| Sleep transition | screen threshold, light & prep, closing note for tomorrow | 2–10m |

## 9. AI architecture (structured data first; AI is a bounded assistant)
Allowed AI layers, each with a hard limit:
- **Narrative parsing**: from voice/text day-story extract time, transition, behavior, candidate
  function. LIMIT: never turns into fact without user confirmation.
- **Summarization**: compress weekly logs in plain, non-judgmental language. LIMIT: no causality,
  diagnosis, or personality labels.
- **Content selection**: rank 2–3 context-fit options from the clinically/culturally reviewed
  library. LIMIT: never free-form prescribes treatment or medication.
- **Language adaptation**: simplify TR/EN copy to the user's chosen tone. LIMIT: never manipulative,
  fear-based, or shaming.
- **Risk flagging**: on explicit risk phrases, trigger the predefined safety flow. LIMIT: crisis
  decision is rule-based + human-reviewed tested text, never left to the generative model alone.
Architecture decision: the model is the user's *narrative → candidate routine nodes* translator and
a safe-library presenter, not the product's memory or therapist. Free-text is not sent to a
third-party model by default; secondary/training use is opt-out-by-default (off).

## 10. Safety, ethics, privacy, regulatory (all MVP, all free, all visible)
- **Product claim limits**: v1 makes no "therapy / treatment / diagnosis / quits addiction / cures
  depression" claim. If intended use drifts to a medical purpose, EU medical-device-software
  qualification may change → flagged as a legal/stop decision, not derived by the agent.
- **Smoking / dependence**: separate quit / reduce / just-notice / not-ready-yet; never give
  individual medical advice about withdrawal/meds; keep ALO 171 + family physician + professional
  referral free; on a lapse do not reset a streak — re-assess trigger strength & readiness.
- **Mental health & crisis**: on explicit self-harm/acute-risk phrasing, STOP the normal coaching
  flow and route to local emergency resources; crisis decision is rule-based + human-reviewed +
  tested copy, never only a generative classifier.
- **Relationship-safety gate**: the connection experiment is NOT assumed safe; in a violence /
  control / conflict context offer an alternative support path instead.
- **Measurement**: optional bi-weekly WHO-5 Well-Being Index (5 items, last two weeks; validated
  Turkish form exists) as an optional outcome measure, never presented as a diagnostic tool.
- **Data protection**: mood, smoking, sleep, health status and free journal text are sensitive.
  KVKK treats health data as special-category (stricter); GDPR Art. 9 + data-minimization apply for
  EU users. MVP rules:
  - data minimization: do not request location/microphone/contacts by default; only per-feature with
    a separate permission;
  - user control: delete any routine node, the AI memory, and the account; export data;
  - lock-screen privacy: never show "smoke a cigarette" / "talk to your partner" in a notification preview;
  - explicit consent & purpose separation: wellbeing vs personalization vs research data separated;
    easy consent withdrawal;
  - local-first: keep raw records on device where possible; clearly show what goes to the cloud; encrypt;
  - model provider disclosure: state whether free text goes to a third-party model; training/secondary
    use default OFF;
  - retention: user-chosen, defined retention windows — no indefinite raw-log hoarding.
- WHO AI-for-health governance (autonomy, safety, transparency, accountability, inclusivity,
  sustainability): translate into product governance — explain why a suggestion appears; right to
  correct a wrong inference.

## 11. Bilingual content system (TR + EN) — cross-cutting, not translation-only
- **Intent keys**: language-neutral keys, e.g. `transition.home.arrival.connection`.
- **Tone options**: calm / direct / warm; separate QA per language.
- **Cultural adaptation**: family contact, tea/coffee rituals written naturally for Turkey; English is
  not a word-for-word copy.
- **Safety copy**: crisis, smoking, privacy texts approved by legal + clinical review in both languages.
- Notification example copy (never sensitive on lock screen):
  - lock screen: "A transition moment is coming up" / "Bir geçiş anı yaklaşıyor"
  - in-app: "Want to try a 60-second wake-up step before your usual first move?"
  - arrival: "Want to try a 90-second connection moment before your usual routine?"
  - skipped: "It did not happen today. What did this moment teach us?"
  - weekly: "You chose your alternative in three of five similar moments."

## 12. Ethical business model
- Always free (never paywalled): one day map, one active experiment, weekly summary, data deletion,
  safety resources, privacy settings, account deletion, basic safety.
- Paid (later, price-tested with willingness-to-pay interviews): multiple maps, advanced patterns,
  voice narration, rich experiment library, export.
- Forbidden: "infinite streak", loss-aversion, and other addictive mechanics — they contradict the
  product's purpose.

## 13. MVP scope
IN MVP:
- day narration (voice or cards) + user correction
- three-day observation (very short logs)
- day map (trigger, behavior, benefit, cost, confidence)
- single active experiment (2–3 safe options by function + if-then plan)
- rule-based notifications (chosen transition, quiet hours, budget, "not now" learning)
- weekly learning (correlation language, user confirmation, next experiment)
- safety pathways (smoking support, crisis routing, lock-screen privacy)
- Turkish + English (expert-reviewed natural copy in both)
OUT of MVP (explicit non-goals):
- continuous location & passive sensor tracking
- free-form AI therapist & diagnosis
- community feed, couples accounts, social competition
- wearable integration
- many simultaneous goals & complex badge systems
- medication / nicotine-product / personal health advice

## 14. Validation plan (first ~10 weeks, NO CODE) — de-risk before Stage 08
Phases (each with participant count + output):
- Problem interviews — understand automatic moments, functions, value conflicts, notification
  acceptance — 10–15 adults — output: language, segment, critical-transition list.
- Founder diary test — run the logging load & experiment logic on the founder's own routine —
  founder + 2 close testers — output: first map + daily protocol.
- Concierge pilot — human-in-the-loop (no algorithm) right-moment & suggestion fit — 10–15 people,
  14 days — output: which suggestion was accepted and why.
- Clickable prototype — test 8-screen comprehension & trust language — 5–8 people — output: flow &
  microcopy fixes.
- Closed MVP — 4-week repetition, load, proximal outcomes — 30–50 people — output: usage & safety signals.
- Adaptation experiment — which decision rule works best when — ethics approval + sample — output:
  micro-randomized research design.
**Four critical assumptions** (must hold): (1) map can be built without heavy load — user finds ≥1
repeating chain correct within 3 days & understands the language; (2) transition moment can be
captured well enough — simple clock + user choice lands the notice in a meaningful window;
(3) the alternative serves the function — user sees it as a real option, not a moral lecture;
(4) the insight feels right — weekly summary says something new but believable, wrong inference is
easily corrected.
**Starting decision thresholds** (working numbers, not benchmarks): map accuracy ≥7/10 interviewees
find the priority chain correct; first-week action ≥half of pilot do ≥3 micro-experiments; notification
fit median ≥4/5; perceived load median ≤2/5; weekly insight ≥2/3 find summary correct & useful;
safety = zero serious privacy / inappropriate clinical-referral incidents (else stop the release).

## 15. Success metrics (layers)
- North star: weekly successful conscious transitions.
- Activation: map confirmed + first experiment planned.
- Proximal outcome: immediate change in craving/energy/connection.
- Mid-term (2 & 4 weeks): self-efficacy + priority-routine frequency.
- Wellbeing: optional bi-weekly WHO-5 + user-defined quality of life.
- Safety: wrong-insight, sensitive-notification, unwanted-suggestion, support-referral incidents.
- Product health: 2 & 4-week retention, notification opt-out, data deletion — tracked as load/trust
  signals, NOT counted as success alone.

## 16. Three-stage product roadmap (from the doc)
- Stage Zero (Sıfır): interviews, founder diary, concierge, clickable prototype. NOT: backend, LLM,
  sensors. Exit: qualitative confirmation of the four critical assumptions.
- Stage One (Bir): mobile MVP, structured map, rule-based decisions, 30–50 experiments, TR+EN. NOT:
  community, wearables, clinical claim. Exit: 4-week acceptance/fit/safety thresholds.
- Stage Two (İki): adaptation, better timing, voice narration, research infrastructure. NOT:
  unexplained autonomous therapy. Exit: measurable proximal outcome under ethical/scientific review.

## 17. Smallest first story to prove BEFORE any code (the doc's "first prototype")
Tell → Understand → Confirm → Choose → Remind → Learn, on a single real transition
(arriving home → balcony cigarette+coffee → "90-sec family contact, then conscious choice").
If these six steps are not meaningful to humans, a bigger AI system will not fix the problem.

## 18. Defensible product asset (moat)
Not a long-term value model, but the combination of: user-verified contextual routine graph;
per-experiment acceptance/action/proximal-outcome history; function-classified, clinically &
culturally reviewed experiment library; explainable decision rules that make privacy & trust
visible at the product level.

## 19. Stack (playbook default; confirm exact versions with research-first at build time)
- Expo + React Native, TypeScript strict; Expo Router for navigation.
- Supabase: Postgres + Auth + Row Level Security + Storage + Edge Functions. Grants + RLS explicit
  on every client-exposed object; `service_role` server-side only.
- Local-first sensitive data: expo-secure-store / on-device storage for raw sensitive logs where
  possible; encrypt cloud-synced fields; explicit "what leaves the device" surface.
- i18n: message catalog keyed by language-neutral intent keys (see §11); expo-localization for locale.
- Notifications: expo-notifications; v1 = locally scheduled + on-device rule engine (right moment,
  budget, quiet hours, "not now"); server push optional later.
- AI: Supabase Edge Function calling an LLM for narrative parsing / summarization / library ranking,
  with the §9 limits; crisis classification is rule-based, not LLM.
- Analytics: privacy-respecting, EU-friendly, event-minimal (product value events, not surveillance).
- Build/release: EAS, environment-separated config; test on ≥1 real iOS + Android target before release.
- Claude Code mapping of the playbook's Sol/Astra routing: routine planning/implementation → default
  Claude Code model (e.g. Sonnet); high-consequence independent gate reviews (architecture, DB/RLS
  authorization, security, vertical-slice audit, release) → a stronger model / high reasoning effort
  run as an INDEPENDENT reviewer pass. The playbook explicitly allows Claude as the implementation
  agent as long as AGENTS.md + gates are followed. `.claude/skills` and `.claude/agents` load natively.

## 20. Terminology map (use consistently; TR shown for BUILD_PLAN, EN for engineering docs)
- contextual routine lab = bağlamsal rutin laboratuvarı/rehberi
- day map = gün haritası; transition/moment = geçiş anı; micro-experiment = mikro-deney
- conscious transition = bilinçli geçiş; lapse = kayma (not "failure"); function = işlev
- right moment = doğru an; notification budget = bildirim bütçesi; quiet window = sessiz saat

## 21. Reconciliation decisions (v1.1 — applied after the first planning-doc critique)

These decisions resolve cross-document consistency and regulatory findings. They are canonical.

- **R1 Authoritative Feature IDs** (PRODUCT_SPEC scheme): F-001 Onboarding & intent; F-002 Day
  narration; F-003 Three-day observation; F-004 Day map review & confirm; F-005 Choose one
  micro-experiment (relationship-safety gate applies at Connection-family selection); F-006
  Right-moment reminder / decision engine; F-007 Log outcome; F-008 Weekly learning summary; F-009
  Experiment library; F-010 Safety & support pathways (smoking + crisis + relationship-safety);
  F-011 Privacy & data control (auth, lifecycle, consent, model disclosure, export, deletion,
  lock-screen privacy); F-012 Bilingual content system; F-013 Notifications settings & budget;
  F-014 Optional bi-weekly WHO-5 (opt-in, non-diagnostic). USER_FLOWS and all docs use this scheme.
- **R2 Consent model** (users): consent_health_processing (required, Art.9(2)(a), captured before
  any capture), consent_personalization (OFF; gates structured special-category data to the model +
  AI personalization), consent_research (OFF), consent_free_text_to_model (OFF; gates free text to
  the model), consent_updated_at, analytics_enabled (opt-in, non-sensitive events only),
  age_confirmed_18 (self-attested 18+). No "consent_wellbeing" toggle — wellbeing is the base
  purpose expressed by consent_health_processing.
- **R3 free_note barrier**: client has no direct write privilege on outcomes.free_note (column
  grant); writes go through a consent-checking Edge Function; plus a trigger rejecting a non-null
  free_note unless consent_free_text_to_model = true. Deny/allow tests cover the direct client path.
- **R4 Retention purge**: cloud rows purged by retention_window_days (Edge Function/pg_cron) AND the
  on-device local sensitive store purged on the same window (on launch/periodic).
- **R5 Export**: client-side merge of cloud rows + on-device local store (incl. unsynced free notes);
  test asserts a locally-held free note appears in the export.
- **R6 Age assurance**: self-attested 18+ at onboarding (age_confirmed_18); suspected-minor policy;
  exact KVKK/GDPR Art.8 requirement is a build-time legal decision (Open Decisions).
- **R7 WHO-5**: optional, opt-in, non-diagnostic MVP measurement feature reached from S-09 Settings
  (flow UF-015); needs an explicit in-flow opt-in beyond consent_health_processing.
- **R8 Duration band**: "30 seconds–10 minutes" (most 30s–5m; craving and sleep-transition families
  up to 10m). experiment_library max_seconds CHECK <= 600.
- **R9 Voice**: MVP = optional voice INPUT for day narration (F-002); deferred/paid = rich/advanced
  voice narration & output.
- **R10 Account lifecycle** cites F-001/F-011 (not F-012). Relationship-safety gate at selection is
  F-005/F-010.
