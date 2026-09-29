# koturutin

## One-line promise
A bilingual (Turkish + English) contextual routine lab that makes your automatic daily chains visible, offers ONE small experiment at the right transition moment, and learns with you what actually works — so you make more conscious choices *in real life* and, over time, need the app less.

## Problem
Much of a day runs on autopilot: the wake-up coffee-and-cigarette, headphones the instant you leave the house, the balcony ritual on arriving home, the after-meal cigarette. These chains fire from **context**, not intention — so willpower and reminders miss the moment where the choice is actually made. Existing tools make it worse in two opposite ways: habit-trackers count streaks and moralize ("you failed again," reset to zero), while free-form AI chat drifts into unbounded, unsafe therapy. Neither makes the invisible transition visible, nor offers a fitting alternative at the exact second the automatic choice happens.

## Primary user
Turkish- and English-speaking adults who notice one or more daily behaviors running on autopilot — a first cigarette on waking, automatic content consumption, an after-meal cigarette, a numbing arrival-home ritual — and want to make more conscious choices in real life. They are looking for **wellbeing and behavior-awareness support**, not therapy, treatment, diagnosis, a habit-streak tracker, or a free-form AI therapist. The product never labels a behavior (coffee, podcasts, solitude, a cigarette) as "bad"; the user decides which behavior costs them.

## Product concept
koturutin builds a **user-verified contextual routine graph** (the "day map": trigger → behavior → immediate benefit/function → delayed cost → confidence). Using a **rule-based, explainable** decision engine, it offers a single small behavior experiment (30 seconds–10 minutes; most 30s–5m) that serves the *same function* at lower cost, at the right transition moment. Structured data comes first; AI is a **bounded assistant** — parsing a spoken day-story into candidate nodes, summarizing a week in non-judgmental language, and ranking 2–3 options from a clinically and culturally reviewed library — never the memory, the therapist, or the crisis decision-maker. Only one experiment is active at a time. Safety and privacy are always-free and always-visible, never behind a paywall.

## Core loop
The engine is a 4-part loop:

**day map (gün haritası) → right moment (doğru an) → micro-experiment (mikro-deney) → learning (öğrenme).**

This plays out through the 7-step learning loop (which *is* the product):

1. **Tell your day** — narrate a typical day (voice or short cards); the system looks for transitions and repeating chains, not clock times.
2. **Observe 3 days** — 10–20 second check-ins capture behavior, craving, energy, context; no prescription on day 1.
3. **Confirm the map** — "Did I understand you right?"; the user corrects functions and picks the priority moment.
4. **Choose one micro-experiment** — pick 1 of 2–3 options that serve the same need at lower cost.
5. **Remind at the right moment** — a short, non-sensitive lock-screen notice as the chosen transition approaches; detail appears only after opening the app.
6. **Learn the outcome** — "did it / not now / didn't fit me" + one-tap before/after state.
7. **Interpret the week together** — which moments were easier/harder (as correlation), and the next small change; the user confirms or corrects.

## MVP
- **Day narration** (optional voice input or cards) + user correction.
- **Three-day observation** — very short logs (context, behavior, craving, energy).
- **Day map** — trigger, behavior, benefit (function label), cost, confidence; hypothesis vs. confirmed status.
- **Single active experiment** — 2–3 safe options by function + an if-this-then-that plan; only one active at a time.
- **Rule-based notifications** — chosen transition, quiet windows, ≤2 proactive notifications/day budget, "not now" learning.
- **Weekly learning** — correlation language, user confirmation, next experiment.
- **Safety pathways** — smoking support (ALO 171 / family physician), crisis routing, relationship-safety alternative, lock-screen privacy.
- **Turkish + English** — expert-reviewed natural copy in both (not word-for-word translation).
- **Optional WHO-5 wellbeing check** — opt-in, non-diagnostic bi-weekly measure, reached from Settings (never a diagnostic tool).
- **Always-free by design** — one day map, one active experiment, weekly summary, data export/deletion, AI-memory deletion, privacy settings, account deletion, and all safety resources.

