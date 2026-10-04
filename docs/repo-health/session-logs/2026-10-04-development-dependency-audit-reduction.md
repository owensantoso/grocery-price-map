---
type: session-log
title: Reduce development dependency advisories with a compatible lock refresh
status: completed
created_at: "2026-10-04 11:29:00 JST +0900"
updated_at: "2026-10-04 11:29:00 JST +0900"
started_at: "2026-10-04 11:08:22 JST +0900"
ended_at: "2026-10-04 11:29:00 JST +0900"
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

# Reduce Development Dependency Advisories

## Scope and Dependencies

Isolated Windows candidate based on production dependency repair PR #32 at `41fa80875686eb911e6506c8c5fe75ae610a82f8`. The rounding and store-identity candidates are separate proposals. This candidate changes only the dependency lock and this receipt; the manifest, security overrides, application code, framework versions, CI workflow, auth and SQL are unchanged.

The dependency brief explicitly allows compatible tooling updates. No unresolved visual, taxonomy or observation-history direction was selected.

## Resolved Graph

| Package | Before | After |
| --- | --- | --- |
| Vitest and pinned siblings | 4.1.5 | 4.1.11 |
| Vite | 8.0.10 | 8.0.16 |
| Babel core | 7.29.0 | 7.29.6 |
| humanfs node | 0.16.7 | 0.16.8 |
| Browserslist | 4.28.1 | 4.28.7 |
| js-yaml | 4.1.1 | 4.3.2 |
| Undici | 7.25.0 | 7.29.1 |

All targets fit the existing parent ranges. js-yaml and Undici updates stay within their existing major versions but are not patch-only updates. Vite requires Rolldown 1.0.3 instead of 1.0.0-rc.17; all 15 declared optional bindings remain locked. Next 16.3.8 and sharp 0.35.5 keep all nine and 25 declared optional edges respectively, including Windows and Linux bindings.

The only changed production-marked package is shared `caniuse-lite`, from 1.0.30001780 to 1.0.30001814. Browserslist 4.28.7 requires at least 1.0.30001806; Next's existing range also admits the selected version. Shared PostCSS, direct React/Supabase/Next, SWC and sharp versions remain unchanged. This is not a claim that every development lock update leaves the production graph immutable.

## Resolver Diagnosis

npm 10.9.2 and 10.9.7 crashed in Arborist's peer-set loader before updating the lock. A task-owned minimal fixture reproduced the crash without security overrides. Instrumentation of a task-owned npm copy located a detached Vitest 5.0.3 node while resolving its optional browser-preview peer through optional Vite developer-tool peers. No Vitest 5 migration was performed.

A temporary task-local npm 11.8.0 CLI on Node 22.14 generated the minimum compatible lock. Exact targets were first selected in a scratch manifest; the original manifest was restored byte-for-byte before regenerating root lock metadata. The resulting lock cleanly installs with ordinary npm 10.9.2. No global npm installation, package-manager replacement, force fix, legacy-peer bypass or security-override removal was used.

## Verification

- Windows Node 22.14 / npm 10.9.2: fresh `npm ci` passed, 457 packages installed.
- `npm test`: 16 files / 48 tests passed on Vitest 4.1.11. The eight store-identity tests from PR #33 are absent from this PR #32-based candidate.
- `npm run lint` and local TypeScript `tsc --noEmit`: passed.
- Missing Supabase production configuration build: failed with the expected configuration message; guard passed.
- Configured production build: passed with CI placeholder configuration and 13 generated pages.
- Production audit: zero affected entries.
- Full audit: five high affected entries, zero critical/moderate/low, down from 13 entries (nine high, three moderate, one low).
- Complete declared native optional lock closure checked; lock coverage alone does not establish Linux runtime acceptance. Remote CI remains a separate observation.
- Astra independently confirmed the actual minimum lock, compatible graph and unchanged Next/SWC/sharp entries. Native Windows Rolldown bundle execution and sharp resize/decode passed; no blocking finding.
- Repository docs metadata, local links and whitespace checks passed; regenerated views differed only in their timestamps and were restored.

## Residual and Follow-ups

The five related remaining entries are `eslint-config-next` → `@next/eslint-plugin-next` → exact `fast-glob@3.3.1` → `micromatch@4.0.8` → `braces@3.0.3`. The captured braces stack-exhaustion advisory has no published patched version. Keep this residual open; do not declare accepted risk, downgrade the matching Next lint configuration or replace its API with a blanket override.

Updating the npm Undici package does not update Node's separate bundled HTTP implementation. The audited development inputs include test/build/lint and potentially untrusted repository content; no public grocery-request exploit path was demonstrated in this review.

Observe exact-head Ubuntu/Node 20 CI and review the candidate before integration. Authenticated staging/RLS, the Opus visual verdict and product decisions remain open. No merge or deployment occurred.
