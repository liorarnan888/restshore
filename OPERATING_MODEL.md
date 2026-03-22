# Operating Model

## Short Answer

Yes, using subagents here is fine.

It is often better than keeping all implementation work in one giant thread.

## The Real Constraint

The problem is not "subagents".
The real problem is:

- one very long main thread
- too much mixed context in one place
- too many unrelated decisions carried forward forever

## Recommended Working Model

### Main thread

Use the main thread for:

- cross-cutting decisions
- priorities
- integration summaries
- acceptance criteria
- backlog shaping

### Focused workstreams

Use focused threads or focused subagent work for:

- calendar sync work
- adaptive engine work
- QA/testing work
- product content work

## Current Suggested Ownership

- `Einstein` -> QA / testing
- `Goodall` -> product content / CBT-I / competitors / SEO
- `Mencius` -> calendar sync
- `Gibbs` -> adaptive engine

## Good Practices

- Give each focused work item:
  - a goal
  - file ownership boundaries
  - acceptance criteria
- Prefer short handoffs over replaying the entire product history.
- Keep context files updated so new threads can start light.

## Anti-Patterns

- using the main thread as the only memory system
- mixing product strategy, clinical policy, QA, sync plumbing, and UI polish in one running conversation forever
- asking multiple agents to edit the same shared files without a clear reason

## Minimal Context Pack

These files are the intended lightweight context pack:

- `PROJECT_STATE.md`
- `WORKSTREAMS.md`
- `DECISIONS.md`
- `TESTING_PLAYBOOK.md`
- `BACKLOG.md`
- `DAILY_CHECKIN_SPEC.md`

This should be enough to start focused work without replaying the whole project history.
