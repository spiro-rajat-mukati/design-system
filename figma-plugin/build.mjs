/**
 * Build script for the Kijani Figma plugin.
 *
 * Input:  src/code.js      → dist/code.js   (transpiled, Figma main thread)
 *         src/ui.js        → dist/ui.js     (transpiled, plugin iframe)
 *         src/ui-shell.html → dist/ui.html  (HTML with <script src="ui.js">)
 *
 * Target: es2017 — Figma's plugin runtime rejects object/array spread,
 * optional chaining, and other post-ES2017 syntax unless transpiled.
 */

import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";

/** Guard: ensure the built output contains no ES2018+ syntax that Figma rejects. */
function assertNoForbiddenSyntax(filePath) {
  const src = readFileSync(filePath, "utf8");
  const issues = [];
  // Object spread/rest {  ...x  } — ES2018
  if (/\{\s*\.\.\.[a-zA-Z_$]/.test(src) || /,\s*\.\.\.[a-zA-Z_$][^(]*\}/.test(src))
    issues.push("object spread/rest");
  // Optional chaining — ES2020
  if (/[a-zA-Z_$\])\d]\?\./.test(src)) issues.push("optional chaining (?.)");
  // Nullish coalescing — ES2020
  if (/[^?]\?\?[^?]/.test(src)) issues.push("nullish coalescing (??)");
  if (issues.length) {
    console.error(`\n❌  ${filePath} contains forbidden syntax: ${issues.join(", ")}`);
    console.error("    Re-check the esbuild target or remove the offending pattern.\n");
    process.exit(1);
  }
}

const watch = process.argv.includes("--watch");
const distDir = new URL("dist/", import.meta.url).pathname;
mkdirSync(distDir, { recursive: true });

const sharedOpts = {
  bundle: false,        // No npm imports — pure globals (figma, parent, etc.)
  platform: "browser",
  target: ["es2017"],   // Transpile spread, for-of, async — keep away from es2018+
  logLevel: "info",
};

if (watch) {
  const [ctxCode, ctxUi] = await Promise.all([
    esbuild.context({ ...sharedOpts, entryPoints: ["src/code.js"], outfile: "dist/code.js" }),
    esbuild.context({ ...sharedOpts, entryPoints: ["src/ui.js"],   outfile: "dist/ui.js"   }),
  ]);
  copyFileSync("src/ui-shell.html", "dist/ui.html");
  await Promise.all([ctxCode.watch(), ctxUi.watch()]);
  console.log("Watching src/ → dist/ (Ctrl-C to stop)");
} else {
  await Promise.all([
    esbuild.build({ ...sharedOpts, entryPoints: ["src/code.js"], outfile: "dist/code.js" }),
    esbuild.build({ ...sharedOpts, entryPoints: ["src/ui.js"],   outfile: "dist/ui.js"   }),
  ]);
  copyFileSync("src/ui-shell.html", "dist/ui.html");
  assertNoForbiddenSyntax("dist/code.js");
  assertNoForbiddenSyntax("dist/ui.js");
  console.log("✓ Build complete → dist/  (no forbidden syntax)");
}
