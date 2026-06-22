# CLAUDE.md — Kijani Design System

> This file is the front door for any AI agent (Claude Code, Claude.ai, Cowork, Lovable, Antigravity) working inside this repository or generating UI that depends on this system. **Read it first, every session.**

Humans should read it too — it's the single shortest description of how we work.

---

## 1. What this repo is

Kijani is the design system powering every Kijani product. It's an **npm-workspaces monorepo** holding one shared foundation and two component libraries that consume it:

- **`packages/tokens`** (`@kijani/tokens`) — the source-of-truth design tokens (Tokens Studio multi-file sets, DTCG `$value`/`$type` shape) plus the zero-dependency `build.mjs` that compiles them to every target.
- **`packages/web`** (`@kijani/web`) — the React + CSS-variables component library.
- **`packages/mobile`** (`@kijani/mobile`) — the React Native (Expo) component library; runtime theming via `ThemeProvider`/`useTheme()` because RN can't use CSS variables.

Two more surfaces: **`figma-plugin/`** is the DesignSync plugin that keeps Figma variables and the token source in two-way sync (push / pull / diff, via auto-merged PRs), and **`site/`** is the human-facing showcase. Storybook publishes via Chromatic.

## 2. Golden rules (non-negotiable)

1. Never hardcode a colour, spacing, radius, font-size, or shadow value. Always use a token.
2. Never compose UI from raw HTML if a Kijani component covers the case.
3. Never detach / fork / re-implement a published component to "make it work." File an RFC.
4. Every new component change ships with Storybook stories + Chromatic snapshots.
5. Light, dark, and RTL — all must work, on every change.
6. Touch targets meet platform minimums — ≥ 44px on mobile (handled in the mobile library's tokens).
7. TypeScript types are not optional. Props named consistently with the existing API surface.
8. Accessibility is a build error, not a follow-up ticket.
9. When emitting Figma variables or editing the token build, follow the **Figma variable representation — conversion rules** in `docs/ai/decisions.md` (opacity ×100, line-height→px, dimensions strip `px`, color→RGBA). Before binding/emitting a new token `$type` as a Figma variable, read back a test binding to confirm Figma's scale — never hand-fix a scale mismatch in Figma; fix it in `build.mjs` + the plugin.

## Agent operating mode (autonomous / solo)

This repo is currently run **solo by the owner, with Claude Code driving execution.** Unless told otherwise:

- **Work in chunks, not single steps.** Given a multi-step goal (e.g. "build the core component set"), proceed through the steps autonomously — don't stop after each one to ask "what next?".
- **Per unit of work, run the full loop yourself:** build + test + lint → commit → push → open a PR → squash-merge it → delete the branch → sync `main`. One focused PR per component/unit.
- **Keep the gates green:** every change must pass the web build and `npm run tokens:check`; never hand-edit generated token files.
- **Commit before destructive git ops.** Never run `git clean`, `git reset --hard`, or a branch switch with uncommitted or untracked work present without first committing it (or confirming it's disposable) — untracked files like `site/` are unrecoverable once cleaned.
- **Only stop to ask the owner for** a genuine product/design decision or ambiguity, or a failure you can't resolve. Surface those clearly; never guess on direction.

The master roadmap — (1) the mobile component library, then (2) the two-way Figma↔GitHub sync plugin — **shipped in v1**. Build history and the deferred P2 backlog live in `docs/ai/mobile-library-plan.md` and `docs/ai/sync-plugin-plan.md`.

This solo mode intentionally lets the agent merge its own PRs. The lead-review expectation in §7 applies once the team grows.

## 3. How to start a task (the 60-second orientation)

- **Editing a component / adding a variant** → read `docs/ai/component-usage.md` + `docs/ai/quality-bar.md` before touching code. Web lives in `packages/web/src/components/`, mobile in `packages/mobile/src/components/`.
- **Generating a new screen from a prompt or Figma** → read `docs/ai/pipeline.md` + `docs/ai/component-usage.md`.
- **Token-level change** → read `docs/ai/token-usage.md` first; edit `packages/tokens/source/` only and let `build.mjs` regenerate — never touch the consumer or the generated files.
- **Reskinning / exploring a new visual style from a reference image** → read `docs/ai/style-extraction.md` (D18): extract the style, regenerate the `core.json` primitives, let references cascade, preview on a `style/<name>` branch.
- **Generating a component from a Figma component into dev-ready code** → run the intake gate in `docs/ai/component-intake.md` (D19), capture a `<Name>.spec.json` (`docs/ai/component-spec.schema.json`), then generate + review. Assisted bootstrap, not 1:1 codegen. For **organisms and templates**, also publish a designer-facing **spec frame** in Figma beside the component (visual, non-technical: anatomy, options, states, do/don't, handoff) — required on create and update (D20). The whole flow is automated by the **`kijani-component-generator`** skill + the deterministic scaffolder in `tools/kijani-component-generator/` (D21).

## 4. File map (where things live)

| Path | What's there |
|---|---|
| `packages/tokens/source/` | Tokens Studio token sets (DTCG `$value`/`$type`) — the source of truth |
| `packages/tokens/build/` | **Generated** outputs (CSS vars, `tokens.ts`, `tokens.native.ts`, Figma-variables JSON). Never hand-edit. |
| `packages/tokens/build.mjs` | Zero-dep build that compiles source → all targets |
| `packages/web/src/components/` | React + CSS-variables component library (`@kijani/web`) |
| `packages/mobile/src/components/` | React Native / Expo component library (`@kijani/mobile`) |
| `figma-plugin/` | DesignSync plugin — two-way Figma↔GitHub token sync |
| `site/` | Showcase + docs site (static HTML, no build) |
| `docs/ai/` | Deep-dive guides for AI usage |
| `tools/kijani-component-generator/` | Organism→component automation: deterministic scaffolder + the `kijani-component-generator` skill (D21) |
| `.storybook/` | Storybook config |
| `.github/workflows/` | CI — token validate/build + Chromatic |

## 5. Pipeline at a glance

`Idea → spec → Figma frames → component selection → Claude Code build → review → Chromatic snapshot → ship`. Each stage names who is responsible and what the AI is reading at that stage. Token changes can also flow Figma → repo through the DesignSync plugin. Full version: `docs/ai/pipeline.md`.

## 6. Quality bar (what "production-ready" means here)

- Passes axe-core with zero violations.
- Renders correctly in light and dark (web); light/dark × platform for mobile.
- Has a Storybook story + Chromatic-approved snapshot.
- Has unit tests for behaviour (not snapshots).
- Bundle impact noted in the PR description.
- No `any`, no `@ts-ignore`, no `// eslint-disable` without justification.

Full version: `docs/ai/quality-bar.md`.

## 7. Escalation and ownership

The system is **owned by Rajat (rajat.mukati@spironet.com)**, who runs it solo with Claude Code executing. While solo, the agent ships and merges its own PRs (see the operating mode above); the bar is the green gates, not a second reviewer. Escalate to the owner only for genuine product/design decisions, ambiguous direction, or a failure you can't resolve — surface those clearly rather than guessing.

Structural changes — forking/detaching a published component, breaking a component API, changing a token tier or the build pipeline — go through a short **RFC** (`docs/ai/rfc-template.md`) rather than a silent edit. Once the team grows, RFCs and any token- or API-level PR require design + eng lead sign-off before merge, and the auto-merge allowance is removed.

## 8. Index of guides

- `docs/ai/pipeline.md` — design-to-dev workflow
- `docs/ai/component-usage.md` — component selection + composition rules
- `docs/ai/token-usage.md` — token tier rules
- `docs/ai/style-extraction.md` — reskin the foundations from a reference image (D18)
- `docs/ai/component-intake.md` — Figma → dev-ready component intake gate / checklist (D19)
- `docs/ai/component-spec.schema.json` — machine-readable component contract (feeds codegen/stories/tests/Code Connect/drift)
- `docs/ai/prompting.md` — prompt library
- `docs/ai/quality-bar.md` — production-readiness checklist
- `docs/ai/rfc-template.md` — RFC template for structural changes
- `docs/ai/mobile-library-plan.md` — mobile library build history + backlog
- `docs/ai/sync-plugin-plan.md` — DesignSync plugin build history + backlog
- `docs/ai/roles/pm.md` — product manager guide
- `docs/ai/roles/designer.md` — designer guide
- `docs/ai/roles/developer.md` — developer guide
- `docs/ai/decisions.md` — decisions & lessons log (why it's built this way + gotchas)

---

_Last reviewed: 2026-06-20 · Owned by: Rajat (solo; design + eng leads once the team grows) · RFC template: `docs/ai/rfc-template.md`_
