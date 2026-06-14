# Figma ↔ GitHub Sync Plugin — Plan & Handoff (MASTER 2)

Context brief for Claude Code building the Kijani **DesignSync** plugin. Read with `CLAUDE.md` and `docs/ai/*`. A fuller PRD is held separately by the owner.

> **Status (2026-06-14): SHIPPED — v1 complete.** Two-way sync (Push / Pull / Diff) is live and hands-free: a Figma token edit opens a clean PR, CI regenerates the build output, and it auto-merges on green. The sections below ("Current state", "Phase 0", "v1 scope", "Sequence") are kept as build history. Remaining work is the **P2 backlog**: Styles sync, component drift via Code Connect, icon export, team/GitHub-App auth.

## What it is

A private Figma plugin that keeps the design system in sync with this repo: **push** Figma variable changes to GitHub as PRs, **diff** Figma vs. repo to catch drift, **pull** GitHub → Figma. Extends the existing `figma-plugin/`.

## Current state (2026-06-13)

- Monorepo: tokens in `packages/tokens/source/` (Tokens Studio sets), built by `packages/tokens/build.mjs` → `tokens.figma-variables.json` (**Light/Dark only today**), CSS, `tokens.ts`, `tokens.native.ts`.
- `$themes.json` has `light-web`, `dark-web`, `light-ios`, `light-android` (mobile is light-only today).
- The existing `figma-plugin/` is read-only and its `ui.html` paths are **stale** (still `src/tokens/...`).
- The Figma "Design System" collection still has the **old 4 density modes**.
- GitHub `spiro-rajat-mukati` + Figma `rajat.mukati`, both Rajat. Repo is **private**. Canonical Figma file lives in the **Mobilite "Private Limited"** org (Full/paid seat).

## Locked decisions (2026-06-13)

- **Extend `figma-plugin/`** — it is the canonical sync path; retire the Tokens Studio setup docs.
- Token format = **Tokens Studio sets**; the plugin writes `packages/tokens/source/` **only**.
- **Push = PR against `main`, auto-merged once CI passes** (hands-free, solo).
- **Conflicts = always the 3-way resolver** (Base / Figma / GitHub), no auto-pick.
- Auth = **fine-grained PAT** per user in Figma `clientStorage`; **authenticated GitHub API** (private repo). Network only from the UI thread; allow-list `api.github.com` + `raw.githubusercontent.com`.
- **Figma modes = 6:** Web {Light, Dark} + iOS {Light, Dark} + Android {Light, Dark} — add dark iOS/Android to the repo too.
- **Figma structure = 3 published files:** Foundations (shared variables + styles + foundation docs), Web components, Mobile components (Mobile starts as a *shell*). **Cowork sets these up via the Figma API — not Claude Code.**
- Mode reconciliation done **in place** (Figma version history is the safety net).

## Parity principle (important)

**The code component library and the Figma component library do NOT need to be structurally identical.** They are two representations bridged only by **shared tokens** + **Code Connect** (name/prop mapping). Components may diverge where it's more efficient or where native UX demands it (mobile especially). The plugin syncs **tokens/variables**, never component internals — for components it only does **drift detection + Code Connect mapping (no codegen, no forced 1:1)**.

## Phase 0 — Claude Code (each its own PR)

1. **Repoint `figma-plugin/`** paths → `packages/tokens/tokens.figma-variables.json` + `packages/web/src/component-specs/`. (Fixes the broken read.)
2. **Authenticated reads:** add `api.github.com` to the manifest allow-list; read the private repo via the GitHub API + PAT (raw URL 404s on a private repo).
3. **Add mobile dark + emit all 6 modes:** add `dark-ios` / `dark-android` themes to `$themes.json`; make `build.mjs` compose all **6** modes into `tokens.figma-variables.json`; cover them in `tokens:check`.

## v1 scope — Claude Code (after Phase 0)

- **Push** (Figma → GitHub) → auto-merged PR. [P0]
- **Diff / compare** (token-level + visual, per mode). [P0]
- **Pull** (GitHub → Figma) with the **3-way conflict resolver**. [P0/P1]
- Later (P2): Styles · components (**drift + Code Connect, no codegen**) · icons · team/GitHub-App.

## Sequence

① Claude Code Phase 0 (repo defines all 6 modes) → ② **Cowork** sets up the 3-file Figma split + 6-mode foundation → ③ Claude Code builds the plugin against the aligned repo + Figma.

## Guardrails

- Write `packages/tokens/source/` only; let `build.mjs` + the `tokens-validate` CI build. Never hand-edit generated files.
- One reviewable PR per unit; keep the web build + `tokens:check` green.
- Secrets: PAT in `clientStorage`, never committed/logged; move the Chromatic token to a CI secret.
- No Figma-structural change without a preview + confirm.
