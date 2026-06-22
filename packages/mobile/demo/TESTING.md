# Testing the Kijani mobile library in the demo app

This demo is a runnable Expo app that loads `@kijani/mobile` **from source** (Metro
`watchFolders`). It doubles as the manual sandbox, the **E2E target** (Maestro), and
the basis for a **shareable build**.

> Source-linked on purpose: fast iteration. It does **not** validate packaging — for
> that, consume `@kijani/mobile` as an installed dependency (separate "package smoke
> test" setup, not included here).

## 0. Prerequisites

- From the repo root once: `npm install` (installs all workspaces).
- In this folder: `cd packages/mobile/demo && npm install` (pulls the web + Expo deps).
- A simulator/emulator (Xcode / Android Studio) or a physical device with Expo Go.
- For E2E: the [Maestro CLI](https://maestro.mobile.dev) — `curl -Ls "https://get.maestro.mobile.dev" | bash`.
- For on-device shareable builds: an Expo account + `npm i -g eas-cli` (optional).

## 1. Run the app

```bash
cd packages/mobile/demo
npm start          # then press i (iOS), a (Android), or w (web)
```

In-app: the top bar toggles light/dark and has **Screens →**, which opens the composed
screens (Account / Settings / Error / Warning). The Error and Warning tabs each open the
organism inside a `BottomSheet`.

## 2. End-to-end flows (Maestro)

Flows live in [`.maestro/`](./.maestro): `01-smoke`, `02-error-sheet`, `03-warning-sheet`.
They drive the real rendered app — launch, navigate to Screens, open each sheet, assert
the content, and dismiss — complementing the jest/RNTL unit tests.

Maestro targets an installed app by **appId**. `app.json` sets it to
`com.kijani.mobiledemo` (iOS `bundleIdentifier` / Android `package`).

**Recommended — dev build (stable appId):**

```bash
npx expo run:ios            # or: npx expo run:android  (builds & installs com.kijani.mobiledemo)
npm run e2e                 # maestro test .maestro  (runs all three flows)
# single flow:
maestro test .maestro/02-error-sheet.yaml
```

**Expo Go (quick, less reliable):** open the project in Expo Go, then override the appId:

```bash
maestro test -e APP_ID=host.exp.Exponent .maestro
```

Flows use visible text selectors (e.g. "Show error sheet", "What to do next?"), so they
stay readable; keep those labels stable in `demo/screens/DemoScreens.tsx` or update the
flows alongside.

## 3. Shareable build

**Web (no account needed) — fastest to share:**

```bash
npm run export:web          # expo export --platform web  → ./dist
npx serve dist              # or deploy ./dist to any static host (Netlify, Pages, S3…)
```

Caveat: web runs via `react-native-web`; the `BottomSheet`'s gesture/animation and any
blur render approximately — treat web as a preview, device as ground truth.

**On device (EAS) — for designers/PMs:**

```bash
eas login
eas build --profile preview        # internal-distribution build (install link)   [eas.json]
# or OTA to an existing dev build:
eas update --branch preview
```

`eas.json` defines `development` (dev client, for Maestro), `preview` (shareable
internal), and `production` profiles.

## Notes & limits

- **Fonts:** TT Hoves / DM Mono aren't bundled yet, so type falls back to the system
  font (layout/spacing/colour are accurate). Wiring real fonts is a separate task.
- **Sandbox:** simulators, device builds, and Maestro runs happen on your machine — they
  can't run in the assistant's environment, so the flows/scripts here are authored and
  JSON/structure-checked, but you execute them locally.
- **CI (later):** Maestro Cloud or a self-hosted emulator job can run `.maestro/` on PRs.
