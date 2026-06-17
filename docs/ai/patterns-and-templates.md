# Patterns & Templates — how to build composite, reusable UI on Kijani

> Reference guide for building **patterns** (domain-aware composites like a "Battery card") and **templates** (full flows/screens) on top of the Kijani primitives. The worked example is the **Battery Image + Battery Details** card reused across the Bike and Station flows.
>
> Guiding rule (agreed): **dev-optimal structure wins over design structure.** Figma can carry extra enumerated states/toggles as a convenience; code stays driven by data + a small config, and **Code Connect bridges the two.**

---

## 1. The three tiers (and where each lives)

| Tier | What | Knows about business data? | Where it lives |
|---|---|---|---|
| **Primitives** | Button, Badge, Checkbox, BatteryLevel indicator … | No — generic | `@kijani/web`, `@kijani/mobile` (this repo) |
| **Patterns** | `BatteryCard`, `RiderHeader`, `StationRow` … | Yes — a battery, a rider | **Product code**, not the DS repo |
| **Templates** | Bike flow screen, Station flow screen | Yes — composes patterns + data | Product code (screens/routes) |

**Patterns and templates do NOT belong in `@kijani/*`.** The design system stays generic and product-agnostic. Domain components live in the product:

```
spiro-app/                      # the product repo (not the design-system repo)
  src/
    patterns/                   # cross-feature composites built on @kijani
      BatteryCard/
        BatteryCard.tsx
        BatteryCard.types.ts
        BatteryCard.figma.tsx   # Code Connect → Figma "Battery card"
        BatteryLevel.tsx        # promote to @kijani/* later if it's truly generic
    features/
      bike/screens/...          # templates: compose patterns + inject data
      station/screens/...
  package.json                  # deps: @kijani/web, @kijani/tokens, @kijani/icons
```

If patterns are shared across **multiple** Spiro products, promote `patterns/` into its own package (`@spiro/patterns`) that depends on `@kijani/*`. Until then, keep it in the app. A primitive that turns out generic (e.g. `BatteryLevel`) can graduate *into* `@kijani/*` later.

---

## 2. The core principle: props mirror the data model, not the Figma toggles

