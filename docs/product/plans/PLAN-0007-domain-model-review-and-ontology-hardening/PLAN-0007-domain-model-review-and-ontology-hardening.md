---
type: plan
id: PLAN-0007
title: Domain model review and ontology hardening
domain: product
status: ready
created_at: "2026-04-29 21:29:32 JST +0900"
updated_at: "2026-04-29 21:29:32 JST +0900"
owner:
sequence:
  roadmap: "7"
  sort_key: "007"
  lane: product
  after: [PLAN-0006]
  before: []
areas:
  - domain-model
  - product-language
  - ontology
related_specs: []
related_adrs: []
related_sessions:
  - docs/repo-health/session-logs/2026-04-29-plan-0006-objective-hardening-closeout.md
related_issues: []
related_prs: []
linked_paths:
  - docs/CURRENT_PRODUCT.md
  - docs/DECISIONS.md
  - docs/OPEN_QUESTIONS.md
  - docs/DEFERRED.md
  - docs/BACKEND_SCHEMA.md
  - docs/orientation/ARCHITECTURE.md
  - src/lib/models.ts
  - src/lib/action-validation.ts
  - supabase/migrations/
repo_state:
  based_on_commit: 34d3b9bf1373d4119a52f85a2f627cd3b58d62b7
  last_reviewed_commit: 34d3b9bf1373d4119a52f85a2f627cd3b58d62b7
---

# PLAN-0007 - Domain model review and ontology hardening

## Goal

Review and harden the product/domain model before substantial new feature work. The goal is to make the core language precise enough that future features do not accidentally encode the wrong concepts, normalization rules, ownership assumptions, or trust model.

This plan should produce durable domain language, unresolved decision questions, and follow-up specs/plans where implementation is appropriate. It should not silently decide product policy without human judgment.

## Architecture

Current product language centers:

- `Item`: a canonical grocery item with a normalization basis.
- `Store`: a specific physical or online source for prices.
- `Price log`: one observation of one item at one store on a date.
- `Comment`: discussion attached to a price log.
- `Vote`: lightweight signal attached to a log or comment.
- `Profile/public profile`: private account row plus public display identity.

Known pressure areas:

- flat items versus hierarchy/tags
- exact store versus chain/location/online-store semantics
- mutable price logs versus append-only/history language
- normalization units and package semantics
- photo evidence and trust requirements
- votes as lightweight feedback versus ranking/trust signals
- geography: Tokyo-first, Japan-first, or broader availability

## Task Dependencies / Parallelization

Recommended order:

1. Start with an interview pass using the `domain-model` skill. Ask one decision question at a time and check code/docs where the answer is discoverable.
2. Extract current vocabulary and contradictions into a domain glossary or context doc.
3. Convert resolved, high-impact choices into specs or ADRs only when they are hard to reverse and surprising without context.
4. Create implementation plans only for decisions that are explicit enough to build.

Safe parallelization:

- Code/doc inventory can run in parallel with product interviews.
- Implementation planning should wait until the relevant product/domain questions are answered.

## Implementation Tasks

- [ ] Run a domain-model interview covering item hierarchy, store semantics, price-log mutability, unit normalization, photo trust, votes, and geography.
- [ ] Create or update a durable domain glossary/context doc once terms are resolved.
- [ ] Identify contradictions between `CURRENT_PRODUCT`, `DECISIONS`, `OPEN_QUESTIONS`, `BACKEND_SCHEMA`, migrations, and code.
- [ ] Route unresolved product decisions to `OPEN_QUESTIONS.md` or a product spec rather than implementation.
- [ ] Write ADRs only for hard-to-reverse decisions with real trade-offs.
- [ ] Produce follow-up implementation briefs for any objective model hardening that becomes clear.

## Validation

- Check current code and migrations before accepting claims about how the product behaves.
- Verify generated docs with `scripts/docs-meta check`.
- Do not mark this plan complete until resolved terms and remaining questions are both findable without chat history.

## Completion Criteria

- The core domain terms are documented in one durable place.
- Major contradictions are resolved, deferred, or explicitly routed.
- Future feature work can tell whether it is changing the domain model or only adding UI/workflow around it.
- No product-governance decision is made by assumption.
