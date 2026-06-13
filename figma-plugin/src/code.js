/**
 * Design System Sync — main plugin thread.
 *
 * Receives messages from ui.html and applies them to the Figma document via
 * the figma.* API. The UI does all the network fetching; we just consume the
 * parsed JSON.
 */

figma.showUI(__html__, { width: 360, height: 520, themeColors: true });

const COLLECTION_NAME = "Design System";

/** Pre-load every (family, style) combo our STRING variables might set as a
 *  fontFamily / fontStyle value. Figma's setValueForMode validates that the
 *  font is loaded before accepting the string, so this needs to run *before*
 *  Sync tokens or Sync Text Styles. */
const FONT_FAMILIES = ["Inter", "Menlo", "Georgia"];
const FONT_STYLES = ["Regular", "Medium", "Semi Bold", "Bold"];
const fontsReady = Promise.all(
  FONT_FAMILIES.flatMap((family) =>
    FONT_STYLES.map((style) =>
      figma.loadFontAsync({ family, style }).catch(() => {})
    )
  )
);

/* ---------- helpers ---------- */

function uiLog(text, kind) {
  figma.ui.postMessage({ type: "log", text, kind: kind || "info" });
}

function uiDone() {
  figma.ui.postMessage({ type: "sync-done" });
}

/** Parse a CSS-style colour into Figma's RGBA (0..1) shape. */
function parseColor(input) {
  if (input == null) return null;
  const s = String(input).trim();

  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };

  // #RRGGBB or #RRGGBBAA
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16) / 255,
        g: parseInt(hex.slice(2, 4), 16) / 255,
        b: parseInt(hex.slice(4, 6), 16) / 255,
        a: 1
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16) / 255,
        g: parseInt(hex.slice(2, 4), 16) / 255,
        b: parseInt(hex.slice(4, 6), 16) / 255,
        a: parseInt(hex.slice(6, 8), 16) / 255
      };
    }
  }

  // rgba(r, g, b, a) or rgb(r, g, b)
  const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (m) {
    return {
      r: Number(m[1]) / 255,
      g: Number(m[2]) / 255,
      b: Number(m[3]) / 255,
      a: m[4] != null ? Number(m[4]) : 1
    };
  }

  return null;
}

/** Ensure the named collection exists; return it. */
function ensureCollection(name) {
  const collections = figma.variables.getLocalVariableCollections();
  let collection = collections.find((c) => c.name === name);
  if (!collection) {
    collection = figma.variables.createVariableCollection(name);
    uiLog("Created Variable Collection: " + name, "ok");
  } else {
    uiLog("Using existing collection: " + name, "muted");
  }
  return collection;
}

/** Ensure every desired mode exists on the collection.
 *  Returns Map<jsonModeId, figmaModeId> so callers can look up by the IDs
 *  that appear inside `values` objects in our JSON (e.g. "light-compact"),
 *  not by Figma's display names ("Light · Compact"). */
function ensureModes(collection, desiredModes) {
  const idToModeId = new Map();
  const existingByName = new Map();
  for (const m of collection.modes) existingByName.set(m.name, m.modeId);

  // Figma collections start with one default mode named "Mode 1". If we
  // haven't matched any of our desired names yet and that's the only mode,
  // rename it to our first desired mode rather than adding a 5th.
  if (
    collection.modes.length === 1 &&
    !desiredModes.some((d) => existingByName.has(d.name))
  ) {
    const onlyMode = collection.modes[0];
    const first = desiredModes[0];
    collection.renameMode(onlyMode.modeId, first.name);
    existingByName.delete(onlyMode.name);
    existingByName.set(first.name, onlyMode.modeId);
    idToModeId.set(first.id, onlyMode.modeId);
    uiLog("Renamed default mode → " + first.name, "muted");
  }

  for (const desired of desiredModes) {
    if (idToModeId.has(desired.id)) continue;
    if (existingByName.has(desired.name)) {
      idToModeId.set(desired.id, existingByName.get(desired.name));
      continue;
    }
    const newId = collection.addMode(desired.name);
    existingByName.set(desired.name, newId);
    idToModeId.set(desired.id, newId);
    uiLog("Added mode: " + desired.name, "ok");
  }
  return idToModeId;
}

/** Index of variables by name in the given collection. */
function indexVariables(collection) {
  const all = figma.variables.getLocalVariables();
  const map = new Map();
  for (const v of all) {
    if (v.variableCollectionId !== collection.id) continue;
    map.set(v.name, v);
  }
  return map;
}

/** Create-or-fetch a variable by name. If a pre-existing variable has a
 *  different resolvedType than what the JSON says (e.g. fontWeights moved
 *  FLOAT→STRING in our build), the existing one is removed and a fresh one
 *  is created. Existing bindings to the old variable will break — callers
 *  expecting to re-bind (Text Styles, regenerated components) handle this. */
function ensureVariable(name, type, collection, varIndex) {
  let v = varIndex.get(name);
  if (v) {
    if (v.resolvedType !== type) {
      uiLog("Type changed on " + name + " (" + v.resolvedType + " → " + type + "), recreating", "muted");
      try { v.remove(); } catch (e) { uiLog("  · couldn't remove " + name + ": " + e.message, "warn"); }
      varIndex.delete(name);
    } else {
      return v;
    }
  }
  v = figma.variables.createVariable(name, collection, type);
  varIndex.set(name, v);
  return v;
}

/** Set a variable's value for one mode. */
function applyValue(variable, modeId, value, type, varIndex) {
  if (!value) return;

  // Alias reference.
  if (value.alias) {
    const target = varIndex.get(value.alias);
    if (!target) {
      uiLog("Unresolved alias: " + variable.name + " → " + value.alias, "warn");
      return;
    }
    variable.setValueForMode(modeId, figma.variables.createVariableAlias(target));
    return;
  }

  // Literal value.
  if (type === "COLOR") {
    const rgba = parseColor(value.value);
    if (!rgba) {
      uiLog("Bad colour on " + variable.name + ": " + value.value, "warn");
      return;
    }
    variable.setValueForMode(modeId, rgba);
    return;
  }
  if (type === "FLOAT") {
    variable.setValueForMode(modeId, Number(value.value));
    return;
  }
  if (type === "STRING") {
    variable.setValueForMode(modeId, String(value.value));
    return;
  }
}

/* ---------- token sync ---------- */

function syncTokens(data) {
  if (!data || !data.variables) {
    uiLog("Bad payload — no variables array", "err");
    uiDone();
    return;
  }

  uiLog("Starting token sync…", "info");

  const collection = ensureCollection(data.collectionName || COLLECTION_NAME);
  const modeIds = ensureModes(collection, data.modes);
  const varIndex = indexVariables(collection);

  // Pass 1 — create every variable and apply LITERAL values.
  // Aliases are deferred to Pass 2 because their targets might not exist yet.
  let processed = 0;
  let pass1Failures = 0;
  for (const entry of data.variables) {
    const v = ensureVariable(entry.name, entry.type, collection, varIndex);
    if (!v) continue;
    for (const [modeId, val] of Object.entries(entry.values)) {
      const figmaModeId = modeIds.get(modeId);
      if (!figmaModeId) continue;
      if (val.value !== undefined) {
        try {
          applyValue(v, figmaModeId, val, entry.type, varIndex);
        } catch (e) {
          pass1Failures += 1;
          if (pass1Failures <= 5) {
            uiLog("  · couldn't set " + entry.name + " for mode " + modeId + ": " + e.message, "warn");
          }
        }
      }
    }
    processed += 1;
  }
  uiLog("Pass 1 complete: " + processed + " variables created or updated" + (pass1Failures ? " (" + pass1Failures + " value-set failures)" : ""), pass1Failures ? "warn" : "ok");

  // Pass 2 — resolve aliases now that every variable exists.
  let aliasCount = 0;
  let aliasFailures = 0;
  for (const entry of data.variables) {
    const v = varIndex.get(entry.name);
    if (!v) continue;
    for (const [modeId, val] of Object.entries(entry.values)) {
      const figmaModeId = modeIds.get(modeId);
      if (!figmaModeId) continue;
      if (val && val.alias) {
        const target = varIndex.get(val.alias);
        if (!target) {
          aliasFailures += 1;
          if (aliasFailures <= 5) uiLog("  · missing alias target: " + entry.name + " → " + val.alias, "warn");
          continue;
        }
        v.setValueForMode(figmaModeId, figma.variables.createVariableAlias(target));
        aliasCount += 1;
      }
    }
  }
  uiLog("Pass 2 complete: " + aliasCount + " alias bindings set" + (aliasFailures ? " (" + aliasFailures + " unresolved)" : ""), aliasFailures ? "warn" : "ok");
  uiLog("Sync done.", "ok");
  uiDone();
}

/* ============================================================
   COMPONENT GENERATOR
   Reads a component spec and constructs a Figma Component with
   auto-layout, fills, strokes, text — all visual properties bound
   to Variables in the Design System collection.

   First version (v0.1): generates ONE representative variant per
   component. Variant matrix + variantOverrides come in v0.2 once
   we know v0.1 renders correctly.
   ============================================================ */

