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

console.log("\n" + totalTokens + " tokens checked: " + (totalTokens - failures) + " matched, " + failures + " mismatched");

// ─── Byte-level write-path guard ─────────────────────────────────────────────
// Replicate applyChangesToText from src/ui.js to verify the write path
// preserves every byte when changesMap is empty, and changes exactly the
// target line(s) when a real edit occurs.

function escapeRe(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function toJsonLiteral(val) {
  return typeof val === "string" ? JSON.stringify(val) : String(val);
}
function patchSingleLine(line, change) {
  const vk = ("$value" in change.new) ? "$value" : "value";
  const oldLit = toJsonLiteral(change.old[vk]);
  const newLit = toJsonLiteral(change.new[vk]);
  if (oldLit === newLit) return line;
  return line.replace(
    new RegExp('"(?:\\$value|value)"\\s*:\\s*' + escapeRe(oldLit)),
    '"$value": ' + newLit
  );
}
function patchMultiLine(line, change) {
  const vk = ("$value" in change.new) ? "$value" : "value";
  const oldLit = toJsonLiteral(change.old[vk]);
  const newLit = toJsonLiteral(change.new[vk]);
  if (oldLit !== newLit && (line.includes('"$value"') || line.includes('"value"'))) {
    const p = line.replace(
      new RegExp('"(?:\\$value|value)"\\s*:\\s*' + escapeRe(oldLit)),
      '"$value": ' + newLit
    );
    if (p !== line) return p;
  }
  if (line.includes('"design-system.figma-value"')) {
    const extObj = change.old["$extensions"];
    const oldExt = extObj && extObj["design-system.figma-value"];
    const newExt = change.new["$extensions"] && change.new["$extensions"]["design-system.figma-value"];
    if (oldExt !== undefined && toJsonLiteral(oldExt) !== toJsonLiteral(newExt)) {
      return line.replace(
        new RegExp('"design-system\\.figma-value"\\s*:\\s*' + escapeRe(toJsonLiteral(oldExt))),
        '"design-system.figma-value": ' + toJsonLiteral(newExt)
      );
    }
  }
  return line;
}
function applyChangesToText(originalText, changesMap) {
  if (changesMap.size === 0) return originalText;
  const lines = originalText.split("\n");
  const result = lines.slice();
  const pathStack = [];
  let activeChange = null;
  let arrayDepth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^[}\]],?$/.test(trimmed)) {
      if (trimmed[0] === "]") { if (arrayDepth > 0) arrayDepth--; }
      else { if (activeChange) activeChange = null; if (pathStack.length > 0) pathStack.pop(); }
      continue;
    }
    const m = trimmed.match(/^"([^"]+)"\s*:\s*([\s\S]*)/);
    if (!m) continue;
    const key = m[1];
    const rest = m[2].trimEnd();
    if (activeChange && key.startsWith("$")) {
      if (rest === "[") arrayDepth++;
      const p = patchMultiLine(line, activeChange);
      if (p !== line) result[i] = p;
      continue;
    }
    if (key.startsWith("$")) { if (rest === "[") arrayDepth++; continue; }
    const fullPath = pathStack.length > 0 ? pathStack.join("/") + "/" + key : key;
    const change = changesMap.get(fullPath);
    if (rest.startsWith("{") && /\}[,]?\s*$/.test(rest)) {
      if (change) result[i] = patchSingleLine(line, change);
      continue;
    }
    if (rest === "{") {
      pathStack.push(key);
      for (let j = i + 1; j < lines.length; j++) {
        const lt = lines[j].trim();
        if (!lt) continue;
        if (lt.startsWith('"$')) { if (change) activeChange = change; }
        break;
      }
      continue;
    }
    if (rest === "[") { pathStack.push(key); arrayDepth++; continue; }
  }
  return result.join("\n");
}

console.log("\nByte-level write-path guard");
let byteFailures = 0;

// Test A: empty changesMap → text unchanged (verbatim identity)
for (const name of FILES_TO_CHECK) {
  const filePath = join(srcDir, name + ".json");
  let text;
  try { text = readFileSync(filePath, "utf8"); } catch { continue; }
  const out = applyChangesToText(text, new Map());
  const ok = out === text;
  if (!ok) byteFailures++;
  console.log("  " + (ok ? "✓" : "✗") + "  " + name + ".json — empty changesMap returns identical text");
}

