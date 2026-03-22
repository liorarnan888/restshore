# Phase 3: Structural Adaptation Based On Check-Ins

Research date: 2026-03-19

## Purpose

Phase 3 is the point where RestShore changes the future sleep plan in a meaningful way.
It should not react to a single bad night. It should react to repeated patterns in the diary.

The goal is to make the plan feel:
- evidence-based
- calm
- predictable
- personal
- easy to continue from

This phase is intentionally more conservative than Phase 2.

## What Phase 3 changes

Phase 3 can change:
- the sleep window length
- the bedtime target
- the language and emphasis of future coaching notes
- the labels and descriptions of future calendar events
- the next weekly summary and clinician-facing summary

Phase 3 does not usually change:
- the past
- the already-logged sleep events
- the wake anchor in normal circumstances
- the overall 6-week program structure

The wake anchor should remain stable unless the user's life schedule has materially changed and the change is confirmed manually.

## Why this phase exists

RestShore needs a deeper layer than nightly micro-adjustments.
If the same pattern repeats across several nights, the future plan should become stricter, looser, or clearer in a controlled way.

This is how the product stays clinically credible:
- it does not overreact
- it does not ignore repeated evidence
- it does not make changes that the user cannot understand

## Structural review cadence

Structural review happens on a weekly cadence.

Recommended rule:
- run a structural review after each block of 7 nights
- only allow a structural change when there are at least 5 completed diary entries in the last 7 nights
- if fewer than 5 nights are logged, do not change the structure yet

This keeps the system close to the diary-driven CBT-I model and avoids decisions from sparse data.

## What counts as enough evidence

Use a 7-night rolling window.

A structural change is eligible only when:
- at least 5 nights are logged
- the same pattern appears on at least 3 logged nights in the rolling 7-night window
- the user has not flagged an obvious one-off explanation such as travel, acute illness, shift change, or medication change

If the pattern is present on only 1 night, it should remain a micro-adjustment only.
If the pattern is present on 2 nights, it should usually still remain a micro-adjustment only.

## Change categories

### 1. No structural change
Use when:
- data is too sparse
- patterns are mixed
- the user has not yet completed enough diary entries
- a one-off event explains the problem

### 2. Micro-adjustment only
Use when:
- one bad night happened
- there is a small coaching opportunity
- the product should change the tone or the bedtime guidance, but not the actual sleep window

This is the default after Phase 1.

### 3. Structural sleep-window adjustment
Use when:
- the same pattern repeats across the rolling 7-night window
- there are at least 5 logs
- the current window looks too wide or too narrow

Recommended adjustment size:
- 15 minutes per review
- at most one structural adjustment per week

### 4. Hold for complex or low-confidence weeks
Use when:
- the pattern is clinically complex
- the diary looks inconsistent
- the user reports severe daytime sleepiness
- there are red flags or escalation signals
- travel, shift work, pregnancy, medication changes, or another major context shift makes the automatic rule unsafe

Current product simplification:
- these cases do not create a separate product bucket
- they simply resolve to `hold / no structural change`
- any future escalation or doctor recommendation should be handled by a separate feature

## Recommended structural rules

### A. Sleep efficiency high and stable
If the user has:
- at least 5 logged nights in the last 7
- sleep efficiency at or above 90 percent on most of those nights
- no major safety or daytime impairment concerns

Then:
- expand the sleep window by 15 minutes
- keep the wake anchor fixed
- keep the bedtime framing calm and encouraging

Why:
- the current window is probably slightly too tight
- a small increase can improve comfort without breaking CBT-I logic

### B. Sleep efficiency mid-range
If the user has:
- at least 5 logged nights
- sleep efficiency between 85 and 89 percent

Then:
- hold steady
- do not change the sleep window yet
- reinforce the current plan with supportive coaching

Why:
- this is the "good enough" zone where the treatment should usually stay in place
- changing too early would create noise

### C. Sleep efficiency low and persistent
If the user has:
- at least 5 logged nights
- sleep efficiency below 85 percent on at least 3 nights in the rolling window
- no obvious one-off explanation
- reasonable adherence to the current plan

Then:
- reduce the sleep window by 15 minutes
- keep the wake anchor fixed
- update the bedtime guidance and the bedtime description

Why:
- the window is probably still too generous for the current sleep pattern
- the user needs a clearer pressure signal, not more tips

### D. Persistent late start
If the user repeatedly gets into bed later than planned, but the wake anchor is stable:

Then:
- do not move the wake anchor just because bedtime drifted
- tighten wind-down guidance
- make the bedtime event more explicit
- if needed, shorten the sleep window slightly in the next review cycle

Why:
- in CBT-I, the wake anchor is usually the anchor
- bedtime drift is often a behavior problem, not a schedule problem

