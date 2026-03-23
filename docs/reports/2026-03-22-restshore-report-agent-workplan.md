# RestShore Report Redesign Agent Workplan

Date: 2026-03-22
Status: Execution handoff for focused agent work

## Purpose

This document translates the report redesign spec into focused workstreams for the existing agent model.

Primary source of truth:
- `docs/reports/2026-03-22-restshore-report-spec.md`

This file exists to make execution parallel, bounded, and low-confusion.

## Core Rule

The report redesign must be implemented as one coherent product change, but the work should be split by system ownership.

Do not let every agent edit everything.
Do not let multiple agents freely edit the same shared files without a clear handoff.

## The Agents To Use

### 1. Goodall

Role:
- product content
- CBT-I framing
- user-facing report language
- connected vs not-connected messaging
- wow-through-clarity, not wow-through-noise

### 2. Mencius

Role:
- Google Calendar connection experience
- connected/unconnected state mechanics
- compact connection UI
- disconnect / remove calendar interactions

### 3. Gibbs

Role:
- adaptive plan state
- current-plan selection
- `What changed and why` data contract
- future-facing report state logic

### 4. Einstein

Role:
- regression coverage
- state matrix
- acceptance tests
- report QA checklist

## Main-Thread Ownership

The main thread or integration owner should own:
- final page composition
- cross-agent conflict resolution
- shared file integration
- visual cleanliness review
- final acceptance pass

## Shared Files

These files should be treated as shared integration surfaces:
- `src/app/report/[sessionId]/page.tsx`
- `src/lib/report.ts`
- `src/lib/types.ts`
- `src/lib/session-service.ts`

Agents should avoid editing shared files until their upstream design/data decisions are clear.

## Workstream A: Goodall

### Goal

Define exactly how the new report should speak in both states:
- not connected
- connected

### Inputs

- `docs/reports/2026-03-22-restshore-report-spec.md`
- current `src/lib/report.ts`
- current `src/app/report/[sessionId]/page.tsx`
- product content research docs

### Deliverables

- final copy skeleton for:
  - hero
  - sleep snapshot
  - shaping-your-sleep section
  - 6-week plan section
  - calendar-add value block
  - doctor-ready summary
  - connected `What changed and why`
- section titles to keep
- section titles to kill
- exact language rules for:
  - behavioral-support framing
  - not connected CTA
  - connected strip

### Must decide

- the exact user-facing headline strategy
- how to make the report feel personal immediately
- what the user should read first in each state
- how to keep doctor-ready value without creating a clinical wall

### Must not own

- component layout details
- Google auth mechanics
- adaptive engine logic

### Likely files

- spec docs
- optionally copy-rich report rendering code

## Workstream B: Mencius

### Goal

Turn the current Google report surface from a large standalone card into a compact embedded report state.

### Inputs

- `docs/reports/2026-03-22-restshore-report-spec.md`
- current `src/components/report/google-connect-card.tsx`
- current `src/app/report/[sessionId]/page.tsx`

### Deliverables

- compact `not connected` upsell strip or hero module
- compact `connected` control strip
- compact `connecting / syncing` transitional state
- preserved support for:
  - Google sign-in
  - calendar grant
  - connect flow
  - disconnect
  - remove calendar

### Must decide

- what parts of the current card survive as reusable logic
- whether to split into subcomponents
- how the connect state fits inside the hero without recreating a side dashboard

### Must not own

- report narrative content
- which report sections survive
- adaptive explanation policy

### Likely files

- `src/components/report/google-connect-card.tsx`
- possible new small report Google components
- `src/app/report/[sessionId]/page.tsx`

## Workstream C: Gibbs

### Goal

Define the data layer for `current plan` and `What changed and why` so the report can show a clean live state without exposing internal engine clutter.

### Inputs

- `docs/reports/2026-03-22-restshore-report-spec.md`
- `src/lib/adaptive-plan.ts`
- `src/lib/session-service.ts`
- `src/lib/types.ts`
- `src/app/report/[sessionId]/page.tsx`

### Deliverables

- current-plan selector for the report
- compact `What changed and why` summary contract
- clear rules for when that block appears
- suppression rules when there is no meaningful change

