# RestShore Report Page Spec

Date: 2026-03-22
Status: Source of truth for redesign / re-implementation

## Purpose

This document defines the intended product, content, UX, and layout behavior for the report page:

- report route: `/report/[sessionId]`

It replaces the current "many cards and side panels" approach with a tighter, more persuasive report experience.

This spec should be treated as the implementation brief for the next agent. If the current draft code conflicts with this document, this document wins.

## Background

Under the new flow, the user reaches the report immediately after finishing the questionnaire.

That means:
- no email is required first
- no Google connection is required first
- the report must stand on its own as a high-value product moment

The report is no longer just a post-processing page or a delivery/status page.
It is the first moment where the user should feel:

1. you understood my sleep
2. you turned that into a real plan
3. if I connect Google, this plan becomes easier to follow and can keep adapting

## Core Product Role Of The Report

The report page has two jobs:

### Job 1: Deliver the value

The page must show:
- what the questionnaire found
- what the plan is
- why the plan looks like this

### Job 2: Move the user into the ongoing system

For users who are not connected:
- the page should make Google Calendar feel like the natural next step

For users who are connected:
- the page should become the clean, current source of truth for the plan they are now following

## The Report Must Create A WOW Moment

The report should not try to create wow through volume.
It should create wow through three very specific feelings:

### 1. "This is about me"

The user should feel that the analysis is personal, not templated.
The first screen should make them feel seen quickly.

### 2. "This is a real plan, not advice"

The report should feel like an actual structured plan that has been assembled from their answers.
It should not feel like a long educational article or a pile of tips.

### 3. "This can keep evolving with me"

Google connection should feel like the point where the static plan becomes a live system:
- calendar
- check-ins
- future updates

That is the emotional conversion point.

## Strategic Positioning

The report should frame RestShore as:
- behavioral support
- CBT-I-inspired structure
- practical sleep planning
- personalized guidance

It should not frame RestShore as:
- diagnosis
- treatment
- cure
- clinician replacement
- a generic wellness content product

## Primary Report States

There are only two intended product states:

1. not connected to Google Calendar
2. connected to Google Calendar

These are not two different routes.
They are two different report experiences on the same route.

## Report Information Hierarchy

Priority order:

1. What we learned about your sleep
2. What your current plan is
3. What to do next
4. If connected, what changed and why
5. Supportive secondary actions

## Non-Negotiable Design Principles

1. The report must feel much shorter than it does today.
2. The main story must sit in the main column, not in a cluttered side system.
3. There must be one primary action only in the not-connected state.
4. The connected state must not feel like an operations dashboard.
5. Mobile first.
6. No debug, beta, or internal tooling blocks on the product-facing report.
7. The wow moment must come from clarity, personalization, and a visible plan, not from decorative noise.

## State A: Not Connected

### Primary job

Show the user a strong personalized report and convert them to:

- `Connect with Google to add your plan to Calendar`

### Key message

You now have a plan.
If you connect Google, that plan can live in your week and support future check-ins and updates.

### Page structure

#### Section 1: Report hero

Required contents:
- personalized eyebrow
- report headline
- short summary paragraph
- 3 compact plan metrics
- one primary CTA only
- one short helper line

Recommended hero behavior:
- the CTA sits in the hero, near the plan metrics
- no second strong CTA anywhere else on the page

Primary CTA:
- `Connect with Google to add your plan to Calendar`

Helper line:
- `Google is optional. Connect it if you want the plan on your calendar and want future check-ins to keep it updated.`

### WOW requirement for the hero

The hero should make the user feel:
- this plan was built for me
- this is more substantial than advice

It should not feel like:
- a product status page
- a legal step
- a delivery center

#### Section 2: Sleep snapshot

This is the first proof section.

Purpose:
- show that the system recognized the user's pattern
- make the user trust the personalization

Contents:
- short diagnostic-style summary without medical diagnosis language
- key pattern cues
- plain-language framing of the user's current sleep picture

This section should be compact and fast to read.

#### Section 3: What seems to be shaping your sleep right now

Purpose:
- explain the likely drivers behind the current sleep pattern
- create the feeling of "this understood me"

Contents:
- a short narrative paragraph
- 3 to 5 compact bullets or cards

The tone should be:
- perceptive
- calm
- specific

Not:
- clinical wall of text
- generic sleep education

#### Section 4: Your 6-week plan

Purpose:
- turn the report into a plan, not just an analysis

Contents:
- a compact 6-week arc
- current wake anchor
- current bedtime target
- current protected sleep window
- clear week structure

The weekly structure should feel present, but not huge.
This is not a full roadmap page.

#### Section 5: What the calendar adds

Purpose:
- sell the connected product without sounding salesy
- explain what becomes better after Google connection

Contents:
- small preview of 3 to 4 event types
- one short paragraph explaining why the calendar matters

Recommended preview event families:
- Wake anchor
- Wind-down practice
- Sleep window
- Morning sleep log

Timezone requirement:
- all calendar events must be created from the user's selected timezone, not the server timezone
- the times shown in Google Calendar must match the times shown in the report for the same plan
- the calendar resource itself must be created with the same timezone as the user's plan

Required framing:
- the calendar is what makes the plan easier to follow in real life
- the calendar is what enables future check-ins and plan updates
- Google comes after the questionnaire, not before

#### Section 6: Doctor-ready summary

Purpose:
- make the report feel substantial and credible
- give the user a sense that this can be useful beyond the product

Contents:
- compact summary block
- shareable / escalation-ready framing

This should be much tighter than a clinical document wall.

## State B: Connected

### Primary job

Show the user their current live plan.

