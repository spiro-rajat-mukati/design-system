# Component intake — Figma → dev-ready, the gate

> Every component generated from a Figma component into dev-ready code passes through this gate **first**. Figma only encodes static visual structure + enumerated variants + (when disciplined) token bindings. Everything dynamic — data, behaviour, states, loading, edge cases, accessibility — is **invisible to Figma**. This checklist forces the invisible to be made explicit before generation, so the generated component is complete, not a pretty shell.
>
> The answers are captured as a machine-readable **`<Name>.spec.json`** (schema: `component-spec.schema.json`). That spec is the single source that drives codegen, Storybook stories, test stubs, Code Connect (`.figma.tsx`), and the drift manifest. Read alongside `patterns-and-templates.md` (where components live) and `quality-bar.md` (the bar they must clear).
>
> Generation is an **assisted bootstrap, not a push-button converter** (D19). It gets ~60–85% — the presentational shell, token-accurate. The dev API, behaviour, edge cases, and a11y are designed/written by a human (or heavily-reviewed AI). The output is **deliberately not 1:1 with Figma** (D5).

---

## Output of the gate

A committed `<Name>.spec.json` validating against `component-spec.schema.json`, colocated with the component. It then feeds: the generated `.tsx`, `.stories.tsx`, test stubs, `.figma.tsx`, and the `component-manifest.json` entry.

## Workflow (where the gate sits)

