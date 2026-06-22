#!/usr/bin/env node
/**
 * scaffold.mjs — deterministic component scaffolder for Kijani.
 *
 * Takes a completed <Name>.spec.json (the contract) and emits the *mechanical*
 * parts of a component so the agent/human only has to write the body + behaviour:
 *   - <Name>.types.ts        (Props interface from spec.props)
 *   - <Name>.tsx             (compiling shell with TODO body)
 *   - index.ts               (barrel export)
 *   - <Name>.figma.tsx       (Code Connect stub from spec.figma + codeConnect)
 *   - __tests__/<Name>.test.tsx (one smoke test + it.todo per spec.tests)
 *   - <Name>.spec.json       (copied into the component dir if not already there)
 * Then: appends the library export to src/index.ts and regenerates the manifest.
 *
 * Deterministic only — no AI, zero dependencies. Part of the `new-organism` flow.
 *
 * Usage:
 *   node tools/component-gen/scaffold.mjs --spec <path/to/Name.spec.json> [flags]
 * Flags:
 *   --force        overwrite existing .tsx/.types even if present (default: keep)
 *   --no-index     don't append the export to src/index.ts
 *   --no-manifest  don't regenerate component-manifest.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

/* ── args ─────────────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
function flag(name) { return args.includes(name); }
function opt(name) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; }

const specPath = opt("--spec");
if (!specPath) { console.error("error: --spec <path> is required"); process.exit(1); }
const FORCE = flag("--force");
const NO_INDEX = flag("--no-index");
const NO_MANIFEST = flag("--no-manifest");

/* ── load + validate spec ─────────────────────────────────────────────── */
const spec = JSON.parse(fs.readFileSync(path.resolve(specPath), "utf8"));
const errs = [];
if (!spec.meta?.name) errs.push("meta.name");
if (!spec.meta?.location) errs.push("meta.location");
if (!Array.isArray(spec.props)) errs.push("props[]");
if (errs.length) { console.error("spec missing: " + errs.join(", ")); process.exit(1); }

const Name = spec.meta.name;                         // e.g. ErrorState
const props = spec.props || [];
const tests = spec.tests || [];

// location: "@kijani/mobile : src/components/ErrorState"
const [pkgName, relPath] = spec.meta.location.split(/\s*:\s*/);
const pkgDir = pkgName.replace("@kijani/", "packages/"); // packages/mobile
const platform = pkgDir.includes("mobile") ? "mobile" : "web";
const compDir = path.join(ROOT, pkgDir, relPath);
const indexFile = path.join(ROOT, pkgDir, "src/index.ts");

/* ── helpers ──────────────────────────────────────────────────────────── */
const has = (t, re) => re.test(t);
function placeholder(type) {
  const t = (type || "").trim();
  if (/\[\]$/.test(t) && /string/.test(t)) return '["Sample"]';
  if (/^string$/.test(t)) return '"Sample"';
  if (/^number$/.test(t)) return "0";
  if (/^boolean$/.test(t)) return "true";
  if (/=>/.test(t)) return "() => {}";
  if (/ReactNode/.test(t)) return "null";
  return `undefined as unknown as ${t}`;
}
const requiredProps = props.filter((p) => p.required);
const requiredJSX = requiredProps.map((p) => `${p.name}={${placeholder(p.type)}}`).join(" ");
const commonDestructure = ["testID", "accessibilityLabel", "style"].filter((n) =>
  props.some((p) => p.name === n),
);

/* ── templates ────────────────────────────────────────────────────────── */
function typesTs() {
  const needsNode = props.some((p) => /ReactNode/.test(p.type || ""));
  const needsStyle = props.some((p) => /StyleProp|ViewStyle/.test(p.type || ""));
  const imports = [];
  if (needsNode) imports.push('import type { ReactNode } from "react";');
  if (needsStyle) imports.push('import type { StyleProp, ViewStyle } from "react-native";');
  const body = props
    .map((p) => {
      const doc = p.description ? `  /** ${p.description} */\n` : "";
      return `${doc}  ${p.name}${p.required ? "" : "?"}: ${p.type};`;
    })
    .join("\n");
  return `${imports.join("\n")}${imports.length ? "\n\n" : ""}// TODO(scaffold): define any custom types referenced below (e.g. action objects).

export interface ${Name}Props {
${body}
}
`;
}

function componentTsx() {
  const destr = commonDestructure.length
    ? `{ ${commonDestructure.join(", ")} }: ${Name}Props`
    : `_props: ${Name}Props`;
  const bg = "{ backgroundColor: theme.color.surface.default }";
  const styleExpr = commonDestructure.includes("style")
    ? `[styles.container, ${bg}, style]`
    : `[styles.container, ${bg}]`;
  const viewProps = [
    commonDestructure.includes("testID") ? "testID={testID}" : "",
    commonDestructure.includes("accessibilityLabel") ? "accessibilityLabel={accessibilityLabel}" : "",
    `style={${styleExpr}}`,
  ].filter(Boolean).join("\n      ");
  return `import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../../ThemeContext";
import type { ${Name}Props } from "./${Name}.types";

/**
 * ${Name} — ${spec.meta.tier || "organism"} (generated shell).
 * TODO(ai/human): implement the body from Figma node ${spec.figma?.nodeId || "?"}.
 * Compose @kijani primitives; tokens only (no hardcoded values); light + dark.
 */
export function ${Name}(${destr}) {
  const { theme } = useTheme();
  return (
    <View
      ${viewProps}
    >
      {/* TODO: build content from ${Name}.spec.json + the Figma node */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
  },
});
`;
}