/** Interpolate ${expr} occurrences in a string against a variant context. */
function interpolate(input, ctx) {
  if (typeof input !== "string") return input;
  return input.replace(/\$\{([^}]+)\}/g, (_, expr) => {
    try {
      const fn = new Function(...Object.keys(ctx), "return (" + expr + ");");
      const v = fn(...Object.values(ctx));
      return v == null ? "" : String(v);
    } catch (e) {
      return "";
    }
  });
}

function evaluateCondition(expr, ctx) {
  if (expr === true || expr === false) return expr;
  if (typeof expr !== "string") return true;
  try {
    const fn = new Function(...Object.keys(ctx), "return (" + expr.replace(/^\$\{|\}$/g, "") + ");");
    return Boolean(fn(...Object.values(ctx)));
  } catch (e) {
    return true;
  }
}

/** Pull a token name out of a "{name/path}" template, or null if not a pure ref. */
function tokenName(input, ctx) {
  const resolved = interpolate(input, ctx);
  const m = /^\{([^}]+)\}$/.exec(resolved);
  return m ? m[1] : null;
}

/** Map our alignment strings to Figma's enum. */
function mapAlign(s) {
  if (s === "center") return "CENTER";
  if (s === "start" || s === "min") return "MIN";
  if (s === "end" || s === "max") return "MAX";
  if (s === "space-between") return "SPACE_BETWEEN";
  return "CENTER";
}

/** Walk a Variable's alias chain in JS and return its raw resolved value
 *  (number or string) — caller filters by JS type. */
function resolveVariableValue(variable) {
  if (!variable) return undefined;
  const firstMode = Object.keys(variable.valuesByMode || {})[0];
  let resolved = variable.valuesByMode && variable.valuesByMode[firstMode];
  let safety = 8;
  while (resolved && typeof resolved === "object" && resolved.type === "VARIABLE_ALIAS" && safety-- > 0) {
    const target = figma.variables.getVariableById(resolved.id);
    if (!target) return undefined;
    const tm = Object.keys(target.valuesByMode || {})[0];
    resolved = target.valuesByMode && target.valuesByMode[tm];
  }
  return resolved;
}

/** Resolve a spec value (literal, {token}, or template) to a plain number. */
function resolveLiteral(input, ctx, varIndex) {
  const name = tokenName(input, ctx);
  if (name) {
    const v = varIndex.get(name);
    if (v) {
      const r = resolveVariableValue(v);
      if (typeof r === "number" && Number.isFinite(r)) return r;
    }
  }
  const literal = interpolate(input, ctx);
  const num = parseFloat(literal);
  return Number.isFinite(num) ? num : null;
}

/** Resolve a spec value to a string (via Variable alias chain or template). */
function resolveString(input, ctx, varIndex) {
  const name = tokenName(input, ctx);
  if (name) {
    const v = varIndex.get(name);
    if (v) {
      const r = resolveVariableValue(v);
      if (typeof r === "string") return r;
    }
  }
  const literal = interpolate(input, ctx);
  return typeof literal === "string" && literal.length > 0 ? literal : null;
}

/** Resolve a token-or-literal to the actual Figma Variable (for binding).
 *  Returns null if the input isn't a {token} reference. */
function variableFor(input, ctx, varIndex) {
  const name = tokenName(input, ctx);
  if (!name) return null;
  return varIndex.get(name) || null;
}

/** Apply a value to a scalar node field, binding to a Variable if the input
 *  resolves to a {token/path}. Returns true if applied, false otherwise. */
function applyScalar(node, field, input, ctx, varIndex) {
  const name = tokenName(input, ctx);
  if (name) {
    const v = varIndex.get(name);
    if (v) {
      try {
        node.setBoundVariable(field, v);
        return true;
      } catch (e) {
        uiLog("Can't bind " + field + " on " + node.name + " to " + name + ": " + e.message, "warn");
      }
    } else {
      uiLog("Missing variable for " + field + ": " + name, "warn");
    }
  }
  const literal = interpolate(input, ctx);
  const num = parseFloat(literal);
  if (Number.isFinite(num)) {
    try { node[field] = num; return true; } catch (e) { /* swallow */ }
  }
  return false;
}

function applyPadding(node, padding, ctx, varIndex) {
  if (padding == null) return;
  if (padding.inline != null) {
    applyScalar(node, "paddingLeft", padding.inline, ctx, varIndex);
    applyScalar(node, "paddingRight", padding.inline, ctx, varIndex);
  }
  if (padding.block != null) {
    applyScalar(node, "paddingTop", padding.block, ctx, varIndex);
    applyScalar(node, "paddingBottom", padding.block, ctx, varIndex);
  }
}

/** Build a SOLID paint, binding its colour to a Variable if a {token} is given. */
function buildPaint(spec, ctx, varIndex) {
  const paint = { type: "SOLID", color: { r: 0, g: 0, b: 0 } };
  if (spec && spec.variable) {
    const name = tokenName(spec.variable, ctx);
    if (name) {
      const v = varIndex.get(name);
      if (v) return figma.variables.setBoundVariableForPaint(paint, "color", v);
      uiLog("Missing variable for paint: " + name, "warn");
    }
  }
  return paint;
}

/** Pick the first applicable paint from a list (first whose `appliesIf` evaluates truthy). */
function pickPaints(list, ctx, varIndex) {
  if (!list || list.length === 0) return [];
  for (const item of list) {
    if (!item.appliesIf || evaluateCondition(item.appliesIf, ctx)) {
      return [buildPaint(item, ctx, varIndex)];
    }
  }
  // Fall back to the first item if none matched.
  return [buildPaint(list[0], ctx, varIndex)];
}

async function buildStructure(spec, ctx, varIndex) {
  if (!spec) return null;
  if (spec.type === "frame") return await buildFrame(spec, ctx, varIndex);
  if (spec.type === "text") return await buildText(spec, ctx, varIndex);
  if (spec.type === "icon-slot") return buildIconSlot(spec, ctx);
  if (spec.type === "spinner") return buildSpinner(spec, ctx, varIndex);
  uiLog("Unknown node type: " + spec.type, "warn");
  return null;
}

async function buildFrame(spec, ctx, varIndex) {
  const frame = figma.createFrame();
  frame.name = spec.name || "Frame";
  frame.clipsContent = false;

  if (spec.autoLayout) {
    frame.layoutMode = spec.autoLayout.direction === "vertical" ? "VERTICAL" : "HORIZONTAL";
    frame.primaryAxisAlignItems = mapAlign(spec.autoLayout.primaryAlignment);
    frame.counterAxisAlignItems = mapAlign(spec.autoLayout.counterAlignment);
    frame.primaryAxisSizingMode = "AUTO";
    frame.counterAxisSizingMode = "AUTO";
    applyPadding(frame, spec.autoLayout.padding, ctx, varIndex);
    if (spec.autoLayout.gap != null) {
      applyScalar(frame, "itemSpacing", spec.autoLayout.gap, ctx, varIndex);
    }
  }

  if (spec.size) {
    // Figma's plugin API doesn't allow binding `width`/`height` directly, so
    // we resolve token references to literals through the variable index and
    // call resize(). For auto-layout containers, also flip primary/counter
    // sizing to FIXED so the explicit value is respected.
    let w = frame.width;
    let h = frame.height;
    let setW = false, setH = false;

    if (spec.size.height != null) {
      const interp = interpolate(spec.size.height, ctx);
      if (interp !== "auto" && interp !== "fill") {
        const n = resolveLiteral(spec.size.height, ctx, varIndex);
        if (n != null) { h = n; setH = true; }
      }
    }
    if (spec.size.width != null) {
      const interp = interpolate(spec.size.width, ctx);
      if (interp !== "auto" && interp !== "fill") {
        const n = resolveLiteral(spec.size.width, ctx, varIndex);
        if (n != null) { w = n; setW = true; }
      }
    }

    if (setW || setH) {
      try { frame.resize(w, h); } catch (e) { /* swallow — may fail on root frames */ }
      if (spec.autoLayout) {
        const horizontal = spec.autoLayout.direction !== "vertical";
        if (setW) frame[horizontal ? "primaryAxisSizingMode" : "counterAxisSizingMode"] = "FIXED";
        if (setH) frame[horizontal ? "counterAxisSizingMode" : "primaryAxisSizingMode"] = "FIXED";
      }
    }
  }

  frame.fills = pickPaints(spec.fills, ctx, varIndex);

  if (spec.strokes && spec.strokes.length) {
    frame.strokes = pickPaints(spec.strokes, ctx, varIndex);
    const weightInput = spec.strokes[0].weight;
    if (weightInput != null) applyScalar(frame, "strokeWeight", weightInput, ctx, varIndex);
    frame.strokeAlign = spec.strokes[0].position === "outside" ? "OUTSIDE" : "INSIDE";
  } else {
    frame.strokes = [];
  }

  if (spec.cornerRadius != null) {
    applyScalar(frame, "cornerRadius", spec.cornerRadius, ctx, varIndex);
  }

  if (spec.opacity && (spec.opacity.appliesIf == null || evaluateCondition(spec.opacity.appliesIf, ctx))) {
    // Resolve opacity to a literal float — Figma's setBoundVariable on the
    // `opacity` field treats a 0-1 Variable value as a 0-100 percentage,
    // making 0.6 render as 0.6% (essentially invisible). Reading the resolved
    // value from the Variable and assigning it literally avoids the bug.
    let lit = 0.6; // sensible default for disabled / loading
    if (spec.opacity.variable) {
      const name = tokenName(spec.opacity.variable, ctx);
      if (name) {
        const v = varIndex.get(name);
        if (v) {
          // Drill through alias chain to a literal float in the first mode.
          const firstMode = Object.keys(v.valuesByMode || {})[0];
          let resolved = v.valuesByMode && v.valuesByMode[firstMode];
          let safety = 8;
          while (resolved && typeof resolved === "object" && resolved.type === "VARIABLE_ALIAS" && safety-- > 0) {
            const target = figma.variables.getVariableById(resolved.id);
            if (!target) break;
            const tm = Object.keys(target.valuesByMode || {})[0];
            resolved = target.valuesByMode && target.valuesByMode[tm];
          }
          if (typeof resolved === "number" && Number.isFinite(resolved)) lit = resolved;
        }
      }
    }
    try { frame.opacity = lit; } catch (e) { /* swallow */ }
  }

  if (Array.isArray(spec.children)) {
    for (const childSpec of spec.children) {
      if (childSpec.appliesIf && !evaluateCondition(childSpec.appliesIf, ctx)) continue;
      const child = await buildStructure(childSpec, ctx, varIndex);
      if (child) frame.appendChild(child);
    }
  }

  return frame;
}

