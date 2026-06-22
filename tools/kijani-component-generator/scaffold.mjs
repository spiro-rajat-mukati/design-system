#!/usr/bin/env node
/**
 * scaffold.mjs — deterministic component scaffolder for Kijani.
 *
 * Takes a completed <Name>.spec.json (the contract) and emits the *mechanical*
 * parts of a component so the agent/human only has to write the body + behaviour:
 *   - <Name>.types.ts        (Props interface + enum type aliases from spec.props)
 *   - <Name>.tsx             (compiling shell with TODO body)
 *   - index.ts               (barrel export — component + Props + derived types)
 *   - <Name>.figma.tsx       (compiling Code Connect stub from spec.codeConnect)
 *   - __tests__/<Name>.test.tsx (one smoke test + it.todo per spec.tests)
 *   - <Name>.spec.json       (copied into the component dir if not already there)
 * Then: appends the library export to src/index.ts and regenerates the manifest.
 *
 * Deterministic only — no AI, zero dependencies. Part of the Kijani Component Generator flow.
 *
 * Usage:
 *   node tools/kijani-component-generator/scaffold.mjs --spec <path/to/Name.spec.json> [flags]
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
const flag = (name) => args.includes(name);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };

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

const Name = spec.meta.name;
const props = spec.props || [];
const tests = spec.tests || [];

// location: "@kijani/mobile : src/components/ErrorState" OR "spiro-app : src/patterns/BatteryCard"
const [pkgName, relPath] = spec.meta.location.split(/\s*:\s*/);
const insideKijani = pkgName.startsWith("@kijani/");
const pkgDir = insideKijani ? pkgName.replace("@kijani/", "packages/") : pkgName;
const platform = /mobile/.test(pkgDir) ? "mobile" : "web";
const compDir = path.join(ROOT, pkgDir, relPath);
const indexFile = path.join(ROOT, pkgDir, "src/index.ts");
// product targets (not @kijani) import the runtime from the package, not relatively
const themeImport = insideKijani
  ? 'import { useTheme } from "../../ThemeContext";'
  : 'import { useTheme } from "@kijani/mobile";';
const themeProviderImport = insideKijani
  ? 'import { ThemeProvider } from "../../../ThemeContext";'
  : 'import { ThemeProvider } from "@kijani/mobile";';

/* ── derive enum type aliases from props ──────────────────────────────── */
// A prop whose `type` is a bare PascalCase identifier AND has an `enum` becomes
// `export type <Type> = "a" | "b";` so the generated types compile with no TODO.
const derivedTypes = [];
const seenType = new Set();
for (const p of props) {
  const t = (p.type || "").trim();
  if (Array.isArray(p.enum) && p.enum.length && /^[A-Z][A-Za-z0-9]*$/.test(t) && !seenType.has(t)) {
    seenType.add(t);
    derivedTypes.push({ name: t, values: p.enum });
  }
}
const derivedTypeNames = derivedTypes.map((d) => d.name);

/* ── helpers ──────────────────────────────────────────────────────────── */
const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
/** A compiling example value for a prop — never references an unimported type. */
function placeholder(p) {
  const t = (p.type || "").trim();
  if (Array.isArray(p.enum) && p.enum.length) return JSON.stringify(p.enum[0]);
  if (/\[\]$/.test(t) && /string/.test(t)) return '["Sample"]';
  if (/=>/.test(t)) return "() => {}";
  if (/\bnumber\b/.test(t)) return "0";
  if (/\bstring\b/.test(t)) return '"Sample"';
  if (/^boolean$/.test(t)) return "true";
  if (/ReactNode/.test(t)) return "null";
  if (/^[A-Z][A-Za-z0-9]*$/.test(t)) return "undefined as never"; // bare custom type, no enum
  return `undefined as unknown as ${t}`;
}
const requiredProps = props.filter((p) => p.required);
const requiredJSX = requiredProps.map((p) => `${p.name}={${placeholder(p)}}`).join(" ");
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
  const aliases = derivedTypes
    .map((d) => `export type ${d.name} = ${d.values.map((v) => JSON.stringify(v)).join(" | ")};`)
    .join("\n");
  const body = props
    .map((p) => {
      const doc = p.description ? `  /** ${p.description} */\n` : "";
      return `${doc}  ${p.name}${p.required ? "" : "?"}: ${p.type};`;
    })
    .join("\n");
  return `${imports.length ? imports.join("\n") + "\n\n" : ""}${aliases ? aliases + "\n\n" : ""}export interface ${Name}Props {
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
${themeImport}
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
  const types = [`${Name}Props`, ...derivedTypeNames].join(", ");
  return `export { ${Name} } from "./${Name}";
