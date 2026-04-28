# Grocery Price Map - Agent Index

This repo uses the AGENT-DOCS workflow in a growing-project shape.

Read the file for your task. Do not rely on chat history as the source of truth.

## Start Here

1. `docs/orientation/CURRENT_STATE.md` - short truth page for what exists now.
2. `docs/README.md` - documentation map and doc type workflow.
3. `docs/orientation/ROADMAP.md` - cleanup and product sequencing.
4. `docs/orientation/ARCHITECTURE.md` - architecture overview and boundaries.
5. `docs/CURRENT_PRODUCT.md` - current user-facing behavior.
6. `docs/DECISIONS.md` - decisions that should not be casually reopened.
7. `docs/OPEN_QUESTIONS.md` - unresolved product questions.
8. `docs/AUDIT_GAPS.md` - confirmed docs/code/product gaps.
9. `docs/BACKEND_SCHEMA.md` - Supabase schema, storage, and RLS model.
10. `docs/DEFERRED.md` - intentionally deferred directions.

## By Task

| Task | Read |
|---|---|
| Any code change | `docs/orientation/CURRENT_STATE.md`, then the relevant route/component/action/query files |
| Product behavior change | `docs/CURRENT_PRODUCT.md`, `docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`, `docs/DEFERRED.md` |
| Architecture cleanup | `docs/orientation/ARCHITECTURE.md`, `docs/ARCHITECTURE.md`, `docs/ARCHITECTURE_NOTES.md`, `docs/AUDIT_GAPS.md` |
| Repo-health audit | `docs/repo-health/audits/README.md`, then the matching guide under `docs/repo-health/audits/guides/` |
| Database, auth, RLS, or storage change | `docs/BACKEND_SCHEMA.md`, migrations under `supabase/migrations/`, `src/app/actions.ts`, `src/lib/queries.ts` |
| New cleanup plan | `docs/product/plans/README.md` for conventions, then create or update the relevant domain plan such as `docs/repo-health/plans/PLAN-*` |
| Debugging or failing verification | `docs/repo-health/debugging/README.md`, `docs/orientation/CURRENT_STATE.md`, and the failing command output |
| Meaningful session closeout | Add a dated note under `docs/repo-health/session-logs/` when the result should survive chat |

## Rules

- Keep changes surgical unless the task is explicitly a refactor.
- Treat existing dirty worktree changes as user work unless proven otherwise.
- Do not invent product direction. If a change touches an item in `OPEN_QUESTIONS.md` or `DEFERRED.md`, ask first.
- Prefer improving the current codebase over rewriting from scratch unless a plan explicitly chooses replacement.
- Update docs when code changes make current docs stale.
- Keep `docs/orientation/CURRENT_STATE.md` short and link to deeper docs.
- Use `scripts/docs-meta` for generated views, IDs, link checks, and docs health when available.

## Verification

`npm` may not be on PATH in some Codex desktop shells. If so, use the bundled Node runtime path and invoke local CLIs directly:

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
```
