/**
 * Build script for the Kijani Figma plugin.
 *
 * Input:  src/code.js       → dist/code.js   (transpiled, Figma main thread)
 *         src/ui.js         → dist/ui.js     (transpiled reference copy)
 *         src/ui-shell.html → dist/ui.html   (HTML with transpiled script INLINED)
 *
 * Target: es2017 — Figma's plugin runtime rejects object/array spread,
 * optional chaining, and other post-ES2017 syntax when shipped un-transpiled.
 *
 * IMPORTANT — inline only, no <script src>:
 * Figma loads plugin UI as a sandboxed data: URI, so relative <script src>
 * references silently fail to load. All JavaScript must be inlined in the HTML.
 */

import * as esbuild from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

/** Fail the build if any ES2018+ syntax survives in a built file. */
function assertNoForbiddenSyntax(filePath) {
  const src = readFileSync(filePath, "utf8");
  const issues = [];
  if (/\{\s*\.\.\.[a-zA-Z_$]/.test(src) || /,\s*\.\.\.[a-zA-Z_$][^(]*\}/.test(src))
    issues.push("object spread/rest (ES2018)");
  if (/[a-zA-Z_$\])\d]\?\./.test(src))
    issues.push("optional chaining (ES2020)");
  if (/[^?]\?\?[^?]/.test(src))
    issues.push("nullish coalescing (ES2020)");
  if (issues.length) {
    console.error(`\n❌  ${filePath} — forbidden syntax: ${issues.join(", ")}`);
    process.exit(1);
  }
}

/** Verify dist/ui.html is fully self-contained (no external <script src>). */
function assertSelfContained(htmlPath) {
  const html = readFileSync(htmlPath, "utf8");
  if (/<script\s[^>]*\bsrc\s*=/i.test(html)) {
    console.error(`\n❌  ${htmlPath} — has <script src=...> which Figma cannot load.`);
    console.error("    All JavaScript must be inlined in the HTML.\n");
    process.exit(1);
  }
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!match || match[1].trim().length < 200) {
    console.error(`\n❌  ${htmlPath} — inline <script> block is missing or suspiciously small.\n`);
    process.exit(1);
  }
}

/** Assemble dist/ui.html by inlining the transpiled ui.js into the HTML shell. */
function assembleHtml() {
  const script = readFileSync("dist/ui.js", "utf8");
  const shell  = readFileSync("src/ui-shell.html", "utf8");
  const MARKER = '<script src="ui.js"></script>';
  if (!shell.includes(MARKER)) {
    console.error('\n❌  src/ui-shell.html is missing the expected injection marker:');
    console.error('    ' + MARKER);
    process.exit(1);
  }
  const html = shell.replace(MARKER, `<script>\n${script}</script>`);
  writeFileSync("dist/ui.html", html);
}

// ─────────────────────────────────────────────

const watch = process.argv.includes("--watch");
mkdirSync("dist", { recursive: true });

const sharedOpts = {
  bundle: false,       // pure globals — no npm imports in plugin code
  platform: "browser",
  target: ["es2017"],  // lowest target Figma's runtime reliably supports
  logLevel: "info",
};

if (watch) {
  // In watch mode, rebuild + re-assemble on every change.
  const onRebuild = (name) => ({
    name: "assemble-on-rebuild",
    setup(b) {
      b.onEnd(() => {
        if (name === "ui") assembleHtml();
        console.log("  rebuilt " + new Date().toLocaleTimeString());
      });
    },
  });

  const [ctxCode, ctxUi] = await Promise.all([
    esbuild.context({
      ...sharedOpts,
      entryPoints: ["src/code.js"],
      outfile: "dist/code.js",
    }),
    esbuild.context({
      ...sharedOpts,
      entryPoints: ["src/ui.js"],
      outfile: "dist/ui.js",
      plugins: [onRebuild("ui")],
    }),
  ]);
  assembleHtml();
  await Promise.all([ctxCode.watch(), ctxUi.watch()]);
  console.log("Watching src/ → dist/ (Ctrl-C to stop)");
} else {
  await Promise.all([
    esbuild.build({ ...sharedOpts, entryPoints: ["src/code.js"], outfile: "dist/code.js" }),
    esbuild.build({ ...sharedOpts, entryPoints: ["src/ui.js"],   outfile: "dist/ui.js"   }),
  ]);
  assembleHtml();
  assertNoForbiddenSyntax("dist/code.js");
  assertNoForbiddenSyntax("dist/ui.js");
  assertSelfContained("dist/ui.html");
  console.log("✓ Build complete → dist/  (self-contained, no forbidden syntax)");
}
