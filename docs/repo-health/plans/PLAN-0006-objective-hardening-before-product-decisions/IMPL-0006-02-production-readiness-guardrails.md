---
type: implementation-brief
id: IMPL-0006-02
title: Production readiness guardrails
domain: repo-health
status: completed
created_at: "2026-04-29 05:25:00 JST +0900"
updated_at: "2026-04-29 05:44:24 JST +0900"
parent_plan: PLAN-0006
task_refs:
  - AUDT-0002#FINDING-001
  - AUDT-0002#FINDING-002
  - AUDT-0002#FINDING-003
  - AUDT-0002#FINDING-004
owner:
areas:
  - operations
  - supabase
  - diagnostics
depends_on:
  - IMPL-0006-01
parallel_with: []
related_specs: []
related_adrs: []
related_sessions: []
related_issues: []
related_prs: []
linked_paths:
  - src/lib/supabase/env.ts
  - src/app/auth/callback/route.ts
  - src/lib/price-log-photo-actions.ts
  - README.md
  - docs/BACKEND_SCHEMA.md
  - supabase/migrations/
repo_state:
  based_on_commit: 81ec608aea076e5ca7bde8eae8466d838c68033f
  last_reviewed_commit: 81ec608aea076e5ca7bde8eae8466d838c68033f
---

# IMPL-0006-02 - Production Readiness Guardrails

## Parent Plan

- PLAN-0006

## Task Goal

Make production/demo boundaries explicit and create the minimum operational runbooks needed to verify deploys, migrations, rollback, and failures.

## Scope

In scope:

- fail closed when production code runs without required Supabase URL and anon key
- preserve local/demo development behavior through explicit non-production checks
- add or update docs for staging/live migration order and verification
- add a lightweight deploy and rollback runbook
- add minimal diagnostics for OAuth callback and storage/photo failure paths
- update README guidance so production setup cannot be mistaken for optional demo setup

Out of scope:

- selecting a hosting provider or paid observability provider
- applying migrations to a live Supabase project from this repo
- changing auth providers or storage architecture
- defining production owner/on-call process beyond a small runbook placeholder

## Execution Steps

1. Inspect `src/lib/supabase/env.ts` and all call sites that depend on demo fallback.
2. Add an explicit production guard that errors when required Supabase env vars are absent in production.
3. Preserve local/demo mode in development and test with an obvious helper name or branch.
4. Add a DB migration checklist covering clean staging/live-like apply, trigger bypass verification, profile update checks, and rate-limit RPC checks.
5. Add a deploy/rollback runbook with prerequisites, release steps, post-deploy smoke checks, and rollback steps.
6. Add minimal auth/storage diagnostics that are useful without choosing a provider: structured server logs and user-facing auth error propagation where appropriate.
7. Update `AUDT-0002` finding routes/statuses after implementation.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
scripts/docs-meta check
```

Manual verification:

- Run a production-mode env check with missing Supabase vars and verify it fails loudly.
- Run normal development/test flows without Supabase vars and verify demo-mode behavior still works where intended.
- Walk through the migration checklist against a disposable or local Supabase target if credentials/tooling are available.

## Done Checklist

- [x] Production missing-env fallback is blocked or fails loudly.
- [x] Local/demo fallback remains explicit and documented.
- [x] DB migration verification checklist exists.
- [x] Deploy/rollback runbook exists.
- [x] Auth/storage failure diagnostics are improved without provider lock-in.
- [x] `AUDT-0002#FINDING-001` through `AUDT-0002#FINDING-004` are updated.
