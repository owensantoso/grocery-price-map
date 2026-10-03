---
type: session-log
title: Restore the production dependency audit gate
status: completed
created_at: "2026-10-04 05:22:32 JST +0900"
updated_at: "2026-10-04 05:22:32 JST +0900"
started_at: "2026-10-04 05:08:35 JST +0900"
ended_at: "2026-10-04 05:22:32 JST +0900"
timezone: Asia/Tokyo
participants:
  - Codex
  - GPT-6 Astra reviewer
areas:
  - dependencies
  - ci
related_plans:
  - docs/repo-health/plans/PLAN-0006-objective-hardening-before-product-decisions/PLAN-0006-objective-hardening-before-product-decisions.md
related_briefs:
  - docs/repo-health/plans/PLAN-0006-objective-hardening-before-product-decisions/IMPL-0006-01-dependency-advisories-and-update-workflow.md
related_specs: []
related_adrs: []
related_todos: []
commits: []
---

# Restore the Production Dependency Audit Gate

## Session Metadata

Isolated Windows branch based on main `5d4b59ed8120e18d0c49d8cd0c17de685f7d5189`. This dependency slice is independent of rounding PR #31.

## Goal

Repair the existing production audit gate, which stops CI before tests on main and otherwise unrelated PRs. Baseline: six affected production package entries (one critical, four high, one moderate), and 20 entries in the full audit.

## Timeline

Captured fresh production/full audits; reviewed published package metadata and the [Next maintainer advisory](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j); selected compatible fixed dependencies; refreshed the lock without force fixes; resolved a baseline fixture type error exposed by the newer build; completed local checks and independent Astra review.

## Context Read

Root `AGENTS.md`, dependency brief IMPL-0006-01, CI workflow, manifest/lockfile, query fixture, existing audit evidence and PR #31's failed CI log.

## Changes

- Update Next and matching ESLint configuration from 16.2.4 to 16.3.8.
- Remove the stale Next PostCSS override; upstream now selects 8.5.23 and compatible sharp 0.35.5.
- Refresh ws to 8.22.0, nanoid to 3.3.19 and baseline-browser-mapping to 2.11.27 within existing parent ranges.
- Refresh existing scoped brace-expansion overrides to 1.1.21 and 5.0.12, also within parent ranges.
- Remove two redundant query test-fixture fields. Required id/store_id values still come from the final override spread; the old duplicate assignments now fail the production build's type check.

## Decisions

Keep application behavior and direct React, Supabase, Vitest, TypeScript and jsdom versions unchanged. Do not downgrade Next ESLint as suggested by a dev-audit force fix. Preserve the audit gate and keep remaining development advisories as an open follow-up, rather than declaring accepted risk or clearing every advisory.

## Verification

- `npm ci`: passed with the final lockfile.
- `npm audit --omit=dev`: passed, zero known production findings.
- `npm audit`: still fails with 13 affected development/tooling package entries (nine high, three moderate, one low), reduced from 20. None of the remaining affected package names is new versus baseline.
- `npm test`: 16 files / 48 baseline tests passed; rounding PR #31 is a separate branch and its nine additional cases are not included here.
- `npm run lint`, `npx tsc --noEmit`: passed.
- Missing Supabase production configuration guard: failed with the expected message. Configured `npm run build`: passed, 13 routes, using CI placeholder configuration.
- Astra review: no blockers; complete declared Next/sharp platform lock entries, compatible peers/engines and an independent Windows native sharp resize check. This does not establish Linux or deployed-runtime behavior.

## Follow-ups

Observe Ubuntu/Node 20 CI before integration. Assess the 13 development entries separately: Babel core, humanfs, Next ESLint/plugin, Vitest/mocker, braces/micromatch/fast-glob, browserslist, js-yaml, undici and Vite. Rebase or rerun dependent open PR checks only through their existing owners. No merge or production deployment was performed.
