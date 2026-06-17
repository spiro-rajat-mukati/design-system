# Decisions & lessons (ADR log)

The durable, agent-facing record of **why** Kijani is built the way it is, and **what we learned the hard way.** Read this alongside `CLAUDE.md`. When you make a structural decision or hit a non-obvious gotcha, append a dated entry — don't rewrite history, supersede it.

> Scope: cross-cutting decisions + operational lessons. Deep build history lives in `mobile-library-plan.md` and `sync-plugin-plan.md`; component/token rules live in `component-usage.md` / `token-usage.md`. This file links to those rather than duplicating them.

## Decisions

**D1 · Monorepo, one foundation, two libraries.** npm-workspaces: `packages/tokens` (shared source of truth) feeds `packages/web` (React + CSS variables) and `packages/mobile` (React Native / Expo, runtime `ThemeProvider`). Two shippable libraries, one foundation — not one library with platform flags.

**D2 · Tokens Studio format; source is the only authored layer.** `packages/tokens/source/*.json` (DTCG `$value`/`$type`). `build.mjs` generates every target into `packages/tokens/build/`. Never hand-edit generated files; `tokens:check` enforces it.

**D3 · Density removed.** Web modes are light/dark only; mobile adds platform (iOS/Android). Touch-target sizing (≥ 44px) lives in the mobile tokens, not a web density mode.

**D4 · Figma = 3 published files, 6 modes.** Foundations (shared variables + styles + foundation docs) + Web + Mobile (shell). Modes = web/iOS/Android × light/dark. Run the DesignSync plugin from **Foundations** — the variable collection lives there.

**D5 · Parity is by tokens + Code Connect, not structure.** The code and Figma component libraries need not match 1:1; they're bridged by shared tokens + Code Connect name/prop mapping. The plugin syncs tokens/variables only — for components it does drift detection + Code Connect, never codegen. See `sync-plugin-plan.md`.

**D6 · DesignSync plugin is the canonical sync path.** `figma-plugin/` does two-way Push / Pull / Diff. The manual Tokens Studio setup (`figma/TOKENS-STUDIO-SETUP.md`) is retired.

**D7 · Push = auto-merged PR to `main`; conflicts = 3-way resolver** (Base / Figma / GitHub), no auto-pick. Fine-grained PAT per user in Figma `clientStorage`; authenticated GitHub API (private repo).

**D8 · Hands-free CI wiring (how auto-merge actually works).** (a) Push writes only `packages/tokens/source/`. (b) `tokens-build.yml` regenerates `build/**` and commits it back to the PR branch using the `TOKENS_BUILD_PAT` secret. (c) `tokens:check` is NOT path-filtered, so it re-runs on the build commit and goes green; only the regen workflow is path-filtered to `source/**` (prevents a self-loop). (d) Branch protection on `main` requiring `tokens:check` is MANDATORY — without it GitHub refuses to enable auto-merge.

**D9 · One normalize-compare for Push / Pull / Diff.** All three share a single value-normalization function (round float32; `rgba()`/`transparent` vs hex8; `px` on dimensions) and make format-preserving, minimal writes. Invariant: a round-trip pull→push is a byte-clean no-op.

## Lessons

**L1 · Cowork edits get wiped by Claude Code `git clean`/`reset`.** Cowork edits the working tree; Claude Code runs git. Uncommitted edits and untracked files (once: the entire `site/` dir + `AGENTS.md`) are destroyed by a clean/reset. **Commit before handing off**, or make Claude Code's first action the commit. To recover: `git reflog`, `git branch -a`, `git fsck --no-reflogs | grep "dangling commit"` — it's usually sitting on an unmerged branch. (Encoded as the "Commit before destructive git ops" rule in `CLAUDE.md`.)

**L2 · `enablePullRequestAutoMerge` needs branch protection.** It fails with "Protected branch rules not configured for this branch" unless `main` has a protection rule with a required check AND the repo has `allow_auto_merge` enabled. This was the final unlock for hands-free Push.

**L3 · `GITHUB_TOKEN` commits don't re-trigger workflows.** A regen step that auto-commits with the default token won't re-run a separate required check → auto-merge stalls. Use a dedicated PAT (`TOKENS_BUILD_PAT`).

