/**
 * Round-trip parity guard for Push serialization.
 *
 * Simulates what Figma + code.js produce for each token in the source files,
 * then runs figmaValMatchesSrc() against the original source entry.
 * Every token must match (zero spurious changes).
 *
 * Run: node figma-plugin/test/check-roundtrip.mjs
 * Added to root package.json as "plugin:roundtrip".
 *
 * Files checked: core, color-light, color-dark, components, components-dark
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, "../../packages/tokens/source");

const FILES_TO_CHECK = ["core", "color-light", "color-dark", "components", "components-dark"];

// ─── Replicated from src/ui.js (must stay in sync) ───────────────────────────

function flattenTokens(obj) {
  const result = new Map();
  function walk(node, path) {
    if (!node || typeof node !== "object") return;
    if ("$value" in node || "value" in node) { result.set(path, node); return; }
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith("$")) continue;
      walk(v, path ? path + "/" + k : k);
    }
  }
  walk(obj, "");
  return result;
}

function srcVal(entry) { return ("$value" in entry) ? entry["$value"] : entry["value"]; }
function normSrcVal(entry) { return String(srcVal(entry)).trim().toLowerCase(); }

function parseDimension(str) {
  const m = String(str).trim().match(/^(-?[\d.]+)\s*([a-zA-Z%]*)$/);
  return m ? { num: parseFloat(m[1]), unit: m[2] } : null;
}

function parseColorStr(str) {
  const s = String(str).trim().toLowerCase();
  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  if (s.startsWith("#")) {
    const h = s.slice(1);
    if (h.length === 6) return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16), a: 1 };
    if (h.length === 8) return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16), a: parseInt(h.slice(6,8),16)/255 };
  }
  const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (m) return { r: parseFloat(m[1]), g: parseFloat(m[2]), b: parseFloat(m[3]), a: m[4] !== undefined ? parseFloat(m[4]) : 1 };
  return null;
}

function colorsEqual(a, b) {
  return Math.abs(a.r - b.r) <= 1 && Math.abs(a.g - b.g) <= 1 && Math.abs(a.b - b.b) <= 1 && Math.abs(a.a - b.a) < (1.5 / 255);
}

function decimalPlaces(str) {
  const m = String(str).trim().match(/\.(\d+)$/);
  return m ? m[1].length : 0;
}

function figmaValMatchesSrc(figmaVal, existingEntry) {
  if (figmaVal.alias) {
    const expected = "{" + figmaVal.alias.replace(/\//g, ".") + "}";
    return normSrcVal(existingEntry) === expected.toLowerCase();
  }
  const extObj = existingEntry["$extensions"];
  const ext = extObj && extObj["design-system.figma-value"];
  if (ext !== undefined) {
    return String(ext).trim().toLowerCase() === String(figmaVal.value).trim().toLowerCase();
  }
  const srcStr = String(srcVal(existingEntry));
  const figmaColor = parseColorStr(String(figmaVal.value));
  if (figmaColor) {
    const srcColor = parseColorStr(srcStr);
    return srcColor ? colorsEqual(figmaColor, srcColor) : false;
  }
  const dim = parseDimension(srcStr);
  if (dim && dim.unit) {
    const n = typeof figmaVal.value === "number" ? figmaVal.value : parseFloat(String(figmaVal.value));
    return Math.abs(dim.num - n) < 0.0001;
  }
  if (typeof figmaVal.value === "number") {
    const dp = decimalPlaces(srcStr);
    return parseFloat(figmaVal.value.toFixed(dp)) === parseFloat(srcStr);
  }
  return normSrcVal(existingEntry) === String(figmaVal.value).trim().toLowerCase();
}

// ─── Simulate Figma + code.js storage ────────────────────────────────────────

/**
 * Given a source token entry, return the {alias|value} shape that code.js +
 * Figma would produce when reading the variable back out.
 *
 * COLOR   → figmaColorToHex (hex6 opaque / hex8 alpha)
 * FLOAT   → bare number stripped of unit; float32 noise for pure numbers
 * $ext    → extension value
 * alias   → slash-path
 * STRING  → raw string
 */
function srcToFigmaVal(entry) {
  const v = srcVal(entry);
  const s = String(v).trim();

  // Alias token
  if (s.startsWith("{") && s.endsWith("}")) {
    const slashPath = s.slice(1, -1).replace(/\./g, "/");
    return { alias: slashPath };
  }

  // $extensions token: Figma stores the extension value, not $value
  const ext = entry["$extensions"] && entry["$extensions"]["design-system.figma-value"];
  if (ext !== undefined) {
    return { value: ext };
  }

  // Color token: simulate parseColor (code.js) + figmaColorToHex round-trip
  const c = parseColorStr(s);
  if (c) {
    // figmaColorToHex: Math.round(channel_0_1 * 255) -> hex
    // c.r/g/b are already 0-255 integers from parseColorStr
    const rh = Math.round(c.r).toString(16).padStart(2, "0");
    const gh = Math.round(c.g).toString(16).padStart(2, "0");
    const bh = Math.round(c.b).toString(16).padStart(2, "0");
    const ah = Math.round(c.a * 255);
    const hex = "#" + rh + gh + bh;
    return { value: ah < 255 ? hex + ah.toString(16).padStart(2, "0") : hex };
  }

  // Dimension: strip unit -> bare float (no float32 noise for dimensions)
  const dim = parseDimension(s);
  if (dim && dim.unit) {
    return { value: dim.num };
  }

  // Pure number (opacity/number type): Figma FLOAT variable introduces float32 noise
  const num = parseFloat(s);
  if (!isNaN(num) && String(num) !== "NaN" && s !== "") {
    return { value: Math.fround(num) };
  }

  // String variable: stored as-is
  return { value: s };
}

// ─── Run checks ──────────────────────────────────────────────────────────────

let totalTokens = 0;
let failures = 0;
const failLines = [];

for (const name of FILES_TO_CHECK) {
  const filePath = join(srcDir, name + ".json");
  let json;
  try {
    json = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (e) {
    console.error("  ✗  Could not read " + name + ".json: " + e.message);
    failures++;
    continue;
  }

  const flat = flattenTokens(json);
  let fileFailures = 0;

  for (const [path, entry] of flat) {
    totalTokens++;
    const figmaVal = srcToFigmaVal(entry);
    const matches = figmaValMatchesSrc(figmaVal, entry);
    if (!matches) {
      fileFailures++;
      failures++;
      const sv = String(srcVal(entry)).slice(0, 60);
      const fv = figmaVal.alias ? ("{alias:" + figmaVal.alias + "}") : String(figmaVal.value).slice(0, 60);
      failLines.push("    [" + name + "] " + path + "\n      src=" + sv + "\n      figma=" + fv);
    }
  }

  const status = fileFailures === 0 ? "✓" : "✗";
  console.log("  " + status + "  " + name + ".json (" + flat.size + " tokens, " + fileFailures + " mismatches)");
}

if (failLines.length > 0) {
  console.error("\nMismatches:");
  failLines.slice(0, 30).forEach(l => console.error(l));
  if (failLines.length > 30) console.error("  ... and " + (failLines.length - 30) + " more");
}

console.log("\n" + totalTokens + " tokens checked: " + (totalTokens - failures) + " matched, " + failures + " mismatched\n");
if (failures > 0) process.exit(1);
