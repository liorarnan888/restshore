# Workstreams

## Why This Exists

This project has grown large enough that work should be split by system ownership, not by random tasks. This file is the quick map of who owns what.

## Main Workstreams

### QA / Testing

- Owner concept: `Einstein`
- Focus:
  - regression tests
  - deterministic scenarios
  - Test Center
  - Adaptation Lab
  - human-readable QA surfaces
- Typical files:
  - `src/lib/*.test.ts`
  - `src/app/test-center/*`
  - `src/components/report/adaptation-preview-card.tsx`

### Product Content / CBT-I / Competitors / SEO

- Owner concept: `Goodall`
- Focus:
  - CBT-I content policy
  - product language and tone
  - user pain understanding
  - competitor/product research
  - SEO-aware messaging
- Typical files:
  - specs
  - backlog/docs
  - user-facing copy-rich files
  - future marketing content

### Calendar Sync

- Owner concept: `Mencius`
- Focus:
  - Google Calendar integration
  - event generation for sync purposes
  - sync/update/delete
  - retries and performance
  - calendar build/delivery UX
- Typical files:
  - `src/lib/integrations.ts`
  - Google integration routes
  - calendar delivery UI

### Adaptive Engine

- Owner concept: `Gibbs`
- Focus:
  - daily logs
  - rule engine
  - thresholds
  - future-only updates
  - edge cases
  - explainability
- Typical files:
  - `src/lib/adaptive-plan.ts`
  - `src/lib/daily-checkin.ts`
  - adaptation tests

## Shared Areas

These are shared and should be edited carefully:

- `src/lib/types.ts`
- `src/lib/session-service.ts`
- `BACKLOG.md`
- `README.md`

## Safe Working Pattern

1. Keep the main thread for:
   - cross-cutting decisions
   - integration
   - prioritization
   - short summaries
2. Use focused threads or focused subagent work for:
   - one workstream at a time
   - one acceptance target at a time
3. Prefer short handoffs instead of loading full history every time.

## What Not To Do

- Do not keep all design, product, QA, integration, and engine work in one giant thread forever.
- Do not make a subagent own unrelated systems.
- Do not let multiple agents freely edit the same shared files without a clear purpose.
