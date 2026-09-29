# Validation Plan — Stage 01 Discovery & Pre-Code Gate

> Scope: koturutin — bilingual contextual routine lab (bağlamsal rutin rehberi).
> Source of truth: the product spine (`SPINE.md`). This document uses the spine's exact IDs,
> entity names and terminology (spine §5, §6, §14, §15, §16, §17, §20). It plans discovery only —
> it writes no application code, runs no migrations, installs no dependencies.
> Governing decision: **ADR-006** (validate before code). Related: ADR-001, ADR-005, ADR-007.

---

## 0. HARD GATE — read first

**No implementation-stage code (playbook Stage 08 — Foundation, and everything after it) begins
until the four critical assumptions (spine §14) are QUALITATIVELY confirmed with real humans.**

This is a stop condition, not a suggestion. It is the product requirement stated in the research:
*a bigger AI system will not fix a loop that humans do not find meaningful* (spine §17). Confirmation
is qualitative — signal from interviews, a founder diary, a human-run concierge pilot and a clickable
prototype — not a code metric.

- The gate is held in `docs/PROJECT_STATUS.md` (Gate status: **HELD** — pre-code validation gate).
- Clearing the gate requires the **Exit criteria** in §9 to be met and the founder's explicit
  sign-off to proceed past ADR-006.
- Mapping to the product roadmap (spine §16): this plan is **Stage Zero (Sıfır)** — interviews,
  founder diary, concierge, clickable prototype. Its exit is *qualitative confirmation of the four
  critical assumptions*. **Stage One (Bir)** is the built mobile MVP (playbook Stages 08–13).
  **Stage Two (İki)** is adaptation/timing research.
- Two later validation phases deliberately sit **after** this gate because they need real built
  code or a research ethics approval: the **Closed MVP** (validates Stage One's 4-week
  acceptance/fit/safety thresholds) and the **Adaptation experiment** (Stage Two research). They are
  in §2 for completeness but are **not** part of the pre-code gate.
- If, at the gate, an assumption fails and cannot be repaired by the "if not met, change this"
  actions in §4, **do not proceed to build**. Revise the concept, re-test, or record a founder
  scope decision — do not let a coding agent start Stage 08.

> Version-sensitive / external items are flagged **[confirm at execution — research-first]**: exact
> validated-instrument text (e.g. the Turkish WHO-5 form), current crisis/cessation resource details
> (ALO 171, family-physician pathway), and any research-ethics-board requirement for the adaptation
> experiment must be confirmed against current official sources at execution time, never guessed.

---

## 1. Purpose & principle

**Purpose.** De-risk the core loop with humans *before* spending build effort, so koturutin builds
the right loop rather than the wrong loop well. This is the playbook rule (correctness before
breadth; smallest coherent MVP; validate-first — AGENTS.md §1, ADR-006).

**Principle — validate the loop with humans, not with an algorithm.** The product's engine is
rule-based and explainable (spine §7). In discovery we do not build even that: a *human* plays the
decision engine so we test whether the **loop concept** and the **right-moment idea** are meaningful
before any code exists (ADR-002's "structured data first, AI second" applies doubly here — in Stage
Zero there is no AI and no engine at all, only humans).

**The smallest first story to prove (spine §17).** Everything in this plan exists to prove that this
six-step story is meaningful to real people on **one single real transition**:

> **Tell → Understand → Confirm → Choose → Remind → Learn**, on
> *arriving home → balcony cigarette + coffee → "90-second family contact, then a conscious choice"*
> (spine §4, §17).

If these six steps are not meaningful to humans, we stop and rethink — we do not build a larger
system on top of a loop nobody wanted.

**Non-negotiables carried into research (spine §1).** No morality labels; no streak / "you failed"
language even spoken aloud; one active experiment at a time; right *moment* over notification
*volume* (≤2 proactive nudges/day); correlation shown as correlation, never causation/diagnosis;
safety & privacy always free and always visible; nicotine dependence never treated as "just a
morning routine".

**Audience for this plan.** A solo founder plus a few testers. Every phase is scoped to be runnable
by one person with spreadsheets, a messaging channel, a clickable prototype and printed safety
scripts — no engineering team, no backend.

---

## 2. The ~10-week validation phases (spine §14)