### Must decide

- what counts as a report-worthy change
- what metadata the report needs vs what should stay internal
- whether `getAdaptivePlanSummary(...)` is enough or should be replaced by a tighter report-specific mapper

### Must not own

- CTA language
- visual composition
- Google connection UI

### Likely files

- `src/lib/adaptive-plan.ts`
- `src/lib/session-service.ts`
- `src/lib/types.ts`

## Workstream D: Einstein

### Goal

Make the redesign safe to ship by covering the new report states and preventing the old clutter from creeping back.

### Inputs

- final spec
- final section inventory
- final connected/not-connected behavior

### Deliverables

- report state test matrix
- regression tests for:
  - report without Google
  - report with Google connected
  - report with plan changes
  - report without plan changes
  - report with no change-summary block
- human-readable QA checklist for the final page

### Must decide

- which behavior is covered by automated tests
- which behavior is left to manual UX QA

### Must not own

- page content strategy
- Google flow design
- adaptive policy design

### Likely files

- report tests
- `TESTING_PLAYBOOK.md`
- optional QA notes doc

## Suggested Order

### Phase 1: Lock the narrative and data contract

Run first:
- Goodall
- Gibbs

These two must define:
- what the report says
- what data the report needs

Without that, UI work will keep thrashing.

### Phase 2: Build the compact Google layer

Run second:
- Mencius

Once the page hierarchy and state rules are stable, Google UI can be reduced and embedded correctly.

### Phase 3: Integration

Run third:
- main thread / integration owner

Tasks:
- compose the final report route
- remove obsolete surfaces
- ensure the page reads as one story

### Phase 4: QA

Run last:
- Einstein

Tasks:
- test matrix
- regressions
- visual cleanliness checklist

## Integration Checklist

The integration owner should not consider the redesign done until all of the following are true:

- the page is one-column or effectively one-story on all breakpoints
- there is no sticky right-rail experience
- there is one primary action only in the not-connected state
- the connected state shows a current plan, not a control center
- `What changed and why` appears only when meaningful
- no beta/debug/test surfaces remain in the product-facing report
- no duplicate plan views remain
- the wow moment comes from the hero + plan clarity, not UI noise

## Explicitly Out Of Scope For This Report Initiative

These should not be pulled into this redesign:
- homepage redesign
- start-page redesign
- check-in flow redesign
- calendar creation wow-moment redesign
- public support/privacy/terms redesign
- doctor escalation page redesign beyond the compact report summary

## Recommended First Prompts

### Goodall prompt

Use `docs/reports/2026-03-22-restshore-report-spec.md` as source of truth. Audit the current report copy in `src/app/report/[sessionId]/page.tsx` and `src/lib/report.ts`. Produce a decision-complete copy skeleton for the redesigned report in both states: not connected and connected. Focus on wow-through-clarity, behavioral-support framing, and compact doctor-ready credibility. Do not design layout. Output the exact section titles, section purposes, and preferred user-facing copy direction.

### Gibbs prompt

Use `docs/reports/2026-03-22-restshore-report-spec.md` as source of truth. Audit the current adaptive-report data flow in `src/lib/adaptive-plan.ts`, `src/lib/session-service.ts`, and `src/lib/types.ts`. Define the minimum clean data contract the redesigned report needs for `current plan` and `What changed and why`. Focus on suppressing internal clutter and showing only meaningful user-facing change summaries.

### Mencius prompt

Use `docs/reports/2026-03-22-restshore-report-spec.md` as source of truth. Audit the current Google report surface in `src/components/report/google-connect-card.tsx` and `src/app/report/[sessionId]/page.tsx`. Design the compact not-connected upsell state, connected state, and transitional connecting/syncing state that fit inside a clean report hero. Preserve Google functionality while removing dashboard-like sprawl.

### Einstein prompt

Use `docs/reports/2026-03-22-restshore-report-spec.md` as source of truth. Create the QA matrix for the report redesign: not connected, connected, connected with updates, connected without updates, and edge cases. Focus on regression risks, clutter reintroduction, state correctness, and mobile acceptance.