async function buildText(spec, ctx, varIndex) {
  // Resolve fontFamily and fontStyle via Variables (or fall back to defaults).
  // We pre-loaded all four Inter weights at plugin start; the explicit
  // loadFontAsync below covers the unlikely case of a different family.
  let family = "Inter";
  let style = "Medium";
  if (spec.fontFamily != null) {
    const f = resolveString(spec.fontFamily, ctx, varIndex);
    if (f) family = f;
  }
  if (spec.fontWeight != null) {
    const s = resolveString(spec.fontWeight, ctx, varIndex);
    if (s) style = s;
  }
  await figma.loadFontAsync({ family, style }).catch(() => {});

  const text = figma.createText();
  text.name = spec.name || "Text";
  text.fontName = { family, style };
  text.characters = interpolate(spec.content || "", ctx) || " ";

  text.fills = pickPaints(spec.fills, ctx, varIndex);

  // Bind every supported typography axis to its underlying Variable, so a
  // token change in source/ propagates through CSS, RN, and Figma uniformly.
  const tryBindRange = (field, input) => {
    const v = variableFor(input, ctx, varIndex);
    if (!v) return false;
    try {
      text.setRangeBoundVariable(0, text.characters.length, field, v);
      return true;
    } catch (e) {
      uiLog("Can't bind " + field + " on " + text.name + ": " + e.message, "warn");
      return false;
    }
  };

  if (spec.fontFamily != null) tryBindRange("fontFamily", spec.fontFamily);
  if (spec.fontWeight != null) tryBindRange("fontStyle",  spec.fontWeight);
  if (spec.fontSize   != null) {
    if (!tryBindRange("fontSize", spec.fontSize)) {
      const n = parseFloat(interpolate(spec.fontSize, ctx));
      if (Number.isFinite(n)) text.fontSize = n;
    }
  }
  if (spec.lineHeight != null) {
    // Set the unit to PERCENT first so Figma knows how to interpret the bound
    // Variable's numeric value (our line-height tokens hold 110, 125, 150…).
    const lineNum = resolveLiteral(spec.lineHeight, ctx, varIndex);
    if (lineNum != null) {
      try { text.lineHeight = { value: lineNum, unit: "PERCENT" }; } catch (e) {}
    }
    tryBindRange("lineHeight", spec.lineHeight);
  }

  // letterSpacing tokens are em-based strings — Figma's letterSpacing wants
  // a {value, unit} struct, not a bindable scalar. Apply as a literal for now.
  if (spec.letterSpacing != null) {
    const interp = interpolate(spec.letterSpacing, ctx);
    if (typeof interp === "string" && interp.endsWith("em")) {
      const n = parseFloat(interp);
      if (Number.isFinite(n)) text.letterSpacing = { value: n * 100, unit: "PERCENT" };
    } else {
      const n = parseFloat(interp);
      if (Number.isFinite(n)) text.letterSpacing = { value: n, unit: "PIXELS" };
    }
  }

  if (spec.textDecoration === "underline") text.textDecoration = "UNDERLINE";
  if (spec.textDecoration === "strikethrough") text.textDecoration = "STRIKETHROUGH";

  return text;
}

function buildIconSlot(spec, ctx) {
  // Placeholder rectangle. Real icons get swapped in by the designer
  // post-generation using Figma's Instance Swap.
  //
  // Spec sizes like "1em" can't be resolved here (no parent font size yet),
  // so anything that doesn't parse to a sensible pixel value falls back to 16
  // — the standard small-icon size.
  const SAFE_DEFAULT = 16;
  const resolveSize = (input) => {
    if (input == null) return SAFE_DEFAULT;
    const n = parseFloat(interpolate(String(input), ctx));
    return Number.isFinite(n) && n >= 4 ? n : SAFE_DEFAULT;
  };

  const rect = figma.createRectangle();
  rect.name = spec.name || "Icon";
  const w = resolveSize(spec.size && spec.size.width);
  const h = resolveSize(spec.size && spec.size.height);
  rect.resize(w, h);
  rect.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 }, opacity: 0.2 }];
  rect.cornerRadius = 2;
  return rect;
}

function buildSpinner(spec, ctx, varIndex) {
  const ring = figma.createEllipse();
  ring.name = spec.name || "Spinner";
  ring.resize(16, 16);
  ring.fills = [];
  ring.strokes = pickPaints(spec.fills, ctx, varIndex);
  ring.strokeWeight = 2;
  ring.arcData = { startingAngle: 0, endingAngle: Math.PI * 1.5, innerRadius: 0 };
  return ring;
}

/* ---------- variant enumeration + overrides ---------- */

/** Cartesian product of variant properties. {a: [1,2], b: ['x','y']} → 4 contexts. */
function enumerateVariants(props) {
  const keys = Object.keys(props || {});
  if (keys.length === 0) return [{}];
  let out = [{}];
  for (const key of keys) {
    const next = [];
    for (const partial of out) {
      for (const value of props[key]) {
        next.push(Object.assign({}, partial, { [key]: value }));
      }
    }
    out = next;
  }
  return out;
}

/** Deep merge two objects. Arrays REPLACE (no concat). Primitives REPLACE.
 *  Used so a `variantOverride.structure.fills` cleanly replaces base fills,
 *  but `structure.autoLayout.padding.inline` overrides without losing siblings. */
function deepMerge(base, override) {
  if (override === undefined) return base;
  if (override === null) return null;
  if (Array.isArray(override)) return override;
  if (typeof override !== "object") return override;
  if (typeof base !== "object" || base === null || Array.isArray(base)) return Object.assign({}, override);
  const out = Object.assign({}, base);
  for (const k of Object.keys(override)) out[k] = deepMerge(base[k], override[k]);
  return out;
}

/** Apply every variantOverride whose `when` clause matches the context. */
function applyOverrides(structure, overrides, ctx) {
  if (!Array.isArray(overrides)) return structure;
  let merged = structure;
  for (const override of overrides) {
    const when = override.when || {};
    let matches = true;
    for (const [k, v] of Object.entries(when)) {
      if (ctx[k] !== v) { matches = false; break; }
    }
    if (matches && override.structure) merged = deepMerge(merged, override.structure);
  }
  return merged;
}

/** Encode a variant context as Figma's "prop=value, prop=value" component-name format. */
function variantName(ctx) {
  return Object.entries(ctx).map(([k, v]) => k + "=" + String(v)).join(", ");
}

/* ---------- generator entry points ---------- */

async function generateComponent(spec, varIndex) {
  uiLog("Generating " + spec.name + "…", "info");

  const pageName = spec.page || "Components / " + spec.name;
  let page = figma.root.children.find((p) => p.name === pageName);
  if (!page) {
    page = figma.createPage();
    page.name = pageName;
    uiLog("Created page: " + pageName, "muted");
  }
  if (typeof figma.setCurrentPageAsync === "function") {
    await figma.setCurrentPageAsync(page);
  } else {
    figma.currentPage = page;
  }

  // Clean up any previous run's component set / loose components named the
  // same — re-runs should be idempotent.
  for (const node of page.children.slice()) {
    if (node.name === spec.name && (node.type === "COMPONENT_SET" || node.type === "COMPONENT")) {
      node.remove();
    }
  }

  const variants = enumerateVariants(spec.variantProperties);
  uiLog("Building " + variants.length + " variant combination(s)…", "muted");

  const components = [];
  let i = 0;
  for (const ctx of variants) {
    const structure = applyOverrides(spec.structure, spec.variantOverrides, ctx);
    const root = await buildStructure(structure, ctx, varIndex);
    if (!root) continue;

    let component;
    if (typeof figma.createComponentFromNode === "function") {
      component = figma.createComponentFromNode(root);
    } else {
      component = figma.createComponent();
      component.appendChild(root);
    }
    component.name = variants.length === 1 ? spec.name : variantName(ctx);
    component.description = spec.description || "";
    components.push(component);

    i += 1;
    if (i % 50 === 0) uiLog("  · " + i + " / " + variants.length, "muted");
  }

  // Combine into a ComponentSet if there's more than one variant.
  let final;
  if (components.length > 1) {
    final = figma.combineAsVariants(components, page);
    final.name = spec.name;
    final.description = spec.description || "";
    // Lay them out in a grid so the canvas isn't a stack of overlapping nodes.
    final.layoutMode = "VERTICAL";
    final.itemSpacing = 24;
    final.paddingTop = 24; final.paddingBottom = 24;
    final.paddingLeft = 24; final.paddingRight = 24;
    final.primaryAxisSizingMode = "AUTO";
    final.counterAxisSizingMode = "AUTO";
  } else {
    final = components[0];
    page.appendChild(final);
  }

  uiLog("Done: " + spec.name + " (" + components.length + " variants)", "ok");
  return final;
}

