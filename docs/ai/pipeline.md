# Design-to-dev pipeline

> How an idea becomes shipped, production-ready code at Kijani — and where AI plugs in at each stage. **This is the workflow every Kijani project follows, regardless of who started it.**

## Why this exists

_One paragraph: the pipeline is the contract between roles. It tells a PM what a designer needs from them, a designer what a dev needs, and an AI agent what context to demand before generating anything. The pipeline also tells reviewers what to check at each stage so we don't catch problems too late._

## The seven stages

_Each stage gets a heading below. For every stage we describe: **inputs**, **the human owner**, **what the AI is reading**, **the deliverable**, and **the gate to the next stage**._

### Stage 1 — Intent

- **Owner:** PM (or whoever proposed the work)
- **Input:** business problem, user, success metric
- **AI reading:** [`roles/pm.md`](./roles/pm.md), [`prompting.md`](./prompting.md)
- **Deliverable:** one-pager (problem · user · what success looks like)
- **Gate to next:** problem statement is sharp enough that a designer can sketch without follow-up.

### Stage 2 — Shape

- **Owner:** PM + designer
- **Input:** the one-pager
- **AI reading:** [`prompting.md`](./prompting.md), Lovable / Cowork prompt templates
- **Deliverable:** low-fi flow (Figma frames, Lovable prototype, or both)
- **Gate:** flow is testable on the team before pixels.

### Stage 3 — Design

- **Owner:** designer
- **Input:** the low-fi flow + edge-case list
- **AI reading:** [`component-usage.md`](./component-usage.md), [`token-usage.md`](./token-usage.md), [`roles/designer.md`](./roles/designer.md)
- **Deliverable:** Figma frames built _entirely_ from Kijani library components, Variables, and Text Styles. Modes covered (light, dark). Mobile: light/dark × platform (iOS/Android). Empty / loading / error / RTL states included.
- **Gate:** zero detached instances, zero hardcoded values in the Figma file.

### Stage 4 — Spec

- **Owner:** designer (with AI assistance)
- **Input:** the Figma file
- **AI reading:** [`component-usage.md`](./component-usage.md), [`quality-bar.md`](./quality-bar.md)
- **Deliverable:** a written spec (Markdown or a Figma comment thread) listing: components used, prop values, layout decisions, behaviour for each state, accessibility intent.
- **Gate:** spec is concrete enough that a dev (or Claude Code) can build it without guessing.

### Stage 5 — Build

- **Owner:** developer (with AI assistance — typically Claude Code)
- **Input:** the spec
- **AI reading:** the whole `docs/ai/` tree, the existing component code, the token files
- **Deliverable:** PR with code + Storybook stories + tests + Chromatic snapshot
- **Gate:** [`quality-bar.md`](./quality-bar.md) checklist passes end-to-end.

### Stage 6 — Review

- **Owner:** design lead + eng lead (jointly)
- **Input:** the PR + Chromatic diff
- **AI reading:** [`quality-bar.md`](./quality-bar.md), `/security-review` and `/review` slash commands
- **Deliverable:** approval (or RFC if scope grew during build)
- **Gate:** both leads sign off; Chromatic baseline updated; changelog entry written.

### Stage 7 — Ship + observe

- **Owner:** developer
- **Input:** merged PR
- **AI reading:** changelog template
- **Deliverable:** release notes, version bump, downstream consumers notified
- **Gate:** the change is visible in Storybook + on the showcase site within 24 hours.

## Where AI plugs in (cheat sheet)

_Compact reference table:_

| Stage | AI tool | What it does well | What still needs a human |
|---|---|---|---|
| Intent | Cowork, Claude.ai | Sharpen problem, draft one-pager | Pick the bet |
| Shape | Lovable, Cowork | Generate a clickable flow from prose | Decide which flow to invest in |
| Design | Figma plugin + Claude | Pull components, run a11y / mode check | Visual judgement, edge cases |
| Spec | Claude Code, Claude.ai | Turn frames into a written spec | Confirm spec matches intent |
| Build | Claude Code | Implement against the spec | Code review, integration with surrounding app |
| Review | Slash commands | First-pass checklist + diff summary | Final sign-off |
| Ship | Claude Code | Generate changelog, version notes | Decide cadence, comms |

## Anti-patterns

_Bulleted list — what we've seen go wrong:_

- Skipping Stage 4 (Spec). AI builds against vibes-from-Figma and ships subtle drift.
- Treating Stage 3 (Design) as optional because "we have AI." Without a Figma file built from the library, the AI has no source of truth to follow.
- Generating Stage 5 (Build) code without first reading [`component-usage.md`](./component-usage.md). The AI guesses at component APIs and produces near-misses.
- Marking Stage 6 (Review) as done because the diff "looks fine." If Chromatic shows changes you didn't intend, the build is not ready.

## Sources of truth

_Final paragraph: token JSON, the component source, and Storybook are the canonical artifacts. Figma mirrors them via the plugin. The website mirrors the docs/ai/ files. Everything else is derivative — fix the source, the rest follows._
