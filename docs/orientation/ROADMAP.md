---
type: roadmap
title: Roadmap
domain: orientation
status: active
created_at: "2026-04-28 22:48:08 JST +0900"
updated_at: "2026-04-29 03:31:10 JST +0900"
owner:
areas: []
related_specs: []
related_plans: []
related_adrs: []
related_sessions: []
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# Roadmap

Ordered roadmap for moving this repo from fast-built MVP to a cleaner, more reviewable codebase.

## Status Legend

- `Complete`
- `Current`
- `Next`
- `Later`
- `Deferred`

## Roadmap Snapshot

| Band | Status | Why it sits here |
|---|---|---|
| MVP foundation | Complete | Core product is built and passes tests, lint, and production build. |
| Documentation system | Complete | First-read docs, audit guides, and the first repo-health audit are in place. |
| Stabilization | Complete | Verification gates and focused characterization tests are in place before refactoring large modules. |
| Backend integrity | Complete | Write-side integrity risks are hardened before wider public usage. |
| Contribution accessibility | Complete | Keyboard store entry, semantic control gaps, focus styling, and map manual verification are in place. |
| Read scale diagnostics | Next | Audit found read-scale risks that need evidence before broad query refactors. |
| Architecture cleanup | Later | Split concentrated action/query modules once behavior is pinned down. |
| Product governance | Later | Admin/moderation requires product decisions before implementation. |
| Expansion | Deferred | OCR, barcode, chain analytics, alerts, reputation, and advanced geo are intentionally out of current scope. |

## 1. Completed Foundation

| Milestone | Status | Why it matters |
|---|---|---|
| Public compare and map flow | Complete | Main product promise is usable. |
| Public logs, stores, items, and detail pages | Complete | App has browsable depth beyond the homepage. |
| Authenticated contributions | Complete | Users can add stores, items, logs, comments, votes, and photos. |
| Basic ownership controls | Complete | Users can edit and delete their own logs. |
| Supabase schema and RLS baseline | Complete | Public-read/auth-write model is encoded in migrations. |

## 2. Current Mainline

The key principle is:

> Make the existing app understandable and verifiable before making it larger.

| Order | Milestone | Status | Why it sits here |
|---|---|---|---|
| 1 | Install AGENT-DOCS growing scaffold | Complete | Gives future sessions a common read path and planning system. |
| 2 | Consolidate docs and resolve docs/code drift | Complete | `IMPL-0001-01` established the first-read path and session receipt. |
| 3 | Create repo-health audit plan | Complete | `AUDT-0001` records the largest stabilization risks. |
| 4 | Decide verification gate | Complete | `IMPL-0001-02` added the CI/local verification gate before implementation proceeds. |
| 5 | Add focused tests for risky behavior | Complete | `IMPL-0001-03` protects behavior before backend hardening and architecture movement. |
| 6 | Harden backend write integrity | Complete | `PLAN-0002` hardened price-log integrity, photos, profile updates, and rate limits. |
| 7 | Fix contribution accessibility blockers | Complete | `PLAN-0003` added keyboard store entry, semantic control improvements, focus styling, and map verification guidance. |
| 8 | Diagnose read-scale risks | Next | `PLAN-0004` routes feed-scale, store index, and log-detail duplication evidence. |
| 9 | Split server actions by domain | Later | `PLAN-0005` reduces the largest write-side gravity well after coverage/integrity work. |
| 10 | Split query snapshots/mappers by domain | Later | `PLAN-0005` reduces the largest read-side gravity well after coverage/read-scale evidence. |

## 3. Side Branches And Polish Tracks

| Work | Status | Why it is not ahead of the mainline |
|---|---|---|
| UI polish and map interaction refinement | Later | Useful, but broad UI movement before tests may hide regressions. |
| Photo pipeline improvements | Later | Current lightweight client-compression flow works enough for MVP. |
| Accessibility contribution-flow polish beyond `PLAN-0003` | Later | Keep broad accessibility work separate from the focused audit-remediation slice. |
| Store/item dedupe | Later | Needs governance decisions and likely admin surface. |

## 4. Product Decisions Needed Before Expansion

| Question | Source |
|---|---|
| First admin/governance model | `docs/OPEN_QUESTIONS.md` |
| First moderation/reporting slice | `docs/OPEN_QUESTIONS.md` |
| Item hierarchy/tags | `docs/OPEN_QUESTIONS.md` |
| Photo requirement strictness | `docs/OPEN_QUESTIONS.md` |
| Geographic target scope | `docs/OPEN_QUESTIONS.md` |

## 5. How To Use This Roadmap

- Start with `docs/orientation/CURRENT_STATE.md` for what already exists.
- Use this roadmap and the numeric `PLAN-*` / `IMPL-*` order for execution. If a later-numbered brief must run earlier, renumber or move it instead of relying on hidden dependency interpretation.
- Use `docs/repo-health/plans/` for cleanup plans and implementation briefs.
- Use `docs/product/plans/` for user-facing product feature plans.
- Use `docs/DEFERRED.md` to avoid accidentally expanding scope.