All six phases from spine §14, in order. Weeks are indicative for a solo founder; phases may overlap.
**Phases 1–4 form the pre-code gate (Stage Zero).** Phases 5–6 are shown for completeness and run
after the gate (they need built code / ethics approval).

| # | Phase | Goal | Participants | Duration (indicative) | Output |
|---|---|---|---|---|---|
| 1 | **Problem interviews** | Understand automatic moments, their functions, value conflicts, and notification acceptance | 10–15 adults | ~Weeks 1–2 | Language & tone findings; target segment; **critical-transition list** |
| 2 | **Founder diary test** | Run the real logging load and the experiment logic on the founder's own routine to feel the daily protocol | Founder + 2 close testers | ~Weeks 1–4 (parallel; ≥14 days of self-logging) | First **day map** (gün haritası) + a workable **daily protocol** |
| 3 | **Concierge pilot** | Test right-*moment* fit and suggestion fit with **a human playing the decision engine — no algorithm** | 10–15 people | **14 days** (~Weeks 3–6) | Which suggestion was accepted, and **why** (per attempt) |
| 4 | **Clickable prototype** | Test comprehension and trust of the **8 core screens (S-01…S-08)** and the microcopy | 5–8 people | ~Weeks 6–8 (30–45 min each) | Flow fixes + microcopy fixes (both languages) |
| — | **← PRE-CODE GATE (§9). Confirm the four critical assumptions here. Only then → Stage 08.** | | | | |
| 5 | **Closed MVP** *(post-gate)* | Measure 4-week repetition, real load, and proximal outcomes on the built MVP | 30–50 people | 4 weeks (overlaps early **implementation** — playbook Stages 08–13) | Usage & safety signals; Stage One exit evidence |
| 6 | **Adaptation experiment** *(Stage Two)* | Learn which decision rule works best when | Ethics-approved sample **[confirm at execution — research-first]** | Stage Two | Micro-randomized research design & findings |

**Notes.**
- **Phase 5 (Closed MVP) overlaps early implementation and is conditional.** It requires a real
  built MVP, so it cannot precede Stage 08. It is **optional-if-earlier-phases-fail**: if Phases 1–4
  do not confirm the four assumptions, there is no Closed MVP because there is no green-lit build.
  It validates Stage One's exit thresholds (spine §16), not the pre-code gate.
- **Phase 6 (Adaptation experiment)** is Stage Two research (spine §16); it needs research-ethics
  approval and a proper micro-randomized design and is out of scope for the MVP gate.
- Phases 1 and 2 run in parallel: the founder can self-log (Phase 2) while recruiting/running
  interviews (Phase 1). Concierge (Phase 3) recruits from interview participants who consented.

---

## 3. The four critical assumptions — how to test, what confirms (spine §14)

These four must hold. Each maps to phases and to a threshold in §4. "Confirms" is a qualitative bar.

### A1 — The map can be built without heavy load
- **Claim (spine §14):** the user finds **≥1 repeating chain correct within 3 days** and understands
  the language.
- **How to test:** Phase 2 founder diary (does 3 days of light logging surface a real chain without
  feeling burdensome?) + Phase 1 interviews (do people recognize their own automatic chains in our
  words?) + Phase 4 prototype task on the **Day map (S-04)** — can the user read `hypothesis` vs
  `confirmed`, correct a wrong assumption in one tap, and pick a priority moment?
- **What confirms it:** In interviews/prototype, ≥7 of 10 people point to a priority chain and say
  "yes, that's me," using the app's own language, after no more than ~3 short check-ins; logging load
  is described as light, not a chore.

### A2 — The transition moment can be captured well enough
- **Claim (spine §14):** a **simple clock + user choice** lands the notice in a meaningful window
  (no sensors, no location by default — spine §13 non-goals).
- **How to test:** Phase 3 concierge — the founder, using only the participant's stated transition
  window and a clock, sends a neutral nudge; the participant reports whether it arrived at a moment
  that actually mattered. Respect ≤2 nudges/day, quiet windows, and "not now" learning (spine §7).
- **What confirms it:** Median "the reminder came at a useful moment" rating **≥4/5** across the
  concierge participants, achieved with a plain clock + the user's own window — no passive tracking.

### A3 — The alternative serves the function
- **Claim (spine §14):** the user sees the offered micro-experiment as **a real option, not a moral
  lecture** — it serves the same *function* at lower cost (spine §1.2, §8).
