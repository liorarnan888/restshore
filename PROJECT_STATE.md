# Project State

## Product Summary

RestShore is a CBT-I-inspired sleep coaching web app. The current product flow is:

1. The user completes a rich intake interview.
2. The user gets a hosted sleep report and report email.
3. The app can create a dedicated Google Calendar with a 6-week sleep program.
4. The user can complete short daily sleep check-ins tied to exact nights.
5. Past sleep events are updated to reflect what actually happened.
6. Repeated nightly patterns can trigger micro-adjustments to future calendar guidance.

## Current Major Capabilities

- Typeform-style intake with one-question-per-screen flow
- Early email capture and resume support
- Hosted report page
- Google sign-in and dedicated Google Calendar creation
- Calendar events for wake anchor, light, meal boundary, caffeine cutoff, digital sunset, wind-down, sleep window, in-bed practice, movement, nap boundary, coach notes, reviews, and daily check-ins
- Daily sleep check-in flow for specific nights
- Logged sleep nights update:
  - title
  - description
  - actual start time
  - actual end time
- Missing nightly logs can mark past sleep events as `Sleep - not logged`
- Micro-adjustments to future guidance based on repeated recent patterns
- Local QA/Test Center for scenario previews and rule visibility

## Current Product Rules

- The program is 6 weeks, not 14 days.
- Calendar changes to the future are micro-adjustments only for now.
- One bad night alone must not change future guidance.
- Future guidance can change only when a repeated pattern is detected.
- Current threshold for future micro-adjustments:
  - `2 of the last 3` relevant nights
- Only future events may be updated by the adaptation engine.
- Past sleep history is preserved visually through event updates rather than event duplication.

## Current Daily Check-In Rules

- Each check-in belongs to one exact night.
- Users can backfill previous nights through the correct linked check-in.
- Users cannot submit data for future nights.
- After a nightly log is submitted:
  - the past sleep event becomes `Sleep` or `Sleep - ...`
  - the event description gets a logged outcome block
  - the event start and end times shift to actual reported times
  - the planned window stays visible inside the description

## Current Micro-Adjustment Families

- `late-start`
- `sleep-onset`
- `fragmentation`
- `early-wake`
- `fatigue`

If a case is not one of these families, it should not change future guidance yet.

## Key Local Surfaces

- Home: `/`
- Report: `/report/[sessionId]`
- Daily check-in: `/check-in/[sessionId]/[nightDate]`
- Test Center: `/test-center`

## Key Technical Areas

- Intake and report flows live in `src/app` and `src/components`
- Calendar modeling lives mainly in `src/lib/plan-engine.ts`
- Daily logging lives mainly in `src/lib/daily-checkin.ts`
- Adaptation logic lives mainly in `src/lib/adaptive-plan.ts`
- Session orchestration lives mainly in `src/lib/session-service.ts`
- Calendar sync/integration lives mainly in `src/lib/integrations.ts`

## Current Verification Baseline

At the time this context pack was created, the working baseline passes:

- `npm run lint`
- `npm run test`
- `npm run build`

## Important Known Open Areas

- Calendar creation UX still needs more premium progress behavior
- Calendar event personalization is still partial
- Report/email educational framing still needs another upgrade
- Reminder strategy is still unresolved
- Structural weekly adaptation is now in preview-only form, and the intended policy has been narrowed to a weekly 3-bucket model:
  - expand
  - hold
  - shrink
- Clinician escalation summary page is not built yet
- Competitor/marketing research is not yet done