// Test B: single-value change touches exactly 1 line in core.json
{
  const text = readFileSync(join(srcDir, "core.json"), "utf8");
  const TEST_PATH = "color/brand/700";
  const TEST_OLD = { "$value": "#3C61DD", "$type": "color" };
  const TEST_NEW = { "$value": "#abcdef", "$type": "color" };
  const changesMap = new Map([[TEST_PATH, { old: TEST_OLD, new: TEST_NEW, modes: ["Light · Web"] }]]);

  const modified = applyChangesToText(text, changesMap);
  const origLines = text.split("\n");
  const modLines = modified.split("\n");

  const changedIdxs = origLines.reduce((acc, l, i) => { if (l !== modLines[i]) acc.push(i); return acc; }, []);
  const exactlyOne = changedIdxs.length === 1;
  const containsNewVal = exactlyOne && modLines[changedIdxs[0]].includes('"#abcdef"');
  const keepsType = exactlyOne && modLines[changedIdxs[0]].includes('"color"');

  if (!exactlyOne) byteFailures++;
  if (!containsNewVal) byteFailures++;
  console.log("  " + (exactlyOne ? "✓" : "✗") + "  Single color change touches exactly 1 line (" + changedIdxs.length + " changed)");
  console.log("  " + (containsNewVal ? "✓" : "✗") + "  Changed line contains new value #abcdef" + (!containsNewVal && changedIdxs.length ? `: "${modLines[changedIdxs[0]].trim()}"` : ""));
  console.log("  " + (keepsType ? "✓" : "✗") + "  Changed line preserves $type key");
}

// Test C: extension-field change for multi-line token
{
  const text = readFileSync(join(srcDir, "core.json"), "utf8");
  const TEST_PATH = "font-weight/regular";
  const TEST_OLD = {
    "$value": "400", "$type": "fontWeights",
    "$extensions": { "design-system.figma-value": "Regular" }
  };
  const TEST_NEW = {
    "$value": "400", "$type": "fontWeights",
    "$extensions": { "design-system.figma-value": "Light" }
  };
  const changesMap = new Map([[TEST_PATH, { old: TEST_OLD, new: TEST_NEW, modes: ["Light · Web"] }]]);

  const modified = applyChangesToText(text, changesMap);
  const origLines = text.split("\n");
  const modLines = modified.split("\n");
  const changedIdxs = origLines.reduce((acc, l, i) => { if (l !== modLines[i]) acc.push(i); return acc; }, []);

  const exactlyOne = changedIdxs.length === 1;
  const containsLight = exactlyOne && modLines[changedIdxs[0]].includes('"Light"');
  const valueUnchanged = !modified.split("\n").some((l, i) => origLines[i] && l !== origLines[i] && l.includes('"400"') !== origLines[i].includes('"400"'));

  if (!exactlyOne) byteFailures++;
  if (!containsLight) byteFailures++;
  console.log("  " + (exactlyOne ? "✓" : "✗") + "  $extensions change touches exactly 1 line (" + changedIdxs.length + " changed)");
  console.log("  " + (containsLight ? "✓" : "✗") + "  Changed line contains new extension value \"Light\"");
  console.log("  " + (valueUnchanged ? "✓" : "✗") + "  $value line is untouched");
}

// ─── Diff no-op guard ─────────────────────────────────────────────────────────
// Replicate normalizeFigmaValStr / normalizeRepoValStr from src/code.js
// (the fixed FLOAT-aware versions). For every non-alias token in
// tokens.figma-variables.json, simulate what Figma would hand back and
// assert the two normalized strings are equal — i.e. Diff on an unchanged
// collection reports ZERO changes.

const tokensJsonPath = join(__dirname, "../../packages/tokens/tokens.figma-variables.json");
let diffFailures = 0;

function normRepoColorStrDiff(str) {
  str = String(str || "").trim().toLowerCase();
  if (str === "transparent") return "#00000000";
  if (str.startsWith("#")) {
    const h = str.slice(1);
    if (h.length === 6) return str;
    if (h.length === 8) return (h.slice(6) === "ff") ? "#" + h.slice(0, 6) : str;
    return str;
  }
  const m = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (m) {
    const r = Math.round(+m[1]).toString(16).padStart(2, "0");
    const g = Math.round(+m[2]).toString(16).padStart(2, "0");
    const b = Math.round(+m[3]).toString(16).padStart(2, "0");
    const a = m[4] != null ? +m[4] : 1;
    if (Math.abs(a - 1) < 0.004) return "#" + r + g + b;
    return "#" + r + g + b + Math.round(a * 255).toString(16).padStart(2, "0");
  }
  return str;
}

