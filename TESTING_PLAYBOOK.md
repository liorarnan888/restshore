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
3. Confirm `/test-center` is password-protected in production and `/launch-insights` remains key-protected.
4. Verify production env includes:
   - `TEST_CENTER_PASSWORD`
   - `AUTH_SECRET`
5. Verify Google Cloud has:
   - the right OAuth client
   - the correct callback URI
   - the `calendar.app.created` scope path for calendar handoff
6. Verify Resend has a verified sender you can actually send from.
7. Run a full happy path:
   - intake
   - email capture
   - Google sign-in
   - calendar creation
   - daily check-in
   - a follow-up update
8. Confirm no-change structural cases in the Test Center now say `hold`, not `manual review`.

## Common Product Checks

### Intake

- loads cleanly
- one-question-per-screen
- back navigation works
- save/resume works
- on `/start` mobile, the first question appears quickly with no duplicate orientation copy
- on `/start` mobile, duration/helper text does not consume meaningful vertical space before the first question
- on `/start` mobile, section labels are not duplicated above the question
- on `/start` mobile, the top shell uses only minimal orientation and does not spend a full paragraph explaining the questionnaire

### Report

- renders as one coherent story, not a side-rail dashboard
- not-connected state has one primary CTA only
- connected state shows compact account controls only
- `What changed and why` appears only when there is a meaningful current update
- no beta/debug/test surfaces remain on the product-facing report

#### Report Google card flow invariants

These are regression-sensitive and should be checked whenever the report card, delivery state, or Google handoff copy changes:

- While calendar sync is actively building, there must be no primary CTA inviting the user to add the plan again.
- If Google has been disconnected, the UI must show a clear reconnect path and must hide remove-calendar controls.
- Remove-calendar should only appear when an authenticated Google session can actually execute that action.
- On mobile, the not-connected report card must keep the heading and body readable without being squeezed by side-by-side status controls.
- The not-connected report card should still feel like one compact card, not two competing panels.
- The connected/building states should preserve a single visual hierarchy: status first, CTA second, controls last.

### Calendar

- creates dedicated calendar
- future events sync correctly
- sleep events update after logs
- remove calendar flow works
- timezone is preserved end-to-end:
  - the plan is built in the user's timezone
  - the Google calendar resource uses the same timezone
  - event start/end times match the plan when viewed in the user's locale

### Daily Check-In

- tied to exact night
- blocks future-night submit
- allows backfill for past nights
- updates past sleep event correctly

### Public entry surfaces

- homepage has one dominant CTA only
- Google return path reads as clearly secondary
- homepage public copy stays in behavioral-support / CBT-I-inspired language
- homepage does not imply diagnosis, treatment, or cure
- `/start` does not feel like a second landing page

### Report card QA

- not-connected state on mobile keeps the heading/body legible without horizontal crowding
- building state shows progress/status only, not a second "add again" CTA
- disconnected state exposes reconnect, hides remove-calendar
- remove-calendar only appears when the current authenticated Google session can actually remove it
- connected state keeps controls compact and subordinate to the plan summary

### Test Center in production

- `/test-center` should open a password gate in production, not a public dashboard.
- unlocking should require a valid `TEST_CENTER_PASSWORD` and a signed internal session cookie.
- after unlocking, the same QA surfaces should be available in production as in local.
- logging out should clear the internal session and return to the gate.
- the debug preview APIs should obey the same gate as the Test Center page.

### Adaptation

- no future change after one bad night
- future change only after repeated pattern
- only future events are changed

## Notes For Future Phases

- Structural weekly adaptation will need its own test panel.
- Reminder strategy will need a reminder QA matrix.
- Clinician escalation output should later get its own acceptance checklist.
- Marketing pages and competitor-inspired flows should later get separate UX review criteria.
