# Agent Entrypoint

This is the first document every future agent should read before making decisions in this repo.

Its job is not to restate the entire product. Its job is to keep implementation work aligned and stop agents from drifting away from the intended direction.

## Primary rule

Do not casually invent product direction.

If the codebase, the docs, and the current task leave room for interpretation:
- prefer the documented current product over improvisation
- prefer explicit open questions over filling gaps with guesses
- consult the user before taking the project in a new product direction

## What to treat as source of truth

Current priority order:
1. direct user instruction in the current conversation
2. current code, routes, query layer, actions, and migrations
3. the docs in this folder
4. older assumptions from prior sessions

Important:
- these docs are meant to become a stable source of truth
- but they still need to stay honest about ambiguity and implementation gaps
- if docs and code disagree, do not blindly follow the docs
- verify against the codebase, then update the docs or raise the mismatch

## Required reading order

Read these before substantial work:
1. [docs/README.md](README.md)
2. [docs/CURRENT_PRODUCT.md](CURRENT_PRODUCT.md)
3. [docs/DECISIONS.md](DECISIONS.md)
4. [docs/OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)
5. [docs/AUDIT_GAPS.md](AUDIT_GAPS.md)
6. [docs/ARCHITECTURE.md](ARCHITECTURE.md)
7. [docs/BACKEND_SCHEMA.md](BACKEND_SCHEMA.md)
8. [docs/DEFERRED.md](DEFERRED.md)
9. [docs/ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md)

## What each doc is for

- `CURRENT_PRODUCT.md`
  Read this to understand what exists today and what user-facing behavior is already present.

- `DECISIONS.md`
  Read this to understand which choices should not be casually reopened.

- `OPEN_QUESTIONS.md`
  Read this before making a product-shaping change. If the change touches an unresolved question, do not pretend it is already settled.

- `AUDIT_GAPS.md`
  Read this so you do not mistake a half-finished implementation or stale doc for a settled system.

- `ARCHITECTURE.md`
  Read this before moving boundaries, changing loading patterns, or restructuring app behavior.

- `BACKEND_SCHEMA.md`
  Read this before touching database shape, policies, storage behavior, or public/private access assumptions.

- `DEFERRED.md`
  Read this so you do not accidentally implement something that has already been intentionally pushed out of scope.

- `ARCHITECTURE_NOTES.md`
  Read this as an operational reminder of the real service boundaries in the current codebase.

## Required code verification points

Before making claims about behavior, inspect:
- route components under `src/app`
- read/query logic in `src/lib/queries.ts`
- write/mutation logic in `src/app/actions.ts`
- current Supabase migrations under `supabase/migrations`

Do not rely on high-level docs alone when behavior matters.

## When you must consult the user first

Stop and ask before:
- changing the product scope in a meaningful way
- resolving an item from `OPEN_QUESTIONS.md` by assumption
- implementing something listed in `DEFERRED.md`
- replacing the current item model with a richer taxonomy without explicit approval
- changing geography assumptions in a way that commits the product to Tokyo-only, Japan-only, or fully global behavior
- weakening public-read / authenticated-write behavior
- changing ownership rules, moderation rules, or admin expectations

## Current guidance for this project

At the moment, agents should assume:
- the app is public-read and authenticated-write
- exact store locations remain the core surface
- compare is still the main landing experience
- the current canonical item flow supports only `count`, `g`, and `ml`
- item modeling will likely become richer later, but is not yet settled
- geography is not finalized enough to hard-commit beyond the current implementation

## Expected behavior when you find drift

If you find drift between docs and code:
1. verify the real behavior in code
2. decide whether it is:
   - a doc bug
   - an implementation bug
   - a half-finished feature
   - a real product ambiguity
3. update the relevant doc if the answer is clear
4. ask the user if the mismatch changes product direction or intent

## Expected behavior after making changes

After finishing meaningful work:
- update any docs that became stale because of your change
- keep unresolved questions unresolved unless the user settled them
- do not silently turn guesses into permanent documentation
