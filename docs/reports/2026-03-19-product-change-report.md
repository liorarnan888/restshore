# RestShore Product Change Report

Date: 2026-03-19

## Executive Summary

RestShore has moved from an early functional prototype into a much more coherent CBT-I product system.

The product now has:
- a richer intake and report flow
- a 6-week program structure instead of a short 14-day plan
- a dedicated Google Calendar experience with guided sleep events
- nightly sleep logging tied to exact nights
- light diary-driven future adjustments
- a much more consistent product language based on the new research stack

Just as importantly, the product now speaks more clearly.
The language is less generic, less repetitive, and more grounded in CBT-I, user trust, and doctor-ready framing.

## What Changed

### 1. Product Structure

The core experience now follows a much stronger arc:

1. A user completes a richer intake.
2. The system generates a 6-week CBT-I program.
3. The user receives a doctor-ready report and email.
4. The user can add a dedicated RestShore calendar.
5. The user logs nights through short morning sleep logs.
6. The product can make limited future-facing micro-adjustments when repeated patterns appear.

This is a much stronger behavioral loop than the original intake-to-report prototype.

### 2. Calendar Became A Real Program Surface

The calendar is no longer just a delivery format for reminders.
It is now one of the main treatment surfaces in the product.

Key upgrades:
- a dedicated RestShore calendar
- clearer event families such as wake anchor, protected sleep window, in-bed practice, and morning sleep log
- stronger event descriptions with practical guidance
- sleep events that can reflect what actually happened after the user logs the night
- future-facing micro-adjustments that affect upcoming guidance only

This means the calendar now acts more like a structured behavioral program and less like a pile of reminders.

### 3. Daily Logging Became Part Of The Core Loop

Daily check-ins evolved into a more precise morning sleep log model.

The product now supports:
- one log per exact night
- backfilling older nights through the correct linked log
- blocking future-night submission
- updating the past sleep event with:
  - a new title
  - a logged outcome block in the description
  - actual start and end times

This makes the calendar function as both a plan and a sleep diary without duplicating events.

### 4. Adaptation Logic Became Safer And Easier To Reason About

The adaptation engine was narrowed deliberately.

Current rule:
- one bad night must not change the future plan
- only repeated patterns can trigger future changes
- the current micro-adjustment threshold is based on repeated signals in recent nights

Current future-changing rule families:
- late-start
- sleep-onset
- fragmentation
- early-wake
- fatigue

This keeps the product more stable, more clinically plausible, and easier to QA.

### 5. A Real Internal Testing Surface Was Added

The project now includes a Test Center and an Adaptation Lab that make the logic much easier to inspect and discuss.

This gives the team:
- human-readable scenario previews
- clear simulated nightly logs
- visible rule traces
- before/after comparisons for future event changes
- a growing foundation for future backend review tooling

That is a major step toward making a complicated adaptive system testable by humans, not only by code.

## Language And Microcopy Shift

One of the most important changes in this phase was not just functionality, but language discipline.

The product language was brought into alignment with the new research documents in:
- `docs/research/product-content/01-cbti-deep-dive.md`
- `docs/research/product-content/02-user-pain-points.md`
- `docs/research/product-content/03-competitor-landscape.md`
- `docs/research/product-content/04-ux-ui-inspiration.md`
- `docs/research/product-content/05-voice-seo-guidelines.md`
- `docs/research/product-content/06-content-policy-and-governance.md`

### Old Patterns We Moved Away From

- generic "sleep hygiene" phrasing
- "hosted report" and other internal-sounding product terms
- repetitive explanatory copy
- overly meta wording about what the system is doing
- vague "coaching" language when the product is actually giving structured calendar guidance
- copy that explained obvious things to users who were already inside the flow

### New Language System

The preferred vocabulary is now:
- `CBT-I program`
- `doctor-ready report`
- `calendar guidance`
- `wake anchor`
- `protected sleep window`
- `in-bed practice`
- `morning sleep log`
- `calendar sync`

The tone is now intended to be:
- calm
- clinically grounded
- specific
- non-shaming
- premium but not precious

## User-Facing Surfaces Improved

### Intake

The intake now feels more like a guided treatment intake and less like a wellness form.
Question framing and helper text were tightened to reduce fluff and make the flow feel more professional.

### Report

The report now frames itself more clearly as a CBT-I program with clinician handoff value.
The report language is more credible, more specific, and less like generic sleep advice.

### Google Calendar Handoff

The Google connection surface is clearer about what the app does and does not control.
It now feels more like a product action and less like a vague technical integration.

### Morning Sleep Log

The sleep log now gets to the point faster, avoids repeating context the user already knows, and behaves more like a fast daily tool than a mini onboarding flow.

### Test Center

The internal testing surface now speaks in human language, which makes it much more useful for product review and logic discussions.

## Why These Changes Matter

This round of work improves the product on three levels at once:

- Clinical clarity:
  the system is much closer to a real CBT-I-informed product and less like a sleep tips app.

- User trust:
  the language is more grounded, less noisy, and more respectful of user attention.

- Product scalability:
  the combination of research docs, testing tools, and tighter terminology makes future work easier to design and review.

## Current State

The current baseline now supports:
- a richer intake
- a 6-week plan
- a doctor-ready report
- Google calendar creation
- sleep event logging tied to exact nights
- past sleep-event updates based on reported reality
- micro-adjustments to future guidance
- internal adaptation previews
- content and voice guidance documents for future work

Verification baseline:
- `npm run lint`
- `npm run test`
- `npm run build`

## High-Value Next Steps

The most important open opportunities now are:

1. Make calendar creation feel more premium while it is running, especially between progress jumps.
2. Increase personalization depth in event descriptions and calendar content based on intake and diary patterns.
3. Improve the educational framing of CBT-I in reports, emails, and future public pages.
4. Build the clinician-facing escalation summary page.
5. Continue preparing the marketing and dashboard language using the new research system.

## Bottom Line

RestShore is no longer just a promising prototype.
It now has the beginnings of a coherent treatment model, a real behavioral loop, an internal testing system, and a more disciplined voice.

That combination is what makes the next stage of product work much safer:
we are no longer adding features into a vague product.
We are extending an increasingly clear system.
