# Mobile Component Library — Plan & Handoff

Context brief for any AI agent (Claude Code) building the Kijani **mobile** component library. Read this with `CLAUDE.md` and `docs/ai/*`.

## Where things stand (2026-06-13, updated 2026-06-13)

- Repo is an **npm-workspaces monorepo**: `packages/tokens` (shared source of truth), `packages/web` (existing React + CSS library), `packages/mobile` (placeholder).
- **Phase 0.1** (monorepo restructure) and **Phase 0.2** (extract `@kijani/tokens` + add React Native output) are **done and merged to `main`**.
- `@kijani/tokens` now emits: CSS (web), `tokens.ts` (flat), **`tokens.native.ts`** (nested, fully-resolved theme objects per mode — for React Native), and `tokens.figma-variables.json`.
- Density (compact/comfortable) was removed earlier: modes are **light / dark** only (web). Mobile adds platform (iOS/Android) later.

## Goal

A **separate** mobile component library (`@kijani/mobile`) that shares the **same** `@kijani/tokens` foundation as web — not one library with mobile flags.

## Locked decisions

| Topic | Decision |
| :---- | :---- |
| Framework | **React Native + Expo** |
| Repo layout | Monorepo (done) — `@kijani/mobile` consumes `@kijani/tokens` |
| Styling | **Built-in `StyleSheet` + a token theme**, no heavy lib; light/dark via a `ThemeProvider` + `useTheme()` |
| Theme source | Import `themes` from `@kijani/tokens` (`tokens.native.ts`); RN cannot use CSS variables |
| Dark mode | **Light + dark from day one** |
| v1 scope | **Core set first:** Button, TextInput/TextField, Textarea, Field, Checkbox, Radio, Badge — then expand |
| Figma | iOS/Android modes go in the **one shared Foundations library** later, synced via the plugin. **Do not touch Figma now.** |
| Distribution | **Consume from the monorepo** for now; no npm publishing yet |
| Touch targets | ≥ 44px on mobile (handle via mobile tokens; web baseline is smaller) |

## Status: v1 + mobile-only extras — COMPLETE (2026-06-13)

All Phase 0 steps, the full v1 component set, and the three mobile-only extras are merged to `main`. 209 tests, 20 test suites. Expo showcase in `packages/mobile/demo/`.

**Built (PRs #10–#26):** ThemeProvider/useTheme, Button, Badge, Field, TextInput, Textarea, Checkbox/CheckboxGroup, Radio/RadioGroup, Tag, ProgressBar, NumericInput, SegmentedControl, Tabs, Toast/ToastProvider/useToast, Select, ActionSheet, MultiSelect, SafeAreaWrapper (PR #24), ListItem (PR #25), BottomSheet (PR #26).

**Mobile-only extras detail:**
- **SafeAreaWrapper** — thin wrapper over RN built-in `SafeAreaView`; configurable edges + surface token; upgrade path to `expo-safe-area-context` documented.
- **ListItem** — row component with leading/trailing slots, inset divider variant, 56px min touch target, pressable + static variants.
- **BottomSheet** — draggable with snap points (px or %), PanResponder gesture + spring animations, animated backdrop overlay, configurable handle + backdrop-close behavior.

**Intentionally deferred:** Popover (no direct mobile equivalent), visual regression, Figma mobile modes, npm publishing.

## Conventions / guardrails

- Never hardcode values — resolve from `@kijani/tokens`. (Web equivalents live in `packages/web/src/components/<Name>/` — mirror prop/token names where sensible; native UX may diverge.)
- TypeScript, accessible (VoiceOver/TalkBack), no `any`.
- One reviewable PR per step; keep the web build + `tokens:check` green.
- Working model: implement → build/test locally → open a PR for review.