1. **Classify** — tier (atom / molecule / generic-organism / pattern / template) + domain (generic→`@kijani`, product→`spiro-app/src/patterns`) + target platform(s). Sets where it lives and which checklist sections apply.
2. **Dedup** — is this genuinely new, or a variant/extension of an existing component? (Prevents library bloat. If it's a variant, stop and extend the existing one.)
3. **Intake checklist** (below) — auto-prefill from the Figma node, then ask only the gaps. Capture as `<Name>.spec.json`.
4. **Generate draft** — Figma MCP `get_design_context` (Code-Connect-aware) → AI drafts an idiomatic, prop-driven component composing `@kijani` primitives + `@kijani/tokens`.
5. **API + DS-consistency review** *(human, irreducible)* — props mirror the data model not the Figma toggles; names match the existing API surface; composes real primitives; no redundant props.
6. **Implement behaviour + a11y** — events, state, async, validation, keyboard, focus, ARIA. (Not in Figma.)
7. **Audit** — tokens all bound (drift-lint clean), light/dark/platform, responsive, touch target ≥44, reduced-motion.
8. **Auto-derive artifacts from the spec** — Storybook stories (variant matrix × states), test stubs (one per behaviour), `.figma.tsx` (from the Code Connect mapping), `component-manifest.json` entry.
9. **Gates** — design sign-off (visual parity), eng review (`quality-bar.md`), axe-core zero violations, Chromatic snapshot, bundle budget.
10. **Code Connect publish + drift register** — so Dev Mode shows the real call and the drift report covers it from day one.
11. **Set the update model** — `regenerate-shell` vs `hand-maintain` + drift (generation is bootstrap-once; re-running over hand-written code clobbers it).

## Tiering — which sections are required

| Section | atom | molecule | generic-organism | pattern (domain) | template |
|---|---|---|---|---|---|
| Props / data model | light | yes | yes | **yes** | yes |
| States + control model | yes | yes | yes | yes | n/a |
| Slots / composition | — | yes | yes | yes | yes |
| Events | yes | yes | yes | yes | wiring |
| Loading / async | — | if applicable | yes | **yes** | yes |
| Edge cases | yes | yes | yes | **yes** | yes |
| Accessibility | **yes** | yes | yes | yes | page-level |
| Responsive / platform | yes | yes | yes | yes | **yes** |
| Tokens / theming | **yes** | yes | yes | yes | yes |
| Validation | inputs only | inputs only | if forms | if forms | — |
| Performance | — | — | lists/heavy | lists/heavy | yes |

Don't ask data-model/loading questions of a `Badge`. Don't skip a11y on anything.

---

## The checklist (questions, by category)

Each item notes **[auto]** (pull from the Figma node) or **[ask]** (must be answered by designer / PM / dev), and maps to a `spec` field.

### 1. Props / data model → `props`
- **[ask]** What's the underlying data object? Which parts are dynamic vs static chrome?
- **[ask]** Per field: type, required/optional, default.
- **[ask]** Enum or **continuous**? (keep `level: number`, never a "71–100%" bucket)
- **[ask]** What should be **derived** in code (status→tone, level→colour) vs passed in?
- **[auto]** Figma variants/properties → candidate props (then reshaped in step 5).

### 2. States → `states`
- **[auto]** Visual states present as variants.
- **[ask]** Full set: default · hover · focus · active · disabled · loading · error · success · empty · selected · expanded · read-only.
- **[ask]** Controlled / uncontrolled / both? Default state? What triggers each transition?

### 3. Slots / composition → `slots`, `composition`
- **[auto]** Figma slots.
- **[ask]** Which regions are injectable vs locked? Compound parts (`Card.Header`)? Polymorphic (`as`)?

### 4. Events → `events`
- **[ask]** Handlers (`onClick`, `onChange`, `onSelect`, `onRemove`…) + signatures. Debounce/throttle? Side effects / optimistic updates?

### 5. Loading / async → `loading`
- **[ask]** Skeleton / spinner / none, and where? Error + retry? Empty state? Pagination (none/paged/infinite/lazy)?

### 6. Edge cases → `edgeCases`
- **[ask]** Long text → truncate/wrap/clamp? Overflow? Null/missing field? Empty list? Big numbers (99+)? i18n length, RTL, pluralization? List of 0/1/many.

### 7. Accessibility → `a11y`
- **[ask]** Correct semantic element/role? Required ARIA (label/describedby/expanded/pressed/live)? Keyboard map (Tab, arrows, Esc, Enter/Space)? Focus management (trap/restore/roving)? SR announcements? Reduced-motion?
- **[auto]** Contrast checkable from bound tokens.

### 8. Responsive / platform → `responsive`, `meta.platforms`
- **[ask]** Fluid / fixed / fill? Breakpoint behaviour? Layout shift mobile↔desktop? Touch target ≥44? Web **and** mobile — same API, different view?

### 9. Tokens / theming → `tokens`
- **[auto]** Every value token-bound? (unbound → magic number; drift-lint flags it)
- **[ask]** Light/dark/platform all intended? Motion tokens (duration/easing)?

### 10. Validation (inputs/forms) → `validation`
- **[ask]** Validation rules + error copy? Mask/format (currency/phone)? Form-library integration?

### 11. Performance → `performance`
- **[ask]** Memoize? Virtualize list? Image optimization? Bundle budget?

### 12. Meta + ops → `meta`, `ops`, `updateModel`
- **[ask]** Owner. Replaces/deprecates anything (migration note)? Analytics hooks? Error boundary? Security (sanitize user content)? i18n keys?
- **[ask]** Update model: `regenerate-shell` or `hand-maintain` + drift?

---

## Gates / Definition of Done → `definitionOfDone`

Ships only when all true: Storybook story · behaviour unit tests · **axe-core zero violations** · light/dark/RTL pass · Code Connect `.figma.tsx` published · registered in `component-manifest.json` (drift covers it) · design sign-off (visual parity) · eng review (`quality-bar.md`).

---

## Worked example — `BatteryCard` (excerpt)

```jsonc
{
  "meta": { "name": "BatteryCard", "tier": "pattern", "platforms": ["web","mobile"],
            "domain": "product", "location": "spiro-app : src/patterns/BatteryCard",
            "owner": "rajat", "status": "draft" },
  "figma": { "fileKey": "…", "nodeId": "…" },
  "props": [
    { "name": "battery", "type": "Battery", "required": true, "description": "domain object" },
    { "name": "level", "type": "number", "derived": false, "description": "0–100 CONTINUOUS — never a bucket; colour derived from it" },
    { "name": "context", "type": "BatteryContext", "enum": ["bike","station"], "fromFigmaVariant": "Remap To" },
    { "name": "tone", "type": "Tone", "derived": true, "description": "computed from battery.status" },
    { "name": "onPress", "type": "() => void", "required": false },
    { "name": "footer", "type": "ReactNode", "description": "composition escape hatch" }
  ],
  "states": { "set": ["default","loading","empty"], "controlModel": "uncontrolled", "defaultState": "default" },
  "loading": { "strategy": "skeleton", "empty": "show 'No battery assigned'" },
  "edgeCases": { "longText": "truncate", "nullData": "hide name if absent", "maxNumber": "100" },
  "a11y": { "element": "button (if onPress) else div", "keyboard": ["Enter: activate","Space: activate"], "focusManagement": "none" },
  "codeConnect": { "mappings": [
    { "figmaProp": "Remap To", "codeProp": "context", "transform": "enum: Bike->bike, Station->station" },
    { "figmaProp": "71–100%", "codeProp": "level", "transform": "omit (continuous; example uses level=92)" }
  ] },
  "updateModel": "hand-maintain",
  "definitionOfDone": { "storybook": false, "tests": false, "a11yAxe": false, "codeConnect": false,
                        "driftRegistered": false, "designSignoff": false, "engReview": false }
}
```

Note how the Figma `71–100%` bucket collapses to a continuous `level`, and `Remap To` becomes a clean `context` prop — the lossy variant→API mapping that a human resolves in step 5.

---

_Schema: `component-spec.schema.json`. Decision: `D19` in `decisions.md`. Where components live: `patterns-and-templates.md`. Quality bar: `quality-bar.md`._
