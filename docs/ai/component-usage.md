# Component usage

> The contract every AI agent (and human) must follow when assembling UI from Kijani components. **If you're about to write `<div>` for something a component covers, stop and read this first.**

## How to choose a component

1. **Is the user picking from a known set of options?** → `Select` (1 of many, searchable), `MultiSelect` (several of many), `Radio` (short single-choice, all options visible), `Checkbox` (binary or multi-select), or `Tabs` (switching views within a page). Never roll a custom dropdown.
2. **Is it an action that mutates state or submits?** → `Button` (or `ButtonGroup` for a set of related actions). Not a link styled as a button.
3. **Is it navigation that changes the URL?** → a link. Not a button styled as a link.
4. **Is it inline status feedback?** → `Toast` (transient), `Tag` (inline / removable chip), or `Badge` (a count/status marker on another element). Pick by lifetime and anchor.
5. **Is it a form field?** → `Field` wrapping the appropriate input (`TextInput`, `Textarea`, `NumericInput`, `Select`, `Checkbox`, `Radio`). Never an input without `Field`.
6. **Is it a contextual overlay off a trigger?** → `Menu` (a list of actions) or `Popover` (small contextual content). There is no focus-trapping modal in the set — for a blocking task, design an inline flow instead.

## The production components

| Component | Use for | Don't use for | Story |
|---|---|---|---|
| Badge | A count / status marker on another element | Actions (use Button) | `Badge.stories.tsx` |
| Button | Mutating actions / form submission | Navigation (use a link) | `Button.stories.tsx` |
| ButtonGroup | A set of related actions or toggles | Unrelated buttons | `ButtonGroup.stories.tsx` |
| Checkbox | Binary, or multi-select from a visible set | Single choice from many (Radio/Select) | `Checkbox.stories.tsx` |
| Field | Wrapping any input: label + help + error + aria | A standalone label | `Field.stories.tsx` |
| Input | The base text-input primitive | Direct use — prefer `TextInput` | _(base of TextInput)_ |
| Menu | A list of actions from a trigger | Form selection (use Select) | `Menu.stories.tsx` |
| MultiSelect | Picking several from many | Single choice (use Select) | `MultiSelect.stories.tsx` |
| NumericInput | Numeric entry with step / formatting | Free text (use TextInput) | `NumericInput.stories.tsx` |
| Popover | Small contextual content on a trigger | Primary content that must be reachable on touch / SR | _(no story yet)_ |
| ProgressBar | Determinate or indeterminate progress | Inline status (use Tag) | `ProgressBar.stories.tsx` |
| Radio | Single choice from a short, visible set | Long lists (use Select) | `Radio.stories.tsx` |
| Select | Picking 1 from many | Picking many (use MultiSelect) | `Select.stories.tsx` |
| Tabs | Switching views within a page | Site-level navigation | `Tabs.stories.tsx` |
| Tag | Inline status / metadata / removable chip | Action triggers (use Button) | `Tag.stories.tsx` |
| TextInput | Single-line text | Long-form text (use Textarea) | `TextInput.stories.tsx` |
| Textarea | Multi-line text | Code editing | `Textarea.stories.tsx` |
| Toast | Transient feedback | Persistent errors (bind to the Field) | `Toast.stories.tsx` |

Stories live beside each component in `packages/web/src/components/<Name>/`. The published, browsable Storybook URL is in the repo `README` once a Chromatic build is linked.

## Composition rules

- **Compose from the inside out.** Build a row of fields, then a form, then a page — not the other way.
- **Mode (light/dark) is inherited.** Never pass colour props for theming — let the CSS variables do their work.
- **Spacing comes from layout primitives**, not from margins on the components themselves. Use `Stack`, `Grid`, or `Row` (when available) and let them set the gap.
- **Forms always use `Field`.** That's how labels, help text, error text, and aria-wiring stay consistent.
- **Mirror the API on mobile.** `@kijani/mobile` uses the same prop and token names where it makes sense; diverge only where native UX demands it.

## Anti-patterns AI must avoid

- **Re-implementing a component "with a tweak."** If the existing component doesn't cover the case, file an RFC (`docs/ai/rfc-template.md`). Don't fork.
- **Wrapping a component in extra divs to override its styling.** That's a sign the component is missing a prop — say so.
- **Mixing Kijani components with raw HTML controls** (`<select>`, `<button>`). Pick one world per surface.
- **Using `Popover`/`Menu` for primary content.** Overlays are for secondary, contextual content; anything that must be reachable on touch or by a screen reader belongs in the page flow.
- **Using `Toast` for a persistent error.** Toast is transient; bind a persistent validation error to its `Field` instead.

## Examples

### Example 1 — picking the right disclosure

```tsx
// ❌ custom dropdown from divs — no keyboard, no aria, no token styling
<div className="dropdown" onClick={toggle}>
  {selected ?? "Choose a role"}
  {open && roles.map((r) => <div onClick={() => pick(r)}>{r.label}</div>)}
</div>

// ✅ Select — keyboard, aria, and tokens handled for you
<Field label="Role">
  <Select value={role} onChange={setRole} options={roles} placeholder="Choose a role" />
</Field>
```

### Example 2 — form composition

```tsx
// ❌ bare input + label — no help/error wiring, inconsistent spacing
<label>Email</label>
<input value={email} onChange={(e) => setEmail(e.target.value)} />
<span className="err">{error}</span>

// ✅ Field-wrapped — label, error, and aria-describedby bound automatically
<Field label="Email" error={error}>
  <TextInput value={email} onChange={setEmail} type="email" />
</Field>
```

### Example 3 — status messaging

```tsx
// ❌ Toast for a validation error — it disappears before the user can fix it
toast.error("Email is required");

// ✅ persistent error on the Field; Toast only for the transient success
<Field label="Email" error={!email ? "Email is required" : undefined}>
  <TextInput value={email} onChange={setEmail} />
</Field>;
// ...on successful save:
toast.success("Profile saved");
```

## When you can't find the right component

1. Don't ship a one-off. File an RFC using `docs/ai/rfc-template.md` — include the use case, the closest existing component, and what's missing. In solo mode the owner can accept it in the same PR that implements it.
2. Scope realistically: a new variant on an existing component is small; a brand-new component is a larger unit of work. Where you can, compose what already exists rather than waiting on new primitives.
