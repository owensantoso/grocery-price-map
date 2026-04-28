---
type: implementation-brief
id: IMPL-0001-02
title: Refactor verification gate decision
domain: repo-health
status: draft
created_at: "2026-04-29 00:32:25 JST +0900"
updated_at: "2026-04-29 01:40:51 JST +0900"
parent_plan: PLAN-0001
task_refs:
  - AUDT-0001#FINDING-015
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
  - package.json
  - vitest.config.ts
  - docs/repo-health/audits/audit-profile.md
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# IMPL-0001-02 - Refactor Verification Gate Decision

## Parent Plan

- PLAN-0001

## Task Goal

Decide what verification gate should exist before broad refactors continue.

## Scope

In scope:

- `AUDT-0001#FINDING-015`
- local-only verification risk
- possible CI for test/lint/build
- optional coverage reporting without strict thresholds
- documentation of accepted risk if no CI is added yet

Out of scope:

- full deployment pipeline
- strict coverage thresholds
- paid/hosted CI service setup beyond what the repo already supports

## Implementation Assumptions

- The immediate goal is a lightweight guard before refactors, not a mature release pipeline.
- A local-only gate can be accepted temporarily if the tradeoff is recorded.
- Any CI added should run the same commands agents already use locally.

## Preferred Approach

Prefer the smallest reversible gate that reduces accidental regressions:

1. If the repo is already on GitHub and Actions is acceptable, add one workflow for install, tests, lint, and build.
2. If CI is not desired yet, create a named local verification checklist and mark `FINDING-015` as accepted risk with owner, reason, and revisit trigger.
3. If coverage is added, keep it advisory unless the project already has stable thresholds.

Do not mix deployment, preview environments, or production secrets into this slice.

Refactor gate contract:

- `IMPL-0001-03` and later implementation plans must not continue until this brief records one of these outcomes:
  - CI exists and runs test/lint/build without secrets.
  - local-only verification is accepted in `AUDT-0001` with owner, reason, commands, and revisit trigger.
  - advisory coverage is documented and paired with either CI or accepted local-only risk.
- The selected gate must be reflected in `docs/repo-health/audits/audit-profile.md` if commands or tooling change.

## Execution Steps

1. Check whether the project has a GitHub Actions or other CI convention.
2. Choose one of:
   - add a minimal test/lint/build CI gate
   - add a local verification checklist and explicitly accept no-CI risk for now
   - add coverage reporting only as advisory output
3. Keep the decision small and reversible.
4. Update downstream briefs if the chosen gate changes prerequisite wording.
5. Update audit profile and `AUDT-0001#FINDING-015`.

## Handoff Notes

- If adding GitHub Actions, avoid requiring secrets for the baseline gate.
- If staying local-only, make the risk explicit in `AUDT-0001` and link the verification checklist.
- Record the exact commands in `docs/repo-health/audits/audit-profile.md` if they change.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
scripts/docs-meta check
```

Attach evidence that the selected gate runs locally or that the no-CI risk has a clear owner and revisit trigger.

## Done Checklist

- [ ] Verification gate decision is recorded.
- [ ] CI/local-only/coverage tradeoff is explicit.
- [ ] Audit profile updated if commands change.
- [ ] `AUDT-0001#FINDING-015` updated.