async function generateComponents(specs) {
  const collection = figma.variables
    .getLocalVariableCollections()
    .find((c) => c.name === COLLECTION_NAME);
  if (!collection) {
    uiLog("Run 'Sync tokens' first — no '" + COLLECTION_NAME + "' Variable Collection found", "err");
    figma.ui.postMessage({ type: "generate-done" });
    return;
  }
  const varIndex = indexVariables(collection);

  for (const spec of specs) {
    try {
      const component = await generateComponent(spec, varIndex);
      if (component) figma.viewport.scrollAndZoomIntoView([component]);
    } catch (e) {
      uiLog("Error generating " + spec.name + ": " + (e && e.message ? e.message : String(e)), "err");
    }
  }
  uiLog("Generation done.", "ok");
  figma.ui.postMessage({ type: "generate-done" });
}

/* ============================================================
   TEXT STYLES
   Creates one Figma Text Style per typography role with every
   supported axis bound to the corresponding Variable. Designers
   apply "Body M" and get all five properties live-tied to tokens.
   ============================================================ */

const TYPOGRAPHY_ROLES = [
  "display-l", "display-m", "display-s",
  "heading-1", "heading-2", "heading-3", "heading-4", "heading-5", "heading-6",
  "body-l", "body-m", "body-s",
  "label-l", "label-m", "label-s",
  "caption", "code", "overline"
];

/** "display-l" → "Display L", "heading-1" → "Heading 1", "body-m" → "Body M". */
function roleDisplayName(role) {
  return role.split("-").map((part) => {
    if (/^\d+$/.test(part)) return part;
    if (part.length === 1) return part.toUpperCase();
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(" ");
}

async function syncTextStyles() {
  uiLog("Starting Text Styles sync…", "info");

  const collection = figma.variables
    .getLocalVariableCollections()
    .find((c) => c.name === COLLECTION_NAME);
  if (!collection) {
    uiLog("Run 'Sync tokens' first — no '" + COLLECTION_NAME + "' collection found", "err");
    figma.ui.postMessage({ type: "sync-text-styles-done" });
    return;
  }
  const varIndex = indexVariables(collection);

  const existingStyles = figma.getLocalTextStyles();

  let created = 0, updated = 0, skipped = 0;

  for (const role of TYPOGRAPHY_ROLES) {
    const styleName = "Typography/" + roleDisplayName(role);
    const sizeVar = varIndex.get("text/" + role + "/size");
    const lineVar = varIndex.get("text/" + role + "/line");
    const weightVar = varIndex.get("text/" + role + "/weight");
    // `code` role has its own fontFamily token (mono); everything else uses sans.
    const familyVar = role === "code"
      ? (varIndex.get("text/code/family") || varIndex.get("font-family/mono"))
      : varIndex.get("font-family/sans");

    if (!sizeVar || !weightVar || !familyVar) {
      uiLog("Skip " + styleName + " (missing Variables — re-run Sync tokens)", "warn");
      skipped += 1;
      continue;
    }

    // Resolve to literals up-front so we can load the right font before
    // creating / mutating the style. After loading, we set the bound vars.
    const family = (typeof resolveVariableValue(familyVar) === "string" ? resolveVariableValue(familyVar) : "Inter") || "Inter";
    const styleStr = (typeof resolveVariableValue(weightVar) === "string" ? resolveVariableValue(weightVar) : "Medium") || "Medium";
    const sizePx = (typeof resolveVariableValue(sizeVar) === "number" ? resolveVariableValue(sizeVar) : 14) || 14;

    await figma.loadFontAsync({ family, style: styleStr }).catch(() => {});

    let textStyle = existingStyles.find((s) => s.name === styleName);
    const isNew = !textStyle;
    if (!textStyle) {
      textStyle = figma.createTextStyle();
      textStyle.name = styleName;
    }

    // Set literal defaults first so the style has a sensible static state and
    // the lineHeight unit context (PERCENT) is established before binding.
    try { textStyle.fontName = { family, style: styleStr }; } catch (e) {}
    try { textStyle.fontSize = sizePx; } catch (e) {}
    if (lineVar) {
      const lineNum = resolveVariableValue(lineVar);
      if (typeof lineNum === "number") {
        try { textStyle.lineHeight = { value: lineNum, unit: "PERCENT" }; } catch (e) {}
      }
    }

    // Bind the underlying Variables. Wrapped individually because not every
    // Figma version exposes every binding; failures degrade gracefully.
    try { textStyle.setBoundVariable("fontFamily", familyVar); } catch (e) { uiLog("  · " + styleName + " fontFamily binding failed: " + e.message, "warn"); }
    try { textStyle.setBoundVariable("fontStyle",  weightVar); } catch (e) { uiLog("  · " + styleName + " fontStyle binding failed: " + e.message, "warn"); }
    try { textStyle.setBoundVariable("fontSize",   sizeVar);   } catch (e) { uiLog("  · " + styleName + " fontSize binding failed: "  + e.message, "warn"); }
    if (lineVar) {
      try { textStyle.setBoundVariable("lineHeight", lineVar); } catch (e) { uiLog("  · " + styleName + " lineHeight binding failed: " + e.message, "warn"); }
    }

    isNew ? (created += 1) : (updated += 1);
  }

  uiLog("Text Styles: " + created + " created, " + updated + " updated, " + skipped + " skipped.", skipped ? "warn" : "ok");
  figma.ui.postMessage({ type: "sync-text-styles-done" });
}

/* ============================================================
   FOUNDATIONS PAGES
   Builds reference pages (Color / Typography / Spacing / Radius
   & Shadow / Motion) populated with Variable-bound swatches and
   Text Style samples. Each page wipes its own root frame on
   re-runs so the output stays clean. Modes are honoured live —
   flip the file's Mode and every swatch updates.
   ============================================================ */

const FOUNDATIONS_PAGES = {
  COLOR:    "📐 Foundations / Color",
  TYPO:     "📐 Foundations / Typography",
  SPACING:  "📐 Foundations / Spacing",
  RADIUS:   "📐 Foundations / Radius & Shadow",
  MOTION:   "📐 Foundations / Motion"
};

function ensurePage(name) {
  let page = figma.root.children.find((p) => p.name === name);
  if (!page) {
    page = figma.createPage();
    page.name = name;
  }
  return page;
}

/** Remove any previous root frame this generator owns, then create a fresh
 *  vertical-auto-layout container as the new root. */
function freshRoot(page, name) {
  for (const child of page.children.slice()) {
    if (child.name === name) child.remove();
  }
  const root = figma.createFrame();
  root.name = name;
  root.layoutMode = "VERTICAL";
  root.itemSpacing = 32;
  root.paddingTop = 56; root.paddingBottom = 56;
  root.paddingLeft = 56; root.paddingRight = 56;
  root.primaryAxisSizingMode = "AUTO";
  root.counterAxisSizingMode = "AUTO";
  root.fills = [];
  page.appendChild(root);
  return root;
}

/** Make a vertical-auto-layout frame with name + gap. */
function vstack(name, gap) {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = "VERTICAL";
  f.itemSpacing = gap;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.fills = [];
  return f;
}

/** Make a horizontal-auto-layout frame with name + gap. */
function hstack(name, gap) {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = "HORIZONTAL";
  f.itemSpacing = gap;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.fills = [];
  return f;
}

/** Create a text node loaded with Inter / the given style. */
async function makeText(content, opts) {
  opts = opts || {};
  const family = opts.family || "Inter";
  const style = opts.style || "Regular";
  await figma.loadFontAsync({ family, style }).catch(() => {});
  const t = figma.createText();
  t.fontName = { family, style };
  t.characters = content;
  if (opts.size) t.fontSize = opts.size;
  if (opts.color) t.fills = [{ type: "SOLID", color: opts.color }];
  return t;
}

const GREY  = { r: 0.42, g: 0.45, b: 0.47 };
const FAINT = { r: 0.65, g: 0.67, b: 0.69 };

/** A single colour swatch — fill bound to a Variable, name + alias label below. */
async function colorSwatch(varIndex, varName, label) {
  const variable = varIndex.get(varName);
  if (!variable) return null;

  const wrap = vstack(label, 6);
  wrap.counterAxisSizingMode = "FIXED";
  wrap.resize(110, wrap.height);

  const tile = figma.createRectangle();
  tile.resize(110, 70);
  tile.cornerRadius = 6;
  tile.strokes = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0.08 }];
  tile.strokeWeight = 1;
  const paint = { type: "SOLID", color: { r: 0, g: 0, b: 0 } };
  tile.fills = [figma.variables.setBoundVariableForPaint(paint, "color", variable)];
  wrap.appendChild(tile);

  const labels = vstack("labels", 2);
  labels.appendChild(await makeText(label, { size: 10, style: "Medium" }));
  labels.appendChild(await makeText(varName, { size: 9, color: FAINT }));
  wrap.appendChild(labels);

  return wrap;
}

