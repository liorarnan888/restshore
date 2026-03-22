# Phase 3 Weekly Structural Adaptation Policy

Research and policy lock date: 2026-03-19

## Purpose

This file is the concise policy lock for Phase 3 structural adaptation.

Phase 3 is intentionally simpler than the broader exploration notes in
`07-phase-3-structural-adaptation.md`.

Its purpose is to give the product and engineering teams one stable rule set for:

- when weekly structural review runs
- when the plan may expand
- when the plan should hold
- when the plan may shrink
- when automation should simply make no structural change

## Weekly cadence

- Run structural review once every 7 nights.
- Look at the latest rolling 7-night window.
- Require at least 5 completed nightly logs in that window.

If fewer than 5 nights are logged:

- do not make a structural change
- hold the current plan steady
- allow only non-structural micro-adjustments if relevant

## The 3-bucket rule table

### 1. Expand

Use `expand` when:

- there are at least 5 logged nights in the last 7
- sleep efficiency is high and stable
- there are no safety concerns or major context changes

What changes:

- expand the sleep window by 15 minutes
- keep the wake anchor fixed
- update future bedtime guidance calmly

Working threshold:

- typically `>= 90%` sleep efficiency on most logged nights

### 2. Hold

Use `hold` when:

- there are at least 5 logged nights
- the data is mixed or mid-range
- there is no strong reason to expand or shrink

What changes:

- no structural change
- the plan stays as it is

Working threshold:

- typically `85% to 89%`
- or mixed nights without a clear directional signal

### 3. Shrink

Use `shrink` when:

- there are at least 5 logged nights
- low sleep efficiency repeats across multiple nights
- adherence looks reasonable
- there is no obvious one-off explanation

What changes:

- reduce the sleep window by 15 minutes
- keep the wake anchor fixed
- update future bedtime and in-bed guidance

Working threshold:

- typically `< 85%` on repeated nights

## Hold also covers low-confidence weeks

Use `hold` when:

- logs are too sparse
- the diary is contradictory
- there are red flags
- there is travel, time-zone disruption, shift-work disruption, or another major context shift
- there is severe daytime impairment
- there is a major medication or life-schedule change

What changes:

- no structural change is made
- the current plan stays stable
- other product surfaces may still explain why no change was made

## What must never change automatically

- the wake anchor, unless a human explicitly approves a real schedule change
- past logged nights
- historical plan records
- the overall 6-week arc
- the plan after one bad night
- the plan when the diary is too sparse
- the plan when safety/context issues make automation unreliable

## User-facing explanation principles

When a weekly structural change happens, the user-facing explanation should always:

- say what changed
- say why it changed
- say when it starts
- stay future-focused
- preserve history and make that explicit
- use plain language first, CBT-I terms second
- avoid blame

If the answer is `hold`, the product should say that the plan is staying steady for now because the signal is not strong enough or not reliable enough yet.

## Why this simplified policy exists

This policy is intentionally narrow because it is easier to:

- explain
- QA
- version
- show in the Test Center
- connect to future clinician-facing summaries

Anything more nuanced than this should live inside implementation details and testing surfaces, not inside the core product policy.