### E. Persistent early waking
If the user repeatedly wakes too early:

Then:
- do not immediately move wake time earlier or later
- first test whether sleep efficiency is already high
- if efficiency is low, treat this as a signal that the sleep window may need to be changed
- if efficiency is high, hold steady and reinforce the existing plan unless there is another reason to adjust

Why:
- early waking can mean different things depending on the rest of the pattern

### F. Fragmented sleep or multiple awakenings
If fragmentation repeats:

Then:
- keep the wake anchor stable
- strengthen overnight rescue guidance
- consider a narrower sleep window if low efficiency accompanies fragmentation

Why:
- the product should respond to the pattern, not just the symptom label

### G. Morning fatigue
If the user keeps waking exhausted:

Then:
- hold structural changes unless there is enough repeated evidence to justify one
- increase the clarity of morning guidance
- add stronger recovery coaching for the next day

Why:
- fatigue is important, but it should not automatically trigger a structural change by itself

## What changes in the product when Phase 3 triggers

When a structural change is approved:

### The new plan version starts
- create a new `PlanVersion`
- assign it an effective date
- use it for all future nights only
- preserve the old version as history

### Future calendar events update
- regenerate only future events
- keep past events untouched
- update titles and descriptions to match the new version
- keep the event family names consistent so the user recognizes the plan

### The user gets a change summary
The summary should explain:
- what changed
- why it changed
- when it starts
- what the user should do next

### The clinician summary gets updated too
If the user later escalates to a doctor, the clinician-facing summary should show:
- the previous plan version
- the new plan version
- what pattern caused the change
- the adherence context

## How to inform the user

Phase 3 needs one consistent message across surfaces.

### In the calendar
Show the new version directly in future event text where useful:
- updated sleep window
- updated bedtime guidance
- updated coaching note

Add one short event or note only if needed:
- `Plan updated for the next 7 nights`

### In email
Send a concise update email:
- subject: `Your RestShore plan has been updated`
- body:
  - what changed
  - why
  - when it starts
  - what stays the same

### In the future main page
When the main page exists, show a summary card with:
- latest plan version
- recent pattern
- what changed this week
- what to do tonight

### In the report
The report page should show:
- current version
- recent logs
- recent adjustment summary
- link to the relevant check-in history

## How the user continues from the same point

The key rule is continuity without confusion.

### Always preserve history
- past events stay as they were
- logged sleep events stay logged
- old plan versions remain visible in the audit trail

### Use versioned future planning
- each log belongs to a specific plan version
- each new weekly plan is its own version
- the next event after the effective date is the first visible sign of the new version

### Keep the current path obvious
- the user should not need to re-start the program
- the user should not lose the old check-ins
- the next action should always be the next diary entry or the next bedtime event

## Where this is documented

This phase should be documented in three places:

### 1. Product spec
This file is the canonical policy for Phase 3:
- `docs/research/product-content/07-phase-3-structural-adaptation.md`

### 2. Runtime records
The eventual implementation should store:
- `PlanVersion`
- `PlanChangeSet`
- `WeeklyPlanReview`
- `NightlyLog`

### 3. Test Center
The test system should show:
- the input logs
- the rule that fired
- the before / after diff
- the user-facing summary
- the version change

## Edge cases

### Missing logs
If fewer than 5 of the last 7 nights are logged:
- no structural change
- only micro-adjustments are allowed
- the user should be encouraged to keep logging

### Contradictory diary data
If the answers conflict:
- treat the exact time fields as the source of truth
- use the pattern fields as supporting signal
- avoid structural changes unless the pattern is still clear after reconciliation

### Travel or time-zone changes
If the user changes time zones or has travel/shift-work disruption:
- freeze structural changes until the schedule stabilizes
- preserve the old version
- resume weekly review only after enough stable nights

### Clinical red flags
If the user reports concerning symptoms:
- pause automatic structural adaptation
- encourage clinician review
- preserve the sleep history for escalation

## Success criteria

Phase 3 is working if:
- users can tell what changed and why
- the plan feels stable but responsive
- the app does not overreact to one bad night
- the calendar remains understandable
- the user can continue from the next event without confusion
- a clinician can read the history and understand the sequence of changes

## References

- [VA sleep diary workbook](https://www.veterantraining.va.gov/insomnia/workbook.pdf)
- [VA sleep diary interactive home](https://www.veterantraining.va.gov/apps/insomnia/resources/interactivities/diary/index.html)
- [CBT-i Coach | VA Mobile](https://mobile.va.gov/app/cbt-i-coach)
- [AASM behavioral treatment summary](https://aasm.org/new-guideline-supports-behavioral-psychological-treatments-for-insomnia/)
