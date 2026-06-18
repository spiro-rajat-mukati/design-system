# Style extraction — reskin the foundations from a reference image

> **Goal:** instead of trial-and-error per component, hand the agent an image of some components in a target visual style and get the **foundations** (`packages/tokens/source/`) rewritten so every Kijani component adopts that style automatically. One image → one coherent token set → both libraries reskinned.
>
> Read alongside `token-usage.md` (tier rules) and `decisions.md` (D18, plus the **Figma variable representation — conversion rules**). This is a **token-tier change**: edit `packages/tokens/source/` only; never hand-edit components or generated files.

---

## 1. Why this works (the one lever)

Kijani is three tiers, and the top two are almost entirely `{references}` downward:

```
core.json            ← PRIMITIVES: colour ramps 50–950, space scale, radius/border/shadow scales,
                        font-size/line-height/weight/family            ← the lever
   ↑ referenced by
color-light / color-dark.json   ← SEMANTIC: surface/text/border/action/feedback = {color.*.NNN}
components.json / -dark          ← COMPONENT: button.radius={radius.md}, padding={space.4}, …
   ↑ consumed by
@kijani/web (CSS vars) + @kijani/mobile (ThemeProvider)  ← every component, token-bound
```

So **~80% of a reskin is regenerating the `core.json` ramps and scales.** Because semantic and component tokens reference primitives by step (e.g. `action.primary.bg → {color.brand.700}`, `button.padding-inline.md → {space.4}`), they re-resolve to the new look with **zero component edits**.

**Dark mode is nearly free.** `color-dark.json` already references the *inverted* ramp steps (text → `neutral.50` instead of `neutral.950`; surface → `neutral.900` instead of `white`; `action.primary.bg → brand.600` instead of `brand.700`). Regenerate the ramps and dark re-resolves automatically — we only tune dark *steps* where contrast needs it (and flag those for review). This is why "light only — auto-derive dark" is a safe default.

**Safety rails already exist:** `build.mjs` throws on any unresolved `{ref}`, and `tokens:check` fails CI if generated files drift from source. A bad mapping can't merge silently.

---

## 2. What gets extracted, and how

The image is a file in the workspace, so colour is **measured, not eyeballed** (pixel sampling). Geometry is measured against a scale; type family is inferred.

| Aspect | Method | Confidence |
|---|---|---|
| **Colour & palette** | Sample pixels (PIL/ImageMagick) → cluster dominant colours → assign roles (page bg, surface, text, border, brand/accent, success/warning/danger/info). Exact hex per swatch. | **Measured** for visible swatches; **inferred** for the full 50–950 ramp (interpolated). |
| **Shape, borders & shadows** | Measure corner radii and border widths in px (needs a known scale — see §5); sample shadow colour + estimate offset/blur from the penumbra. | **Measured** (radii/border) · **estimated** (shadow blur/spread). |
| **Spacing & density** | Measure paddings, gaps, control heights; map to the 4px `space` grid. | **Measured** where elements are isolable. |
| **Typography** | Infer family (or use the name you give — say it, font-ID from a screenshot is unreliable); measure sizes → `font-size` scale, weights → `font-weight`, line-heights. | **Inferred** (family) · **measured** (sizes/weights). |

Every run ships a **confidence table** separating *measured* from *inferred* so you know exactly what to scrutinise (dark mode, off-image ramp steps, and font family are always inferred).

---

## 3. How extracted values map onto the tiers

The discipline that keeps the system clean: **change primitives first; re-point references only for relationship changes.**

### Colour → regenerate ramps in `core.json`
- From each anchor swatch (e.g. extracted brand `#2F38FF`), generate a full **50–950 ramp** by interpolating lightness in a perceptual space (OKLCH) so steps stay even. Replace `color.brand.*`, `color.neutral.*`, and the four semantic hues.
- **Re-point semantic steps only if the style changes the *relationship*** — e.g. the new primary reads lighter, so `action.primary.bg` should point at `{color.brand.600}` not `{color.brand.700}`. Otherwise leave `color-light.json` alone and let it cascade.
- **Dark:** regenerated ramps flow through `color-dark.json` automatically; review/tune only the dark steps that fail contrast.

### Shape / borders / shadows → `core.json` scales
- `radius.*` (none/xs/sm/md/lg/xl/2xl/full), `border-width.*` (0/1/2/4), `shadow.*` (the boxShadow arrays) + `elevation.*` aliases.
- Want pill buttons? Prefer changing the **component pointer** (`button.radius → {radius.full}`) over redefining `radius.md`, unless the *whole system* should get rounder.
- Flat style? Set `shadow.*` softer/none and `border` steps accordingly.

