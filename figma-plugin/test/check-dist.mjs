/**
 * Regression checks for figma-plugin/dist/.
 *
 * Run: node test/check-dist.mjs
 * Added to root package.json as "plugin:check".
 *
 * Key invariant: dist/ui.html must be fully self-contained with no
 * <script src=...> tags.  Figma loads plugin UI as a sandboxed iframe
 * (internally a data: URI), so relative external script references silently
 * fail to load — causing zero JS to execute and all UI features to break.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

let passed = 0;
let failed = 0;

function check(name, ok, detail) {
  if (ok) {
    console.log("  ✓  " + name);
    passed++;
  } else {
    console.error("  ✗  " + name + (detail ? "\n     " + detail : ""));
    failed++;
  }
}

// ─── dist/ui.html ────────────────────────────────────────────────────────────
console.log("\ndist/ui.html");
const uiHtml = readFileSync(join(root, "dist/ui.html"), "utf8");

check(
  "No external <script src=...>  (Figma iframe cannot load relative scripts)",
  !/<script\s[^>]*\bsrc\s*=/i.test(uiHtml),
  "Remove <script src=...> tags — all JS must be inlined by the build step."
);

const inlineScript = uiHtml.match(/<script>([\s\S]*?)<\/script>/);
const inlineLen = inlineScript ? inlineScript[1].trim().length : 0;
check(
  "Inline <script> block is non-trivially large (> 1 000 chars)",
  inlineLen > 1000,
  `Actual: ${inlineLen} chars — the assembleHtml() step in build.mjs may have failed.`
);

check(
  "Global error handler present (window 'error' + 'unhandledrejection')",
  uiHtml.includes("unhandledrejection"),
  "Add window.addEventListener('unhandledrejection', ...) in src/ui.js."
);

check(
  "PAT init message present (get-pat sent on load)",
  uiHtml.includes("get-pat"),
  "The get-pat init postMessage at the bottom of src/ui.js is missing."
);

check(
  "Pull button handler wired (btn-pull listener)",
  uiHtml.includes("btn-pull"),
  "document.getElementById('btn-pull') event listener is missing from src/ui.js."
);

check(
  "'done' case in message handler (unblocks busy-state on main-thread errors)",
  uiHtml.includes('case "done"') || uiHtml.includes("case 'done'"),
  "Add case 'done': setBusy(false); to the window.onmessage switch in src/ui.js."
);

// ─── dist/code.js ────────────────────────────────────────────────────────────
console.log("\ndist/code.js");
const code = readFileSync(join(root, "dist/code.js"), "utf8");

check(
  "No ES2018 object spread ({...x})",
  !(/\{\s*\.\.\.[a-zA-Z_$]/.test(code) || /,\s*\.\.\.[a-zA-Z_$][^(]*\}/.test(code)),
  "esbuild must lower object spread — check target is es2017."
);
check(
  "No optional chaining (?.)",
  !/[a-zA-Z_$\])\d]\?\./.test(code),
  "esbuild must lower optional chaining — check target is es2017."
);
check(
  "esbuild spread helpers emitted (__spreadValues or __spreadProps)",
  code.includes("__spreadValues") || code.includes("__spreadProps") || !code.includes("..."),
  "Expected esbuild helper functions to replace object spread."
);
check(
  "PAT_KEY constant present",
  code.includes("kijani.pat"),
  "PAT_KEY is missing from dist/code.js."
);
check(
  "compute-pull-preview handler present",
  code.includes("compute-pull-preview"),
  "The Pull message handler is missing from the router."
);
check(
  "read-collection handler present (Push step 1)",
  code.includes("read-collection"),
  "The Push 'read-collection' message handler is missing from the router."
);
check(
  "readFigmaCollection function present in code.js",
  code.includes("readFigmaCollection"),
  "The readFigmaCollection() function was not emitted in dist/code.js."
);
check(
  "figmaColorToHex emitted (color serialization for Push)",
  code.includes("figmaColorToHex"),
  "figmaColorToHex() is missing — Push color serialization will not work."
);

// ─── dist/ui.js ──────────────────────────────────────────────────────────────
console.log("\ndist/ui.js");
const uiJs = readFileSync(join(root, "dist/ui.js"), "utf8");

check(
  "No ES2018 object spread in ui.js",
  !(/\{\s*\.\.\.[a-zA-Z_$]/.test(uiJs) || /,\s*\.\.\.[a-zA-Z_$][^(]*\}/.test(uiJs)),
  "esbuild must lower object spread — check target is es2017."
);
check(
  "Push button handler wired (btn-push listener)",
  uiJs.includes("btn-push"),
  "document.getElementById('btn-push') event listener is missing from src/ui.js."
);
check(
  "computePushChanges function present",
  uiJs.includes("computePushChanges"),
  "computePushChanges() is missing from dist/ui.js."
);
check(
  "executePush function present (GitHub write flow)",
  uiJs.includes("executePush"),
  "executePush() is missing from dist/ui.js."
);
check(
  "403 write-scope error message present",
  uiJs.includes("Contents: Write"),
  "Write-scope error message missing — PAT failures won't be clearly surfaced."
);
check(
  "collection-data message handler present",
  uiJs.includes("collection-data"),
  "The 'collection-data' message case is missing from window.onmessage."
);

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