- **How to test:** Phase 3 concierge (was the suggested alternative accepted, and *why/why not?*) +
  Phase 4 prototype task on **Choose experiment (S-05)** — do the 2–3 function-fit options feel like
  genuine alternatives that respect the behavior's benefit, not judgment?
- **What confirms it:** In the concierge, **≥half** of participants actually try **≥3
  micro-experiments** in the first week; in the prototype, people describe the options as "a fair
  swap that still gives me what I wanted," not as being told a behavior is "bad."

### A4 — The insight feels right
- **Claim (spine §14):** the weekly summary says something **new but believable**, and a **wrong
  inference is easily corrected** (correlation language only — spine §1.7, §3.7).
- **How to test:** Phase 3 concierge weekly review + Phase 4 prototype task on **Week review (S-08)**
  — read a correlation-language insight with sample data; is it fresh, believable, and can the user
  tap "this is wrong" to correct it?
- **What confirms it:** **≥2 of 3** participants find the weekly summary correct and useful; nobody
  reads it as causation/diagnosis; every wrong inference is correctable in one tap and that path is
  obvious.

---

## 4. Starting decision thresholds (spine §14)

Working numbers, **not benchmarks** — they are a decision aid for a solo founder. If a threshold is
not met, apply the "if not met, change this" action and re-test the affected phase before the gate.

| Signal | Threshold (spine §14) | Measured in | Maps to | If not met — change this |
|---|---|---|---|---|
| **Map accuracy** | ≥ **7/10** interviewees find the priority chain correct | Phase 1 interviews + Phase 4 (S-04) | A1 | Rewrite map language / simplify the "tell your day" (S-02) prompts; re-run a few interviews |
| **First-week action** | ≥ **half** of the pilot do **≥3** micro-experiments | Phase 3 concierge | A3 | Re-pick the priority moment; offer easier, shorter options from the library (spine §8); check the option really serves the function |
| **Notification fit** | median **≥ 4/5** | Phase 3 concierge | A2 | Adjust the transition window with the user; lower nudge volume; improve "not now" learning; re-test timing |
| **Perceived load** | median **≤ 2/5** | Phase 2 diary + Phase 3 concierge | A1 | Shorten check-ins (10–20s), reduce frequency, cut fields; make more of the loop optional |
| **Weekly insight** | ≥ **2/3** find the summary correct & useful | Phase 3 review + Phase 4 (S-08) | A4 | Rewrite summaries in plainer correlation language; make the "this is wrong" correction more prominent |
| **Safety** | **zero** serious privacy / inappropriate clinical-referral incidents | All phases | §7 ethics | **STOP the release** (spine §14). Fix the safety flow/copy and re-review before any further testing; a serious incident is a hard stop, not a threshold to average away |

---

## 5. Concierge pilot protocol (human-in-the-loop, NO algorithm)

**Why.** To prove A2 and A3 (right moment + real alternative) and to feed A1/A4 — **before** writing
the rule engine. A human (the founder) *is* the decision engine for 10–15 people over 14 days. There
is no app, no algorithm, no automated scheduling — only a person, a clock, a messaging channel and
paper/spreadsheet logs. If the loop needs an algorithm to feel meaningful, we have not proven it yet.

**Setup (per participant, ~20–30 min onboarding — simulates S-02 → S-04 → S-05 by hand):**
1. Consent (see §7). Set language (`tr`/`en`), quiet windows, and the notification budget (≤2/day).
   Record smoking stance (`quitting`/`reducing`/`noticing`/`not_ready`) — do **not** treat nicotine
   as "just a routine" (spine §1.10).
2. **Tell your day (S-02):** a short conversation; the founder writes down transitions and repeating
   chains — not clock times, but *moments* (spine §3.1).
3. **Confirm the map (S-04):** the founder reflects back the assumed chains and *functions*
   ("Did I understand you right?"); the participant corrects them and **picks one priority moment**.
   Start with the spine §17 story where it fits (arriving home → balcony cigarette+coffee).
4. **Choose one experiment (S-05):** offer **2–3** options from the reviewed library families
   (spine §8) that serve the **same function** at lower cost; the participant picks **one**
   (one active experiment at a time — spine §1.4). Write a plain if-this-then-that plan.
   - Run the **relationship-safety gate** before any *connection* experiment (spine §10); if the
     context is violence/control/conflict, offer an alternative support path instead.
   - For a smoking-related moment, attach the visible cessation entry (ALO 171 / family physician);
     give **no** individual medical/withdrawal/medication advice.

