---
type: plan
id: PLAN-0006
title: Objective hardening before product decisions
domain: repo-health
status: draft
created_at: "2026-04-29 05:14:02 JST +0900"
updated_at: "2026-04-29 08:47:30 JST +0900"
owner: 
sequence:
  roadmap: "6"
  sort_key: "006"
  lane: repo-health
  after: [PLAN-0005]
  before: []
areas: []
related_specs: []
related_adrs: []
related_sessions: []
related_issues: []
related_prs: []
linked_paths:
  - docs/repo-health/audits/AUDT-0002-second-pass-risk-blind-spot-audit.md
  - package.json
  - package-lock.json
  - .github/workflows/ci.yml
  - next.config.ts
  - src/lib/supabase/env.ts
  - src/app/auth/callback/route.ts
  - src/app/actions.ts
  - src/lib/action-validation.ts
  - src/components/forms/price-log-form.tsx
  - src/lib/price-log-draft.ts
  - src/lib/price-log-draft.test.ts
  - src/components/stores/store-directory-map.tsx
  - src/components/map/store-location-picker.tsx
  - src/components/navigation/header-search.tsx
  - supabase/migrations/
repo_state:
  based_on_commit: 81ec608aea076e5ca7bde8eae8466d838c68033f
  last_reviewed_commit: 81ec608aea076e5ca7bde8eae8466d838c68033f
---

# PLAN-0006 - Objective hardening before product decisions

## Goal

Fix the high-confidence engineering and repo-health issues from `AUDT-0002` that do not need a product, governance, or launch-positioning decision.

This plan deliberately excludes choices that need human judgment: country/tax scope, online-store semantics, append-only history policy, moderation policy shape, default-handle migration policy, account deletion/anonymization policy, and production storage retention policy.

## Architecture

Preserve the current app shape:

- Next App Router routes and server actions stay the product boundary.
- Supabase migrations stay the backend source of truth.
- Public display data should continue to flow through public read models such as `public_profiles`; private profile data should stay owner-scoped.
- Production guardrails should fail closed for production while preserving local/demo development paths.
- Dependency hygiene should become routine CI/repo maintenance rather than an occasional manual audit.

## Task Dependencies / Parallelization

Recommended execution order:

1. `IMPL-0006-01` first, because the production dependency advisory is an active high-severity risk.
2. `IMPL-0006-02` next, because production guardrails and runbooks determine how later DB and deploy fixes are verified.
3. `IMPL-0006-03` after `IMPL-0006-02` or in parallel with non-overlapping work, because it includes DB policy and validation changes.
4. `IMPL-0006-04` and `IMPL-0006-05` can run after the shared verification baseline is healthy; they touch UI/workflow surfaces only.
5. `IMPL-0006-06` can run after `IMPL-0006-02`; prefer doing it before feature-heavy work if observability is the priority.

Safe parallelization:

- `IMPL-0006-01` can run beside docs-only portions of `IMPL-0006-02`.
- `IMPL-0006-04` and `IMPL-0006-05` can run in parallel if their edits to `src/components/forms/price-log-form.tsx` are coordinated.
- Do not run overlapping Supabase migration work in parallel with profile/text constraint work unless one owner coordinates migration numbering.

## Implementation Tasks

- [x] `IMPL-0006-01` - update vulnerable dependencies and add a dependency advisory workflow.
- [x] `IMPL-0006-02` - add production env gates, migration/deploy/rollback runbooks, and minimal diagnostic surfaces.
- [x] `IMPL-0006-03` - restrict private profile reads, add profile-update rate limiting, and add bounded public text validation/constraints.
- [x] `IMPL-0006-04` - add public-photo warning text and map/search keyboard resilience.
- [x] `IMPL-0006-05` - preserve price-log draft state across missing item/store creation.
- [x] `IMPL-0006-06` - add a provider-neutral diagnostic tracing foundation.
- [x] Update `AUDT-0002` finding statuses/routes as each brief completes.
- [ ] Record a session log when the plan completes.

## Validation

Run the normal verification set after each code-bearing brief:

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
scripts/docs-meta check
scripts/docs-meta review --type audit-findings
```

Additional brief-specific checks are listed in each `IMPL-*` file.

## Completion Criteria

- `npm audit --omit=dev` has no unresolved production vulnerabilities, or any remaining production advisory has a documented accepted-risk rationale.
- Production/demo env behavior is explicit and production missing-env builds/runtime paths fail closed.
- Release, rollback, and DB migration verification steps exist in durable docs.
- Private profile data is owner-scoped; public display data still works through public surfaces.
- Public text inputs have app and DB length bounds.
- Remaining included UI/workflow resilience issues are fixed or explicitly re-routed.
- All judgment-heavy `AUDT-0002` findings are marked deferred or left out of this plan with a clear reason.
