---
type: implementation-brief
id: IMPL-0001-02
title: Risk coverage before refactor
domain: repo-health
status: draft
created_at: "2026-04-28 22:51:03 JST +0900"
updated_at: "2026-04-29 00:33:00 JST +0900"
parent_plan: PLAN-0001
task_refs:
  - AUDT-0001#FINDING-002
  - AUDT-0001#FINDING-009
  - AUDT-0001#FINDING-010
  - AUDT-0001#FINDING-011
owner: 
areas: []
depends_on:
  - IMPL-0001-01
parallel_with: []
related_specs: []
related_adrs: []
related_sessions: []
related_issues: []
related_prs: []
linked_paths:
  - docs/repo-health/audits/AUDT-0001-mvp-stabilization-risk-audit.md
  - src/app/actions.ts
  - src/lib/queries.ts
  - src/components/forms/price-log-form.tsx
  - src/components/forms/autocomplete-field.tsx
  - src/components/logs/log-vote-controls.tsx
  - src/lib/pricing.test.ts
  - src/lib/demo-data.test.ts
  - src/lib/measurements.test.ts
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# IMPL-0001-02 - Risk coverage before refactor

## Parent Plan

- PLAN-0001

## Task Goal

Add enough focused coverage that cleanup can move code without silently changing user-visible behavior.

## Scope

In scope:

- compare ordering and normalized-price behavior
- demo-data fallback assumptions
- create/edit/delete log validation paths that can be tested without a live Supabase project
- vote/comment pure helpers if extracted during test work
- cache/revalidation expectations documented where direct testing is awkward
- live read-model behavior that currently exists only inside `src/lib/queries.ts`
- a small component-test slice for the highest-risk frontend behavior if it can be added without a broad UI refactor

Out of scope:

- full browser E2E suite
- live Supabase integration tests
- new product behavior
- solving backend integrity findings from `PLAN-0002`
- full frontend accessibility cleanup

## Execution Steps

1. Identify pure functions already covered and where coverage is missing.
2. Prefer extracting small pure helpers only when that makes current behavior testable.
3. Add write-side coverage for at least one server-action-adjacent path from `AUDT-0001#FINDING-002`.
4. Add read-side coverage for live compare/feed/detail semantics from `AUDT-0001#FINDING-009` and `AUDT-0001#FINDING-010`.
5. Add a tiny component coverage slice from `AUDT-0001#FINDING-011`, or document why it is deferred.
6. Keep fixtures small and representative.
7. Document any behavior that cannot be tested locally yet.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
```

## Done Checklist

- [ ] Tests cover at least one risky read-side behavior and one risky write-side behavior, or explain why write-side coverage is deferred.
- [ ] Demo/live parity or live read-model semantics are covered before `queries.ts` splitting.
- [ ] At least one high-risk frontend behavior is covered or explicitly deferred.
- [ ] No broad refactor is mixed into test setup.
- [ ] Verification complete.