**Daily operation (14 days — the founder plays the rule engine by hand):**
- At the participant's chosen transition window, the founder sends a **lock-screen-safe neutral
  message** on the agreed channel — e.g. *"A transition moment is coming up" / "Bir geçiş anı
  yaklaşıyor"* (spine §11). **Never** put sensitive content ("smoke a cigarette", "talk to your
  partner") in the message itself.
- The participant replies with the **transition-card (S-06)** response: **did / not now / didn't fit
  me** (map to `did` / `not_now` / `declined`; a non-response is `offered`).
- Honor the rules manually: **≤2 proactive nudges/day**, respect **quiet windows**, and **learn
  "not now"** — reduce or reschedule when a participant defers (spine §7).
- After a "did", capture the **immediate outcome (S-07)**: craving 0–10, energy, mood, connection,
  plus an optional short note (sensitive — consented, minimized).

**What is logged (paper/spreadsheet, pseudonymized — mirrors the entity model, spine §5):**

| Log record | Fields (mirrors entity) | Notes |
|---|---|---|
| Onboarding map | moment (name, window, context, `hypothesis`/`confirmed`, priority); routine edge (trigger, behavior, function/benefit, delayed cost) | `moments`, `routine_edges` |
| Chosen experiment | function label, duration band, if-then plan, safety class | `experiments` (exactly one active) |
| Each offer | `offered_at`, transition, response (`offered`/`did`/`not_now`/`declined`), reason | `attempts` |
| Each outcome | craving 0–10, energy, mood, connection, optional note | `outcomes` (sensitive) |
| Weekly review | insight text (correlation language), user confirmed? corrected? | `insights` |
| Any safety event | which pathway (smoking / crisis / relationship-safety), timestamp, resolution — minimal PII | `safety_events` |

**Weekly review (day 7 & day 14 — simulates S-08):** the founder presents the pattern in
**correlation language only** ("you chose your alternative in three of five similar moments" — spine
§11), never causation/diagnosis; the participant confirms or corrects; together they pick the next
small change.

**Read-outs:** notification-fit rating (→ A2 threshold), count of participants doing ≥3 experiments
in week 1 (→ A3 threshold), perceived-load rating (→ A1/load threshold), weekly-insight usefulness
(→ A4 threshold), and North-Star tally: **weekly successful conscious transitions** counted by hand
(spine §15).

---

## 6. Clickable prototype test script (8 screens, comprehension + trust)

**Format.** A non-functional clickable prototype (e.g. Figma or paper — no backend, no real data;
use realistic *fake* sample data). Moderated 1:1 sessions, ~30–45 min, **5–8 people**, in the
participant's language (TR or EN). Record only with consent; capture no real personal routine data
in this phase. Goal: fix **flow** and **microcopy** (spine §14 output), and test the trust language.

**Task list — walk the 8 primary loop screens (S-01…S-08, spine §6):**

| # | Screen | Task given to the user | Comprehension probe | Trust probe |
|---|---|---|---|---|
| 1 | **S-01 Intent (Niyet)** | "Set what you'd like to change and why." | In your own words, what is this asking? | Does it feel like *you* choose, or like it's telling you what's wrong? |
| 2 | **S-02 Tell-your-day (Günü anlat)** | "Describe a typical day (cards or voice)." | What is it trying to learn about your day? | Does anything here feel like surveillance or judgment? |
| 3 | **S-03 Observation check-in (Kısa gözlem)** | "Do a 10–20s check-in." | What is a check-in for? Is it a test/score? | Does it feel like a chore or a streak? (It must not.) |
| 4 | **S-04 Day map (Gün haritası)** | "Read the map; fix one thing that's wrong; pick the moment that matters most." | Can you tell a *guess* (`hypothesis`) from a *confirmed* item? | Was it easy to say "this is wrong"? Do you trust the map more after correcting it? |
| 5 | **S-05 Choose experiment (Deney seç)** | "Pick one of the 2–3 options for that moment." | Do the options serve the same need as your current behavior? | Do these feel like *real alternatives* or a *moral lecture*? (→ A3) |
| 6 | **S-06 Transition card (Geçiş kartı)** | "A reminder arrives — respond (do now / remind later / not suitable)." | What does each choice do? | Is the lock-screen notice neutral (no sensitive words)? Do 'remind later'/'not suitable' feel respected, not punished? |
| 7 | **S-07 Immediate outcome (Hemen sonrası)** | "Log how you feel right after (craving/energy/mood/connection)." | What is this capturing, and why one tap? | Does logging an "it didn't happen" feel safe, not like failure? |
| 8 | **S-08 Week review (Hafta)** | "Read your week; decide the next small change." | Say the main insight back in your own words. | Is it **new but believable**? Does it sound like *correlation* (not "X causes Y")? Can you correct a wrong insight in one tap? (→ A4) |