/* ---------- Color page ---------- */

async function buildColorPage(varIndex) {
  const page = ensurePage(FOUNDATIONS_PAGES.COLOR);
  const root = freshRoot(page, "Color tokens");

  root.appendChild(await makeText("Color", { style: "Semi Bold", size: 32 }));
  root.appendChild(await makeText(
    "Primitives are raw scales (do not consume directly). Semantic tokens describe intent and re-theme via Modes — toggle the file Mode to flip Light ↔ Dark.",
    { size: 12, color: GREY }
  ));

  // --- Primitives ---
  root.appendChild(await makeText("Primitives", { style: "Semi Bold", size: 20 }));

  const SCALE = ["50","100","200","300","400","500","600","700","800","900","950"];
  for (const family of ["neutral", "brand", "info", "success", "warning", "danger"]) {
    const familyStack = vstack(family, 8);
    familyStack.appendChild(await makeText(family, { size: 13, style: "Medium" }));
    const row = hstack(family + " row", 8);
    for (const step of SCALE) {
      const sw = await colorSwatch(varIndex, "color/" + family + "/" + step, family + "/" + step);
      if (sw) row.appendChild(sw);
    }
    familyStack.appendChild(row);
    root.appendChild(familyStack);
  }

  // Absolutes
  const absStack = vstack("absolutes", 8);
  absStack.appendChild(await makeText("absolutes", { size: 13, style: "Medium" }));
  const absRow = hstack("abs row", 8);
  for (const name of ["white", "black"]) {
    const sw = await colorSwatch(varIndex, "color/" + name, name);
    if (sw) absRow.appendChild(sw);
  }
  absStack.appendChild(absRow);
  root.appendChild(absStack);

  // --- Semantic groups ---
  root.appendChild(await makeText("Semantic", { style: "Semi Bold", size: 20 }));
  root.appendChild(await makeText("These flip per Mode. View under both Light and Dark.", { size: 11, color: GREY }));

  const SEMANTIC_GROUPS = [
    {
      title: "Surface",
      names: ["default","raised","sunken","overlay","inverse","brand","info-subtle","success-subtle","warning-subtle","danger-subtle"],
      prefix: "color/surface/"
    },
    {
      title: "Text",
      names: ["primary","secondary","tertiary","muted","disabled","inverse","on-brand","link","link-hover","success","warning","danger","info"],
      prefix: "color/text/"
    },
    {
      title: "Border",
      names: ["default","subtle","strong","focus","disabled","error","success","warning","info"],
      prefix: "color/border/"
    }
  ];
  for (const group of SEMANTIC_GROUPS) {
    const stack = vstack(group.title, 8);
    stack.appendChild(await makeText(group.title, { size: 13, style: "Medium" }));
    const row = hstack(group.title + " row", 8);
    row.layoutWrap = "WRAP";
    row.counterAxisSizingMode = "FIXED";
    row.resize(1200, row.height);
    for (const n of group.names) {
      const sw = await colorSwatch(varIndex, group.prefix + n, n);
      if (sw) row.appendChild(sw);
    }
    stack.appendChild(row);
    root.appendChild(stack);
  }

  // Action × {primary/secondary/tertiary/destructive} × {bg/bg-hover/bg-active/bg-disabled/fg}
  const ACTION_ROLES = ["primary", "secondary", "tertiary", "destructive"];
  const ACTION_SLOTS = ["bg", "bg-hover", "bg-active", "bg-disabled", "fg"];
  const actionStack = vstack("action", 12);
  actionStack.appendChild(await makeText("Action", { size: 13, style: "Medium" }));
  for (const role of ACTION_ROLES) {
    const roleRow = vstack(role, 6);
    roleRow.appendChild(await makeText(role, { size: 11, color: GREY }));
    const row = hstack(role + " row", 8);
    for (const slot of ACTION_SLOTS) {
      const sw = await colorSwatch(varIndex, "color/action/" + role + "/" + slot, slot);
      if (sw) row.appendChild(sw);
    }
    roleRow.appendChild(row);
    actionStack.appendChild(roleRow);
  }
  root.appendChild(actionStack);

  // Feedback × {info/success/warning/danger} × {bg/border/fg/icon}
  const FEEDBACK_TONES = ["info", "success", "warning", "danger"];
  const FEEDBACK_SLOTS = ["bg", "border", "fg", "icon"];
  const fbStack = vstack("feedback", 12);
  fbStack.appendChild(await makeText("Feedback", { size: 13, style: "Medium" }));
  for (const tone of FEEDBACK_TONES) {
    const row = vstack(tone, 6);
    row.appendChild(await makeText(tone, { size: 11, color: GREY }));
    const inner = hstack(tone + " row", 8);
    for (const slot of FEEDBACK_SLOTS) {
      const sw = await colorSwatch(varIndex, "color/feedback/" + tone + "/" + slot, slot);
      if (sw) inner.appendChild(sw);
    }
    row.appendChild(inner);
    fbStack.appendChild(row);
  }
  root.appendChild(fbStack);

  uiLog("  · Color page built", "muted");
}

/* ---------- Typography page ---------- */

async function buildTypographyPage(varIndex) {
  const page = ensurePage(FOUNDATIONS_PAGES.TYPO);
  const root = freshRoot(page, "Typography tokens");

  root.appendChild(await makeText("Typography", { style: "Semi Bold", size: 32 }));
  root.appendChild(await makeText(
    "Each role is a Text Style with fontFamily, fontStyle, fontSize, and lineHeight bound to Variables. Apply via Styles panel.",
    { size: 12, color: GREY }
  ));

  const styles = figma.getLocalTextStyles();

  for (const role of TYPOGRAPHY_ROLES) {
    const roleStyleName = "Typography/" + roleDisplayName(role);
    const textStyle = styles.find((s) => s.name === roleStyleName);

    const sampleText = role.startsWith("display") ? "The quick brown fox"
      : role.startsWith("heading") ? "Section heading"
      : role === "overline" ? "OVERLINE LABEL"
      : role === "code" ? "const tokens = await fetch(…);"
      : role === "caption" ? "Helper or caption text"
      : role.startsWith("label") ? "Label text"
      : "The quick brown fox jumps over the lazy dog.";

    const row = hstack(role, 24);
    row.counterAxisAlignItems = "CENTER";

    // Left: role name + style ref
    const meta = vstack(role + " meta", 4);
    meta.counterAxisSizingMode = "FIXED";
    meta.resize(160, meta.height);
    meta.appendChild(await makeText(roleDisplayName(role), { style: "Medium", size: 12 }));
    meta.appendChild(await makeText("text/" + role, { size: 10, color: FAINT }));
    row.appendChild(meta);

    // Right: sample text (with text style applied if available)
    const sample = await makeText(sampleText, { style: "Regular", size: 14 });
    if (textStyle) {
      try { sample.textStyleId = textStyle.id; } catch (e) { /* fallback to default */ }
    }
    row.appendChild(sample);

    root.appendChild(row);
  }

  uiLog("  · Typography page built", "muted");
}

/* ---------- Spacing page ---------- */

async function buildSpacingPage(varIndex) {
  const page = ensurePage(FOUNDATIONS_PAGES.SPACING);
  const root = freshRoot(page, "Spacing tokens");

  root.appendChild(await makeText("Spacing", { style: "Semi Bold", size: 32 }));
  root.appendChild(await makeText(
    "4px base scale. Use as padding (inset), gap between stacked items (stack), or gap between inline items (inline).",
    { size: 12, color: GREY }
  ));

  const STEPS = ["0", "1", "2", "3", "4", "5", "6", "8", "10", "12", "16", "20", "24", "32"];

  root.appendChild(await makeText("Primitives", { style: "Semi Bold", size: 20 }));

  const brandVar = varIndex.get("color/brand/700");
  for (const step of STEPS) {
    const variable = varIndex.get("space/" + step);
    if (!variable) continue;
    const literal = resolveVariableValue(variable);
    if (typeof literal !== "number") continue;

    const row = hstack("space-" + step, 16);
    row.counterAxisAlignItems = "CENTER";

    const name = await makeText("space/" + step, { size: 11, style: "Medium" });
    const nameWrap = figma.createFrame();
    nameWrap.layoutMode = "HORIZONTAL"; nameWrap.fills = [];
    nameWrap.primaryAxisSizingMode = "FIXED"; nameWrap.counterAxisSizingMode = "AUTO";
    nameWrap.resize(120, 16);
    nameWrap.appendChild(name);
    row.appendChild(nameWrap);

    const bar = figma.createRectangle();
    bar.resize(Math.max(literal, 1), 16);
    const fill = { type: "SOLID", color: { r: 0, g: 0, b: 0 } };
    bar.fills = brandVar
      ? [figma.variables.setBoundVariableForPaint(fill, "color", brandVar)]
      : [{ type: "SOLID", color: { r: 0.235, g: 0.380, b: 0.867 } }];
    row.appendChild(bar);

    row.appendChild(await makeText(literal + "px", { size: 11, color: GREY }));

    root.appendChild(row);
  }

  uiLog("  · Spacing page built", "muted");
}

