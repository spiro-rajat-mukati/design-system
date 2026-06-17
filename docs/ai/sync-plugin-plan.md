# Figma ↔ GitHub Sync Plugin — Plan & Handoff (MASTER 2)

Context brief for Claude Code building the Kijani **DesignSync** plugin. Read with `CLAUDE.md` and `docs/ai/*`. A fuller PRD is held separately by the owner.

> **Status (2026-06-14): SHIPPED — v1 complete.** Two-way sync (Push / Pull / Diff) is live and hands-free: a Figma token edit opens a clean PR, CI regenerates the build output, and it auto-merges on green. The sections below ("Current state", "Phase 0", "v1 scope", "Sequence") are kept as build history. Remaining work is the **P2 backlog**: Styles sync, component drift via Code Connect, icon export, team/GitHub-App auth.

## What it is

A private Figma plugin that keeps the design system in sync with this repo: **push** Figma variable changes to GitHub as PRs, **diff** Figma vs. repo to catch drift, **pull** GitHub → Figma. Extends the existing `figma-plugin/`.

## Current state (2026-06-13)

- Monorepo: tokens in `packages/tokens/source/` (Tokens Studio sets), built by `packages/tokens/build.mjs` → `tokens.figma-variables.json` (**Light/Dark only today**), CSS, `tokens.ts`, `tokens.native.ts`.
- `$themes.json` has `light-web`, `dark-web`, `light-ios`, `light-android` (mobile is light-only today).
- The existing `figma-plugin/` is read-only and its `ui.html` paths are **stale** (still `src/tokens/...`).
- The Figma "Design System" collection still has the **old 4 density modes**.
- GitHub `spiro-rajat-mukati` + Figma `rajat.mukati`, both Rajat. Repo is **private**. Canonical Figma file lives in the **Mobilite "Private Limited"** org (Full/paid seat).

## Locked decisions (2026-06-13)

- **Extend `figma-plugin/`** — it is the canonical sync path; retire the Tokens Studio setup docs.
- Token format = **Tokens Studio sets**; the plugin writes `packages/tokens/source/` **only**.
- **Push = PR against `main`, auto-merged once CI passes** (hands-free, solo).
- **Conflicts = always the 3-way resolver** (Base / Figma / GitHub), no auto-pick.
- Auth = **fine-grained PAT** per user in Figma `clientStorage`; **authenticated GitHub API** (private repo). Network only from the UI thread; allow-list `api.github.com` + `raw.githubusercontent.com`.
- **Figma modes = 6:** Web {Light, Dark} + iOS {Light, Dark} + Android {Light, Dark} — add dark iOS/Android to the repo too.
- **Figma structure = 3 published files:** Foundations (shared variables + styles + foundation docs), Web components, Mobile components (Mobile starts as a *shell*). **Cowork sets these up via the Figma API — not Claude Code.**
- Mode reconciliation done **in place** (Figma version history is the safety net).

## Parity principle (important)

**The code component library and the Figma component library do NOT need to be structurally identical.** They are two representations bridged only by **shared tokens** + **Code Connect** (name/prop mapping). Components may diverge where it's more efficient or where native UX demands it (mobile especially). The plugin syncs **tokens/variables**, never component internals — for components it only does **drift detection + Code Connect mapping (no codegen, no forced 1:1)**.

## Phase 0 — Claude Code (each its own PR)

1. **Repoint `figma-plugin/`** paths → `packages/tokens/tokens.figma-variables.json` + `packages/web/src/component-specs/`. (Fixes the broken read.)
2. **Authenticated reads:** add `api.github.com` to the manifest allow-list; read the private repo via the GitHub API + PAT (raw URL 404s on a private repo).
3. **Add mobile dark + emit all 6 modes:** add `dark-ios` / `dark-android` themes to `$themes.json`; make `build.mjs` compose all **6** modes into `tokens.figma-variables.json`; cover them in `tokens:check`.

## v1 scope — Claude Code (after Phase 0)

- **Push** (Figma → GitHub) → auto-merged PR. [P0]
- **Diff / compare** (token-level + visual, per mode). [P0]
- **Pull** (GitHub → Figma) with the **3-way conflict resolver**. [P0/P1]
- Later (P2): Styles · components (**drift + Code Connect, no codegen**) · icons · team/GitHub-App.

## Sequence

① Claude Code Phase 0 (repo defines all 6 modes) → ② **Cowork** sets up the 3-file Figma split + 6-mode foundation → ③ Claude Code builds the plugin against the aligned repo + Figma.

