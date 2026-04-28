---
type: implementation-brief
id: IMPL-0006-01
title: Dependency advisories and update workflow
domain: repo-health
status: completed
created_at: "2026-04-29 05:25:00 JST +0900"
updated_at: "2026-04-29 05:27:01 JST +0900"
parent_plan: PLAN-0006
task_refs:
  - AUDT-0002#FINDING-021
  - AUDT-0002#FINDING-022
  - AUDT-0002#FINDING-023
owner:
areas:
  - dependencies
  - ci
depends_on: []
parallel_with: []
related_specs: []
related_adrs: []
related_sessions: []
related_issues: []
related_prs: []
linked_paths:
  - package.json
  - package-lock.json
  - .github/dependabot.yml
  - .github/workflows/ci.yml
repo_state:
  based_on_commit: 81ec608aea076e5ca7bde8eae8466d838c68033f
  last_reviewed_commit: 81ec608aea076e5ca7bde8eae8466d838c68033f
---

# IMPL-0006-01 - Dependency Advisories and Update Workflow

## Parent Plan

- PLAN-0006

## Task Goal

Remove known production dependency advisories and add a lightweight workflow so future dependency advisories are noticed without another manual audit pass.

## Scope

In scope:

- upgrade `next` and `eslint-config-next` to a non-vulnerable `16.2.x` or later patch release
- refresh `package-lock.json`
- update `vitest` and directly pinned test/tooling dependencies as needed to clear or reduce dev-only audit findings
- add a dependency update workflow such as Dependabot for npm and GitHub Actions
- add a CI or scheduled check for `npm audit --omit=dev`
- document any remaining dev-only advisory as accepted risk only if the package ecosystem has no reasonable fixed version

Out of scope:

- changing app behavior
- replacing the package manager
- broad framework migrations beyond advisory fixes
- SHA-pinning GitHub Actions, which is currently an accepted risk in `AUDT-0002#FINDING-024`

## Execution Steps

1. Run `npm audit --omit=dev --json` and `npm audit --json` to capture the starting advisory set.
2. Update `next` and `eslint-config-next` to the smallest fixed compatible version.
3. Update `vitest` or other directly pinned dev tooling only as needed to address dev audit findings.
4. Add `.github/dependabot.yml` for npm and GitHub Actions update PRs.
5. Add a CI or scheduled production dependency audit gate that runs `npm audit --omit=dev`.
6. Refresh docs/audit routes after verification.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm audit --omit=dev
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm audit
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
scripts/docs-meta check
```

## Done Checklist

- [x] Production dependency audit no longer reports the `next`/`postcss` advisories.
- [x] Dev/tooling audit is cleared or any remaining dev-only advisory has an explicit accepted-risk note.
- [x] Dependency update PR workflow exists.
- [x] CI or scheduled automation checks production dependency advisories.
- [x] `AUDT-0002#FINDING-021`, `AUDT-0002#FINDING-022`, and `AUDT-0002#FINDING-023` are updated.

## Implementation Notes

- Updated `next` and `eslint-config-next` from `16.2.1` to `16.2.4`.
- Updated `vitest` from `4.1.0` to `4.1.5`.
- Added scoped npm overrides for vulnerable transitive `postcss`, `picomatch`, and `brace-expansion` versions still selected by otherwise current direct dependencies.
- Added Dependabot weekly npm and GitHub Actions update checks.
- Added `npm audit --omit=dev` to CI after `npm ci`.
