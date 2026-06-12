# CLAUDE.md — Kijani Design System

> This file is the front door for any AI agent (Claude Code, Claude.ai, Cowork, Lovable, Antigravity) working inside this repository or generating UI that depends on this system. **Read it first, every session.**

Humans should read it too — it's the single shortest description of how we work.

---

## 1. What this repo is

_Short paragraph: Kijani is the design system powering every Kijani product. The repo holds three things — the source of truth tokens (W3C JSON), the React component library, and the Figma sync plugin. Storybook publishes via Chromatic. The showcase site under `site/` is the human-facing landing surface._

## 2. Golden rules (non-negotiable)

_Numbered list, ~8 items. Each one line. Examples to flesh out later:_

1. Never hardcode a colour, spacing, radius, font-size, or shadow value. Always use a token.
2. Never compose UI from raw HTML if a Kijani component covers the case.
3. Never detach / fork / re-implement a published component to "make it work." File an RFC.
4. Every new component change ships with Storybook stories + Chromatic snapshots.
5. Light, dark, and RTL — all must work, on every change.
6. Touch targets meet platform minimums — ≥ 44px on mobile (handled in the mobile library's tokens).
7. TypeScript types are not optional. Props named consistently with the existing API surface.
8. Accessibility is a build error, not a follow-up ticket.

## 3. How to start a task (the 60-second orientation)

_Three bullet decision tree:_

- **Editing a component / adding a variant** → read `docs/ai/component-usage.md` + `docs/ai/quality-bar.md` before touching code.
- **Generating a new screen from a prompt or Figma** → read `docs/ai/pipeline.md` + `docs/ai/component-usage.md`.
- **Token-level change** → read `docs/ai/token-usage.md` first; token edits go through the build pipeline, not the consumer.

## 4. File map (where things live)

_Table-style summary:_

| Path | What's there |
|---|---|
| `src/tokens/source/` | W3C-format token JSON (the source of truth) |
| `src/tokens/build/` | **Generated.** Never hand-edit. |
| `src/components/` | React component library |
| `figma-plugin/` | Custom plugin that syncs tokens, Text Styles, components to Figma |
| `site/` | Showcase + docs site (static HTML, no build) |
| `docs/ai/` | Deep-dive guides for AI usage |
| `.storybook/` | Storybook config |

## 5. Pipeline at a glance

_One-line summary of `docs/ai/pipeline.md`:_

`Idea → spec → Figma frames → component selection → Claude Code build → review → Chromatic snapshot → ship`. Each stage names who is responsible and what the AI is reading at that stage. Full version: `docs/ai/pipeline.md`.

## 6. Quality bar (what "production-ready" means here)

_Bullet list, ~6 items. Full version in `docs/ai/quality-bar.md`:_

- Passes axe-core with zero violations.
- Renders correctly in all 4 mode combinations.
- Has a Storybook story + Chromatic-approved snapshot.
- Has unit tests for behaviour (not snapshots).
- Bundle impact noted in the PR description.
- No `any`, no `@ts-ignore`, no `// eslint-disable` without justification.

## 7. Escalation and ownership

_Two paragraphs:_

- _Who owns the system, when to ask vs. when to ship, RFC template location._
- _Slack channel, GitHub label conventions, design + eng lead sign-off rules._

## 8. Index of guides

- `docs/ai/pipeline.md` — design-to-dev workflow
- `docs/ai/component-usage.md` — component selection + composition rules
- `docs/ai/token-usage.md` — token tier rules
- `docs/ai/prompting.md` — prompt library
- `docs/ai/quality-bar.md` — production-readiness checklist
- `docs/ai/roles/pm.md` — product manager guide
- `docs/ai/roles/designer.md` — designer guide
- `docs/ai/roles/developer.md` — developer guide

---

_Last reviewed: TODO · Owned by: design + eng leads · RFC template: `docs/ai/rfc-template.md` (TODO)_