## P2 — ① Typography / Text Styles sync (planned, locked 2026-06-14)

### Layer model

- **Foundations file** — holds the variable collections: type primitive vars (`type/size/*`, `type/weight/*`, `type/line-height/*`, `type/family/*`, `type/tracking/*`) + semantic text vars (`type/web/h1/*`, `type/web/body-m/*`, … and `type/mobile/*` equivalents) where each semantic var aliases the corresponding primitive. Both collections are published.
- **Web file / Mobile file** — each holds its own Text Styles (`Web/H1`, `Web/Body M`, …; `Mobile/H1`, …). Every style sub-property (fontSize, lineHeight, fontWeight, fontFamily, letterSpacing) is bound to the **Foundations published semantic variable** via `importVariableByKeyAsync` + `setBoundVariable`. Styles are never duplicated in Foundations.

### Build steps

1. **Repo — token split.** Add `packages/tokens/source/type-primitives.json` (raw scale values, platform-agnostic) and `packages/tokens/source/text.web.json` / `text.mobile.json` (semantic sets that alias primitives: `text.web.h1.size → {type.size.4xl}`). Line-height values in px throughout. Extend `build.mjs` to emit web + RN type tokens into existing targets; update `tokens:check` to cover the new files.

2. **Plugin — variable sync.** Extend the existing Push / Pull / Diff pipeline to cover type primitive + semantic text variables. Reuse v1's shared normalize-compare functions (float32 for numeric dims, string for weight names). No new sync architecture needed — just new variable collections using the same code path.

3. **Plugin — "ensure Text Styles" step.** A separate idempotent action (run per library file, not from Foundations): for each `text.web.*` / `text.mobile.*` semantic variable in the published Foundations collection, find or create a matching Text Style in the active file, then call `importVariableByKeyAsync` + `setBoundVariable` for each sub-property. If the variable binding already matches, no write occurs.

### Operating model

- Variable sync (steps 1–2) runs from Foundations, same as today.
- Text Style binding (step 3) runs separately from the Web file and again from the Mobile file — Foundations must be published + enabled first.
- The styles step is idempotent: re-running it on an already-bound file is a no-op.
- Naming convention: `text.web.h1` ↔ var `type/web/h1/*` ↔ style `Web/H1`; weight stored as numeric in the repo, mapped to Figma style-name on write (400 ↔ Regular, 500 ↔ Medium, 600 ↔ Semi Bold, 700 ↔ Bold).

## P2 — ② Icons (scaffolded 2026-06-15)

### Operating model

Icons follow the same **source → build → generated** model as tokens:

- **Source (authored):** `packages/icons/svg/<name>.svg` — 24 × 24 `viewBox`, `currentColor` fills/strokes, kebab-case filenames.
- **Generated (never hand-edited):** per-icon React components in `src/web/<Name>.tsx` + `src/native/<Name>.tsx`, barrel files `src/web/index.ts` + `src/native/index.ts`, root entry-points `index.ts` + `native.ts`.
- **Build:** `packages/icons/build.mjs` (zero-dep Node ESM) — reads SVGs, normalises indentation, transforms attributes to JSX camelCase, binds `currentColor` to a `color` prop, maps SVG element names to react-native-svg components, generates `forwardRef` web components and named-function native components.
- **CI:** `icons-build.yml` (path-filtered to `svg/**` and `build.mjs`, PAT-signed commit — reuses `TOKENS_BUILD_PAT`) + `icons-validate.yml` (no path filter, idempotency guard).

### Entry points

| Import | Use case |
|---|---|
| `@kijani/icons` | Web — full barrel |
| `@kijani/icons/src/web/<Name>` | Web — per-icon deep import for tree-shaking |
| `@kijani/icons/native` | React Native / Metro — full barrel |
| `@kijani/icons/src/native/<Name>` | React Native — per-icon deep import (Metro tree-shaking) |

### Starter set (PR #54 — 5 icons)

`arrow-left`, `arrow-right`, `check`, `close`, `search`.

### Figma asset file (deferred — plugin step)

The plugin's icon-export action (future P2 step) will read from the **"Kijani — Assets" Figma file** (one file, pages by type: icons / illustrations / images). Icons are exported as 24 × 24 SVGs with hardcoded colors stripped, then pushed as a PR to `packages/icons/svg/`. The CI `icons-build.yml` regenerates components automatically — the plugin never touches `src/`.