The page should answer:
- what is my plan now
- what changed
- why it changed

### Page structure

#### Section 1: Report hero

Same underlying structure as the not-connected state:
- report headline
- short summary
- 3 key metrics

But the CTA area changes.

Instead of a Google conversion CTA, show a compact connected-control strip:
- connected Google account
- secondary `Disconnect Google`
- secondary `Remove calendar`

These actions must be visible but clearly secondary.

#### Section 2: What changed and why

Purpose:
- make the adaptive system legible
- preserve the feeling that the plan is live and personal

Contents:
- only show this block when a real plan update exists
- one compact summary of what changed
- short explanation of why it changed
- when the change starts

This is not a full change history.
It is a short current-state explanation.

#### Section 3: Sleep snapshot

Same role as the unconnected state, but updated to reflect the current plan context.

#### Section 4: What seems to be shaping your sleep right now

Same role as the unconnected state.
This may evolve based on check-ins, but should stay concise.

#### Section 5: Your current 6-week plan

This is the current plan, not a historical archive.

The user should be able to see:
- the current version of the plan
- the current anchor values
- the weekly arc in compact form

#### Section 6: Doctor-ready summary

Same role as in the not-connected state.

## What Must Be Removed From The Current Report

These should not remain as first-class report blocks:

- `BetaFeedbackCard`
- `Beta guardrails`
- `Open Test Center`
- `AdaptationPreviewCard`
- `RetakeAssessmentButton` as a major surface
- `Morning sleep log` card
- `Recent plan adjustments` as a large separate section
- `Delivery status`
- `6-week roadmap` as a separate second plan view
- `First calendar cues`

These either belong elsewhere or should be folded into the new structure in much smaller form.

## CTA Rules

### Not connected

- one primary CTA only
- only one placement: top / hero area
- no repeated conversion CTA lower on the page

Primary CTA:
- `Connect with Google to add your plan to Calendar`

### Connected

- no primary conversion CTA
- only compact account actions
- `Disconnect Google` is secondary
- `Remove calendar` is secondary

## Check-In Rules

- do not show `Open today's check-in` or `Open next sleep log` as a major CTA inside the report
- the check-in entry point should stay in the calendar
- the report should not become the main operations surface for daily behavior

## WOW Design Guidance

### The report must feel like a reveal

The user just finished answering many questions.
The page should reward that effort.

The reveal should come from:
- a strong personalized top summary
- the feeling that a real plan has been assembled
- a visible bridge from static plan to live calendar system

### The report must not feel like:

- a document dump
- a dashboard full of cards
- a software control center
- a side panel full of secondary widgets

### Practical wow devices that are allowed

- a powerful hero with personalized structure
- compact high-signal metrics
- one elegant calendar preview block
- a clean "what changed and why" explanation when connected
- strong visual separation between "analysis" and "plan"

### Practical wow devices that are not allowed

- more pills
- more small cards
- more support/legal blocks inside the main narrative
- multiple CTA buttons competing for attention
- long explanatory copy in every section

## Mobile Rules

Above the fold in the not-connected state must include:
- report headline
- summary
- 3 key metrics or their mobile equivalent
- the primary Google CTA

Above the fold in the connected state must include:
- report headline
- summary
- current metrics
- compact connected-control strip

General mobile rules:
- one column only
- no sticky right rail
- no giant secondary cards before the main report content
- every section must feel skimmable

## Content Rules

### Tone

The report should feel:
- calm
- intelligent
- specific
- warm
- high-trust

It should not feel:
- breathless
- over-celebratory
- salesy
- overly clinical
- operational

### Language

Prefer:
- personal sleep pattern
- current plan
- wake anchor
- protected sleep window
- what changed and why
- add your plan to Calendar

Avoid:
- delivery center language
- sync/status framing as the main story
- beta/internal operations wording
- technical Google integration language in the main narrative

## Route And Component Responsibilities

### Report route `/report/[sessionId]`

Responsible for:
- report reveal
- plan understanding
- conversion to Google when not connected
- current-plan clarity when connected

Not responsible for:
- beta operations
- internal QA surfaces
- developer testing tools
- detailed delivery diagnostics

### Google connect surface

Responsible for:
- optional connection
- calendar add flow
- compact connected account controls

Not responsible for:
- carrying the whole emotional weight of the report page
- acting like a separate dashboard

## Acceptance Criteria

### Not-connected acceptance criteria

- the user sees real value before connecting Google
- there is one primary CTA only
- the report clearly explains what the calendar adds
- the page makes Google feel like the natural next step
- the page does not feel like a cluttered product dashboard

### Connected acceptance criteria

- the page feels simpler than the current version
- the current plan is the main story
- any update is explained through a compact `What changed and why` block
- disconnect and calendar removal are visible but secondary
- the page does not feel like an operations center
- the connected plan keeps the same timezone the user was shown during report generation

### General acceptance criteria

- the report feels shorter, clearer, and more premium than the current draft
- the user can understand the plan quickly
- the wow moment comes from personalization and structure, not from visual noise
- mobile does not bury the primary action or the current plan

## Relevant Implementation Targets

Current relevant files:

- `src/app/report/[sessionId]/page.tsx`
- `src/components/report/google-connect-card.tsx`
- `src/lib/report.ts`

Important implementation constraint:

- the next implementation should redesign the report as one coherent narrative page, not as "keep everything and rearrange it"

## Recommendation To Implementing Agent

If there is tension between:

- "show more information"
- and "make the report feel stronger and more premium"

choose the cleaner report.

The page should feel like:
- a reveal
- a plan
- and then, only if useful, a live system

not like a multi-widget control panel.