**Also surface, without a dedicated task:** the persistent **Safety & support (S-10)** affordance and
the privacy/consent framing — ask "if something felt urgent or unsafe, where would you go?" and
"what do you think leaves your phone?" (spine §10 lock-screen privacy + local-first).

**Per-screen scoring (qualitative):** comprehension pass/fail + verbatim confusions; trust
red/yellow/green + verbatim quotes on judgment/lecture/streak/causation language. Log every microcopy
fix per language (TR and EN are not word-for-word copies — spine §11, ADR-008).

**Feeds:** A1 (map language, S-04), A3 (real option, S-05), A4 (insight, S-08), plus notification
neutrality/trust (S-06).

---

## 7. Ethics & safety during research

Safety and privacy are **always free and always visible** in the product (spine §1.8, §10) — the same
holds in research. Even a test handles special-category data.

**Informed consent (every phase).**
- Plain-language consent before any session, in the participant's language. State: this is
  **research**, **not therapy/treatment/diagnosis** (spine §10 product-claim limits); what will be
  recorded; how long it is kept; and the right to withdraw or delete their data at any time with no
  reason.
- Separate the consents by purpose (spine §9, §10): participation; audio/notes recording;
  free-text notes. In research, **no participant free text is sent to any third-party model** — the
  product's three model-use consents default OFF, and Stage Zero uses no model at all.

**Sensitive-data handling even in tests (KVKK special-category / GDPR Art. 9 — spine §10).**
- **Minimize:** collect only what a phase needs; the clickable prototype (Phase 4) captures **no**
  real routine data (fake sample data only).
- **Pseudonymize:** participant codes, never names, in logs; keep the code↔identity key separate and
  access-controlled.
- **Protect:** store logs on an encrypted device / access-controlled sheet; the founder is the data
  controller and keeps a simple record of what is collected and why.
- **Retain briefly, then delete:** a defined short retention window; delete on request and at study
  end; no indefinite raw-log hoarding (spine §10 retention).

**Crisis & smoking safety available at all times.**
- Every interview/concierge channel and prototype session has the **rule-based, human-reviewed,
  tested** crisis script ready (spine §10, ADR-005). On explicit self-harm / acute-risk phrasing:
  **STOP** the normal research flow and route to local emergency + professional resources
  (Turkey: **ALO 171**, family physician) **[confirm resource details at execution — research-first]**.
  Crisis routing is never left to a person's improvisation or to a generative model.
- Smoking / dependence: keep cessation support (ALO 171 / family physician / professional referral)
  free and visible; separate `quitting`/`reducing`/`noticing`/`not_ready`; on a lapse, treat it as
  learning (re-assess trigger strength & readiness) — **never** a reset streak, **never** individual
  medical/withdrawal/medication advice (spine §1.10, §10).

**Relationship-safety gate.** The *connection* experiment is **not** assumed safe. Before offering it
(concierge Phase 3) screen for a violence/control/conflict context; if present, offer an alternative
support path instead of the connection step (spine §10, F-012).

**No medical advice / no morality labels.** The researcher does not diagnose, treat, or advise on
medication. No behavior (coffee, podcasts, solitude, a cigarette) is labeled "bad" (spine §1.2). No
"streak/you failed" language, spoken or written (spine §1.3). If the optional **WHO-5** is used as an
outcome measure, present it as optional and explicitly **non-diagnostic**, using the validated
Turkish form **[confirm exact instrument text at execution — research-first]** (spine §10).