See `decisions.md D11` for the full assets routing model.

## P2 — ②b Illustrations (scaffolded 2026-06-15)

### Two lanes

`@kijani/illustrations` (`packages/illustrations`) extends the assets-by-type model to illustration artwork — two distinct source lanes, one unified consumer API.

**Vector lane** (`packages/illustrations/svg/<name>.svg`)
- Multi-color artwork. Colors are preserved as-is — illustrations are not icon-like; forcing currentColor would break gradients and multi-tone art.
- `build.mjs` cleans the SVG (strips XML decl / editor metadata / comments / inkscape attrs; removes explicit `width`/`height` from root `<svg>`; adds `width="100%" height="100%"`). Colors untouched.
- Web component: `dangerouslySetInnerHTML` on a `<span>` that sets `width` + `aspectRatio` — handles all SVG features without JSX conversion or SVGR.
- RN component: `SvgXml` from react-native-svg — accepts the SVG string, supports full SVG feature set including gradients.
- Dimensions read from `viewBox`; `width` prop controls rendered size; height auto-computed from intrinsic aspect ratio.

**Raster lane** (`packages/illustrations/raster-src/<name>.(png|jpg|jpeg)`)
- Drop-folder for AI-generated raster art. PNG is treated as 2× input.
- `build.mjs` uses `sharp` (only devDep): emits `raster/<name>@2x.webp` (original size, quality 85) + `raster/<name>.webp` (50% size, 1×). Both committed to the repo — no CDN required at this stage.
- Web component: `<img srcSet="… 1x, … 2x">` with bundler-resolved `require()` paths.
- RN component: `<Image source={require(…)}>` — Metro picks `@2x` automatically on hi-DPI.

### Unified API

| Export | Web | React Native |
|---|---|---|
| `@kijani/illustrations` | barrel + `<Illustration name="…" />` | — |
| `@kijani/illustrations/native` | — | barrel + `<Illustration name="…" />` |
| `@kijani/illustrations/manifest` | typed `manifest.ts` (name → meta) | typed `manifest.ts` |
| `@kijani/illustrations/src/web/<Name>` | deep per-illustration import | — |
| `@kijani/illustrations/src/native/<Name>` | — | deep per-illustration import |

### CI

- `illustrations-build.yml` — path-filtered to `svg/**`, `raster-src/**`, `build.mjs`; runs `npm ci` (sharp needs install); PAT-signed commit back to branch.
- `illustrations-validate.yml` — unfiltered on PR; runs `check-generated.mjs` (binary-aware idempotency guard using `Buffer.equals()`).

### Starter set (PR #57 — 1 vector + 1 raster)

- `empty-state.svg` — 240 × 180, multi-color (blue palette, folder + plus-circle motif). Proves the vector color-preservation lane.
- `hero-banner.png` → `hero-banner.webp` + `hero-banner@2x.webp` — 400 × 300 → 200 × 150 / 400 × 300. Proves the raster lane end-to-end.

See `decisions.md D12` for the full architectural rationale.

### Step 2 — plugin Export Assets (shipped PR #58)

The "Export Icons → GitHub PR" plugin action was generalized into a single **"Export Assets → GitHub PR"** action that routes by name prefix.

**Scanning (code.js):** `exportAssetsScan()` finds all `icon/*`, `illustration/*`, and `image/*` top-level COMPONENT / COMPONENT_SET nodes. COMPONENT_SET nodes export their first COMPONENT child (default variant). Exports:
- `icon/*` + `illustration/*` → `exportAsync({format:"SVG"})` → SVG bytes
- `image/*` → `exportAsync({format:"PNG", constraint:{type:"SCALE",value:1}})` → PNG bytes

All raw bytes sent to UI as `Array.from(uint8Array)`.

**Processing (ui.js):**
- Icons: `optimizeSVG()` — strips metadata, normalizes single-color → `currentColor`, flags multi-color.
- Illustrations: `cleanIllustrationSVG()` — strips metadata/editor attrs; **never alters colors** (matches D12 vector-lane spec).
- Images: kept as `Uint8Array`; no color processing.

**Diff:** Fetches GitHub directory listings for all three target paths in parallel (`ghFetchMeta`, 404 → empty). Computes git blob SHA:
- SVG: `computeGitBlobSha(svgString)` (UTF-8).
- PNG: `computeGitBlobShaBytes(uint8Array)` (binary, same formula: `SHA1("blob " + n + "\0" + bytes)`).