## Explicitly not in MVP
- Continuous location tracking & passive sensor monitoring.
- Free-form AI therapist & diagnosis.
- Community feed, couples accounts, social competition.
- Wearable integration.
- Many simultaneous goals & complex badge systems.
- Medication / nicotine-product / personal health advice.
- **Forbidden mechanics** (contradict the product's purpose): infinite streaks, loss-aversion, and other addictive engagement loops.
- Paid features are deferred and price-tested later (multiple maps, advanced patterns, **rich/advanced voice narration & output** (beyond the basic voice input in MVP), rich experiment library, export).

## Differentiation
- **vs. Liven-style "AI wellbeing / self-help chat":** koturutin is not free-form AI therapy. AI is bounded to parsing, summarizing, phrasing, and ranking a *reviewed* library; the crisis pathway is rule-based and human-reviewed, never left to a generative model. The product's memory is a structured, user-corrected routine graph, not a chat transcript.
- **vs. habit-trackers (streaks, counters, moral scores):** no streaks and no "you failed again." A lapse (*kayma*) is learning data, never a reset-to-zero, and no behavior is labeled "bad."
- **The combination that is hard to copy:** a user-verified **contextual routine graph** + **one micro-experiment delivered at the right moment** (function-matched, lower-cost) + **explainable learning** with one-tap "this is wrong" correction. It optimizes for conscious choices in real life, not time-in-app.

## Primary success metric
- **Weekly number of successful conscious transitions** (a real-life conscious choice at a targeted moment) — the North Star. NOT time-in-app, NOT streaks.
- Activation gate on the way to it: **map confirmed + first experiment planned.**

## Secondary metrics
- **Proximal outcome:** immediate change in craving / energy / connection reported after an attempt.
- **Mid-term (2 & 4 weeks):** self-efficacy + priority-routine frequency.
- **Wellbeing:** optional bi-weekly WHO-5 + user-defined quality of life — an optional outcome measure, never a diagnostic tool.
- **Safety:** wrong-insight, sensitive-notification, unwanted-suggestion, and support-referral incidents.
- **Product health (tracked as load/trust signals, NOT counted as success alone):** 2- & 4-week retention, notification opt-out rate, data deletion.

## Known constraints
- **Stack:** Expo + React Native (TypeScript strict, Expo Router) client; Supabase (Postgres + Auth + Row Level Security + Storage + Edge Functions) backend, with grants + RLS explicit on every client-exposed object and `service_role` server-side only. Exact package/SDK versions must be confirmed against current official docs at build time (research-first), not guessed here.
- **Bilingual (TR + EN)** is a cross-cutting content system keyed by language-neutral intent keys — not translation-only; safety copy is legal- and clinically-reviewed in both languages.
- **Rule-based, explainable v1** — no ML for the MVP; every insight shows its evidence and offers a one-tap "this is wrong" correction; correlation is shown as correlation, never causation or diagnosis.
- **KVKK / GDPR sensitive data:** mood, smoking, sleep, health status, and free journal text are special-category (KVKK stricter; GDPR Art. 9). MVP rules: data minimization (no location/microphone/contacts by default; per-feature permission only), local-first for raw sensitive logs where possible, encrypted cloud-synced fields, third-party-model use for free text is opt-out-by-default (OFF), user-defined retention windows, and full delete/export.
- **Notification & privacy limits:** ≤2 proactive notifications/day, protected quiet windows, and lock-screen previews that never reveal sensitive content.
- **No clinical claim:** v1 makes no therapy / treatment / diagnosis / addiction-cure claim. If intended use drifts toward a medical purpose, EU medical-device-software qualification is a legal / stop decision, not something the agent derives.

## Key assumptions and risks
Four critical assumptions that must hold (validated before code):

1. **The map can be built without heavy load** — a user finds ≥1 repeating chain correct within 3 days and understands the language.
2. **The transition moment can be captured well enough** — a simple clock + user choice lands the notice in a meaningful window.
3. **The alternative serves the function** — the user sees it as a real option, not a moral lecture.
4. **The insight feels right** — the weekly summary says something new but believable, and a wrong inference is easily corrected.

Key risks: notification fatigue undermining trust; mishandling of sensitive KVKK/GDPR data; failure of a safety pathway (crisis, smoking dependence, relationship-safety); users reading correlation as causation; and treating nicotine dependence like an ordinary routine (professional cessation support, e.g. ALO 171, stays free and visible).

## Current status
Planning complete (Stages 02-07 drafted); pre-code validation (see `docs/VALIDATION_PLAN.md`) is a hard gate before implementation Stage 08.
