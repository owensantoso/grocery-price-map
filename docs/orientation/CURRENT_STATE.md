---
type: current-state
title: Current State
domain: orientation
status: active
created_at: "2026-04-28 22:48:08 JST +0900"
updated_at: "2026-04-29 02:17:24 JST +0900"
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

# Current State

Fast truth page for what exists now and where to look next.

Grocery Price Map is a working Next.js + Supabase MVP for public grocery price browsing and authenticated community price logging. The app is usable today, but it needs a deliberate stabilization and architecture-cleanup phase before more broad feature expansion.

## What Exists Today

Built and usable:

- Public compare page for one canonical item at a time.
- Public log feed, log detail pages, store pages, and item catalog.
- Authenticated store, item, and price-log creation.
- Authenticated log editing and owner-only log deletion.
- Log photos, comments, log votes, comment votes, and profile username settings.
- Supabase migrations for core tables, comments, votes, photos, public reads, rate limiting, usernames, and owner delete policy.
- Demo-mode fallback data when Supabase env vars are absent.

## Not Yet Built

- Admin/governance model.
- Reporting and moderation workflows.
- Store/item deduplication.
- Rich item taxonomy beyond the flat canonical item model.
- Distance/radius/area-based geo filtering.
- Chain-level analytics.
- Reputation, trust, subscriptions, alerts, OCR, barcode, or SKU intelligence.

## Current Product / System Model

Use this mental model:

- `items` are shared canonical grocery items with product-supported comparison units of `count`, `g`, and `ml`.
- `stores` are first-class exact physical or online store records.
- `price_logs` are append-only observations that preserve history; compare uses latest normalized prices by store.
- Public users can read; authenticated users can write; ownership controls edit/delete for logs.
- Geography is not finalized. The app leans Tokyo/Japan today but should not be treated as permanently Tokyo-only or fully global without a product decision.

Source docs:

- Current product: `docs/CURRENT_PRODUCT.md`
- Decisions: `docs/DECISIONS.md`
- Open questions: `docs/OPEN_QUESTIONS.md`
- Deferred scope: `docs/DEFERRED.md`

## Roadmap Position

The repo is in a stabilization phase: docs, the first repo-health audit, CI, and focused characterization coverage are in place. `PLAN-0002` is next and tracks backend write-integrity hardening before broad action/query refactors.

Source docs:

- Roadmap: `docs/orientation/ROADMAP.md`
- Architecture: `docs/orientation/ARCHITECTURE.md`
- Plan guide: `docs/product/plans/README.md`
- Active cleanup plan: `docs/repo-health/plans/PLAN-0001-documentation-and-architecture-cleanup/PLAN-0001-documentation-and-architecture-cleanup.md`
- Backend integrity plan: `docs/repo-health/plans/PLAN-0002-backend-write-integrity-hardening/PLAN-0002-backend-write-integrity-hardening.md`
- Contribution accessibility plan: `docs/repo-health/plans/PLAN-0003-contribution-accessibility-fixes/PLAN-0003-contribution-accessibility-fixes.md`
- Read-scale diagnostic plan: `docs/repo-health/plans/PLAN-0004-read-scale-and-verification-gates/PLAN-0004-read-scale-and-verification-gates.md`
- Architecture cleanup plan: `docs/repo-health/plans/PLAN-0005-architecture-cleanup/PLAN-0005-architecture-cleanup.md`
- Audit guides/profile: `docs/repo-health/audits/`

## Key Gotchas

- `src/app/actions.ts` and `src/lib/queries.ts` are the main gravity wells. Refactor them only with clear verification.
- `AUDT-0001#FINDING-001` is the sharpest backend risk: direct authenticated writes can bypass some server-action-calculated price-log integrity.
- Existing docs were written during an audit and should be treated as source-of-truth working memory, not scratch text.
- `npm` may not be available on PATH in Codex desktop shells. Use the bundled Node path shown in `AGENTS.md` if needed.
- The database schema still has some legacy unit breadth while product flows intentionally expose only `count`, `g`, and `ml`.

## Verification Baseline

Recent verification on 2026-04-29 passed:

- `vitest run`: 7 files, 20 tests passed.
- `eslint .`: passed.
- `next build`: passed with 13 app routes generated.

For current commands, use:

- Root `AGENTS.md`
- `package.json`

## Where To Look

| Need | Read |
|---|---|
| First orientation | `docs/README.md` |
| Current product behavior | `docs/CURRENT_PRODUCT.md` |
| Current architecture | `docs/orientation/ARCHITECTURE.md` and `docs/ARCHITECTURE.md` |
| Backend schema and policies | `docs/BACKEND_SCHEMA.md` |
| Roadmap order | `docs/orientation/ROADMAP.md` |
| Known gaps | `docs/AUDIT_GAPS.md` |
| Repo-health audit procedure | `docs/repo-health/audits/README.md` |
| Durable decisions | `docs/DECISIONS.md` and `docs/decisions/adr/` |
| Session paper trail | `docs/repo-health/session-logs/` |

## Maintenance Rule

When a plan or multi-task change finishes, update this file only with:

- new current truth
- changed roadmap position
- new gotchas
- links to deeper source docs

Move detailed narratives, session receipts, and decision rationale to the appropriate fanout doc.
