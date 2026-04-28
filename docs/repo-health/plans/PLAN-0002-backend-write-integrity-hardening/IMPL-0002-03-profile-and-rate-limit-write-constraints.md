---
type: implementation-brief
id: IMPL-0002-03
title: Profile and rate-limit write constraints
domain: repo-health
status: draft
created_at: "2026-04-29 00:25:41 JST +0900"
updated_at: "2026-04-29 01:01:18 JST +0900"
parent_plan: PLAN-0002
task_refs:
  - AUDT-0001#FINDING-005
  - AUDT-0001#FINDING-006
owner:
areas: []
depends_on: []
parallel_with: []
related_specs: []
related_adrs: []
related_sessions: []
related_issues: []
related_prs: []
linked_paths:
  - docs/repo-health/audits/AUDT-0001-mvp-stabilization-risk-audit.md
  - src/app/actions.ts
  - supabase/migrations/202603220003_action_rate_limits.sql
  - supabase/migrations/202603230002_profiles_self_update.sql
  - docs/BACKEND_SCHEMA.md
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# IMPL-0002-03 - Profile And Rate-Limit Write Constraints

## Parent Plan

- PLAN-0002

## Task Goal

Tighten two smaller write boundaries found in `AUDT-0001`: profile self-update scope and app-side rate-limit race behavior.

## Scope

In scope:

- `AUDT-0001#FINDING-005`
- `AUDT-0001#FINDING-006`
- profile updates intended to change only `public_name`
- rate-limit logic in `consumeRateLimit`
- Supabase migrations or RPCs needed to enforce the intended constraints

Out of scope:

- full roles/admin model
- moderation/reporting
- changing the configured rate-limit thresholds unless explicitly justified
- production abuse analytics

## Implementation Assumptions

- The settings UI currently intends profile self-service editing for `public_name` only.
- Existing action names, windows, and thresholds are product behavior and should not drift during this slice.
- The rate-limit fix can be a documented accepted risk if the cost of an atomic DB function is not worth it before public launch.

## Preferred Approach

Handle the two findings independently unless a shared migration naturally covers both.

For profile self-update:

1. Check whether column-level privileges are compatible with the current Supabase client path.
2. If not, prefer a trigger or RPC that rejects changes outside `public_name` and expected timestamp fields.
3. Keep existing settings-page validation and error copy stable.

For rate limiting:

1. First decide whether MVP acceptance is legitimate. If accepted, write the owner, reason, and trigger for revisiting.
2. If fixing, prefer a single database function that checks and records consumption in one transaction, using row/table locking or an equivalent constraint-backed approach so concurrent calls cannot all pass the same count.
3. Keep the TypeScript caller small so future actions can keep using the same helper.

## Execution Steps

1. For profile updates, decide whether to use column-level privileges, trigger validation, or an RPC.
2. Preserve the existing settings page behavior.
3. For rate limits, decide whether the current race is acceptable for MVP or should move into an atomic DB function.
4. If implementing atomic rate limiting, keep existing action names, limits, and windows.
5. Verify with a documented concurrent-call check when practical, or record the exact manual SQL/test still needed.
6. Update migrations/docs and audit finding statuses.

## Handoff Notes

- Do not bundle threshold tuning with race-condition work.
- Include the exact columns a user may update on `profiles`.
- Include a short concurrency note for the rate-limit decision, even if the decision is to defer.
- If implementing the DB function, include whether it uses a lock, unique/constraint-backed bucket, or another concurrency control mechanism.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
scripts/docs-meta review --type audit-findings
```

Attach evidence for:

- settings page profile update still works for `public_name`
- an unintended profile column cannot be changed directly, or the remaining risk is accepted
- rate-limit behavior is unchanged for normal single requests

## Done Checklist

- [ ] Profile self-update scope matches the username-only settings surface or accepted risk is documented.
- [ ] Rate-limit race is fixed atomically or accepted with reason and revisit trigger.
- [ ] Existing settings and write actions still pass verification.
- [ ] `AUDT-0001#FINDING-005` and `AUDT-0001#FINDING-006` updated.