function normRepoValStrDiff(entry, type) {
  if (!entry || entry.alias) return null;
  if (type === "COLOR") return normRepoColorStrDiff(entry.value);
  if (type === "FLOAT") {
    const n = typeof entry.value === "number" ? entry.value : parseFloat(String(entry.value));
    return isFinite(n) ? String(Math.fround(n)) : null;
  }
  return String(entry.value != null ? entry.value : "");
}

// Simulate what Figma returns when reading a stored variable value back out.
// FLOAT: Figma returns an IEEE 754 float32 (apply Math.fround)
// COLOR: any color string → RGBA 0–1 floats (Figma's internal format) → hex6/8
//        mirrors normalizeFigmaColorRGBA in code.js
// STRING: pass through
function simulateFigmaReturn(value, type) {
  if (type === "FLOAT") {
    const n = typeof value === "number" ? value : parseFloat(String(value));
    return isFinite(n) ? Math.fround(n) : value;
  }
  if (type === "COLOR") {
    const s = String(value).trim().toLowerCase();
    let r, g, b, a;
    if (s === "transparent") {
      r = 0; g = 0; b = 0; a = 0;
    } else if (s.startsWith("#")) {
      const h = s.slice(1);
      if (h.length === 6) {
        r = parseInt(h.slice(0,2), 16) / 255; g = parseInt(h.slice(2,4), 16) / 255;
        b = parseInt(h.slice(4,6), 16) / 255; a = 1;
      } else if (h.length === 8) {
        r = parseInt(h.slice(0,2), 16) / 255; g = parseInt(h.slice(2,4), 16) / 255;
        b = parseInt(h.slice(4,6), 16) / 255; a = parseInt(h.slice(6,8), 16) / 255;
      } else return s;
    } else {
      const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
      if (!m) return s;
      r = parseFloat(m[1]) / 255; g = parseFloat(m[2]) / 255;
      b = parseFloat(m[3]) / 255; a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    }
    const rh = Math.round(r * 255).toString(16).padStart(2, "0");
    const gh = Math.round(g * 255).toString(16).padStart(2, "0");
    const bh = Math.round(b * 255).toString(16).padStart(2, "0");
    const ah = Math.round(a * 255);
    return "#" + rh + gh + bh + (ah < 255 ? ah.toString(16).padStart(2, "0") : "");
  }
  return String(value);
}

function normFigmaValStrDiff(figmaRaw, type) {
  if (type === "COLOR") return typeof figmaRaw === "string" ? figmaRaw : String(figmaRaw);
  if (type === "FLOAT") {
    const n = typeof figmaRaw === "number" ? figmaRaw : parseFloat(String(figmaRaw));
    return isFinite(n) ? String(Math.fround(n)) : null;
  }
  return String(figmaRaw != null ? figmaRaw : "");
}

console.log("\nDiff no-op guard (tokens.figma-variables.json)");
try {
  const figmaVars = JSON.parse(readFileSync(tokensJsonPath, "utf8"));
  let diffTotal = 0;
  let diffMismatches = 0;
  const diffFailLines = [];

  for (const v of figmaVars.variables) {
    for (const [modeId, entry] of Object.entries(v.values)) {
      if (entry.alias) continue;
      diffTotal++;
      const rStr = normRepoValStrDiff(entry, v.type);
      if (rStr === null) continue;
      const figmaRaw = simulateFigmaReturn(entry.value, v.type);
      const fStr = normFigmaValStrDiff(figmaRaw, v.type);
      if (fStr === null) continue;
      if (rStr !== fStr) {
        diffMismatches++;
        diffFailures++;
        diffFailLines.push("    [" + v.type + "] " + v.name + " @" + modeId +
          "\n      repo=" + rStr + "\n      figma=" + fStr);
      }
    }
  }

  if (diffFailLines.length > 0) {
    console.error("\nDiff mismatches:");
    diffFailLines.slice(0, 20).forEach(l => console.error(l));
    if (diffFailLines.length > 20) console.error("  ... and " + (diffFailLines.length - 20) + " more");
  }
  console.log("  " + (diffMismatches === 0 ? "✓" : "✗") + "  " + diffTotal +
    " non-alias values checked: " + diffMismatches + " false diff(s)");
} catch (e) {
  diffFailures++;
  console.error("  ✗  Could not run Diff no-op guard: " + e.message);
}

const grandTotal = failures + byteFailures + diffFailures;
console.log("\n" + (grandTotal === 0 ? "All checks passed." : grandTotal + " check(s) failed.") + "\n");
if (grandTotal > 0) process.exit(1);