**L4 · Figma's value representation differs from the source.** Figma stores numbers as float32, dimensions unitless, colours as `{r,g,b,a}`. Reading back without normalizing produced false diffs (`0.1` → `0.10000000149011612`, `26px` → `26`, `rgba(...)` → `#rrggbbaa`). Always normalize on read / compare / write (see D9).

**L5 · Figma line-height variables are px-only — emit computed px per role.** _(discovered 2026-06-15)_ Figma's Variable API for `lineHeight` only accepts `FLOAT` values in pixels. Emitting the line-height ratio primitives (`tight=110`, `snug=125`, `normal=150` as %-representation numbers) caused bound text styles to render at ~110–150 px, not the intended proportional height. Fix: `build.mjs` now skips `line-height/*` ratio primitives from `tokens.figma-variables.json` entirely (they remain in `primitives.css` as unitless CSS values for web). For every `text/web/*/line` and `text/mobile/*/line` semantic token it emits `Math.round(sizePixels × ratio)` as a literal FLOAT px. Same computed px goes into `tokens.native.ts` (RN `lineHeight` is also px). Web CSS keeps `var(--line-height-snug)` → `1.25` unitless ratio, which is correct. Plugin: `syncTextStyles`, `applyEnsureTextStyles`, and `buildText` all switched from `unit: "PERCENT"` to `unit: "PIXELS"` when setting the literal before binding. Post-Pull, `normalizeFigmaValStr` / `normalizeRepoValStr` compare px-to-px (both FLOAT), so Diff round-trips are clean with no special casing. Old `line-height/tight|snug|normal` orphan variables remain in Figma after Pull and can be manually deleted.

**D10 · Typography sync = variable-bound Text Styles (Option B); styles live in the library files.** _(locked 2026-06-14)_ Type primitives + semantic variables (semantic alias primitives) live in Foundations (published). Figma Text Styles are created in the LIBRARY files — `Web/*` in the Web file, `Mobile/*` in the Mobile file — each sub-property (fontSize, lineHeight, fontWeight, fontFamily, letterSpacing) bound to the Foundations published semantic variable via `importVariableByKeyAsync` + `setBoundVariable`. Repo `text.web.*` / `text.mobile.*` map 1:1 to the semantic vars. Line-height stored in px (Figma type variables are px-only). Naming: `text.web.h1` ↔ var `type/web/h1/*` ↔ style `Web/H1`. Weight: numeric ↔ Figma style-name (400 ↔ Regular, 600 ↔ Semi Bold). Requires Foundations library published + enabled in Web/Mobile before the styles step. Build plan in `sync-plugin-plan.md`.

**L6 · Figma library updates don't auto-propagate.** _(locked 2026-06-15)_ A consuming file (Web/Mobile) must have the source library (Foundations) enabled AND apply pending updates via Manage libraries → Updates tab — they don't auto-sync and can lag (a small edit/refresh in Foundations may be needed to surface them in the Updates tab). The plugin's `importVariableByKeyAsync` binding alone doesn't subscribe a file to library updates; it imports the variable at call time but doesn't watch for subsequent changes. Variables also never appear in the Assets panel's "All libraries" list — that panel shows components only, not variables.

**D11 · Assets follow an assets-by-type model; icons live in `@kijani/icons`.** _(locked 2026-06-15)_ Design assets (icons / illustrations / images) are not stored inside the component packages. They live in a dedicated `packages/icons` workspace (`@kijani/icons`) that mirrors the tokens source→build pattern: authored SVG sources in `svg/`, generated React (web) and react-native-svg (native) components in `src/`, regenerated by a zero-dep `build.mjs`. Entry points: `@kijani/icons` (web barrel), `@kijani/icons/native` (RN barrel), deep per-icon imports for tree-shaking. CI mirrors tokens: `icons-build.yml` (path-filtered to `svg/**`, PAT-signed commit) + `icons-validate.yml` (no path filter, idempotency guard). The Figma export step (future plugin action) writes to `packages/icons/svg/` only — never touches generated files.

