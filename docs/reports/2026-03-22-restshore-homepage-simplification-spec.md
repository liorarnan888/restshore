# RestShore Homepage Simplification Spec

Date: 2026-03-22

## Goal

The homepage should do only two jobs:

1. explain the product in a few seconds
2. get the user into the questionnaire

It should not try to be a launch memo, support center, policy explainer, feedback hub, and SEO index all at once.

## Current homepage diagnosis

The current homepage in [src/app/page.tsx](C:/Users/USER/Documents/Codex%20-%20CBTi%20-%20Cal/src/app/page.tsx) is trying to carry too many responsibilities in one screen flow:

- a large brand header
- a long hero with multiple paragraphs
- a large image card
- launch highlight chips
- the full intake experience embedded on the same page
- a beta explainer section
- a feedback section
- a dedicated Google/trust section
- a support section
- an "explore more" section with SEO links

This creates three product problems:

1. the page is not immediately scannable
2. the primary action competes with too many secondary messages
3. the mobile experience feels long before it feels clear

## Inspiration findings

Reference set: [docs/research/product-content/04-ux-ui-inspiration.md](C:/Users/USER/Documents/Codex%20-%20CBTi%20-%20Cal/docs/research/product-content/04-ux-ui-inspiration.md)

### Stripe

What matters:

- one dominant message above the fold
- one primary CTA
- trust comes quickly, but in compact form
- the hero art supports the page instead of explaining the product

What to borrow:

- strong hierarchy
- immediate CTA
- compact proof strip

### Linear

What matters:

- very little text
- strong contrast and spacing
- product category is obvious quickly
- the screenshot does real work

What to borrow:

- fewer words
- tighter headline
- more confidence, less explanation

### Notion

What matters:

- clear headline
- short paragraph
- strong CTA block
- trust logos appear early but lightly

What to borrow:

- short explanatory copy
- one simple "why this matters" paragraph
- fast progression to CTA

### Framer

What matters:

- motion and visual energy create momentum
- however, the page still keeps the top story short

What to borrow:

- visual polish
- not the amount of content

### Headspace / Calm

What matters:

- calm, soft tone
- emotionally reassuring language
- clean visual space

What to borrow:

- warmth
- softness
- lower cognitive load

What not to copy:

- generic wellness vagueness

## Strategic conclusion

RestShore should combine:

- Stripe/Linear clarity
- Notion simplicity
- Headspace softness

It should not behave like:

- a launch announcement
- a documentation hub
- a content directory

## New homepage job description

The homepage is a short bridge into the intake.

Its job is to answer only these four questions:

1. What is this?
2. Is it for me?
3. What happens if I start?
4. Can I trust this enough to begin?

If a section does not help answer one of those four questions, it should move off the homepage.

## Recommended product architecture

### Recommendation

The homepage should no longer embed the full intake directly.

Instead:

- homepage = short landing page
- questionnaire = dedicated `/start` experience

Why:

- it lets the homepage stay extremely clear
- it lets the intake feel like a focused conversation
- it reduces mobile clutter and visual competition
- it creates a cleaner mental transition: learn -> start

If keeping the intake on `/` is important for implementation speed, the first CTA should still jump directly into the intake with an immediate full-screen transition and minimal surrounding chrome.

## Proposed homepage structure

### Section 1: Minimal top bar

Contents:

- RestShore logo
- small beta label
- no link farm

Behavior:

- no support, privacy, SEO, or diagnostics links in the top bar
- no test-center or internal launch links on the public homepage

### Section 2: Hero

This is the entire homepage thesis.

Contents:

- short eyebrow
- single H1
- one short supporting paragraph
- one primary CTA
- one short reassurance line

Recommended copy direction:

- eyebrow: `Free beta`
- H1: `A structured sleep plan, on your calendar.`
- supporting line: `Answer a short sleep questionnaire. RestShore turns it into a six-week sleep plan, a clear summary, and an optional Google Calendar you can actually follow.`
- CTA: `Start the questionnaire`
- reassurance line: `No Google connection needed to begin.`

Notes:

- keep the H1 to 2 to 3 lines on mobile
- keep the supporting copy to 2 short sentences maximum
- the CTA should appear above the fold on mobile without scrolling

