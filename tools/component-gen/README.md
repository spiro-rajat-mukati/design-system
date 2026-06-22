# component-gen — the organism → dev-ready flow

Automates the mechanical half of turning a Figma organism into a `@kijani` component.

- **`scaffold.mjs`** — deterministic, zero-dep CLI. Given a completed `<Name>.spec.json`
  it emits the types, a compiling component shell, the barrel, a Code Connect stub, and a
  test file; appends the library export; and regenerates the manifest. It never writes the
  component *body* or the prop API — those are judgment calls (D19).
- **`SKILL.md`** — the `new-organism` orchestration skill. It drives the full flow:
  read Figma → classify → dedup (gate) → interview the gaps → write the spec → API review
  (gate) → run the scaffolder → implement body + tests → verify → spec frame (D20) →
  demo → commit (gate). Install it via Settings → Capabilities (or bundle it in a plugin);
  it can't be registered from a chat session.

## Quick use (scaffolder only)

```bash
node tools/component-gen/scaffold.mjs --spec packages/mobile/src/components/Foo/Foo.spec.json
# flags: --force (overwrite hand-maintained files) · --no-index · --no-manifest
```

## Split of responsibility

| Deterministic (scaffolder) | Judgment (agent + human) |
|---|---|
| files, types, barrel, stubs | component body + behaviour |
| manifest regen, export wiring | prop API design, dedup call |
| respects `updateModel` (no clobber) | a11y, states, spec-frame copy |

See `docs/ai/component-intake.md` (the checklist), `docs/ai/component-spec.schema.json`
(the contract), and decisions **D19 / D20** for the why.