/* ---------- Radius & Shadow page ---------- */

async function buildRadiusShadowPage(varIndex) {
  const page = ensurePage(FOUNDATIONS_PAGES.RADIUS);
  const root = freshRoot(page, "Radius & Shadow tokens");

  root.appendChild(await makeText("Radius & Shadow", { style: "Semi Bold", size: 32 }));

  // Radius
  root.appendChild(await makeText("Radius", { style: "Semi Bold", size: 20 }));
  const RADII = ["none", "xs", "sm", "md", "lg", "xl", "2xl", "full"];
  const radiusRow = hstack("radius row", 16);
  const surfaceVar = varIndex.get("color/brand/100");
  for (const r of RADII) {
    const variable = varIndex.get("radius/" + r);
    if (!variable) continue;
    const literal = resolveVariableValue(variable);
    const tile = vstack(r, 6);
    tile.counterAxisSizingMode = "FIXED"; tile.resize(96, tile.height);

    const sq = figma.createRectangle();
    sq.resize(96, 96);
    sq.cornerRadius = typeof literal === "number" ? literal : 0;
    const fill = { type: "SOLID", color: { r: 0.93, g: 0.95, b: 1 } };
    sq.fills = surfaceVar
      ? [figma.variables.setBoundVariableForPaint(fill, "color", surfaceVar)]
      : [fill];
    sq.strokes = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0.1 }];
    sq.strokeWeight = 1;
    tile.appendChild(sq);

    tile.appendChild(await makeText(r, { size: 11, style: "Medium" }));
    tile.appendChild(await makeText((literal != null ? literal + "px" : "—"), { size: 10, color: FAINT }));
    radiusRow.appendChild(tile);
  }
  root.appendChild(radiusRow);

  // Shadow (Variables don't store shadows — use raw values from the CSS layer
  // for visual reference. Update if the shadow scale changes.)
  root.appendChild(await makeText("Shadow / Elevation", { style: "Semi Bold", size: 20 }));
  const SHADOWS = [
    { name: "shadow/1 · elevation/e1", effects: [{ type: "DROP_SHADOW", color: { r: 0.067, g: 0.094, b: 0.110, a: 0.04 }, offset: { x: 0, y: 1 }, radius: 2, spread: 0, visible: true, blendMode: "NORMAL" },
                                                  { type: "DROP_SHADOW", color: { r: 0.067, g: 0.094, b: 0.110, a: 0.04 }, offset: { x: 0, y: 1 }, radius: 1, spread: 0, visible: true, blendMode: "NORMAL" }] },
    { name: "shadow/2 · elevation/e2", effects: [{ type: "DROP_SHADOW", color: { r: 0.067, g: 0.094, b: 0.110, a: 0.06 }, offset: { x: 0, y: 2 }, radius: 4, spread: 0, visible: true, blendMode: "NORMAL" },
                                                  { type: "DROP_SHADOW", color: { r: 0.067, g: 0.094, b: 0.110, a: 0.04 }, offset: { x: 0, y: 1 }, radius: 2, spread: 0, visible: true, blendMode: "NORMAL" }] },
    { name: "shadow/3 · elevation/e3", effects: [{ type: "DROP_SHADOW", color: { r: 0.067, g: 0.094, b: 0.110, a: 0.08 }, offset: { x: 0, y: 4 }, radius: 8, spread: 0, visible: true, blendMode: "NORMAL" },
                                                  { type: "DROP_SHADOW", color: { r: 0.067, g: 0.094, b: 0.110, a: 0.04 }, offset: { x: 0, y: 2 }, radius: 4, spread: 0, visible: true, blendMode: "NORMAL" }] },
    { name: "shadow/4 · elevation/e4", effects: [{ type: "DROP_SHADOW", color: { r: 0.067, g: 0.094, b: 0.110, a: 0.10 }, offset: { x: 0, y: 8 }, radius: 16, spread: 0, visible: true, blendMode: "NORMAL" },
                                                  { type: "DROP_SHADOW", color: { r: 0.067, g: 0.094, b: 0.110, a: 0.06 }, offset: { x: 0, y: 4 }, radius: 8, spread: 0, visible: true, blendMode: "NORMAL" }] },
    { name: "shadow/5 · elevation/e5", effects: [{ type: "DROP_SHADOW", color: { r: 0.067, g: 0.094, b: 0.110, a: 0.14 }, offset: { x: 0, y: 16 }, radius: 32, spread: 0, visible: true, blendMode: "NORMAL" },
                                                  { type: "DROP_SHADOW", color: { r: 0.067, g: 0.094, b: 0.110, a: 0.08 }, offset: { x: 0, y: 8 }, radius: 16, spread: 0, visible: true, blendMode: "NORMAL" }] }
  ];
  const shadowRow = hstack("shadow row", 24);
  for (const s of SHADOWS) {
    const tile = vstack(s.name, 8);
    tile.counterAxisSizingMode = "FIXED"; tile.resize(140, tile.height);
    tile.paddingTop = 16; tile.paddingBottom = 16; tile.paddingLeft = 16; tile.paddingRight = 16;

    const card = figma.createRectangle();
    card.resize(120, 80);
    card.cornerRadius = 8;
    card.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    card.effects = s.effects;
    tile.appendChild(card);

    tile.appendChild(await makeText(s.name, { size: 10, color: FAINT }));
    shadowRow.appendChild(tile);
  }
  root.appendChild(shadowRow);

  uiLog("  · Radius & Shadow page built", "muted");
}

/* ---------- Motion page ---------- */

async function buildMotionPage(varIndex) {
  const page = ensurePage(FOUNDATIONS_PAGES.MOTION);
  const root = freshRoot(page, "Motion tokens");

  root.appendChild(await makeText("Motion", { style: "Semi Bold", size: 32 }));
  root.appendChild(await makeText(
    "Durations and easings used across transitions. Figma can't animate these statically — values listed below for engineering reference.",
    { size: 12, color: GREY }
  ));

  // Durations
  root.appendChild(await makeText("Durations", { style: "Semi Bold", size: 20 }));
  const DURATIONS = [
    ["instant", "0ms",   "Imperceptible — used to disable motion when prefers-reduced-motion is set."],
    ["fast",    "100ms", "Micro-interactions: hovers, button feedback."],
    ["base",    "200ms", "Default — most UI transitions (default → hover, mode flips)."],
    ["slow",    "300ms", "Larger surfaces: modals, drawers entering."],
    ["slower",  "500ms", "Page-level transitions, large reveals."]
  ];
  for (const [name, val, desc] of DURATIONS) {
    const row = hstack(name, 16);
    row.counterAxisAlignItems = "CENTER";
    const left = vstack(name + " meta", 2);
    left.counterAxisSizingMode = "FIXED"; left.resize(220, left.height);
    left.appendChild(await makeText("duration/" + name, { size: 12, style: "Medium" }));
    left.appendChild(await makeText(val, { size: 11, color: FAINT }));
    row.appendChild(left);
    row.appendChild(await makeText(desc, { size: 12, color: GREY }));
    root.appendChild(row);
  }

  // Easings
  root.appendChild(await makeText("Easings", { style: "Semi Bold", size: 20 }));
  const EASINGS = [
    ["linear",   "linear",                            "Constant rate. Use only for progress / load indicators."],
    ["in",       "cubic-bezier(0.4, 0, 1, 1)",        "Accelerates. Use for things leaving the screen."],
    ["out",      "cubic-bezier(0, 0, 0.2, 1)",        "Decelerates. Use for things entering the screen."],
    ["in-out",   "cubic-bezier(0.4, 0, 0.2, 1)",      "Default — most state transitions."],
    ["spring",   "cubic-bezier(0.5, 1.5, 0.5, 1)",    "Slight overshoot. Use sparingly for delight."]
  ];
  for (const [name, val, desc] of EASINGS) {
    const row = hstack(name, 16);
    row.counterAxisAlignItems = "CENTER";
    const left = vstack(name + " meta", 2);
    left.counterAxisSizingMode = "FIXED"; left.resize(220, left.height);
    left.appendChild(await makeText("ease/" + name, { size: 12, style: "Medium" }));
    left.appendChild(await makeText(val, { size: 10, color: FAINT, family: "Inter" }));
    row.appendChild(left);
    row.appendChild(await makeText(desc, { size: 12, color: GREY }));
    root.appendChild(row);
  }

  uiLog("  · Motion page built", "muted");
}

