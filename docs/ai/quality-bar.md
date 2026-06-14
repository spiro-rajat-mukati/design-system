# Quality bar

> The definition of done for every change that touches the design system or consumes it. **An AI agent's job is not finished until this checklist passes.**

## How to use this file

_Two rules:_

1. Run this checklist on _your own output_ before asking a human to review.
2. When something fails, fix it before handing off. Don't shift it to "follow-up."

## The checklist

_Grouped by concern. Each item should be a yes/no check, not a discussion._

### Tokens

- [ ] No hardcoded colours, sizes, radii, durations, or shadows.
- [ ] All visual values come from semantic or component tokens.
- [ ] No primitives referenced directly from a component.

### Components

- [ ] Every UI element is a Kijani component (or a documented composition of them).
- [ ] No raw HTML controls (`<button>`, `<select>`, `<input>`) where a Kijani component exists.
- [ ] No detached / forked / locally-redefined component logic.
- [ ] Component props match the documented API; no string-typed props that should be enums.

### Modes

- [ ] Web: renders correctly in light.
- [ ] Web: renders correctly in dark.
- [ ] Web: renders correctly in RTL (no `left` / `right` properties — logical only).
- [ ] Mobile: renders correctly in light/dark × platform (iOS/Android).
- [ ] Mobile: touch targets meet platform minimums (≥ 44px).

### States

- [ ] Default state.
- [ ] Hover (where applicable).
- [ ] Focus (visible, keyboard-reachable).
- [ ] Disabled.
- [ ] Loading.
- [ ] Empty.
- [ ] Error.

### Accessibility

- [ ] axe-core: zero violations.
- [ ] Keyboard: every interactive element reachable + operable without mouse.
- [ ] Screen reader: labels, roles, and state changes announced correctly.
- [ ] Focus order matches visual order.
- [ ] Colour contrast meets WCAG AA in every mode.
- [ ] Motion respects `prefers-reduced-motion`.

### Code quality

- [ ] TypeScript: no `any`, no `@ts-ignore`, no `// eslint-disable` without an inline justification.
- [ ] Props named consistently with the existing API surface in this repo.
- [ ] No dead code, no commented-out blocks.
- [ ] No console logs.
- [ ] Imports use the public entry point; no deep imports into a component's internals.

### Tests

- [ ] Behaviour covered by unit tests (not snapshot tests).
- [ ] Storybook story per significant state.
- [ ] Chromatic snapshot reviewed; intentional diffs annotated in the PR.

### Bundle and performance

- [ ] No new heavy dependency without a PR comment justifying it.
- [ ] No dynamic imports of the design system itself (it's already tree-shaken).
- [ ] Bundle impact noted in the PR description if it's non-trivial.

### Documentation

- [ ] Changelog entry written.
- [ ] If a component API changed, the migration note is included.
- [ ] If a token changed, downstream consumers are tagged.

## How to self-run the checklist (AI)

_Prompt fragment AI can use on its own output:_

```
Run the docs/ai/quality-bar.md checklist on the code you just produced.
For each section, report pass / fail / not-applicable with one sentence of evidence.
Do not summarise as "looks good." If a section can't be verified without running
the code, say so explicitly.
```

## When a check legitimately fails

_Short paragraph: some checks can fail intentionally — e.g. a Figma-only change has no Chromatic snapshot. The rule is: name the exception in the PR description, don't hide it. Anything not named is taken as missed._