### Spacing / density → mostly `components.json`, sometimes `core.json`
- ⚠️ **Highest-blast-radius axis.** `space.*` is aliased by `space-inset/stack/inline` and referenced widely; rescaling it moves *everything* on **both web and mobile** (you chose the shared foundation).
- Default to **surgical, component-tier** changes (`button.height.*`, `button.padding-inline.*`, group gaps) for a density shift. Only rescale the `space` ramp for a deliberate global density change — and I'll flag the web impact first.

### Typography → `core.json` primitives + the Figma extension
- Update `font-family.sans.$value` (the CSS/RN stack) **and** its `$extensions["design-system.figma-value"]` (what Figma uses, e.g. `"Inter"`). Same dual-write applies to `font-size` (`figma-value` in px) and `line-height` (`figma-value` = ratio×100, e.g. `1.25 → 125`) per **golden rule #9** and the conversion table in `decisions.md`.
- The composite roles in `text-mobile.json` / `text-web.json` reference these primitives, so they update without edits.

---

## 4. Snap-to-scale discipline (keep tokens clean)

Raw measurements are messy; tokens must stay a system, not a pile of pixel values.

- **Colours** snap to generated ramp steps; the few exact brand/accent anchors are pinned, the rest interpolated.
- **Spacing** snaps to the 4px grid (`space.1=4 … space.8=32`). A measured 15px becomes `space.4` (16) unless it's clearly intentional.
- **Radii / border widths** snap to the existing scale; if the style genuinely needs a new step, **add a named step** (e.g. `radius.3xl`) rather than scattering one-offs.
- Anything that refuses to snap gets **listed for your call** — never silently forced.

---

## 5. Inputs that make a run accurate

Send with the image:

1. **Highest-resolution image possible** — ideally a component *sheet* (many components + states) over a single mockup, and including raw palette swatches if you have them.
2. **A scale anchor** so px measurements are real: the frame width, a known control height, or "this button is 40px tall." Without one, geometry is proportional-only and I'll say so.
3. **The font name**, if the style uses a specific typeface (font-ID from an image is unreliable).
4. **Light only** is fine — dark is auto-derived per your choice; send a dark image too only if you want dark measured exactly.

---

## 6. The workflow — branch + preview per style

Each style is a disposable experiment; nothing touches `main` until you pick a winner.

1. **Extract** (Cowork): write/run an image-fit extraction script → produce a **style spec** (the measured + inferred values) + a **confidence table**, for your sign-off.
2. **Map & apply** (Cowork): edit `packages/tokens/source/` on a branch named `style/<name>` (e.g. `style/neo-flat`). Regenerate locally to confirm `build.mjs` resolves all refs.
3. **Build & open PR** (Claude Code): commit → `build.mjs` regenerates → `tokens:check` → push → open a PR **(preview only — not auto-merged;** auto-merge is for token *sync*, not style experiments).
4. **Preview both surfaces** (shared foundation = both change):
   - **Web** — Storybook / Chromatic snapshot on the branch.
   - **Mobile** — Pull the branch's tokens into a *duplicate or branch* Figma file via DesignSync so you see the components reskinned. A/B against `main`.
5. **Decide** — keep → merge the PR; discard → delete the branch (clean, nothing lost). Next style starts from a fresh branch off `main`.

Because the foundation is shared, every preview shows the **web** impact too — worth a glance even though the experiment is mobile-driven.

---

## 7. Honest limits

- **Not a pixel-perfect clone.** The output captures the look & feel as a coherent token set; a single image can't fully specify a 6-mode (web/iOS/Android × light/dark) system.
- **Inferred ≠ measured.** Full ramps, dark mode, and font family are inferred from partial evidence — they're exactly what the confidence table flags for review.
- **Density on a shared foundation is blunt.** A global spacing change hits web; I default to surgical component-tier edits and surface the trade-off.
- **Out of scope:** gradients, illustrations, photographic treatments, and motion — these aren't foundation tokens.

---

## 8. Starter: colour sampling

A general palette sampler (the measurement parts — radii/spacing — are written per-image once the scale is known):

```python
# pip install pillow scikit-learn --break-system-packages
from PIL import Image
from sklearn.cluster import KMeans
import numpy as np

img = Image.open("reference.png").convert("RGB")
px = np.array(img).reshape(-1, 3)
k = 8
km = KMeans(n_clusters=k, n_init=10).fit(px)
counts = np.bincount(km.labels_)
for c, n in sorted(zip(km.cluster_centers_, counts), key=lambda t: -t[1]):
    r, g, b = (int(round(v)) for v in c)
    print(f"#{r:02X}{g:02X}{b:02X}  {n/len(px):5.1%}")
# → rank by coverage; assign roles (largest neutral = page bg, etc.),
#   then interpolate each anchor into a 50–950 ramp (OKLCH) for core.json.
```

---

_Method recorded as **D18** in `decisions.md`. Token-tier rules: `token-usage.md`. Figma scale conversions: golden rule #9 + the conversion table in `decisions.md`._
