# Prompting

> The internal prompt library. Templates that reliably produce Kijani-quality output across Claude.ai, Claude Code, Cowork, Lovable, and Antigravity. **Copy a template, fill in the bracketed slots, send.**

## How to use this file

_Three rules:_

1. **Always paste the project context block first** (next section). Without it, the model has no idea what library to use.
2. **Pick the template that matches your task** — not the closest one. Templates are tuned per task.
3. **Fill every bracketed slot.** Empty slots produce hallucinations.

## The project context block (always include)

```
You are working inside the Kijani Design System.
The source of truth is this repository.
Before generating anything, read CLAUDE.md and follow:
- docs/ai/component-usage.md  (component selection rules)
- docs/ai/token-usage.md      (token tier rules)
- docs/ai/quality-bar.md      (definition of done)

Hard constraints:
- Use Kijani components, not raw HTML controls.
- Use Kijani tokens, never hardcoded visual values.
- Every change must work in light, dark, compact, comfortable modes.
- Accessibility violations are build errors, not follow-ups.
```

## Templates by task

### 1 — "Build me a screen from this spec"

_For Claude Code, given a Figma spec or Markdown spec._

```
[paste project context block]

Task: implement [screen name] from the spec at [path or pasted below].

Steps:
1. Read the spec end-to-end before writing code.
2. List the Kijani components you'll use and why.
3. Identify any state I haven't specified (loading, empty, error, RTL).
4. Ask me one round of clarifying questions if anything is unclear.
5. Implement against the spec, including stories + tests.
6. Run the quality-bar checklist from docs/ai/quality-bar.md.
7. Report what you skipped or stubbed.

Spec:
[paste spec or path]
```

### 2 — "Generate a component variant"

```
[paste project context block]

Task: add a new variant `[variant-name]` to the `[ComponentName]` component.

Constraints:
- The variant must be expressed through existing tokens; do not introduce new tokens unless I confirm.
- The Storybook story must cover all four modes (light/dark/compact/comfortable).
- Visual regression: include a Chromatic-safe snapshot.

Reference: the existing variants in src/components/[ComponentName]/.
```

### 3 — "Turn this Figma frame into a spec"

_For Cowork or Claude.ai with a screenshot or Figma URL._

```
[paste project context block]

Task: write the developer spec for this design.

Output format (Markdown):
- Components used (with prop values)
- Layout decisions (which layout primitive, why)
- Each interactive element: behaviour, focus order, keyboard handling
- States: default, hover, focus, disabled, loading, empty, error, RTL
- Accessibility intent (what an SR user should hear)

The spec should be specific enough that a dev can build it without follow-up.
```

### 4 — "Review this PR for design-system fidelity"

```
[paste project context block]

Task: review the diff at [PR URL or pasted diff].

Check against docs/ai/quality-bar.md and report:
- Hardcoded visual values (any)
- Components that don't exist in the library
- Missing mode coverage in stories
- Missing a11y attributes
- TS escapes (any, @ts-ignore, eslint-disable without justification)

Do not approve. Surface findings as a checklist.
```

### 5 — "Sharpen a problem statement" (PM)

```
You are helping a Kijani PM draft a one-pager.
Ask me the minimum questions needed to fill this template:

- Problem (one sentence)
- User (who exactly, doing what)
- Today's workaround
- What success looks like in one quarter
- What this is NOT (scope cuts)

When you have answers, draft the one-pager.
```

### 6 — "Explore a flow" (PM + designer)

_For Lovable or Cowork._

```
You are building a clickable prototype inside the Kijani Design System.

Goal: [one sentence — what does the user need to accomplish?]

Constraints:
- Use Kijani Web components.
- No new visual ideas; rearrange and configure existing components.
- Show me the three most-different layouts that solve the goal.
- For each, name the components used and the trade-off.
```

## Patterns that make prompts produce better output

_Bulleted advice section, ~6 items:_

- **Always tell the model where to start reading.** "Read CLAUDE.md first" raises output quality more than any other single instruction.
- **Demand a plan before code.** "List the components you'll use and why" catches bad component choices cheaply.
- **Constrain output shape, not creativity.** "Output as Markdown with these sections" works; "be creative" doesn't.
- **Give negative examples.** "Don't roll a custom dropdown; use `Select`." This is more reliable than the positive form alone.
- **Ask for the diff, not the whole file.** Reduces drift on unrelated lines.
- **Make the model self-check.** Ending a prompt with "now run the docs/ai/quality-bar.md checklist on your own output" raises floor quality dramatically.

## Anti-patterns

_Bulleted:_

- "Just make it look nice" — the model has no reference for "nice"; the template above is the reference.
- Pasting a screenshot without the context block — the model defaults to generic Tailwind UI.
- Letting the model pick a component without justification — even one sentence of "why this component" catches most misuses.
- Re-prompting in the same thread after a bad output without explicitly saying what was wrong. The model anchors on the previous attempt.

## Maintenance

_One paragraph: this file is updated when (a) a template stops producing good output, or (b) a new common task emerges. PRs to this file go through both leads, same as component changes._
