# RestShore Home + Start Screen Spec

Date: 2026-03-22
Status: Source of truth for redesign / re-implementation

## Purpose

This document defines the intended product, content, UX, and layout behavior for two public entry screens:

1. homepage: `/`
2. questionnaire entry screen: `/start`

This spec should be treated as the implementation brief for the next agent. It is intentionally more important than the current draft code if the two are in conflict.

## Background

RestShore is not "just a sleep calendar" and not "just a sleep advice site."

The product promise is:

- take the structure behind CBT-I-inspired sleep support
- turn it into something practical and personalized
- give the user a plan they can actually follow
- optionally place that structure into Google Calendar

The homepage exists to communicate that promise quickly and move people into the questionnaire.

The `/start` page exists to remove marketing friction and let the questionnaire begin cleanly.

## Strategic Positioning

### Core product truth

CBT-I is one of the strongest evidence-backed behavioral approaches for persistent sleep problems.

The real-world problem is not only awareness of the method. It is access:

- time
- cost
- scheduling
- the effort of turning guidance into daily behavior

RestShore's role is to turn that structure into practical output:

- a personalized plan
- a clear summary
- an optional calendar structure

### Tone

The tone should be:

- calm
- intelligent
- credible
- warm
- non-medical in public-facing claims

It should not sound:

- breathless
- salesy
- vague wellness
- cold clinical
- over-explanatory

## Non-Negotiable Design Principles

1. One dominant action per screen.
2. No fake buttons.
3. No decorative chips that look clickable if they are not clickable.
4. Mobile first.
5. The user should understand the product in under 10 seconds.
6. Google is visible as a return path for existing users, but not framed as the main action for new users.
7. The illustration stays, but it supports the story instead of competing with it.

## Screen 1: Homepage `/`

### Primary job

The homepage has one main job:

- explain what RestShore does
- make the user start the questionnaire

### Secondary job

Provide a quiet return path for people who already have a plan:

- `Continue with Google`

This is a secondary path, not a competing hero CTA.

### What the homepage must communicate

The user should quickly understand:

1. this is grounded in CBT-I-inspired structure
2. the product solves the "access + implementation" problem
3. the output is personalized and practical
4. Google is optional and comes later

### What the homepage must not try to do

It must not become:

- an SEO directory
- a support center
- a full trust page
- a beta changelog
- the questionnaire itself

## Homepage Information Hierarchy

Priority order:

1. What is this?
2. Why does this matter?
3. What do I get?
4. Start the questionnaire
5. If I already started, how do I get back?

## Homepage Content Model

### Section A: Minimal header

Contents:

- RestShore logo
- secondary returning-user path: `Already have a plan? Continue with Google`

Rules:

- do not add a top navigation bar
- do not add multiple links in the header
- do not add legal/support links here
- do not style the Google path like the primary CTA

### Section B: Hero

This is the main communication block.

Required elements:

- small eyebrow / beta label
- primary headline
- two short paragraphs
- one primary CTA
- one short helper line
- illustration

### Recommended hero copy

Eyebrow:

- `Free public beta`

Headline:

- `CBT-I, made practical.`
- `A personal sleep plan you can actually follow.`

Supporting paragraph 1:

- `CBT-I is one of the most proven behavioral approaches for persistent sleep problems. The hard part is access: time, cost, scheduling, and the work of turning guidance into real life.`

Supporting paragraph 2:

- `RestShore gives you the practical output: a personal plan, a clear summary, and an optional calendar that carries the structure into your actual week.`

Primary CTA:

- `Start the questionnaire`

Helper line:

- `About 8 to 10 minutes. No Google required to start.`

### Hero illustration

The illustration should remain.

Its role:

- set emotional tone
- make the page feel premium and calm
- support the idea of a night-to-morning transition

Its role is not:

- to explain the product on its own
- to dominate the hero
- to push the CTA below the fold on mobile

Overlay copy on the illustration:

- `What you get`
- `Not another pile of sleep advice. A personal plan, a clear summary, and an optional calendar built from your answers.`

### Section C: Why this exists

This section explains the pain in a more grounded way.

Headline:

- `The method is not the problem. Getting it into real life is.`

Body 1:

- `People do not just need to hear that sleep needs structure. They need a structure that fits their own pattern, arrives in a usable form, and is easier to follow when the night gets hard.`

Body 2:

- `That is the job of RestShore: take what usually gets spread across appointments, notes, and recommendations, and turn it into something concrete, personal, and easier to carry into daily life.`

### Section D: How it works

This should stay compact and scannable.

Three steps only:

1. `Tell us what sleep has looked like`
   - `A short questionnaire that stays focused and personal.`
2. `Get your plan and summary`
   - `A personal sleep structure built from your answers, not generic advice.`
3. `Put the structure on your calendar`
   - `Google only appears at the end, if you want the plan to live there.`

### Section E: Google and trust

This section should be small and quiet.

Purpose:

- explain that Google is optional
- explain that returning users can resume through Google
- keep legal/support accessible

Recommended copy:

- `New users start with the questionnaire. Google only appears at the end, if you want the calendar. If you already have a plan, you can continue with Google and get back to it.`

Secondary line:

- use the existing behavioral-support / non-medical support disclaimer

Links:

- Privacy
- Terms
- Support

## Homepage Visual Rules

### Must do

- keep one clear dominant CTA
- keep the page visually calm
- use generous spacing
- allow the headline to dominate
- keep the illustration elegant and secondary

### Must not do

- do not use badge rows that look like interactive controls
- do not add multiple CTA-like pills
- do not create a crowded glass-card stack
- do not turn every sentence into a chip
- do not add a second strong CTA next to the main one

## Homepage Mobile Rules

Above the fold on mobile must include:

- logo
- quiet Google return path
- hero headline
- supporting copy
- primary CTA

The illustration may start above the fold or just below it, but it must not bury the CTA.

### Mobile layout rules

- one column only
- CTA full width
- Google return path should read like a link or subtle secondary action
- no dense multi-card cluster before the CTA

## Screen 2: Start `/start`

### Primary job

Get the user into the questionnaire with almost no distraction.

### Secondary job

Reassure the user briefly about:

- what happens next
- Google coming later

### What this page must feel like

- focused
- quiet
- immediate
- friction-light

It should feel like the product has started, not like a second landing page.

## Start Page Structure

### Section A: Minimal intro shell

Contents:

- RestShore logo
- `Back home` link
- use only the minimum orientation needed to start
- if the page reads clearly without an intro sentence, prefer removing it

Optional intro sentence:

- `Tell us what sleep has been like, and we will turn it into a structured plan. Google only appears later if you want the calendar.`

### Section B: Questionnaire

Immediately below the header:

- render the intake experience
- do not add marketing sections below it
- do not add testimonials
- do not add feature lists

### Start Page Rules

- the first question should appear as high as possible on mobile
- the intro shell should be compact
- do not spend meaningful vertical space on duration or repeated orientation copy
- do not add decorative chips
- do not add explanatory cards before the intake

## Interaction Flows

### New user flow

1. user lands on `/`
2. reads the promise
3. clicks `Start the questionnaire`
4. lands on `/start`
5. completes intake
6. sees report
7. optionally connects Google at the end

### Returning user flow

1. user lands on `/`
2. clicks `Already have a plan? Continue with Google`
3. completes Google sign-in
4. lands on `/continue`
5. app routes them to:
   - `/report/[sessionId]` if a completed plan exists
   - `/start?resume=...` if an in-progress session exists
   - `/start` if nothing is found

### Google rules

- Google must not be required before the questionnaire
- Google must not be the main CTA for new users
- Google is allowed as a return mechanism for existing users

## Component / Route Responsibilities

### Homepage route `/`

Responsible for:

- positioning
- product promise
- trust framing
- starting the questionnaire
- quiet returning-user path

### Start route `/start`

Responsible for:

- compact intro
- questionnaire entry
- minimal orientation

### Continue route `/continue`

Responsible for:

- resolving returning-user state after Google sign-in
- redirecting to the best next screen

## Analytics

Keep or preserve these events:

- homepage page view
- start page view
- intake started
- email captured
- report generated
- calendar connected

Do not add noisy analytics just for decorative elements.

## Accessibility / UX Requirements

1. Primary CTA must be clearly distinguishable from secondary actions.
2. Non-interactive content must not look like buttons.
3. Links must look like links when they are not buttons.
4. Typography must remain readable on mobile.
5. Contrast must stay strong enough across warm backgrounds.

## Implementation Notes

Current relevant files:

- `src/app/page.tsx`
- `src/app/start/page.tsx`
- `src/app/continue/page.tsx`
- `src/components/launch/continue-with-google-button.tsx`
- `src/components/intake/intake-experience.tsx`

Existing reusable assets:

- `src/components/brand/brand-logo.tsx`
- `public/restshore/hero-illustration.png`

Important implementation constraint:

- the current draft should be treated as a rough intermediate build, not as the final UX reference

## Acceptance Criteria

### Homepage acceptance criteria

- the user can understand the product promise in under 10 seconds
- there is one dominant CTA only
- the Google return path is visibly secondary
- the page does not contain fake-button pills
- the illustration is present without burying the CTA
- the page feels clearly lighter than the previous long-form homepage

### Start page acceptance criteria

- the page feels like the questionnaire has started
- the intro is short and calming
- the first question is visible quickly on mobile
- the mobile view does not waste space on duplicate labels or duration reminders
- there is no extra marketing clutter below the intro

## Out of Scope

This spec does not cover:

- report page redesign
- calendar connection screen redesign
- onboarding emails
- SEO content pages

## Recommendation To Implementing Agent

If there is tension between:

- "more explanation"
- and "cleaner, faster comprehension"

choose cleaner, faster comprehension.

The page should feel editorial and premium, but disciplined.
