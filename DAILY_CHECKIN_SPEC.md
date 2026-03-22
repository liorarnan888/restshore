# Daily Sleep Check-In And Adaptive Plan Spec

Status: Draft for v1 implementation planning

Last updated: 2026-03-18

## Summary

This spec defines the first version of RestShore daily updates: a very short, mobile-first morning sleep check-in that captures what actually happened last night, reflects that outcome back into the user's Google Calendar, and gradually adapts the future plan without rewriting history.

The guiding product idea is:

- make daily logging easy enough to sustain
- make the calendar feel alive and personal
- preserve the difference between the original plan and what actually happened
- avoid overreacting to one bad night

## Product Decisions

### Chosen direction

- The user completes one short morning check-in about the last night only.
- The check-in is mobile-first and should usually take 30 to 60 seconds.
- Each check-in entry point is tied to one specific night, not to "today" in a generic way.
- The app does not rewrite past planned event times to match actual times.
- The app does not create a second full "actual sleep" event in v1.
- After the user logs the night, the past overnight sleep event is renamed to `Sleep`.
- The title of that past event becomes visually informative on the calendar itself.
- The description of that past event gets a `Logged outcome` block with the actual data.
- Future plan changes affect only future events, never past events.
- Daily adjustments are light and tactical.
- Structural plan changes happen only after enough diary data, not after a single rough night.

### Why this direction

This approach keeps the calendar understandable:

- the original sleep plan remains visible as the plan that was prescribed
- the user still gets a visual signal showing what happened
- the calendar does not become cluttered with duplicate overnight events
- the adaptation engine can stay clinically calmer and more credible
- the user can still backfill missed nights without losing the date context

## Goals

- Make daily check-in feel easy, fast, and worth doing.
- Turn the calendar into a lightweight sleep diary without making it messy.
- Show the user that the plan is personal and responsive.
- Prepare the system for future adaptive CBT-I style changes.
- Preserve a clean clinical story that could later be shared with a physician.

## Non-Goals For Phase 1

- No full homepage dashboard for plan changes yet.
- No deep analytics dashboard yet.
- No changing past planned event times to actual times.
- No separate "actual sleep" overnight event by default.
- No aggressive same-day structural changes to the sleep window after one night.
- No complex reminder system yet.

## Clinical And Product Principles

- Daily sleep diary data is valuable, but structural changes should be based on repeated patterns, not one bad night.
- Morning logging is preferable to logging at night because the user can report a completed night instead of a guess.
- The user should always be able to tell the difference between:
  - what the plan asked for
  - what actually happened
  - what changed next

Reference material that informed this direction:

- VA CBT-i Coach: [https://mobile.va.gov/app/cbt-i-coach](https://mobile.va.gov/app/cbt-i-coach)
- VA sleep diary workbook: [https://www.veterantraining.va.gov/insomnia/workbook.pdf](https://www.veterantraining.va.gov/insomnia/workbook.pdf)
- VA sleep diary interactive home: [https://www.veterantraining.va.gov/apps/insomnia/resources/interactivities/diary/index.html](https://www.veterantraining.va.gov/apps/insomnia/resources/interactivities/diary/index.html)
- AASM behavioral treatment summary: [https://aasm.org/new-guideline-supports-behavioral-psychological-treatments-for-insomnia/](https://aasm.org/new-guideline-supports-behavioral-psychological-treatments-for-insomnia/)

## Core User Experience

## Entry Point

The default entry point is a single morning event in the dedicated RestShore calendar.

Recommended event:

- Title: `1-minute sleep check-in`
- Timing: 15 to 30 minutes after the user's target wake time
- Duration: 5 minutes
- Purpose: one reliable place to log the last night
- Link target: a check-in URL for one exact night, for example the night ending on 2026-03-18

The event description contains:

- a direct check-in link
- one short sentence explaining why logging matters
- reassurance that this is a very short update

Example description opening:

```text
Take 30 to 60 seconds to log last night. This helps your plan respond to real sleep, not guesses.
```

### Night-specific linking

Every daily check-in entry point must be tied to one exact sleep night.

That means:

- the event created for the morning of March 18 should open the check-in for the night that ended on March 18
- opening the link later that day, the next day, or three days later should still open the same night
- it must not silently switch to "today's" night based on open time

Recommended URL shape:

- `/check-in/:token?night=2026-03-18`

The page should clearly say which night is being logged.

Recommended header:

- `Logging the night ending Wednesday, March 18`

If the user missed a day, they should still be able to backfill that specific night from the old event link.

### Reminder stance for v1

Reminder strategy is intentionally conservative in v1.

- Use one visible morning check-in event as the main entry point.
- Do not add multiple extra reminder events.
- Do not add a second email reminder for the same daily action in v1.
- Revisit stronger reminder design later as a separate product decision.

This aligns with the current backlog item about avoiding reminder overload.

## Check-In Flow

The check-in should feel like a miniature version of the original intake:

- one question per screen
- large touch targets
- very low friction
- fast by default
- adaptive only when needed

Target completion time:

- typical: 30 to 60 seconds
- high-friction nights: under 90 seconds

## Question Set

### Core questions shown almost every day

1. `How close was last night to the plan?`
   - Close to plan
   - Bedtime was later than planned
   - Wake time drifted
   - Both drifted
   - Hard to say

2. `About what time did you get into bed?`
   - time picker
   - prefilled near the planned bedtime

3. `About what time did you get out of bed for the day?`
   - time picker
   - prefilled near the planned wake time

4. `What best describes the night?`
   - I fell asleep fairly quickly
   - It took a while to fall asleep
   - I woke up several times
   - I woke too early
   - It was a rough mix of the above

5. `How are you functioning this morning?`
   - Good enough
   - Tired but manageable
   - Running on fumes

### Follow-up questions shown only when relevant

If the user says it took a while to fall asleep:

- `About how long did it take to fall asleep?`
  - under 20 minutes
  - 20 to 40 minutes
  - 40 to 60 minutes
  - more than an hour

If the user says they woke several times or had a rough mix:

- `About how much total time were you awake during the night?`
  - under 20 minutes
  - 20 to 40 minutes
  - 40 to 60 minutes
  - more than an hour

- `How many awakenings do you remember?`
  - 1
  - 2
  - 3 to 4
  - 5 or more

If the user says they woke too early:

- `About how much earlier did you wake than you wanted?`
  - under 30 minutes
  - 30 to 60 minutes
  - 60 to 90 minutes
  - more than 90 minutes

Optional future question, not required in v1:

- `Did you get out of bed during the night when you were clearly awake?`

## Completion Screen

After submit, the user should see a lightweight confirmation:

- `Last night has been logged`
- one sentence on whether tonight's plan may stay steady or be lightly adjusted
- a small hint that the calendar will reflect the logged night

Example:

```text
Saved. We will keep tonight steady unless your recent pattern suggests a useful adjustment.
```

## Calendar Behavior

## What changes after the user logs the night

When the check-in is submitted, update the past overnight sleep event for that specific night.

### Event title behavior

Before logging:

- `Protected sleep window`

After logging:

- rename the event to `Sleep`
- add a short logged summary directly in the title

Recommended title pattern:

- `Sleep - close to plan`
- `Sleep - late start`
- `Sleep - early wake`
- `Sleep - 4 awakenings`
- `Sleep - long awake time`
- `Sleep - late start - early wake`

Rules:

- Keep titles short enough to scan in month and week view.
- Show at most two outcome tags in the title.
- Prioritize the most behaviorally important signal.
- Do not attempt to show every metric in the title.

Recommended tag priority:

1. close to plan
2. late start
3. early wake
4. awakenings count
5. long awake time
6. short sleep duration only if it is the clearest summary

### Event description behavior

Add a new `Logged outcome` block to the description of the past overnight event.

Recommended structure:

```text
Planned window
- Planned bedtime: 1:00 AM
- Planned wake time: 8:00 AM

Logged outcome
- In bed: 1:28 AM
- Out of bed: 8:07 AM
- Sleep onset: 40 to 60 minutes
- Night awakenings: 3 to 4
- Awake during night: 40 to 60 minutes
- Early wake: none reported
- Morning function: tired but manageable

Coach interpretation
- This night drifted later than planned and included meaningful awake time overnight.
- Keep the morning anchor steady. Tonight's plan may adjust the wind-down and in-bed guidance.
```

### What does not change

- Do not change the event times of past planned sleep events.
- Do not create a separate full overnight "actual sleep" event in v1.
- Do not rewrite other past calendar events by default.

## What happens when the user does not log the night

The system should create a visible accountability cue for missing diary data.

Recommended behavior:

- if a night's check-in is still missing after the intended morning logging window, update the past overnight event title to a missing-data state
- keep this visible until the user backfills the night
- as soon as the user backfills, replace the missing-data title with the real logged title and add the `Logged outcome` block

Recommended title options:

- `Sleep - not logged`
- `Sleep - no diary yet`
- `Sleep - data missing`

Recommended product stance:

- this should feel lightly accountable, not punitive
- avoid copy that sounds mocking, hostile, or judgmental
- the goal is to make missing data visible on the calendar, not to shame the user harshly

Current recommendation:

- use `Sleep - not logged` as the default missing-data title

## Why not create a second actual sleep event in v1

That remains a future option, but v1 should avoid it because:

- it adds visual clutter
- it creates ambiguity between plan and reality
- it makes the calendar harder to understand at a glance
- it increases sync and update complexity

If later testing shows the calendar still needs a stronger visual diary layer, a future option is:

- keep the updated `Sleep` title
- optionally add a small morning summary event instead of a second overnight block

Example:

- `Sleep logged: late start, 4 awakenings`

That would be less messy than a second full overnight event.

## Adaptation Model

The plan adapts in two layers.

## Layer 1: Daily micro-adjustments

These are safe, lightweight adjustments made to future events after recent diary input.

Examples:

- switch tonight's wind-down practice based on reported racing thoughts
- strengthen bedtime guidance after repeated late starts
- strengthen overnight reset guidance after repeated awakenings
- reinforce wake anchor after repeated morning drift
- soften or sharpen coaching notes based on recent adherence

These changes affect:

- future `Wind-down practice`
- future `In-bed practice`
- future `Coach note`
- future evening guidance

These changes do not affect:

- the already logged night
- past calendar history
- structural bedtime or wake targets after a single night

## Layer 2: Structural adjustments

These happen only when enough data has accumulated.

Recommended gate:

- at least 5 logged nights out of the most recent 7

Recommended cadence:

- no more than once per week by default

Possible structural changes:

- expand or contract the sleep window
- move bedtime target
- refine nap guidance
- refine weekend guardrails
- tighten or relax certain behavior cutoffs if the pattern is repeated

Structural changes should create:

- a new plan version
- updated future calendar events only
- a clear summary of what changed and why

## Personalization Logic

The daily system should respond to user-specific patterns, not generic sleep advice.

Examples:

- If the intake and recent diary data suggest racing thoughts:
  - prioritize cognitive offload, constructive worry, and less effortful in-bed guidance
  - say explicitly that these are chosen because the user reports a busy mind before sleep

- If the user repeatedly logs long awake time overnight:
  - prioritize middle-of-the-night reset guidance and lower-effort re-entry to bed

- If the user repeatedly drifts later than planned:
  - tighten evening descent content and late-stimulation boundaries

- If the user does not use caffeine:
  - do not create caffeine cutoff events in the first place

This personalization should become richer in future phases, but the data model should support it now.

## Data Model

## DailySleepCheckIn

Recommended fields:

- `id`
- `sessionId`
- `dateForNight`
- `planVersionId`
- `plannedBedtime`
- `plannedWakeTime`
- `actualInBedAt`
- `actualOutOfBedAt`
- `nightType`
- `sleepLatencyBucket`
- `wakeAfterSleepOnsetBucket`
- `awakeningsBucket`
- `earlyWakeBucket`
- `morningFunction`
- `closenessToPlan`
- `derivedTags`
- `submittedAt`

## PlanVersion

Recommended fields:

- `id`
- `sessionId`
- `effectiveFromDate`
- `bedtimeTarget`
- `wakeTime`
- `sleepWindowHours`
- `rulesSummary`
- `source`
- `createdAt`

`source` values:

- `initial`
- `weekly_adjustment`
- `manual`

## ProgramAdjustment

Recommended fields:

- `id`
- `sessionId`
- `planVersionId`
- `scope`
- `reason`
- `changes`
- `effectiveFromDate`
- `createdAt`

`scope` values:

- `micro`
- `structural`

## API Surface

Recommended endpoints for v1:

- `GET /check-in/:token`
  - load the mobile-first check-in page for a specific date/night
  - validate that the token and night pair refer to a real planned sleep night

- `POST /api/check-ins/start`
  - resolve the requested night, planned event, and initial defaults
  - never replace the requested night with a newer one just because the user opened the page later

- `POST /api/check-ins/submit`
  - save the diary entry
  - update the past sleep event title and description
  - trigger micro-adjustment evaluation for future events

- `GET /api/check-ins/history/:sessionId`
  - lightweight recent history for future homepage/report use

- `POST /api/program/recompute`
  - internal endpoint used for weekly or manual future-plan recalculation

## Calendar Sync Rules

When a daily check-in is submitted:

1. Find the planned overnight sleep event for the logged night.
2. Update its title from `Protected sleep window` to `Sleep`.
3. Append the logged-summary tags to the title.
4. Add the `Logged outcome` block to the description.
5. If a micro-adjustment is triggered:
   - update future relevant events only
   - do not touch past events
6. If a structural adjustment is triggered later:
   - update only events on or after the new effective date

When a daily check-in is missing past the intended logging window:

1. Find the planned overnight sleep event for that specific night.
2. Rename it to `Sleep - not logged`.
3. Optionally append one short line in the description:
   - `No diary entry was submitted for this night yet.`
4. If the user later backfills the night:
   - replace the missing title with the true logged title
   - write the real logged outcome block

## Title Generation Rules For Logged Sleep

The title should feel visual and human, not technical.

Good examples:

- `Sleep - close to plan`
- `Sleep - late start`
- `Sleep - early wake`
- `Sleep - 4 awakenings`
- `Sleep - late start - long awake time`

Avoid:

- `Protected sleep window - Logged: 6h 12m`
- long metric-heavy strings
- internal wording like `WASO` or `sleep latency`

### Derived title tags

Suggested mapping:

- bedtime later than threshold -> `late start`
- early wake present -> `early wake`
- awakenings bucket 3 to 4 -> `4 awakenings`
- awakenings bucket 5 or more -> `many awakenings`
- wake-after-sleep-onset bucket over 40 minutes -> `long awake time`
- close adherence and manageable morning -> `close to plan`

## Phase Plan

## Phase 1: Logging and visible reflection

Scope:

- morning check-in page
- check-in event in calendar
- store daily entries
- rename past overnight event to `Sleep`
- add visible logged summary to title
- add `Logged outcome` to description

Success criteria:

- user can complete the check-in in under a minute
- previous night's sleep event visibly reflects what happened
- no duplicate overnight events are created

## Phase 2: Daily micro-adjustments

Scope:

- choose more suitable practices for tonight
- adapt coaching notes and certain future descriptions
- update only future events

Success criteria:

- user can see that upcoming guidance responds to recent nights
- changes feel personal without becoming erratic

## Phase 3: Structural weekly adaptation

Scope:

- plan versioning
- weekly review logic
- sleep window adjustments
- bedtime target adjustments
- change summaries via email and future homepage summary

Success criteria:

- changes are explainable
- changes do not feel random
- the plan becomes more personalized over time

## Open Questions

- Should the morning check-in event eventually be a Google Task instead of a calendar event
  - current recommendation: no, keep it as a calendar event for now

- Should logged sleep titles sometimes show duration, such as `Sleep - 6h 12m`
  - current recommendation: not by default
  - use behaviorally meaningful tags first

- Should we later add a small morning summary event after each logged night
  - current recommendation: consider only if title-plus-description proves insufficient

- How should reminder controls eventually be exposed to the user
  - current recommendation: backlog item, not part of phase 1

## Edge Cases

- Missed day, then backfill from an older event link
  - the link must still open the originally intended night
  - the submitted diary entry must update that exact night's sleep event

- User opens the morning check-in before the intended sleep night has actually ended
  - show a friendly message and block submission until the relevant night can be meaningfully logged

- User submits the same night twice
  - allow editing the existing entry rather than creating a duplicate
  - keep a last-updated timestamp for auditability

- User starts a check-in but leaves midway
  - persist partial answers locally or server-side for that specific night

- User misses several days
  - each older event link should still work for backfill
  - the next check-in page may optionally surface other missing nights, but must keep the current linked night explicit

- User changes timezone or travels
  - the night identifier should remain tied to the user's sleep-plan timezone at the time the event was created, or another explicitly stored reference timezone
  - avoid changing which night is being logged just because the browser timezone changed

- Daylight saving shifts
  - store night identity separately from rendered local times
  - avoid deriving the logged night only from clock math on the client

- User never connected Google Calendar
  - the daily check-in system should still work if delivered by email or homepage in a future phase
  - calendar reflection becomes optional, not mandatory

- Missing diary state and later backfill
  - if an event was marked `Sleep - not logged`, backfilling must fully replace that state with the real logged summary

- Structural adjustment happens after several missed logs
  - the engine should avoid making strong plan changes if diary coverage is too sparse

## Backlog Dependencies

This spec depends on or connects to these backlog tracks:

- reminder strategy refinement
- richer calendar personalization
- future homepage summary of user updates and plan changes
- improved educational context around CBT-I in email and the main experience