export type { ${types} } from "./${Name}.types";
`;
}

function figmaTsx() {
  const url = spec.figma?.fileKey && spec.figma?.nodeId
    ? `https://www.figma.com/design/${spec.figma.fileKey}/x?node-id=${String(spec.figma.nodeId).replace(":", "-")}`
    : "TODO-figma-url";
  const ccMappings = (spec.codeConnect && spec.codeConnect.mappings) || [];
  const propByName = Object.fromEntries(props.map((p) => [p.name, p]));
  const propLines = [];
  const bound = [];
  for (const m of ccMappings) {
    const cp = propByName[m.codeProp];
    if (!cp) continue;
    if (/boolean/i.test(m.transform || "") || cp.type === "boolean") {
      propLines.push(`      ${cp.name}: figma.boolean(${JSON.stringify(m.figmaProp)}),`);
      bound.push(cp.name);
    } else if (Array.isArray(cp.enum) && cp.enum.length) {
      const obj = cp.enum.map((v) => `${cap(v)}: ${JSON.stringify(v)}`).join(", ");
      propLines.push(`      ${cp.name}: figma.enum(${JSON.stringify(m.figmaProp)}, { ${obj} }),`);
      bound.push(cp.name);
    }
    // text/string mappings: left for the example to fill literally
  }
  const exampleAttrs = [
    ...bound.map((n) => `${n}={${n}}`),
    ...requiredProps.filter((p) => !bound.includes(p.name)).map((p) => `${p.name}={${placeholder(p)}}`),
  ].join(" ");
  const sig = bound.length ? `({ ${bound.join(", ")} })` : "()";
  const propsBlock = propLines.length ? `\n${propLines.join("\n")}\n    ` : "";
  return `import React from "react";
import figma from "@figma/code-connect";
import { ${Name} } from "./${Name}";

// Figma node ${spec.figma?.nodeId || "?"}. Generated mapping — refine as needed.
figma.connect(
  ${Name},
  "${url}",
  {
    props: {${propsBlock}},
    example: ${sig} => <${Name} ${exampleAttrs} />,
  },
);
`;
}

function testTsx() {
  const todos = tests.map((t) => `  it.todo(${JSON.stringify(t)});`).join("\n");
  return `import React from "react";
import { render } from "@testing-library/react-native";
${themeProviderImport}
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
if (!insideKijani) {
  console.warn(`  note: '${pkgName}' is outside @kijani — runtime imports use the @kijani/mobile package; ensure that dependency exists in the target.`);
}
fs.mkdirSync(path.join(compDir, "__tests__"), { recursive: true });
function write(rel, content, { protect = false } = {}) {
  const file = path.join(compDir, rel);
  const exists = fs.existsSync(file);
  const handMaintained = spec.updateModel === "hand-maintain";
  if (exists && !FORCE && (protect ? handMaintained : true)) {
    console.log(`  keep   ${path.relative(ROOT, file)} (exists; --force to overwrite)`);
    return;
  }
  fs.writeFileSync(file, content, "utf8");
  console.log(`  ${exists ? "write " : "create"} ${path.relative(ROOT, file)}`);
}

console.log(`\nScaffolding ${Name} → ${path.relative(ROOT, compDir)}`);
if (derivedTypeNames.length) console.log(`  derived types: ${derivedTypeNames.join(", ")}`);
write(`${Name}.types.ts`, typesTs(), { protect: true });
write(`${Name}.tsx`, componentTsx(), { protect: true });
write(`index.ts`, indexTs());
write(`${Name}.figma.tsx`, figmaTsx(), { protect: true });
write(path.join("__tests__", `${Name}.test.tsx`), testTsx(), { protect: true });
const specDest = path.join(compDir, `${Name}.spec.json`);
if (path.resolve(specPath) !== specDest) write(`${Name}.spec.json`, JSON.stringify(spec, null, 2) + "\n");

/* ── append library export ────────────────────────────────────────────── */
if (!NO_INDEX && fs.existsSync(indexFile)) {
  const idx = fs.readFileSync(indexFile, "utf8");
  if (!idx.includes(`./components/${Name}"`)) {
    const typeExports = [`${Name}Props`, ...derivedTypeNames].join(", ");
    const block = `\nexport { ${Name} } from "./components/${Name}";\nexport type { ${typeExports} } from "./components/${Name}";\n`;
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
  3. Refine prop mappings in ${Name}.figma.tsx.
  4. Verify:  cd ${pkgDir} && npx tsc --noEmit && npx jest ${Name}
              node scripts/build-manifest.mjs && node scripts/check-manifest.mjs
  5. MANDATORY: build the designer spec frame (D20) beside the component and record
     figma.specFrameNodeId + definitionOfDone.figmaSpecFrame in the spec.
  6. Add to the demo, then commit on a branch.
`);