function indexTs() {
  return `export { ${Name} } from "./${Name}";
export type { ${Name}Props } from "./${Name}.types";
`;
}

function figmaTsx() {
  const url = spec.figma?.fileKey && spec.figma?.nodeId
    ? `https://www.figma.com/design/${spec.figma.fileKey}/x?node-id=${String(spec.figma.nodeId).replace(":", "-")}`
    : "TODO-figma-url";
  return `import React from "react";
import figma from "@figma/code-connect";
import { ${Name} } from "./${Name}";

// Figma node ${spec.figma?.nodeId || "?"}. TODO(ai/human): map props + refine the example.
figma.connect(
  ${Name},
  "${url}",
  {
    props: {},
    example: () => <${Name} ${requiredJSX} />,
  },
);
`;
}

function testTsx() {
  const todos = tests.map((t) => `  it.todo(${JSON.stringify(t)});`).join("\n");
  return `import React from "react";
import { render } from "@testing-library/react-native";
import { ThemeProvider } from "../../../ThemeContext";
import { ${Name} } from "../${Name}";

describe("${Name}", () => {
  it("renders", () => {
    const { toJSON } = render(
      <ThemeProvider>
        <${Name} ${requiredJSX} />
      </ThemeProvider>,
    );
    expect(toJSON()).toBeTruthy();
  });

${todos}
});
`;
}

/* ── write ────────────────────────────────────────────────────────────── */
fs.mkdirSync(path.join(compDir, "__tests__"), { recursive: true });
const written = [];
function write(rel, content, { protect = false } = {}) {
  const file = path.join(compDir, rel);
  const exists = fs.existsSync(file);
  const handMaintained = spec.updateModel === "hand-maintain";
  if (exists && protect && handMaintained && !FORCE) {
    console.log(`  keep   ${path.relative(ROOT, file)} (hand-maintain; --force to overwrite)`);
    return;
  }
  if (exists && !FORCE && !protect) {
    // never silently clobber non-protected existing files either, unless forced
    console.log(`  keep   ${path.relative(ROOT, file)} (exists; --force to overwrite)`);
    return;
  }
  fs.writeFileSync(file, content, "utf8");
  written.push(path.relative(ROOT, file));
  console.log(`  ${exists ? "write " : "create"} ${path.relative(ROOT, file)}`);
}

console.log(`\nScaffolding ${Name} → ${path.relative(ROOT, compDir)}`);
write(`${Name}.types.ts`, typesTs(), { protect: true });
write(`${Name}.tsx`, componentTsx(), { protect: true });
write(`index.ts`, indexTs());
write(`${Name}.figma.tsx`, figmaTsx(), { protect: true });
write(path.join("__tests__", `${Name}.test.tsx`), testTsx(), { protect: true });
// drop the spec.json into the component dir if it isn't already there
const specDest = path.join(compDir, `${Name}.spec.json`);
if (path.resolve(specPath) !== specDest) write(`${Name}.spec.json`, JSON.stringify(spec, null, 2) + "\n");

/* ── append library export ────────────────────────────────────────────── */
if (!NO_INDEX && fs.existsSync(indexFile)) {
  const idx = fs.readFileSync(indexFile, "utf8");
  if (!idx.includes(`./components/${Name}"`)) {
    const block = `\nexport { ${Name} } from "./components/${Name}";\nexport type { ${Name}Props } from "./components/${Name}";\n`;
    fs.writeFileSync(indexFile, idx.replace(/\n*$/, "\n") + block, "utf8");
    console.log(`  append ${path.relative(ROOT, indexFile)} (+${Name} export)`);
  } else {
    console.log(`  ok     ${path.relative(ROOT, indexFile)} already exports ${Name}`);
  }
}

/* ── regenerate manifest ──────────────────────────────────────────────── */
if (!NO_MANIFEST) {
  try {
    execSync("node scripts/build-manifest.mjs", { cwd: ROOT, stdio: "ignore" });
    console.log("  manifest regenerated");
  } catch (e) {
    console.warn("  manifest regen failed: " + e.message);
  }
}

/* ── next steps ───────────────────────────────────────────────────────── */
console.log(`
Next (the non-mechanical parts):
  1. Implement ${Name}.tsx body from the Figma node + spec (tokens only, light/dark, a11y).
  2. Replace the it.todo() tests with real behaviour tests.
  3. Map props in ${Name}.figma.tsx.
  4. Verify:  cd ${pkgDir} && npx tsc --noEmit && npx jest ${Name}
              node scripts/build-manifest.mjs && node scripts/check-manifest.mjs
  5. Build the designer spec frame (D20) and record figma.specFrameNodeId in the spec.
  6. Add to the demo, then commit on a branch.
`);
