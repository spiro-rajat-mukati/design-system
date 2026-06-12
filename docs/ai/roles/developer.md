# Role guide — Developers

> Your two-minute orientation to using AI inside the Kijani Design System. **Claude Code is the primary tool; the repo is the context. Before you prompt, make sure the agent has read `CLAUDE.md`.**

## The shape of your day with AI

_Three short paragraphs:_

1. **In-repo builds.** Claude Code (or Antigravity) is excellent at implementing a spec against the library — when it has the spec, `CLAUDE.md`, and `docs/ai/component-usage.md` in context. Without those, it produces near-misses.
2. **Refactors and migrations.** Claude Code is excellent at sweeping changes (rename, prop migration, token swap) when the rules are precise. Be explicit about scope; ambiguity bleeds across files.
3. **Review and self-review.** Before requesting human review, run the [quality bar](../quality-bar.md) checklist on the diff. The `/review` slash command runs a first pass.

## Setting up Claude Code for this repo

_Step list:_

1. Clone the repo and `cd` in.
2. Confirm `CLAUDE.md` is at the repo root.
3. Start a session in this directory; Claude Code reads `CLAUDE.md` automatically.
4. For long sessions, run the `/init` skill once to seed project memory.
5. For PR reviews, run the `/review` skill on your branch before pushing.

## Templates you'll use most

_Pointer:_

The [prompting library](../prompting.md) has six templates. The three you'll use most are:

- _"Build me a screen from this spec"_
- _"Generate a component variant"_
- _"Review this PR for design-system fidelity"_

## How to write a prompt Claude Code will execute well

_Bulleted advice:_

- **Always demand a plan before code.** Tell the agent to list components + tokens it'll use, before writing anything. Reject the plan if it's wrong; don't reject the implementation.
- **Constrain the diff.** "Modify only `src/components/Button/` and its stories" stops collateral edits.
- **Reference files by path, not name.** `src/components/Button/Button.tsx` beats "the button component."
- **Ask for tests in the same turn.** Adding tests after the fact is harder than asking for them up front.
- **End every prompt with the self-check.** "Now run docs/ai/quality-bar.md on your output."

## What Claude Code is bad at (and what to do instead)

_Compact list:_

- **Architecture decisions across the system.** Don't ask "should this be a new component or a variant?" — that's an RFC. Ask the leads.
- **Long-running refactors without checkpoints.** Break the work into PR-sized chunks; let the agent finish one before starting the next.
- **Visual judgement.** Claude Code can implement; it can't tell you whether the visual is on-brand. Run Chromatic and look.

## Anti-patterns

_Bulleted:_

- Letting the agent introduce a new dependency without confirming. Always ask "what new packages are you adding?" before approving.
- Accepting an implementation that "looks fine" without running the quality-bar checklist. The failure modes (mode coverage, a11y, RTL) aren't visible at a glance.
- Skipping the Storybook story update. The story is part of the change, not a follow-up.

## What to escalate, and to whom

_Two paragraphs:_

- _Token change_ → both leads review the PR against `src/tokens/source/`.
- _Component API change_ → RFC required. Both leads sign off.
- _Cross-cutting change (e.g. all components getting a new prop)_ → schedule a sync; don't surprise the team in a PR.