The Figma component exposes toggles — *All Content, Battery Name, Battery Details, Status*, a *Battery Level: 71–100%* enum, *Remap To: Bike*, *Background: Gray/Default*. That shape is right **for Figma** (static, can't compute). For code, do **not** mirror that flat list. Take **data + minimal config + slots**, and derive the rest.

### `BatteryCard.types.ts`

```ts
export type BatteryStatus = "charging" | "in-use" | "idle" | "fault";
export type BatteryContext = "bike" | "station";   // was the "Bike vs Station" / "Remap To" variant
export type CardSurface = "default" | "gray";      // token-backed, not a hex

export interface Battery {
  id: string;                 // "U7B1LBNL36300660"
  name?: string;              // display name / serial
  level: number;              // 0–100, CONTINUOUS — never a pre-bucketed enum
  status?: BatteryStatus;
  imageUrl?: string;          // or a model id resolved to an image
}

export interface BatteryCardProps {
  battery: Battery;
  context?: BatteryContext;   // one prop replaces a whole Figma variant axis
  surface?: CardSurface;      // maps to a surface token
  onPress?: () => void;
  footer?: React.ReactNode;   // slot for flow-specific extras (composition escape hatch)
  // Visibility overrides — default behaviour DERIVES from data presence.
  showStatus?: boolean;       // default: render iff battery.status is set
}
```

Why this is dev-optimal:

- **Derive, don't enumerate.** `level` is a number (`92`). The component computes the bucket/color/icon *in one place* (`BatteryLevel`). Figma's `71–100%` exists only so designers can preview a state — it must never become a `state` prop the consumer buckets by hand. One source of truth for "what does 92% look like," shared by both flows and Figma.
- **Derive visibility from data.** If `battery.name` exists, render the name. Don't make devs flip "Battery Name on." Keep `show*` props only as overrides. Figma's *All Content / Battery Name / Status* toggles are a **design-side convenience** with no 1:1 code equivalent — the acceptable divergence.
- **Context is one prop, not a copy.** "Bike vs Station" + "Remap To" collapse to `context`. Two flows, **one** component — never fork per flow.

---

## 3. Reference implementation (web, built from `@kijani/web` + tokens)

```tsx
// BatteryCard.tsx  (lives in the product, e.g. spiro-app/src/patterns/BatteryCard)
import { Badge } from "@kijani/web";
import { BatteryLevel } from "./BatteryLevel";
import type { BatteryCardProps, BatteryStatus } from "./BatteryCard.types";

const STATUS_TONE: Record<BatteryStatus, React.ComponentProps<typeof Badge>["tone"]> = {
  charging: "success",
  "in-use": "info",
  idle: "neutral",
  fault: "danger",
};

export function BatteryCard({
  battery,
  context = "bike",
  surface = "default",
  onPress,
  footer,
  showStatus = battery.status != null,
}: BatteryCardProps) {
  const Wrapper = onPress ? "button" : "div";
  return (
    <Wrapper
      type={onPress ? "button" : undefined}
      onClick={onPress}
      data-context={context}
      style={{
        // every value is a token — surface/border/radius/space come from @kijani/tokens
        background:
          surface === "gray"
            ? "var(--color-surface-sunken)"
            : "var(--color-surface-default)",
        border: "var(--border-width-1) solid var(--color-border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-3)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        textAlign: "inherit",
        cursor: onPress ? "pointer" : "default",
      }}
    >
      {battery.imageUrl && (
        <img src={battery.imageUrl} alt="" style={{ width: "100%", borderRadius: "var(--radius-md)" }} />
      )}

      {battery.name && (
        <span style={{ font: "var(--text-web-body-m)", color: "var(--color-text-primary)" }}>
          {battery.name}
        </span>
      )}

      {/* derived from a continuous value — color + icon decided inside BatteryLevel */}
      <BatteryLevel level={battery.level} context={context} />

      {showStatus && battery.status && (
        <Badge tone={STATUS_TONE[battery.status]} variant="soft" size="sm">
          {battery.status}
        </Badge>
      )}

      {footer}
    </Wrapper>
  );
}
```

```tsx
// BatteryLevel.tsx — the ONE place that turns a number into a presentation.
// If this proves generic, promote it into @kijani/web later.
import type { BatteryContext } from "./BatteryCard.types";

function bucket(level: number) {
  if (level <= 10) return { tone: "var(--color-danger-600)", label: "critical" };
  if (level <= 30) return { tone: "var(--color-warning-600)", label: "low" };
  return { tone: "var(--color-success-600)", label: "ok" };
}

export function BatteryLevel({ level, context }: { level: number; context: BatteryContext }) {
  const pct = Math.max(0, Math.min(100, level));
  const { tone } = bucket(pct);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
      {/* bike vs station glyph swap lives here, driven by context */}
      <BatteryGlyph fill={tone} context={context} />
      <span style={{ font: "var(--text-web-label-s)", color: tone }}>{Math.round(pct)}%</span>
    </span>
  );
}
```

Notes:
- **Tokens all the way down** — surface, border, radius, spacing, text, status colors are all variables, so light/dark + theming just work, same as the primitives.
- **Composition escape hatch** — `footer` (or `children`) lets a flow add one-off content without growing the prop list. When you reach the 6th boolean, expose sub-parts (`BatteryCard.Image`, `BatteryCard.Level`) and let flows assemble them.
- **Mobile** is the same shape with `@kijani/mobile` primitives + `useTheme()` instead of CSS vars (RN can't read CSS variables).

---

## 4. Code Connect bridges the design↔dev gap

Designers keep the rich Figma variant set; devs get the clean data API; Code Connect maps between them so Dev Mode shows the real call:

```tsx
// BatteryCard.figma.tsx
import figma from "@figma/code-connect";
import { BatteryCard } from "./BatteryCard";

figma.connect(BatteryCard, "<figma-url-of-Battery-card>", {
  props: {
    context: figma.enum("Remap To", { Bike: "bike", Station: "station" }),
    surface: figma.enum("Colour", { "Gray / Default": "gray" }),
  },
  example: ({ context, surface }) => (
    <BatteryCard
      battery={{ id: "U7B1LBNL36300660", name: "U7B1LBNL36300660", level: 92, status: "in-use" }}
      context={context}
      surface={surface}
    />
  ),
});
```

The Figma `71–100%` and per-section toggles collapse to `level={92}` and derived visibility in the example. That's the "design carries extra enumerated states; code collapses them to smarter props" pattern in action.

---

## 5. Rules of thumb for any pattern / template

- **Props = domain object + minimal config + slots.** Never a mirror of every Figma toggle.
- **One component, parameterized** — never fork per flow.
- **Continuous values in code, buckets only in Figma.** Derivation lives in the component (one source of truth).
- **Patterns/templates live in the product**, built on `@kijani/*` + tokens; primitives stay generic. Promote a primitive into `@kijani/*` only once it's truly domain-free.
- **Tokens all the way down** so theming is automatic.
- **Bridge with Code Connect** — accept that Figma's structure is flatter/richer than the code API by design.