### Section 3: Compact proof row

This replaces multiple explainer sections.

Contents:

- `Free beta`
- `5 minute questionnaire`
- `Google Calendar optional`

Alternative set:

- `Six-week plan`
- `Doctor-ready summary`
- `Google optional`

Rules:

- 3 items maximum
- no badges wall
- no all-caps marketing noise

### Section 4: How it works

One compact three-step strip or stack.

Steps:

1. `Answer a few questions`
2. `Get your sleep plan`
3. `Add it to Google Calendar if you want`

Copy should stay short enough to scan in under 5 seconds.

### Section 5: Trust note

One small card, not a full section stack.

Contents:

- Google is optional
- access is only requested at the end
- privacy, terms, and support links

Recommended headline:

- `Google access comes later, only if you want the calendar.`

This replaces the separate:

- beta explainer
- Google/trust block
- support block

### Section 6: Footer

Keep only:

- Privacy
- Terms
- Support

Optional:

- one text link to `What is CBT-I inspired?`

Everything else should leave the homepage.

## What should be removed from the homepage

- the large hero illustration card
- the launch highlight chips
- the separate beta explanation section
- the feedback card
- the dedicated Google explanation section
- the dedicated support card
- the "explore more" SEO links section
- the full intake component embedded below the hero

These are not bad surfaces. They are just in the wrong place.

## Mobile-first rules

This redesign should be judged on mobile first, not desktop first.

### Above the fold on mobile must contain

- logo
- H1
- short supporting copy
- primary CTA
- reassurance line

### Mobile layout rules

- no side-by-side hero layout
- no large decorative image above the CTA
- no paragraph longer than 3 lines
- no card stack that makes the CTA feel buried
- no more than 2 sections before the user can act

### Spacing rules

- hero top padding should be smaller than today
- CTA should be full width on mobile
- proof row should wrap gracefully into 2 lines at most

## Visual direction

The page should stay premium, but calmer and quieter.

Use:

- warm neutral base
- one cool accent
- subtle gradient or glow
- one compact product artifact, if any

Avoid:

- large decorative hero art that pushes content down
- multiple glass panels stacked one after another
- excessive badges or pills

## Product artifact recommendation

If we want a visual in the hero, it should be a small product-oriented artifact, not a large editorial illustration.

Best option:

- a compact phone/calendar preview showing the sleep schedule rhythm

Second-best option:

- no hero image at all on mobile

Worst option:

- a large abstract image that competes with the headline

## CTA strategy

There should be one obvious action:

- `Start the questionnaire`

Optional secondary action:

- a subtle text link: `How it works`

But there should not be multiple equal-priority buttons competing in the hero.

## Information hierarchy

Priority order:

1. start the questionnaire
2. understand the product promise
3. trust that Google is optional and that the beta is safe to try

Lower-priority items should move elsewhere:

- feedback collection
- support instructions
- SEO article links
- deep product explanation

## Success criteria

The new homepage is successful if:

- a new visitor understands the product in under 10 seconds
- the primary CTA is visible immediately on mobile
- the page can be described as "short" without qualification
- support/legal/trust are still accessible, but not dominant
- the intake feels like the next step, not like a section buried halfway down a long page

## Suggested implementation shape

### Public homepage

- minimal header
- hero
- proof row
- three-step "how it works"
- compact trust card
- footer

### Intake route

- dedicated narrow-focus intake experience
- almost no marketing chrome
- progress and clarity first

## Recommended next step

Implement the new homepage as a separate simplified shell first, without changing the intake logic.

This gives the team a clean comparison:

- same questionnaire
- much cleaner landing experience
- better mobile behavior

## Sources

- [UX / UI Inspiration Board](C:/Users/USER/Documents/Codex%20-%20CBTi%20-%20Cal/docs/research/product-content/04-ux-ui-inspiration.md)
- [Stripe homepage](https://stripe.com/)
- [Linear homepage](https://linear.app/)
- [Notion homepage](https://www.notion.com/)
- [Framer homepage](https://www.framer.com/)
- [Headspace sleep page](https://www.headspace.com/sleep)
- [Current homepage implementation](C:/Users/USER/Documents/Codex%20-%20CBTi%20-%20Cal/src/app/page.tsx)
