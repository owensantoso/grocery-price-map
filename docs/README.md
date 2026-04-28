# Grocery Price Map Docs

This folder is the living reference set for the app as it actually exists today.

The repo now uses the AGENT-DOCS workflow in a growing-project shape: short orientation docs first, deeper source docs second, and plans/session logs for cleanup work that needs to survive chat history.

## Start Here

1. [../AGENTS.md](../AGENTS.md) - root agent index and task routing.
2. [orientation/CURRENT_STATE.md](orientation/CURRENT_STATE.md) - short current truth page.
3. [orientation/ROADMAP.md](orientation/ROADMAP.md) - cleanup and product sequencing.
4. [orientation/ARCHITECTURE.md](orientation/ARCHITECTURE.md) - architecture overview and boundaries.
5. [CURRENT_PRODUCT.md](CURRENT_PRODUCT.md) - current user-facing behavior.
6. [DECISIONS.md](DECISIONS.md) - decisions that should not be reopened casually.
7. [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) - unresolved product questions.
8. [AUDIT_GAPS.md](AUDIT_GAPS.md) - confirmed gaps and drift.

## Top-Level Areas

| Area | Purpose |
|---|---|
| `orientation/` | Current state, roadmap, and architecture overview. |
| `product/plans/` | Planning conventions and product feature plans. |
| `repo-health/plans/` | Documentation, testing, architecture-cleanup, and maintainability plans. |
| `repo-health/audits/` | Reusable audit guides, local audit profile, and `AUDT-*` repo-health audit receipts. |
| `repo-health/operations/` | Provider-neutral deploy, rollback, migration, and incident checklists. |
| `decisions/adr/` | Durable architecture or product decisions when simple notes are not enough. |
| `repo-health/session-logs/` | Timestamped receipts for meaningful planning, debugging, or implementation sessions. |
| `repo-health/debugging/` | Diagnostic records and debugging guidance. |
| `research/` | Spikes and option surveys when uncertainty needs evidence. |

## Existing Source Docs

These older source docs remain part of the active map. Prefer the orientation docs for the first read, then use these files for deeper product, architecture, backend, and audit context.

- [CURRENT_PRODUCT.md](CURRENT_PRODUCT.md)
  What the app currently is, who it is for, and the user-facing flows already implemented.

- [ARCHITECTURE.md](ARCHITECTURE.md)
  Detailed app structure, routing, rendering model, shared shell, and data-loading notes from the first audit.

- [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md)
  Extra operational architecture notes.

- [BACKEND_SCHEMA.md](BACKEND_SCHEMA.md)
  Current Supabase tables, views, storage, and policy-level behavior.

- [DECISIONS.md](DECISIONS.md)
  Important product and technical decisions already made.

- [DEFERRED.md](DEFERRED.md)
  Known future directions intentionally not part of the current build.

- [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)
  Real unresolved questions where product direction is still ambiguous.

- [AUDIT_GAPS.md](AUDIT_GAPS.md)
  Confirmed mismatches and audit findings.

- [repo-health/operations/README.md](repo-health/operations/README.md)
  Lightweight production readiness runbooks and checklists.

- [AGENT_ENTRYPOINT.md](AGENT_ENTRYPOINT.md)
  Earlier agent entrypoint. The root [AGENTS.md](../AGENTS.md) is now the first read, but this file remains useful as an expanded rationale.

## Doc Type Workflow

Use the smallest durable doc that answers the actual question.

| Need | Use |
|---|---|
| Current truth | `docs/orientation/CURRENT_STATE.md` |
| Sequencing | `docs/orientation/ROADMAP.md` |
| Architecture overview | `docs/orientation/ARCHITECTURE.md` |
| Cleanup or refactor scope | `docs/repo-health/plans/PLAN-*` |
| Product feature scope | `docs/product/plans/PLAN-*` |
| Bounded implementation handoff | `docs/**/plans/**/IMPL-*` |
| Durable decision | `docs/decisions/adr/ADR-*` |
| Repo-health audit | `docs/repo-health/audits/AUDT-*` |
| Debug evidence | `docs/repo-health/debugging/DIAG-*` |
| Session receipt | `docs/repo-health/session-logs/YYYY-MM-DD-*.md` |
| Research/options | `docs/research/RSCH-*` |

## Rules

- Keep `orientation/CURRENT_STATE.md` short and link outward.
- Do not hand-maintain generated views if `scripts/docs-meta` can produce them.
- Put plans under the domain that owns the outcome.
- Treat code as current truth when docs conflict with implementation, then update the smallest relevant doc.
- Do not resolve `OPEN_QUESTIONS.md` or implement `DEFERRED.md` work by assumption.
