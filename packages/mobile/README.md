# @kijani/mobile

React Native component library for the Kijani design system. Shares the same `@kijani/tokens` foundation as the web library — every colour, spacing, radius, and shadow value resolves from tokens at runtime. Zero hardcoded values.

---

## Requirements

- React Native ≥ 0.73 / Expo SDK ≥ 52
- React ≥ 18
- `@kijani/tokens` (workspace peer — consumed automatically in the monorepo)

---

## ThemeProvider + useTheme

Every component must be rendered inside `<ThemeProvider>`. Wrap your app root:

```tsx
import { ThemeProvider } from "@kijani/mobile";

export default function App() {
  return (
    <ThemeProvider>
      {/* your app */}
    </ThemeProvider>
  );
}
```

`ThemeProvider` reads `useColorScheme()` automatically and switches between the light and dark token sets. Override the scheme:

```tsx
<ThemeProvider forcedTheme="dark">…</ThemeProvider>
```

Read the active theme anywhere inside the tree:

```tsx
import { useTheme } from "@kijani/mobile";

function MyComponent() {
  const { theme, themeName } = useTheme();
  // theme.color.surface.default, theme.button.height.md, …
  // themeName: "light" | "dark"
}
```

---

## Toast

`Toast` is imperative. Wrap your root with `<ToastProvider>` (inside `ThemeProvider`), then call `useToast()` anywhere:

```tsx
import { ToastProvider, useToast } from "@kijani/mobile";

// Root
<ThemeProvider>
  <ToastProvider>
    <App />
  </ToastProvider>
</ThemeProvider>

// Anywhere inside
const { show, dismiss, dismissAll } = useToast();
const id = show({ message: "Saved!", tone: "success", duration: 3000 });
dismiss(id);     // manual dismiss
dismissAll();    // clear all
```

`duration: 0` makes a toast sticky until explicitly dismissed.

---

## Component inventory

### Infrastructure
| Export | Description |
|---|---|
| `ThemeProvider` | Provides light/dark token theme; reads system scheme by default |
| `useTheme()` | Returns `{ theme, themeName }` |

### Inputs & forms
| Component | Props highlights |
|---|---|
| `Field` | `label`, `description`, `helperText`, `errorText`, `successText` — wraps any input; propagates `FieldContext` |
| `TextInput` | All RN TextInput props + `size`, `clearable`, `onClear`, `prefix`, `suffix`, `disabled`, `invalid` |
| `Textarea` | `rows`, `rows="auto"`, `maxLength`, `showCount` |
| `NumericInput` | `min`, `max`, `step`, controlled + uncontrolled, `−`/`+` stepper buttons |
| `Checkbox` | Controlled + uncontrolled, `indeterminate`, `disabled`, `label`, `description` |
| `CheckboxGroup` | `options[]`, `value[]`, `onChange`, `orientation` |
| `Radio` | `value`, `checked`, `disabled`, `label`, `description` |
| `RadioGroup` | `options[]`, `value`, `onChange` |
| `Select` | Native `ActionSheetIOS` on iOS; Modal picker on Android; `placeholder`, `size`, `disabled` |
| `MultiSelect` | Chip display, modal checkbox picker, `maxSelections`, per-chip remove |

### Display & feedback
| Component | Props highlights |
|---|---|
| `Button` | 6 variants × 5 sizes, `loading`, `disabled`, `fullWidth`, `iconOnly` |
| `Badge` | 6 tones × 4 variants × 3 sizes, `count`, `withDot`, `leadingIcon` |
| `Tag` | 6 tones × 3 variants × 2 sizes, `removable`, `onRemove`, `onPress` |
| `ProgressBar` | 4 tones × 4 sizes, `indeterminate`, `label`, `showValue` |

### Navigation & layout
| Component | Props highlights |
|---|---|
| `SegmentedControl` | Pill-track group selector; controlled + uncontrolled; per-option disabled; 3 sizes |
| `Tabs` | `variant="underline"\|"pill"`, 3 sizes, scrollable, per-tab disabled |

### Overlays & system
| Component | Props highlights |
|---|---|
| `ToastProvider` + `useToast()` | Imperative: `show()`, `dismiss()`, `dismissAll()`; 5 tones; auto-dismiss timer |
| `ActionSheet` | Native iOS sheet; animated slide-up Modal on Android; `destructive`, `disabled`, `icon` per item |

---

## Usage examples

```tsx
import {
  ThemeProvider, ToastProvider,
  Button, Field, TextInput, Select, Badge, Tag,
  ProgressBar, Tabs, SegmentedControl,
} from "@kijani/mobile";

// Basic form field
<Field label="Email" helperText="We'll never share this.">
  <TextInput placeholder="you@example.com" keyboardType="email-address" clearable />
</Field>

// Buttons
<Button variant="primary" onPress={save} loading={isSaving}>Save</Button>
<Button variant="destructive" size="sm">Delete</Button>

// Status badge
<Badge tone="success" variant="soft">Active</Badge>

// Removable tag
<Tag label="TypeScript" tone="brand" removable onRemove={handleRemove} />

// Progress bar
<ProgressBar tone="brand" value={uploadPct} label="Uploading" showValue />

// Tabs
<Tabs
  items={[{ value: "all", label: "All" }, { value: "active", label: "Active" }]}
  defaultValue="all"
  variant="underline"
/>
```

---

## Running the showcase

A live Expo showcase in `demo/` renders every component in both light and dark. Tap the header button to toggle themes.

```sh
cd packages/mobile/demo
npm install --legacy-peer-deps   # first time only
npx expo start --ios             # iOS Simulator
npx expo start --android         # Android emulator
# or scan the QR code with Expo Go on your phone
```

---

## Running tests

Tests live alongside each component in `__tests__/` directories.

```sh
cd packages/mobile
npx jest                             # all 175 tests
npx jest --watch                     # watch mode
npx jest src/components/Button       # single component
```

All tests use `@testing-library/react-native` with `ThemeProvider` wrappers. No snapshot tests — behaviour only.

---

## Token conventions

All style values come from `theme.*` returned by `useTheme()`. The shape mirrors `tokens.native.ts`:

```
theme.color.surface.default     → background
theme.color.text.primary        → foreground
theme.color.action.primary.bg   → brand fill
theme.color.feedback.danger.fg  → danger text
theme.button.height.md          → "40px"
theme.input["border-focus"]     → focus ring colour
theme.progress["fill-success"]  → success progress fill
```

Use the `px()` utility from `src/utils/tokens.ts` to strip the "px" unit when assigning RN style numbers.

---

## What's not in v1

| Item | Notes |
|---|---|
| `Popover` | No natural mobile equivalent; use `ActionSheet` or `Modal` instead |
| `BottomSheet` | Draggable/snap sheet — candidate for v1.1 |
| `SafeAreaWrapper` | Use `expo-safe-area-context` directly for now |
| `ListItem` | Row component for lists — candidate for v1.1 |
| Visual regression | Detox/Maestro or Chromatic RN — candidate for v1.1 |
| Figma mobile modes | iOS/Android component frames — deferred per locked decision |
| npm publishing | Monorepo-only for now |
