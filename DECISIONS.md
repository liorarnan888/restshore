# Decisions

## Product Decisions

### 1. Program duration

- Decision: the program is 6 weeks.
- Reason: this fits the intended CBT-I-style coaching arc better than a short 14-day plan.

### 2. Google connection timing

- Decision: Google is connected after the intake, not before it.
- Reason: lower friction during intake, higher perceived value before account linking.

### 3. Email capture timing

- Decision: email is captured early, after the user has already answered a few easy questions.
- Reason: save progress, support resume flow, reduce abandonment loss.

### 4. Educational content in intake

- Decision: use short educational cards between question groups.
- Reason: increase value and motivation without making the intake feel like homework.

### 5. Calendar scope

- Decision: use dedicated-calendar-only permissions where possible.
- Reason: reduce trust friction and avoid needing broad access to the user’s whole calendar.

### 6. Sleep event behavior after a nightly log

- Decision: update the original past sleep event instead of creating a second “actual sleep” event.
- What changes:
  - title
  - description
  - actual start time
  - actual end time
- What stays visible:
  - the planned sleep window in the description
- Reason: preserve visual history without cluttering the calendar.

### 7. Missing diary behavior

- Decision: if a nightly log was not submitted, the past sleep event can become `Sleep - not logged`.
- Reason: create light accountability and make the calendar useful as a real diary surface.

### 8. Daily check-in ownership

- Decision: every daily check-in belongs to one exact night, not to “today in general”.
- Reason: supports backfill, clarity, and future backend modeling.

### 9. Future adaptation threshold

- Decision: one bad night alone must not change the future plan.
- Current threshold:
  - repeated pattern
  - currently `2 of the last 3` relevant nights
- Reason: avoid overreacting to one rough night.

### 10. Adaptation scope for now

- Decision: current adaptation is micro-adjustment only.
- It may change:
  - future guidance text
  - near-future event descriptions
  - some future event families
- It may not yet do:
  - full structural weekly plan rewrites
  - broad versioned plan changes

### 11. Phase 3 structural adaptation policy

- Decision: Phase 3 structural adaptation should run on a weekly cadence, not nightly.
- Review window:
  - latest 7 nights
- Minimum diary threshold:
  - at least 5 completed nightly logs
- Structural buckets:
  - `expand`
  - `hold`
  - `shrink`
- Working interpretation:
  - `expand` when efficiency is high and stable
  - `hold` when efficiency is mid-range or the signal is mixed
  - `hold` also when data is sparse, contradictory, risky, or context-shifted
  - `shrink` when low efficiency repeats and adherence is reasonable
- Structural adjustment size:
  - 15 minutes
- Things that should not change automatically:
  - wake anchor
  - past logged nights
  - historical plan records
  - overall 6-week arc
  - anything after one bad night
  - anything with sparse diary data
  - anything with red flags or major context shifts

### 12. Phase 3 explanation style

- Decision: structural updates must be explained in plain language.
- The user-facing message should always say:
  - what changed
  - why it changed
  - when it starts
- The message should stay future-focused and never imply that the user failed.

## Current Future-Changing Rule Families

- `late-start`
- `sleep-onset`
- `fragmentation`
- `early-wake`
- `fatigue`

If a scenario does not fall into one of these rule families, it should not change future guidance yet.

## Testing Decisions

### 13. Test Center

- Decision: maintain a human-readable local Test Center.
- Reason: product review should not depend only on code-level tests or hidden debug steps.

### 14. Adaptation Lab

- Decision: show simulated nightly logs, triggered rules, user-facing summaries, and exact before/after diffs.
- Reason: future adaptation behavior must be inspectable, not magical.

### 15. Public marketing language

- Decision: public-facing homepage and acquisition copy must stay in `behavioral support` / `CBT-I-inspired` language.
- It should:
  - describe CBT-I as a well-studied behavioral framework
  - position RestShore as structure, coaching, planning, and implementation support
  - keep a non-medical public tone
- It should not:
  - imply diagnosis
  - imply treatment or cure
  - claim medical outcomes
  - assume the user has a specific condition in ad-style copy

### 16. Start page mobile compactness

- Decision: `/start` is not a second landing page.
- On mobile:
  - the first question should appear as high as possible
  - no unnecessary duration copy should appear inside the intake shell
  - no duplicate section labels should appear above the first question
  - the top shell should use only the minimum orientation needed to start
  - if the page still reads clearly without an intro paragraph, prefer removing it
- Reason: the user already chose to start; the page should feel like the questionnaire has begun.

### 17. Report page state model

- Decision: the report has exactly two product states on the same route:
  - not connected
  - connected
- Not connected:
  - the report stands on its own
  - it has one primary action only: connect Google to add the plan to Calendar
- Connected:
  - the report becomes the current source of truth for the live plan
  - account controls stay secondary
  - `What changed and why` appears only when a meaningful update exists
- The report must not behave like:
  - a delivery center
  - an ops dashboard
  - a beta/debug surface
