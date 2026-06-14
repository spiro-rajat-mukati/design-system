# RFC — <short title>

> Lightweight RFC for **structural** changes to Kijani: forking/detaching a published component, breaking a component API, changing a token tier, or changing the build pipeline. Small additive changes (a new variant, a new token that follows existing tiers) don't need one — just ship per the operating mode in `CLAUDE.md`.

**Status:** Draft · Accepted · Rejected · Superseded
**Author:**
**Date:**
**Affects:** tokens · web · mobile · figma-plugin · build · CI

## 1. Problem

What's broken or missing, and why the current system can't accommodate it cleanly.

## 2. Proposal

The change, concretely. Name the tokens / components / APIs touched.

## 3. Alternatives considered

What else was on the table and why this won.

## 4. Impact

- **Breaking?** APIs / props / tokens removed or renamed, and the migration path.
- **Modes:** light/dark (web); light/dark × platform (mobile); RTL.
- **Bundle / perf:** notable size or runtime cost.
- **Parity:** does web + mobile stay aligned via shared tokens / Code Connect?

## 5. Rollout

Order of operations, and how it ships under the autonomous merge flow (or whether it needs the owner's sign-off).

---

_Solo mode: the owner can accept an RFC in the same PR that implements it. Once the team grows, structural RFCs need design + eng lead sign-off before merge (see `CLAUDE.md` §7)._