/* ---------- entry point ---------- */

async function generateFoundations() {
  const collection = figma.variables.getLocalVariableCollections().find((c) => c.name === COLLECTION_NAME);
  if (!collection) {
    uiLog("Run 'Sync tokens' first — no '" + COLLECTION_NAME + "' collection found", "err");
    figma.ui.postMessage({ type: "foundations-done" });
    return;
  }
  const varIndex = indexVariables(collection);

  uiLog("Building Foundations pages…", "info");

  await buildColorPage(varIndex);
  await buildTypographyPage(varIndex);
  await buildSpacingPage(varIndex);
  await buildRadiusShadowPage(varIndex);
  await buildMotionPage(varIndex);

  uiLog("Foundations done.", "ok");
  figma.ui.postMessage({ type: "foundations-done" });
}

/* ---------- PAT — clientStorage ---------- */

/* ============================================================
   DIFF — compare repo JSON to the live "Design System" collection
   ============================================================ */

/** Repo JSON rgba/hex string → lowercase #rrggbb[aa] */
function normalizeRepoColorStr(str) {
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

/** Figma RGBA {r,g,b,a} (0–1 floats) → lowercase #rrggbb[aa] */
function normalizeFigmaColorRGBA(rgba) {
  if (!rgba || typeof rgba.r !== "number") return null;
  const r = Math.round(rgba.r * 255).toString(16).padStart(2, "0");
  const g = Math.round(rgba.g * 255).toString(16).padStart(2, "0");
  const b = Math.round(rgba.b * 255).toString(16).padStart(2, "0");
  const a = rgba.a != null ? rgba.a : 1;
  if (Math.abs(a - 1) < 0.004) return "#" + r + g + b;
  return "#" + r + g + b + Math.round(a * 255).toString(16).padStart(2, "0");
}

/** Figma value (any mode value) → comparable string. Aliases become "alias:<name>". */
function normalizeFigmaValStr(raw, type) {
  if (raw && typeof raw === "object" && raw.type === "VARIABLE_ALIAS") {
    const t = figma.variables.getVariableById(raw.id);
    return "alias:" + (t ? t.name : "?");
  }
  if (type === "COLOR") return normalizeFigmaColorRGBA(raw) || String(raw);
  return String(raw != null ? raw : "");
}

/** Repo {value|alias} entry → comparable string. */
function normalizeRepoValStr(entry, type) {
  if (!entry) return "";
  if (entry.alias) return "alias:" + entry.alias;
  if (type === "COLOR") return normalizeRepoColorStr(entry.value);
  return String(entry.value != null ? entry.value : "");
}

/** Human-readable display label for a Figma value. */
function figmaValLabel(raw, type) {
  if (raw && typeof raw === "object" && raw.type === "VARIABLE_ALIAS") {
    const t = figma.variables.getVariableById(raw.id);
    return "→ " + (t ? t.name : "?");
  }
  if (type === "COLOR") return normalizeFigmaColorRGBA(raw) || "?";
  return String(raw != null ? raw : "—");
}

/** Human-readable display label for a repo value entry. */
function repoValLabel(entry, type) {
  if (!entry) return "—";
  if (entry.alias) return "→ " + entry.alias;
  if (type === "COLOR") return normalizeRepoColorStr(entry.value);
  return String(entry.value != null ? entry.value : "—");
}

/**
 * Diff the repo JSON against the live Figma "Design System" collection.
 * Returns { modeMap, unmatchedFigmaModes, added, changed, removed } or { error }.
 */
function computeDiff(repoData, collection) {
  if (!collection) {
    return { error: "No '" + COLLECTION_NAME + "' Variable Collection found — run Sync Tokens first." };
  }

  // Mode mapping: repo mode name → figma modeId (by matching display names).
  const figmaModeByName = new Map(collection.modes.map(m => [m.name, m.modeId]));
  const modeMap = repoData.modes.map(rm => ({
    repoId:  rm.id,
    name:    rm.name,
    figmaId: figmaModeByName.get(rm.name) || null,
    matched: figmaModeByName.has(rm.name),
  }));
  const matchedNames = new Set(modeMap.filter(m => m.matched).map(m => m.name));
  const unmatchedFigmaModes = collection.modes.filter(m => !matchedNames.has(m.name)).map(m => m.name);

  // Index Figma variables in this collection.
  const figmaByName = new Map();
  for (const v of figma.variables.getLocalVariables()) {
    if (v.variableCollectionId === collection.id) figmaByName.set(v.name, v);
  }

  const repoNames = new Set(repoData.variables.map(v => v.name));
  const added = [], changed = [], removed = [];

  // Added: in repo, not in Figma.
  for (const rv of repoData.variables) {
    if (figmaByName.has(rv.name)) continue;
    const preview = {};
    for (const mm of modeMap) {
      if (!mm.matched) continue;
      const e = rv.values[mm.repoId];
      if (!e) continue;
      const isColor = rv.type === "COLOR" && !e.alias;
      preview[mm.name] = { label: repoValLabel(e, rv.type), isColor, hex: isColor ? normalizeRepoColorStr(e.value) : null };
    }
    added.push({ name: rv.name, type: rv.type, preview });
  }

  // Removed: in Figma, not in repo.
  for (const [name, fv] of figmaByName) {
    if (!repoNames.has(name)) removed.push({ name, type: fv.resolvedType });
  }

  // Changed: in both — compare per matched mode.
  for (const rv of repoData.variables) {
    const fv = figmaByName.get(rv.name);
    if (!fv) continue;
    const modeChanges = [];
    for (const mm of modeMap) {
      if (!mm.matched) continue;
      const repoEntry = rv.values[mm.repoId];
      const figmaRaw  = fv.valuesByMode[mm.figmaId];
      if (!repoEntry || figmaRaw === undefined) continue;

      const rStr = normalizeRepoValStr(repoEntry, rv.type);
      const fStr = normalizeFigmaValStr(figmaRaw, rv.type);
      if (rStr === fStr) continue;

      const isAlias = !!(repoEntry.alias || (figmaRaw && figmaRaw.type === "VARIABLE_ALIAS"));
      modeChanges.push({
        modeName:    mm.name,
        repoModeId:  mm.repoId,
        figmaModeId: mm.figmaId,
        figmaStr:    fStr,   // hex or "alias:…"
        repoStr:     rStr,   // hex or "alias:…"
        figmaLabel:  figmaValLabel(figmaRaw, rv.type),
        repoLabel:   repoValLabel(repoEntry, rv.type),
        isColor:     rv.type === "COLOR" && !isAlias,
        isAlias,
      });
    }
    if (modeChanges.length) changed.push({ name: rv.name, type: rv.type, modeChanges });
  }

  return { modeMap, unmatchedFigmaModes, added, changed, removed };
}

/* ============================================================
   PULL — 3-way preview + apply
   ============================================================ */

const BASE_KEY = "kijani.base";

// Stash repoData between compute-pull-preview and apply-pull so the UI
// doesn't have to re-send the full JSON payload.
let pendingPullData = null;

/**
 * Decide how Figma modes should be reconciled to match the 6 repo modes.
 *
 * Legacy name → target name mappings handle the old density modes and the
 * previous 2-mode ("Light" / "Dark") state from before PR #28.
 *
 * Returns { toRename, toAdd, toRemove } where each entry is enough info to
 * drive the Figma API calls and the preview UI.
 */
function planModeReconciliation(existingModes, desiredModes) {
  const LEGACY = {
    "Light":               "Light · Web",
    "Dark":                "Dark · Web",
    "Light · Compact":     "Light · Web",
    "Dark · Compact":      "Dark · Web",
    "Light · Comfortable": "Light · Web",
    "Dark · Comfortable":  "Dark · Web",
  };

  const desiredNames = new Set(desiredModes.map(m => m.name));
  const alreadyCorrect = new Set(existingModes.filter(m => desiredNames.has(m.name)).map(m => m.name));

  const toRename = [];
  const usedTargets = new Set(alreadyCorrect);
  const toRemove = [];

  for (const em of existingModes) {
    if (alreadyCorrect.has(em.name)) continue;
    const target = LEGACY[em.name];
    if (target && desiredNames.has(target) && !usedTargets.has(target)) {
      toRename.push({ fromName: em.name, toName: target, modeId: em.modeId });
      usedTargets.add(target);
    } else {
      toRemove.push({ name: em.name, modeId: em.modeId });
    }
  }

  const toAdd = desiredModes
    .filter(m => !usedTargets.has(m.name))
    .map(m => m.name);

  return { toRename, toAdd, toRemove };
}

/**
 * Compute a 3-way pull preview.
 *
 * Base = last-applied repo snapshot (clientStorage["kijani.base"]).
 * Figma = current Figma variable values.
 * Repo  = current repo JSON.
 *
 * Verdict per (variable, mode):
 *   "repo-wins"  — apply repo value (no conflict or no base)
 *   "figma-wins" — repo unchanged since base, Figma has a local edit → skip
 *   "conflict"   — both sides changed since base → user must pick
 */
async function computePullPreview(repoData) {
  const collection = figma.variables.getLocalVariableCollections()
    .find(c => c.name === COLLECTION_NAME);
  if (!collection) {
    return { error: "No '" + COLLECTION_NAME + "' collection found — run Sync Tokens first." };
  }

  const diff = computeDiff(repoData, collection);
  if (diff.error) return { error: diff.error };

  let baseData = null;
  try { baseData = await figma.clientStorage.getAsync(BASE_KEY); } catch (_) {}

  // Index base variables by name → {repoModeId → normalizedStr}
  const baseIndex = new Map();
  if (baseData && Array.isArray(baseData.variables)) {
    for (const bv of baseData.variables) {
      const modeMap = {};
      for (const [modeId, entry] of Object.entries(bv.values)) {
        modeMap[modeId] = normalizeRepoValStr(entry, bv.type);
      }
      baseIndex.set(bv.name, modeMap);
    }
  }

  const modeRecon = planModeReconciliation(collection.modes, repoData.modes);

  const autoApply = [], figmaWins = [], conflicts = [];

  for (const item of diff.changed) {
    for (const mc of item.modeChanges) {
      let verdict;
      if (!baseData) {
        verdict = "repo-wins";
      } else {
        const baseModes = baseIndex.get(item.name) || {};
        const baseStr   = baseModes[mc.repoModeId];
        const figmaChanged = !baseStr || mc.figmaStr !== baseStr;
        const repoChanged  = !baseStr || mc.repoStr  !== baseStr;
        if (figmaChanged && repoChanged) verdict = "conflict";
        else if (!figmaChanged)          verdict = "repo-wins";
        else                             verdict = "figma-wins";
      }
      const entry = { name: item.name, type: item.type, ...mc, verdict };
      if (verdict === "conflict")    conflicts.push(entry);
      else if (verdict === "figma-wins") figmaWins.push(entry);
      else                           autoApply.push(entry);
    }
  }

  return {
    diff,
    modeRecon,
    conflicts,
    autoApply,
    figmaWins,
    hasBase: !!baseData,
    summary: {
      added:       diff.added.length,
      autoApply:   autoApply.length,
      figmaWins:   figmaWins.length,
      conflicts:   conflicts.length,
      removed:     diff.removed.length,
      modeChanges: modeRecon.toRename.length + modeRecon.toAdd.length + modeRecon.toRemove.length,
    },
  };
}

/**
 * Apply a pull to the Figma document.
 *
 * @param {object} repoData     Parsed tokens.figma-variables.json
 * @param {object} resolutions  { "varname:repoModeId": "repo"|"figma" } for conflicts
 */
async function applyPull(repoData, resolutions) {
  const collection = figma.variables.getLocalVariableCollections()
    .find(c => c.name === COLLECTION_NAME);
  if (!collection) {
    uiLog("No '" + COLLECTION_NAME + "' collection — run Sync Tokens first.", "err");
    figma.ui.postMessage({ type: "pull-done" });
    return;
  }

  // Step 1: reconcile modes ---------------------------------------------------
  uiLog("Reconciling modes…", "muted");
  const recon = planModeReconciliation(collection.modes, repoData.modes);

  for (const r of recon.toRename) {
    try { collection.renameMode(r.modeId, r.toName); uiLog("Renamed '" + r.fromName + "' → '" + r.toName + "'", "muted"); }
    catch (e) { uiLog("Could not rename '" + r.fromName + "': " + e.message, "warn"); }
  }
  for (const name of recon.toAdd) {
    try { collection.addMode(name); uiLog("Added mode: " + name, "ok"); }
    catch (e) { uiLog("Could not add '" + name + "': " + e.message, "warn"); }
  }
  // Remove stale modes (re-read after renames/adds in case modeId list shifted).
  const desiredNames = new Set(repoData.modes.map(m => m.name));
  for (const m of [...collection.modes]) {
    if (!desiredNames.has(m.name)) {
      try { collection.removeMode(m.modeId); uiLog("Removed stale mode: " + m.name, "muted"); }
      catch (e) { uiLog("Could not remove '" + m.name + "': " + e.message, "warn"); }
    }
  }

  // Step 2: build mode id map after reconciliation ----------------------------
  const modeByName = new Map(collection.modes.map(m => [m.name, m.modeId]));
  const modeIdMap  = new Map(); // repoModeId → figmaModeId
  for (const rm of repoData.modes) {
    const fId = modeByName.get(rm.name);
    if (fId) modeIdMap.set(rm.id, fId);
  }

  // Step 3: apply variables ---------------------------------------------------
  uiLog("Applying values…", "muted");
  const varIndex = indexVariables(collection);
  let applied = 0, skipped = 0, pass1Failures = 0;

  // Pass 1: literal values
  for (const rv of repoData.variables) {
    const v = ensureVariable(rv.name, rv.type, collection, varIndex);
    if (!v) continue;
    for (const [repoModeId, entry] of Object.entries(rv.values)) {
      const figmaModeId = modeIdMap.get(repoModeId);
      if (!figmaModeId || entry.value === undefined) continue;
      // Honour conflict resolution: "figma" means keep Figma value.
      if ((resolutions[rv.name + ":" + repoModeId] || "repo") === "figma") { skipped++; continue; }
      try { applyValue(v, figmaModeId, entry, rv.type, varIndex); applied++; }
      catch (e) { if (++pass1Failures <= 5) uiLog("Set failed " + rv.name + ": " + e.message, "warn"); }
    }
  }
  uiLog("Pass 1: " + applied + " values applied" + (pass1Failures ? " (" + pass1Failures + " failures)" : "") + (skipped ? ", " + skipped + " kept as Figma" : ""), pass1Failures ? "warn" : "ok");

  // Pass 2: alias values
  let aliases = 0, aliasFail = 0;
  for (const rv of repoData.variables) {
    const v = varIndex.get(rv.name);
    if (!v) continue;
    for (const [repoModeId, entry] of Object.entries(rv.values)) {
      const figmaModeId = modeIdMap.get(repoModeId);
      if (!figmaModeId || !entry.alias) continue;
      if ((resolutions[rv.name + ":" + repoModeId] || "repo") === "figma") continue;
      try { applyValue(v, figmaModeId, entry, rv.type, varIndex); aliases++; }
      catch (e) { aliasFail++; }
    }
  }
  uiLog("Pass 2: " + aliases + " aliases set" + (aliasFail ? " (" + aliasFail + " failures)" : ""), aliasFail ? "warn" : "ok");

  // Step 4: store new base snapshot -------------------------------------------
  try {
    await figma.clientStorage.setAsync(BASE_KEY, repoData);
    uiLog("Base snapshot saved (future pulls will detect Figma edits since now).", "muted");
  } catch (e) { uiLog("Could not save base: " + e.message, "warn"); }

  const totalApplied = applied + aliases - skipped;
  uiLog("Pull complete — " + totalApplied + " values written.", "ok");
  figma.ui.postMessage({ type: "pull-done", totalApplied, skipped });
}

const PAT_KEY = "kijani.pat";

/** Load the PAT from clientStorage on startup and send it to the UI. */
async function loadPat() {
  try {
    const pat = await figma.clientStorage.getAsync(PAT_KEY);
    figma.ui.postMessage({ type: "pat-loaded", pat: pat || null });
  } catch (e) {
    figma.ui.postMessage({ type: "pat-loaded", pat: null });
  }
}

/* ---------- message router ---------- */

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === "compute-diff") {
      const col = figma.variables.getLocalVariableCollections().find(c => c.name === COLLECTION_NAME);
      const result = computeDiff(msg.repoData, col);
      figma.ui.postMessage({ type: "diff-result", result });
    } else if (msg.type === "compute-pull-preview") {
      pendingPullData = msg.repoData;
      const preview = await computePullPreview(msg.repoData);
      figma.ui.postMessage({ type: "pull-preview", preview });
    } else if (msg.type === "apply-pull") {
      if (!pendingPullData) {
        uiLog("No pending pull data — re-fetch tokens first.", "err");
        figma.ui.postMessage({ type: "pull-done" });
      } else {
        await applyPull(pendingPullData, msg.resolutions || {});
        pendingPullData = null;
      }
    } else if (msg.type === "get-pat") {
      await loadPat();
    } else if (msg.type === "set-pat") {
      // msg.pat arrives from the UI — store it, then send it back so the UI
      // can update activePat and the status indicator.
      await figma.clientStorage.setAsync(PAT_KEY, msg.pat);
      figma.ui.postMessage({ type: "pat-saved", pat: msg.pat });
    } else if (msg.type === "sync-tokens") {
      await fontsReady;
      syncTokens(msg.data);
    } else if (msg.type === "sync-text-styles") {
      await fontsReady;
      await syncTextStyles();
    } else if (msg.type === "generate-components") {
      await fontsReady;
      await generateComponents(msg.specs);
    } else if (msg.type === "generate-foundations") {
      await fontsReady;
      await generateFoundations();
    } else {
      uiLog("Unknown message: " + msg.type, "warn");
    }
  } catch (e) {
    const msg2 = (e && e.message) ? e.message : String(e);
    uiLog("Plugin error [" + (msg.type || "?") + "]: " + msg2, "err");
    console.error("Figma plugin error:", e);
    uiDone();
  }
};
