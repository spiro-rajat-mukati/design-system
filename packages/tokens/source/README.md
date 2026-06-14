# Token sources

This folder is **the only place tokens are authored.** The CSS and TS files in `packages/tokens/` are generated artifacts — never edit them directly. The CI guard (`tokens:check`) will reject any PR that hand-edits a generated file.

## Files

| File | Purpose |
|---|---|
| `$metadata.json` | Tokens Studio set order. Order matters — later sets override earlier ones. |
| `$themes.json` | Theme combinations (Light/Dark × Web/iOS/Android). Tokens Studio in Figma uses this; the build script derives modes from it conceptually. |
| `core.json` | Primitives + mode-agnostic semantics (typography roles, spacing roles, elevation). Loaded by every theme. |
| `color-light.json` | Semantic colors for light mode. |
| `color-dark.json` | Semantic colors for dark mode. |
| `components.json` | Component tokens (single baseline density). References semantic colors via `{…}`. |
| `components-dark.json` | Dark-only overrides for component tokens whose values can't be expressed by flipping a semantic alone (alpha-tinted overlays, neutral-stepped controls). |
| `platform-web.json` | Web platform overrides — currently a no-op; defaults already web-appropriate. |
| `platform-ios.json` | iOS overrides (SF Pro font family). Wired in Phase 4. |
| `platform-android.json` | Android overrides (Roboto). Wired in Phase 4. |

## Authoring rules

- **W3C Design Tokens shape.** Every leaf has `$value` and `$type`. Optional `$description` is encouraged for any non-obvious token.
- **Reference syntax.** Use `{path.to.token}` (dot-separated). Aliases must point at a token in an enabled set for the active theme.
- **Layer discipline.** Primitives don't reference anything. Semantics reference primitives only. Component tokens reference semantics only. Skipping layers is a review-stopper.
- **No raw colour in `components.json`.** If you find yourself writing `#…` or `rgba(…)` in a component token, you're missing a semantic. Either add a semantic colour or alias an existing one.
- **One responsibility per file.** Light colour values go in `color-light.json`, never in `core.json` or `components.json`. Don't smear concerns across files.

## Building

```
npm run tokens:build      # one-shot
npm run tokens:watch      # rebuild on source change
npm run tokens:check      # CI guard — fails if generated files are stale
```

The build runs automatically before `start`, `build`, `storybook`, and `build-storybook` (via `pre*` hooks). You shouldn't normally need to run it manually.

## Outputs (do not edit by hand)

All six files live directly in `packages/tokens/` (not in a subdirectory).

- `packages/tokens/primitives.css` — primitives in `:root`.
- `packages/tokens/semantics.css` — light semantics in `:root`, dark overrides in `[data-theme="dark"]`.
- `packages/tokens/component-tokens.css` — components in `:root`, plus a `[data-theme="dark"]` override block.
- `packages/tokens/tokens.ts` — flat token maps per theme (light/dark) for JS consumers.
- `packages/tokens/tokens.native.ts` — fully-resolved nested theme objects for React Native (no CSS variables).
- `packages/tokens/tokens.figma-variables.json` — Figma Variables import payload (6 modes: Web/iOS/Android × Light/Dark).

## Figma sync

Tokens Studio in Figma reads this folder via GitHub sync. The `$themes.json` file controls which combinations appear as Figma Variables Modes. When you merge to `main`, designers get the new tokens in Figma without doing anything.

## Adding a new token

1. **Decide the layer.** Is it a raw value (primitive), an intent (semantic), or per-component (component token)?
2. **Add it to the right file** with `$value` and `$type`. If it's mode-dependent, add it to the right mode file.
3. **Run `npm run tokens:build`** locally. The generated CSS / TS picks up the new token automatically.
4. **Reference it** from component CSS (or RN code) using the generated CSS variable / TS property.
5. **Open a PR.** Both design and engineering leads review. Merge → token publishes to Figma + npm.