**Incident rule.** A **serious privacy incident** or an **inappropriate clinical referral** is a
**hard stop** (spine §14 safety threshold): halt testing, fix the flow/copy, re-review with the
safety scripts before resuming. This overrides all other thresholds.

---

## 8. Success-metrics mapping & North Star (spine §15)

The North Star governs the whole plan; discovery observes each metric layer **qualitatively** (no
production analytics yet). Retention/opt-out are **load/trust signals, not success** (spine §15,
ADR-007).

| Metric layer (spine §15) | What it means | How it appears in validation |
|---|---|---|
| **North Star** | **Weekly successful conscious transitions** (a real-life choice) — not time-in-app, not streaks | Concierge (Phase 3): counted by hand per participant per week; the primary read-out |
| **Activation** | Map confirmed + first experiment planned | Concierge onboarding (S-04→S-05); prototype comprehension of S-04/S-05 |
| **Proximal outcome** | Immediate change in craving/energy/connection | Concierge outcome logs (S-07 by hand) |
| **Mid-term (2 & 4 wk)** | Self-efficacy + priority-routine frequency | Partly in the 14-day concierge; fully only in the Closed MVP (Phase 5, post-gate) |
| **Wellbeing** | Optional bi-weekly WHO-5 + user-defined quality of life (never a diagnostic) | Optional in concierge; validated TR form **[confirm at execution]** |
| **Safety** | Wrong-insight, sensitive-notification, unwanted-suggestion, support-referral incidents | Tracked across all phases → §4 safety threshold / §7 incident rule |
| **Product health** | 2- & 4-week retention, notification opt-out, data deletion | **Load/trust signals only**, not success; mainly in the Closed MVP |

---

## 9. Exit criteria into Stage One build

The pre-code gate is cleared — and playbook **Stage 08 (Foundation)** may begin — only when **all** of
the following hold. Until then, `docs/PROJECT_STATUS.md` keeps the gate **HELD** and no coding agent
writes application code (ADR-006, AGENTS.md §2 stop conditions).

**Gate checklist:**
- [ ] **A1 confirmed** — the map builds with light load; ≥7/10 find the priority chain correct and
      understand the language (§3, §4).
- [ ] **A2 confirmed** — a plain clock + user's chosen window lands the notice in a meaningful moment;
      notification-fit median ≥4/5 (§3, §4).
- [ ] **A3 confirmed** — the alternative reads as a real option, not a lecture; ≥half of the concierge
      pilot did ≥3 micro-experiments in week 1 (§3, §4).
- [ ] **A4 confirmed** — the weekly insight is new-but-believable and a wrong inference is corrected in
      one tap; ≥2/3 find it correct & useful (§3, §4).
- [ ] **Thresholds** in §4 are met, **or** the "if not met, change this" action was applied and the
      affected phase re-tested.
- [ ] **Safety = zero** serious privacy / inappropriate clinical-referral incidents (§4, §7). Any such
      incident is a hard stop until resolved.
- [ ] **Stage Zero deliverables in hand** (spine §14 outputs): language/tone + segment + the
      **critical-transition list** (Phase 1); the **first map + daily protocol** (Phase 2); **which
      suggestion was accepted and why** (Phase 3); **flow & microcopy fixes**, both languages
      (Phase 4).
- [ ] **Founder sign-off** to proceed past the ADR-006 gate is recorded; `docs/PROJECT_STATUS.md` is
      updated (gate released; next eligible action = Stage 08).

**What happens after the gate:**
- Enter playbook **Stage 08 (Foundation)** and continue the lifecycle (spine §16 **Stage One / Bir**:
  mobile MVP, structured day map, rule-based decisions, 30–50 experiments, TR+EN). Confirm exact stack
  versions research-first at build time (spine §19; ADR-003).
- The **Closed MVP** (Phase 5) then runs on the real build to validate **Stage One's** exit
  thresholds (4-week acceptance/fit/safety — spine §16). It is conditional: it exists only because the
  pre-code gate passed.
- The **Adaptation experiment** (Phase 6) is **Stage Two (İki)** research under proper ethics approval
  and a micro-randomized design **[confirm at execution — research-first]**; it is out of scope for
  this gate.

**If the gate fails:** do not build. Apply §4 remedies and re-test, revise the concept, or record a
founder scope decision (the only way past ADR-006 is meeting the exit criteria or an explicit,
logged founder decision to accept the risk — a scope change, not an agent default).