**PR creation:** Single atomic commit via Git Data API. PNG files committed as `{ content: base64, encoding: "base64" }` via `ghCreateBinaryBlob()` — base64-encoded in 4 KB chunks to avoid call-stack overflow. All three lanes in one tree, one commit, one branch, one auto-merge PR.

**Drop-folder fallback:** `packages/illustrations/raster-src/` can still receive PNG files by manual placement (CI `illustrations-build.yml` is path-filtered to that directory and runs on push). The plugin route is the primary path; drop-folder is the fallback.

## P2 — ③ Component drift detection (planned 2026-06-17)

On-demand, **read-only** report comparing the Figma component libraries against the code component libraries. **Detect, never codegen** (D5). Scope: coverage + prop/variant parity + hardcoded-value lint. Surfacing: plugin report on demand (a CI gate / auto-issues are deferred fast-follows).

### Data sources

- **Code contract = generated manifest.** New build script per component package emits `packages/<lib>/component-manifest.json` (generated + committed + CI-validated, same discipline as tokens). Parse each `src/components/**/<Name>.types.ts` via the TypeScript compiler API to extract: component name, source path, the exported Props interface → each prop's name + kind (string-literal union → its option list; boolean; node/other), and whether a sibling `<Name>.figma.tsx` Code Connect file exists. Tag platform (`web` | `mobile`).
- **Figma side = live component sets.** The plugin reads, per `COMPONENT_SET` in the open component file: name, variant properties + options, component properties (TEXT/BOOLEAN/INSTANCE_SWAP), and the node tree (for the lint).
- The component-drift action runs **in a component file** (Web or Mobile) — once per file (tokens Diff runs from Foundations; component Diff runs from the component file). It fetches the matching `component-manifest.json` via the plugin's existing authenticated GitHub API.

### Checks

1. **Coverage** — name set-difference: code-only (e.g. web `Field`/`Input`/`Popover` have code, no Figma set), Figma-only (no code component), and matched-but-no-Code-Connect (`.figma.tsx` missing).
2. **Prop/variant parity** — for each matched component, compare Figma variant options ↔ code prop union options (e.g. Figma `Variant=[primary…link]` vs the code `variant` union). Flag: option in code missing in Figma; option in Figma missing in code; a code variant-like prop with no Figma axis; a Figma axis with no code prop. Normalize names before compare and account for the **web vs mobile naming difference** (web variant props are code-aligned lowercase; mobile mixes — see `code-connect-property-map.md`).
3. **Hardcoded-value lint** — traverse each set's layers; for bindable visual fields (fills, strokes, corner radii, stroke weights, itemSpacing, padding, tokenized width/height, text fontSize/fontFamily/lineHeight), flag any raw value with no `boundVariables` entry. Whitelist legit raws: opacity 1, fully-transparent fills, `0` spacing/radius, and an explicit structural-size allowlist. Report layer path + field + raw value. (Our components were built fully bound, so a clean run validates that; the value is catching future hand-edits.)

### Output

Read-only "Component Drift" report grouped by component, each issue tagged by category + severity (coverage = high, parity = medium, hardcoded = warning), with a counts summary. No fix actions (D5). Optional export-to-markdown.

### Architecture / reuse

A shared, pure `computeComponentDrift(figmaModel, codeManifest)` comparator (unit-testable), mirroring the token normalize-compare pattern, so a future CI gate can reuse it. New plugin action "Component Drift" beside Diff; network only from the UI thread, traversal/lint in the main thread, comparator pure.

### Phases

- **A — repo:** `component-manifest.json` generator (TS-compiler parse of `*.types.ts` + Code Connect presence) + CI validate (idempotency guard like tokens).
- **B — plugin:** read Figma component model + fetch manifest + coverage & parity comparator + report UI.
- **C — plugin:** hardcoded-value lint traversal + whitelist, folded into the report.

Deferred (fast-follows, not v1): CI gate via the Figma REST API; auto-filed GitHub issues. Rationale recorded as **D16** in `decisions.md`.

## Guardrails

- Write `packages/tokens/source/` only; let `build.mjs` + the `tokens-validate` CI build. Never hand-edit generated files.
- One reviewable PR per unit; keep the web build + `tokens:check` green.
- Secrets: PAT in `clientStorage`, never committed/logged; move the Chromatic token to a CI secret.
- No Figma-structural change without a preview + confirm.
