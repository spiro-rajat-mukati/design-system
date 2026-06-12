# Role guide — Product Managers

> Your two-minute orientation to using AI inside the Kijani Design System. **You won't need to write code; you do need to know which tools produce which outputs and how to scope a build so AI delivers something usable.**

## The shape of your day with AI

_Three short paragraphs:_

1. **Sharpening intent.** Cowork / Claude.ai are best at turning a fuzzy idea into a sharp one-pager. Use them at Stage 1 of the [pipeline](../pipeline.md).
2. **Exploring options.** Lovable / Cowork are best at standing up clickable prototypes from prose. Use them at Stage 2 — to show the team three plausible flows before designers commit to one.
3. **Reviewing builds.** Once a dev (or Claude Code) ships a PR, Cowork can run the [quality bar](../quality-bar.md) checklist on the diff so you can spot fidelity issues without reading the code.

## What to ask for, and from whom

_Compact table:_

| Tool | Best for | Worst for |
|---|---|---|
| Cowork | One-pagers, summaries, diff reviews | Building real product surfaces |
| Lovable | Prototype flows from prose | Production code |
| Claude.ai | Sharpening text, debating trade-offs | File operations |
| Claude Code | Production code in the repo | Strategy |
| Antigravity | Agentic builds across files | Quick one-shot prompts |

## Templates you'll use most

_Pointer:_

The [prompting library](../prompting.md) has six templates. The three you'll use most are:

- _"Sharpen a problem statement"_
- _"Explore a flow"_
- _"Review this PR for design-system fidelity"_

Use them verbatim. Don't paraphrase — the constraints in the templates are doing the work.

## How to scope a build so AI delivers

_Bulleted advice:_

- **Always describe the user, the action, and the success state.** Skipping any of the three sends the AI guessing.
- **Name 1–3 components you expect in the result.** This anchors the AI to the library rather than generic UI.
- **Specify which states matter.** Loading and empty almost always matter; error usually does; RTL is required.
- **Decline the first answer that looks close.** Ask for three variations. The right answer is usually the one you didn't ask for.

## Anti-patterns

_Bulleted:_

- Treating Cowork as a designer. It produces prose and prototypes; it doesn't make design decisions.
- Skipping the [pipeline's Stage 4 (Spec)](../pipeline.md). If the dev gets a Figma file and no written spec, AI builds against vibes.
- Shipping the first prototype as "design done." Prototypes are exploration, not specification.

## What to escalate, and to whom

_Two paragraphs:_

- _Bug in an existing component_ → file a GitHub issue with the `bug` label. Both leads are on it.
- _New variant / new component_ → RFC template (TODO link). Both leads review. Token tweak: same week; new variant: 1–2 weeks; new component: 3–6 weeks.
