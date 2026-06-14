# Token usage

> The contract for visual values. **No hardcoded colours, sizes, radii, durations, or shadows. Ever.** This file explains the tier system, when each tier is appropriate, and the anti-patterns that creep in when nobody's looking.

## The three tiers

_Diagram-style summary:_

```
primitive  →  semantic  →  component
(raw)         (intent)      (slot)
```

- **Primitive tokens** — raw values. `color.blue.500`, `space.4`, `radius.md`. Never reference these from a component directly.
- **Semantic tokens** — intent-bound. `color.fg.brand`, `color.bg.surface`, `space.inset.md`. These re-bind under each mode (light/dark).
- **Component tokens** — per-component slots. `button.primary.bg`, `field.border.error`. These resolve to semantics; rebind only when the component genuinely needs a different value.

## Which tier to use

_Decision tree:_

1. **Are you authoring a primitive?** You're probably not. Only the foundations file authors primitives. Stop and ask.
2. **Are you authoring a component?** Use component tokens for that component, falling back to semantics where the slot doesn't yet exist.
3. **Are you authoring a page-level layout?** Use semantics. Page-level CSS should not reference component tokens (those belong to the component).
4. **Are you about to inline a hex / rem / px value?** Wrong tier — find the right token instead.

## Anti-patterns

_Examples with concrete fixes:_

- ❌ `color: #5B7CFA` → ✅ `color: var(--color-fg-brand)`
- ❌ `padding: 12px 16px` → ✅ `padding: var(--space-inset-sm)` (or a layout primitive)
- ❌ `border-radius: 8px` → ✅ `border-radius: var(--radius-md)`
- ❌ `transition: 200ms` → ✅ `transition: var(--duration-quick)`
- ❌ `box-shadow: 0 4px 12px rgba(0,0,0,0.1)` → ✅ `box-shadow: var(--shadow-card)`

## Modes (light, dark)

_Short paragraph: modes are bound at the semantic tier. A component never branches on "if dark mode" — it references a semantic token, and the semantic token rebinds. If you find yourself writing mode-aware code in a component, that's the signal that the semantic tier is missing a token._

## RTL

_Short paragraph: never use `left` / `right` properties. Use logical (`inline-start` / `inline-end`) or layout primitives. The tokens are direction-agnostic; the CSS shouldn't pretend otherwise._

## When you genuinely need a new token

_Two-step process:_

1. Argue for a semantic, not a primitive. New primitives are very rare. New semantics happen most weeks.
2. File a PR against `packages/tokens/source/` — never against the generated build files. The build pipeline regenerates everything else (CSS variables, TypeScript types, Figma Variables) from source.

## How the build pipeline uses tokens

_Short paragraph: `packages/tokens/source/*.json` is the source. The build emits CSS variables (consumed by components), TypeScript declarations (consumed by RN and type-checking), and `tokens.figma-variables.json` (consumed by the Figma plugin). Never hand-edit generated files — CI will reject the PR._

## How AI agents should query token availability

_Quick recipe:_

- "What's the semantic token for danger background?" → grep `packages/tokens/source/color-light.json` for `bg.danger`.
- "Is there a token for shadow-elevated?" → grep `packages/tokens/source/core.json` for `shadow-elevated`.
- If nothing matches, the token doesn't exist yet. Don't invent one in CSS; propose it.
