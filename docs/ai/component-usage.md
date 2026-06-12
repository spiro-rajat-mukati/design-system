# Component usage

> The contract every AI agent (and human) must follow when assembling UI from Kijani components. **If you're about to write `<div>` for something a component covers, stop and read this first.**

## How to choose a component

_Decision tree, ~5 questions. Examples:_

1. **Is the user picking from a known set of options?** → `Select` (long list, searchable) or `Tabs` (small set, persistent) or `Radio` (short, single-choice with all options visible). Never roll a custom dropdown.
2. **Is it a yes/no commitment that mutates state?** → `Button`. Not a link styled as a button.
3. **Is it navigation that changes the URL?** → Link. Not a button styled as a link.
4. **Is it inline status feedback?** → `Toast` (transient) or `Banner` (persistent) or `Tag` (inline). Pick by lifetime.
5. **Is it a form field?** → `Field` wrapping the appropriate input. Never an input without `Field`.

## The 16 production components

_Table — name, one-line purpose, link to Storybook story, common misuses:_

| Component | Use for | Don't use for | Storybook |
|---|---|---|---|
| Button | Mutating actions | Navigation | TODO link |
| Field | Wrapping any input with label + help + error | Standalone label | TODO link |
| Input | Single-line text | Long-form text (use Textarea) | TODO link |
| Textarea | Multi-line text | Code editing | TODO link |
| Select | Picking 1 from many | Picking many (use Combobox) | TODO link |
| Combobox | Searchable / multi-select | Trivial yes-no | TODO link |
| Checkbox | Binary or multi-select | Single choice from many | TODO link |
| Radio | Single choice from a short visible set | Long lists | TODO link |
| Switch | Immediate on/off state | Form submission flag | TODO link |
| Tabs | Switching views within a page | Site-level nav | TODO link |
| Toast | Transient feedback | Persistent errors | TODO link |
| Banner | Persistent inline status | Transient feedback | TODO link |
| Tag | Inline status / metadata | Action triggers | TODO link |
| Modal | Focused task interrupting flow | Side-by-side comparison | TODO link |
| Drawer | Adjacent context without full takeover | Quick confirmations | TODO link |
| Tooltip | Brief clarification on hover/focus | Critical info (sighted-mouse-users only) | TODO link |

## Composition rules

_Bulleted:_

- **Compose from the inside out.** Build a row of fields, then a form, then a page — not the other way.
- **Mode (light/dark) is inherited.** Never pass colour props for theming — let CSS variables do their work.
- **Spacing comes from layout primitives**, not from margins on the components themselves. Use `Stack`, `Grid`, or `Row` (when available) and let them set the gap.
- **Forms always use `Field`.** This is how labels, help text, error text, and aria-wiring stay consistent.

## Anti-patterns AI must avoid

_Concrete callouts:_

- **Re-implementing a component "with a tweak."** If the existing component doesn't cover the case, file an RFC. Don't fork.
- **Wrapping a component in extra divs to override its styling.** That's a sign the component is missing a prop — say so.
- **Mixing Kijani components with raw HTML controls** (`<select>`, `<button>`). Pick one world per surface.
- **Using a `Modal` as a non-modal panel.** Modals trap focus; panels don't. Use `Drawer` or an inline layout instead.
- **Stacking `Tooltip` on critical content.** Tooltips aren't readable on touch or by screen readers reliably enough to carry primary info.

## Examples

_Three short before/after snippets. Each ~10 lines. Filled in later:_

### Example 1 — picking the right disclosure

```tsx
// TODO: bad version (custom dropdown with divs)
// TODO: good version (Select)
```

### Example 2 — form composition

```tsx
// TODO: bad version (inputs without Field)
// TODO: good version (Field-wrapped, error-bound)
```

### Example 3 — status messaging

```tsx
// TODO: bad version (Toast used for a persistent error)
// TODO: good version (Banner for persistent, Toast for transient)
```

## When you can't find the right component

_Two paragraphs:_

1. _Don't ship a one-off. File an RFC in GitHub (template at `docs/ai/rfc-template.md` — TODO). Include the use case, the closest existing component, and what's missing._
2. _If the change is small (a variant on an existing component), the lead-time is 1–2 weeks. If it's a new component, 3–6 weeks. Plan around that, or scope the work to use what exists._
