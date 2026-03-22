# Testing Playbook

## Purpose

This file explains how to test the current product quickly and consistently.

## Standard Commands

Run these from the project root:

```powershell
npm run lint
npm run test
cmd /c npm run build
```

## Local App Entry Points

- Home: [http://localhost:3000/](http://localhost:3000/)
- Report: `http://localhost:3000/report/<SESSION_ID>`
- Test Center: [http://localhost:3000/test-center](http://localhost:3000/test-center)

## Best QA Order

### 1. Adaptation logic first

Use the Test Center before touching the real calendar.

Why:

- It is deterministic
- It is faster
- It avoids calendar cleanup
- It shows exact before/after diffs

### 2. Then test real daily logging

Use a real check-in to verify:

- the past sleep event changes
- title changes
- description changes
- actual start/end times change

### 3. Then test real calendar sync

Only after the logic looks right in preview mode.

## What To Use For Each Kind Of Check

### Adaptation Lab

Use when you want to verify:

- whether future guidance should change
- which rule fired
- what nights were simulated
- exactly which future events change

### Real Daily Check-In

Use when you want to verify:

- a specific night log
- event title update
- event description update
- actual sleep timing update

### Full Calendar Flow

Use when you want to verify:

- Google sign-in
- calendar creation
- event sync
- event removal
- update behavior on future events

## Current Rule Matrix Summary

- One bad night:
  - no future change
- Two of the last three repeated relevant nights:
  - can change future guidance

Current rule families:

- late start
- sleep onset
- fragmentation
- early wake
- fatigue

## Launch / approval checklist

Use this when you want a human pass before Google review or staging sign-off:

1. Open the homepage and confirm the intake is reachable without sign-in.
2. Open the privacy page and confirm it explains intake, email, Google, and Resend in plain language.
3. Confirm `/test-center` and `/launch-insights` are hidden in production.
4. Verify Google Cloud has:
   - the right OAuth client
   - the correct callback URI
   - the `calendar.app.created` scope path for calendar handoff
5. Verify Resend has a verified sender you can actually send from.
6. Run a full happy path:
   - intake
   - email capture
   - Google sign-in
   - calendar creation
   - daily check-in
   - a follow-up update
7. Confirm no-change structural cases in the Test Center now say `hold`, not `manual review`.

## Common Product Checks

### Intake

- loads cleanly
- one-question-per-screen
- back navigation works
- save/resume works

### Report

- renders with key plan data
- shows Google/account state clearly
- exposes testing/debug affordances locally

### Calendar

- creates dedicated calendar
- future events sync correctly
- sleep events update after logs
- remove calendar flow works

### Daily Check-In

- tied to exact night
- blocks future-night submit
- allows backfill for past nights
- updates past sleep event correctly

### Adaptation

- no future change after one bad night
- future change only after repeated pattern
- only future events are changed

## Notes For Future Phases

- Structural weekly adaptation will need its own test panel.
- Reminder strategy will need a reminder QA matrix.
- Clinician escalation output should later get its own acceptance checklist.
- Marketing pages and competitor-inspired flows should later get separate UX review criteria.
