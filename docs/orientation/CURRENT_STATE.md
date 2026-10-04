---
type: current-state
title: Current State
domain: orientation
status: active
created_at: "2026-04-28 22:48:08 JST +0900"
updated_at: "2026-10-04 10:18:35 JST +0900"
owner:
areas: []
related_specs: []
related_plans: [PLAN-0002, PLAN-0007]
related_adrs: []
related_sessions: [docs/repo-health/session-logs/2026-10-04-current-state-reconciliation.md]
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: 8fb4b3ea2af675092a3710b2d885d7dddcebcea6
---

# Current State

Fast truth page for what exists now and where to look next.

Grocery Price Map is a working Next.js + Supabase MVP for public grocery price browsing and authenticated community price logging. The source implements the MVP and its stabilization work; this page does not certify deployed behavior or an authenticated staging roundtrip. Further broad feature expansion still needs deliberate product and architecture choices.

## What Exists Today

Implemented in source:

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
- `price_logs` are separate observations; owners can edit/delete their own logs, and compare derives latest normalized observations by store. Immutable history or correction policy remains unresolved in [PLAN-0007](../product/plans/PLAN-0007-domain-model-review-and-ontology-hardening/PLAN-0007-domain-model-review-and-ontology-hardening.md).
- Source contracts define public reads and authenticated writes with owner edit/delete checks. Applied RLS, storage and signed-in deployed behavior remain verification gates.
- Geography is not finalized. The app leans Tokyo/Japan today but should not be treated as permanently Tokyo-only or fully global without a product decision.

Source docs:

- Current product: `docs/CURRENT_PRODUCT.md`
- Decisions: `docs/DECISIONS.md`
- Open questions: `docs/OPEN_QUESTIONS.md`
- Deferred scope: `docs/DEFERRED.md`

## Roadmap Position

The repo is in a stabilization phase: docs, the first repo-health audit, CI, focused characterization coverage, backend write-integrity hardening, contribution accessibility fixes, read-scale diagnostics, and the first architecture cleanup split are in place. Further action/query splitting should be incremental and evidence-driven.

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

- `src/app/actions.ts` and `src/lib/queries.ts` are smaller after the first architecture cleanup, but still act as stable public entry points. Refactor further only with clear verification.
- The direct derived-field bypass in `AUDT-0001#FINDING-001` is historical: `202604290001_price_log_integrity.sql` defines a before-insert/update trigger checking submitter identity, item unit, derived price/tax and photo-folder ownership. Defined migrations do not prove deployment; apply/verify migrations and authenticated RLS/storage behavior before claiming rollout. See [PLAN-0002](../repo-health/plans/PLAN-0002-backend-write-integrity-hardening/PLAN-0002-backend-write-integrity-hardening.md).
- Existing docs were written during an audit and should be treated as source-of-truth working memory, not scratch text.
- `npm` may not be available on PATH in Codex desktop shells. Use the bundled Node path shown in `AGENTS.md` if needed.
- The database schema still has some legacy unit breadth while product flows intentionally expose only `count`, `g`, and `ml`.
- Map surfaces have a manual verification checklist at `docs/repo-health/debugging/map-manual-verification.md`; `?debug=1` is wired only for the compare map.

## Verification Baseline

The [4 October store-identity receipt](../repo-health/session-logs/2026-10-04-created-store-identity-return.md) at source `8fb4b3e` records 56 passing tests, lint, TypeScript, a zero-finding production audit and a configured production build. Supabase/auth/navigation were mocked; signed-in staging, applied migrations/storage/RLS, real cache behavior and physical map/mobile checks remain open. The earlier 29 April 30-test/13-route receipt is historical.

The [dependency receipt](../repo-health/session-logs/2026-10-04-production-dependency-audit-repair.md) retains 13 development/tooling audit entries as an open follow-up; the production audit result does not close them.

This candidate is stacked on dependency-repair PR #32. Decimal-parity PR #31 is separate and is not included here. Opus visual selection, taxonomy and immutable-history policy remain human decisions; no demo variant is selected by this page.

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
