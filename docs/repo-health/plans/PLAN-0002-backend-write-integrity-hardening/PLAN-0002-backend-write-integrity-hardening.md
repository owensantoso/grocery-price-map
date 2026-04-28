---
type: plan
id: PLAN-0002
title: Backend write integrity hardening
domain: repo-health
status: in_progress
created_at: "2026-04-29 00:25:41 JST +0900"
updated_at: "2026-04-29 02:39:08 JST +0900"
owner: 
sequence:
  roadmap: "2"
  sort_key: "002"
  lane: repo-health
  after: []
  before: []
areas: []
related_specs: []
related_adrs: []
related_sessions:
  - docs/repo-health/session-logs/2026-04-29-price-log-write-integrity-boundary.md
related_issues: []
related_prs: []
linked_paths:
  - docs/repo-health/audits/AUDT-0001-mvp-stabilization-risk-audit.md
  - src/app/actions.ts
  - src/lib/photos.ts
  - src/lib/supabase/server.ts
  - supabase/migrations/202604290001_price_log_integrity.sql
  - supabase/migrations/
  - docs/BACKEND_SCHEMA.md
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# PLAN-0002 - Backend write integrity hardening

## Goal

Harden the write-side trust boundary before wider public use or large server-action refactors.

This plan responds to the backend/data-integrity findings from `AUDT-0001`:

- `FINDING-001`: authenticated clients can bypass server-action-calculated `price_logs` integrity
- `FINDING-004`: photo storage and DB mutations are not atomic
- `FINDING-005`: profile self-update policy is broader than the product intends
- `FINDING-006`: DB-backed rate limiting is count-then-insert and race-prone

The intent is not to redesign the product. The intent is to preserve current user-facing behavior while moving critical integrity assumptions closer to the backend boundary.

## Architecture

Current write path:

1. Browser submits forms or vote controls.
2. `src/app/actions.ts` validates/authenticates and calculates trusted values.
3. Server actions write directly to Supabase tables/storage.
4. RLS mostly checks ownership/public-read/auth-write rules.

Risk:

- A direct authenticated Supabase client can bypass some server-action calculations and write table fields that the app treats as trusted.
- Storage operations and DB writes are coordinated in app code but cannot be atomic across Supabase Storage and Postgres.

Target direction:

- Keep server actions as the product write entry point.
- Add DB-side guardrails for fields that must stay trustworthy even when clients bypass the UI.
- Add compensating cleanup or safer ordering around photo mutation failure paths.
- Narrow overly broad update permissions where product behavior is intentionally smaller.

## Task Dependencies / Parallelization

Recommended order:

1. Finish `IMPL-0001-03` characterization coverage first if practical, then run `IMPL-0002-01` before `IMPL-0005-01` splits `actions.ts`.
2. `IMPL-0002-01` defines and implements the price-log integrity boundary. It is the highest-risk item and may affect later tests/migrations.
3. `IMPL-0002-02` improves photo mutation compensation after the price-log row shape is clear.
4. `IMPL-0002-03` can run separately if it only touches profile/rate-limit migrations and helper code, but avoid parallel Supabase migration edits unless file ownership is explicit.

Do not start broad `actions.ts` module splitting while this plan is in flight unless the split is strictly mechanical and covered by tests.

## Implementation Tasks

- [x] `IMPL-0002-01` - define and enforce the price-log write integrity boundary.
- [ ] `IMPL-0002-02` - add safer photo mutation compensation around create/update/delete failure paths.
- [ ] `IMPL-0002-03` - narrow profile update permissions and make rate limiting atomic or explicitly accepted as MVP risk.
- [ ] Update `docs/BACKEND_SCHEMA.md` and relevant audit finding statuses after implementation.
- [ ] Add a session log for each completed brief.

## Validation

Baseline validation:

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
scripts/docs-meta check
scripts/docs-meta check-links
scripts/docs-meta review --type audit-findings
```

Backend-specific validation should include migration review and, where practical, mocked Supabase/action tests for failure paths before applying schema changes to a live project.

## Completion Criteria

- `price_logs` integrity assumptions are enforced or explicitly documented at the backend boundary.
- Photo upload/remove failure modes have compensating cleanup or safer ordering.
- Profile update permissions match the product’s username-only setting surface.
- Rate limiting is atomic, or the race risk is explicitly accepted with a reason and revisit trigger.
- `AUDT-0001` findings `FINDING-001`, `FINDING-004`, `FINDING-005`, and `FINDING-006` are updated to `resolved`, `deferred`, or `accepted-risk` with evidence.