**D12 · Illustrations use two lanes: vector (SVG string) and raster (sharp → WebP).** _(locked 2026-06-15)_ `@kijani/illustrations` (`packages/illustrations`) adds a second asset package following the same source→build pattern as D11 but with two distinct lanes. (a) **Vector lane**: multi-color SVGs in `svg/`. Colors are preserved as-is (not currentColor-ified). Web components embed the cleaned SVG string via `dangerouslySetInnerHTML` inside a `<span>` that owns width + aspect-ratio — this approach handles SVG features (gradients, masks, defs) that JSX conversion would break, requires zero new runtime deps beyond React, and keeps the component file tiny. RN components use `SvgXml` from react-native-svg (same reason: handles full SVG feature set from a string). (b) **Raster lane**: PNG/JPG sources in `raster-src/` (AI-generated art, opaque blobs). `build.mjs` uses `sharp` (only devDep) to emit 1×WebP (source ÷ 2) and 2×WebP (source original) into `raster/` — both committed to the repo. Web component: `<img srcSet>` with bundler-resolved `require()` paths. RN component: `<Image>` with `require()` — Metro's @2x naming convention handles hi-DPI. (c) **Unified `<Illustration name="…" />`** plus a typed `manifest.ts` ship for both platforms. Entry points: `@kijani/illustrations` (web), `@kijani/illustrations/native` (RN). CI pattern: `illustrations-build.yml` (path-filtered, PAT-signed commit, `npm ci` for sharp) + `illustrations-validate.yml` (unfiltered PR check, idempotency guard). Binary idempotency guard uses `Buffer.equals()` — never `readFileSync(abs, 'utf8')` for WebP.

**D13 · Single "Export Assets" plugin action with prefix routing.** _(locked 2026-06-15)_ The DesignSync plugin's asset-export action is a single button that scans all `icon/*`, `illustration/*`, and `image/*` top-level COMPONENT / COMPONENT_SET nodes in the Kijani — Assets file and routes each by prefix:

| Prefix | Export format | SVG treatment | Target path |
|---|---|---|---|
| `icon/*` | `exportAsync({format:"SVG"})` | `optimizeSVG` — single-color → currentColor; multi-color flagged (preserved) | `packages/icons/svg/<name>.svg` |
| `illustration/*` | `exportAsync({format:"SVG"})` | `cleanIllustrationSVG` — strips metadata/editor attrs; **colors preserved** | `packages/illustrations/svg/<name>.svg` |
| `image/*` | `exportAsync({format:"PNG", constraint:{type:"SCALE",value:1}})` | Binary as-is (no color processing) | `packages/illustrations/raster-src/<name>.png` |

PNG blobs are committed via the Git Data API as `{ content: base64, encoding: "base64" }` (never as UTF-8). SHA comparison for idempotency uses `SHA1("blob " + byteLength + "\0" + bytes)` — same formula as icons but operating on the raw `Uint8Array`. All three lanes land in a single atomic commit on one auto-merge PR. The plugin never touches generated files (`src/`, `raster/`, `manifest.ts`) — CI icons-build and illustrations-build regenerate those from the source files. The `raster-src/` drop-folder (manual file placement) remains a valid fallback if Figma is not the source.

**D14 · Disabled state = colors only; `disabled-opacity` set to 1.0 (was 0.6).** _(locked 2026-06-17)_ Disabled is conveyed exclusively by `*-disabled` color tokens (surface, text, border), not by whole-element transparency. Setting `button.disabled-opacity` to `{opacity.100}` removes the 0.6 overlay that previously dimmed the entire button including its label — disabled colors now carry the full signal on their own. Opacity-based disabled is avoided because it makes text illegible for low-vision users and causes compositing artifacts over non-white backgrounds.

## Open / deferred

- **Reset the Chromatic token.** The committed token was moved into the `CHROMATIC_TOKEN` secret but not yet rotated — the leaked value is still live and in git history. Reset it in Chromatic and update the secret.
- **CRA → Vite** for `packages/web` (~½ day, low risk; Storybook already runs on its own webpack5).
- **P2 plugin backlog:** Styles sync, component drift via Code Connect, team / GitHub-App auth, npm publishing.

---

_Append entries as `D#` / `L#` with a date when decisions or lessons land. Supersede rather than delete._
