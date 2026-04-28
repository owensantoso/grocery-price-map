# Open Questions

These are the main product questions that still look genuinely unresolved from the current codebase.

## 1. What is the first admin/governance model?

Current direction:
- stores/items should eventually be editable/deletable by admin only
- creation can stay open to signed-in users

Question:
- is the first admin model simply “specific allowed email(s)”
- or do you want a proper roles table earlier

## 2. What is the first moderation/reporting slice?

Current direction:
- reporting/moderation is now considered desirable
- the likely problem set is:
  - wrong/troll prices
  - inappropriate photos
  - abusive comments

Question:
- what should the first moderation MVP include:
  - report button only
  - admin hide/remove actions
  - both

## 3. What item hierarchy should exist beyond the current flat canonical item model?

Current direction:
- a richer hierarchy probably makes sense
- examples:
  - `Protein -> Chicken -> Chicken Breast`
  - maybe tags on top of hierarchy

Question:
- should the next step be:
  - simple tags only
  - fixed hierarchy only
  - hierarchy plus tags

## 4. How strict should photo requirements become?

Current direction:
- photo-centric trust is desirable
- making photos required is under serious consideration

Question:
- should photos eventually be:
  - optional but encouraged
  - required for all new logs
  - required only for certain items or trusted/untrusted states

## 5. How strict should normalization be for edge-case items?

Current behavior:
- canonical items normalize to `count`, `g`, or `ml`

Question:
- is this intentionally enough for the foreseeable future
- or do you expect more item classes that need piece/bundle/pack nuance soon

## 6. What role should votes play?

Current behavior:
- votes exist for logs and comments
- they influence sorting/visibility in some contexts

Question:
- are votes only lightweight usefulness signals
- or should they later affect trust, ranking, or “verified” style behavior

## 7. What is the intended account/settings surface beyond username?

Current behavior:
- settings is mostly public username management

Question:
- should settings remain intentionally small
- or do you expect a fuller profile/preferences area soon

## 8. Should external store links ever be the primary destination again?

Current behavior:
- internal store pages are now richer and increasingly used as the canonical destination

Question:
- should external links stay secondary forever
- or should some contexts still prefer leaving the site directly

## 9. What geographic scope should the product explicitly target first?

Current direction:
- the current UI has Tokyo/Japan flavor in branding and map defaults
- the product should not yet be documented as permanently Tokyo-only
- fully global operation would expand scope around localization, scale, and smarter geo features

Question:
- should the intended near-term scope be:
  - Tokyo-first
  - Japan-first
  - globally available but English/Japanese-lightweight

Related future pressure:
- distance-based filtering
- area-based filtering
- more intelligent map/search behavior
