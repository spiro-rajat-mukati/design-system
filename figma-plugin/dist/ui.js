window.addEventListener("error", (e) => {
  try {
    const logEl2 = document.getElementById("log");
    if (logEl2) {
      const line = document.createElement("div");
      line.className = "line err";
      line.textContent = "Script error: " + (e.message || String(e));
      logEl2.appendChild(line);
      logEl2.scrollTop = logEl2.scrollHeight;
    }
  } catch (_) {
  }
});
window.addEventListener("unhandledrejection", (e) => {
  try {
    const logEl2 = document.getElementById("log");
    if (logEl2) {
      const msg = e.reason && e.reason.message ? e.reason.message : String(e.reason);
      const line = document.createElement("div");
      line.className = "line err";
      line.textContent = "Unhandled error: " + msg;
      logEl2.appendChild(line);
      logEl2.scrollTop = logEl2.scrollHeight;
    }
  } catch (_) {
  }
});
const REPO = "spiro-rajat-mukati/design-system";
const BRANCH = "main";
const SPECS = [
  "Button",
  "Badge",
  "ButtonGroup",
  "Field",
  "TextInput",
  "Textarea",
  "NumericInput",
  "Radio",
  "Checkbox",
  "Tag",
  "Toast",
  "Tabs",
  "Select",
  "MultiSelect",
  "Menu",
  "ProgressBar"
];
let activePat = null;
let pullPreviewCache = null;
const logEl = document.getElementById("log");
function log(msg, kind) {
  const empty = logEl.querySelector(".empty");
  if (empty) empty.remove();
  const line = document.createElement("div");
  line.className = "line " + (kind || "info");
  line.textContent = msg;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}
function updatePatStatus(hasPat) {
  const el = document.getElementById("pat-status");
  el.innerHTML = hasPat ? '<strong>PAT:</strong> <span class="pat-ok">\u2713 stored</span>' : '<strong>PAT:</strong> <span class="pat-err">not set \u2014 open PAT Settings below</span>';
  if (!hasPat) document.getElementById("pat-settings").open = true;
}
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
async function ghFetch(repoPath) {
  if (!activePat) throw new Error("No PAT \u2014 enter it in PAT Settings");
  const url = "https://api.github.com/repos/" + REPO + "/contents/" + repoPath + "?ref=" + BRANCH;
  const resp = await fetch(url, {
    cache: "no-store",
    headers: {
      "Authorization": "Bearer " + activePat,
      "Accept": "application/vnd.github.raw+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error("GitHub API " + resp.status + " for " + repoPath + (body ? ": " + body.slice(0, 100) : ""));
  }
  return resp.json();
}
async function ghFetchMeta(repoPath, ref) {
  if (!activePat) throw new Error("No PAT \u2014 enter it in PAT Settings");
  const url = "https://api.github.com/repos/" + REPO + "/contents/" + repoPath + (ref ? "?ref=" + ref : "");
  const resp = await fetch(url, {
    cache: "no-store",
    headers: {
      "Authorization": "Bearer " + activePat,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    if (resp.status === 403) throw new Error("PAT lacks required scope. Push needs Contents: Write + Pull Requests: Write. GitHub said: " + body.slice(0, 120));
    if (resp.status === 404) return null;
    throw new Error("GitHub " + resp.status + " for " + repoPath + (body ? ": " + body.slice(0, 100) : ""));
  }
  return resp.json();
}
const ALL_BTNS = ["sync-tokens", "btn-diff", "btn-pull", "btn-push", "sync-text-styles", "ensure-text-styles", "generate-foundations", "generate-components", "save-pat"];
function setBusy(busy) {
  for (const id of ALL_BTNS) {
    const el = document.getElementById(id);
    if (el) el.disabled = busy;
  }
}
function shortMode(name) {
  return name.replace(" \xB7 ", "\xB7").replace("Web", "W").replace("Android", "And");
}
function renderSwatch(hex) {
  return '<span class="swatch" style="background:' + hex + '"></span>';
}
function renderModeChange(mc) {
  let html = '<div class="mode-change">';
  html += '<span class="mode-lbl">' + esc(shortMode(mc.modeName)) + "</span> ";
  if (mc.isColor) {
    html += '<span class="val-old">' + renderSwatch(mc.figmaStr) + esc(mc.figmaLabel) + "</span>";
    html += '<span class="val-arr">\u2192</span>';
    html += renderSwatch(mc.repoStr) + esc(mc.repoLabel);
  } else {
    html += '<span class="val-old"><code>' + esc(mc.figmaLabel) + "</code></span>";
    html += '<span class="val-arr">\u2192</span>';
    html += "<code>" + esc(mc.repoLabel) + "</code>";
  }
  html += "</div>";
  return html;
}
function renderDiff(result) {
  if (result.error) return '<div class="panel-error">' + esc(result.error) + "</div>";
  const { modeMap, unmatchedFigmaModes, added, changed, removed } = result;
  const matched = modeMap.filter((m) => m.matched).length;
  let html = "";
  html += '<div class="diff-summary">';
  if (!changed.length && !added.length && !removed.length) {
    html += '<span class="pill ok">\u2713 Figma is in sync with the repo</span>';
  } else {
    if (changed.length) html += '<span class="pill changed">' + changed.length + " changed</span>";
    if (added.length) html += '<span class="pill added">' + added.length + " added</span>";
    if (removed.length) html += '<span class="pill removed">' + removed.length + " removed</span>";
  }
  html += "</div>";
  const unmatchedRepo = modeMap.filter((m) => !m.matched).map((m) => m.name);
  html += '<div class="diff-modes">';
  html += "Modes matched: <strong>" + matched + " / " + modeMap.length + "</strong>";
  if (unmatchedRepo.length) html += " \xB7 Repo-only: " + unmatchedRepo.map((n) => "<em>" + esc(n) + "</em>").join(", ");
  if (unmatchedFigmaModes.length) html += " \xB7 Figma-only: " + unmatchedFigmaModes.map((n) => "<em>" + esc(n) + "</em>").join(", ");
  html += "</div>";
  if (!changed.length && !added.length && !removed.length) return html;
  if (changed.length) {
    html += '<div class="diff-stitle">Changed (' + changed.length + ")</div>";
    const show = changed.slice(0, 60);
    for (const item of show) {
      html += '<div class="diff-row">';
      html += '<div class="var-name changed">' + esc(item.name) + "</div>";
      for (const mc of item.modeChanges.slice(0, 4)) html += renderModeChange(mc);
      if (item.modeChanges.length > 4) html += '<div class="mode-change diff-more">+' + (item.modeChanges.length - 4) + " more modes</div>";
      html += "</div>";
    }
    if (changed.length > 60) html += '<div class="diff-more">\u2026 ' + (changed.length - 60) + " more</div>";
  }
  if (added.length) {
    html += '<details class="diff-collapse"><summary>Added in repo, not in Figma (' + added.length + ")</summary>";
    for (const item of added.slice(0, 40)) {
      html += '<div class="diff-row"><div class="var-name added">' + esc(item.name) + "</div>";
      for (const [modeName, v] of Object.entries(item.preview).slice(0, 2)) {
        html += '<div class="mode-change"><span class="mode-lbl">' + esc(shortMode(modeName)) + "</span> ";
        if (v.isColor && v.hex) html += renderSwatch(v.hex);
        html += esc(v.label) + "</div>";
      }
      html += "</div>";
    }
    if (added.length > 40) html += '<div class="diff-more">\u2026 ' + (added.length - 40) + " more</div>";
    html += "</details>";
  }
  if (removed.length) {
    html += '<details class="diff-collapse"><summary>In Figma, not in repo (' + removed.length + ") \u2014 Pull will not delete these</summary>";
    for (const item of removed.slice(0, 40)) {
      html += '<div class="diff-row"><div class="var-name removed">' + esc(item.name) + "</div></div>";
    }
    if (removed.length > 40) html += '<div class="diff-more">\u2026 ' + (removed.length - 40) + " more</div>";
    html += "</details>";
  }
  return html;
}
function renderModeRecon(recon) {
  const { toRename, toAdd, toRemove } = recon;
  const total = toRename.length + toAdd.length + toRemove.length;
  if (total === 0) {
    return '<div class="pull-section"><div class="pull-section-title">Mode reconciliation</div><div class="mode-recon-item"><span class="mode-badge ok">\u2713</span> Collection already has all 6 correct modes</div></div>';
  }
  let html = '<div class="pull-section"><div class="pull-section-title">Mode reconciliation (' + total + " change" + (total > 1 ? "s" : "") + ")</div>";
  for (const r of toRename) {
    html += '<div class="mode-recon-item"><span class="mode-badge rename">rename</span> <span>' + esc(r.fromName) + " \u2192 " + esc(r.toName) + "</span></div>";
  }
  for (const name of toAdd) {
    html += '<div class="mode-recon-item"><span class="mode-badge add">add</span> <span>' + esc(name) + "</span></div>";
  }
  for (const r of toRemove) {
    html += '<div class="mode-recon-item"><span class="mode-badge remove">remove</span> <span>' + esc(r.name) + "</span></div>";
  }
  html += "</div>";
  return html;
}
function renderConflictCard(conflict, idx) {
  const key = esc(conflict.name + ":" + conflict.repoModeId);
  const isColor = conflict.isColor;
  const figmaDesc = isColor ? '<span style="display:inline-flex;align-items:center;gap:3px">' + renderSwatch(conflict.figmaStr) + esc(conflict.figmaLabel) + "</span>" : "<code>" + esc(conflict.figmaLabel) + "</code>";
  const repoDesc = isColor ? '<span style="display:inline-flex;align-items:center;gap:3px">' + renderSwatch(conflict.repoStr) + esc(conflict.repoLabel) + "</span>" : "<code>" + esc(conflict.repoLabel) + "</code>";
  return '<div class="conflict-card"><div class="conflict-name">' + esc(conflict.name) + '</div><div class="conflict-mode">Mode: ' + esc(conflict.modeName) + '</div><div class="conflict-radios"><label class="conflict-radio"><input type="radio" name="conflict_' + idx + '" value="repo" data-key="' + key + '" checked /><span><strong>Repo</strong> \u2192 ' + repoDesc + '</span></label><label class="conflict-radio"><input type="radio" name="conflict_' + idx + '" value="figma" data-key="' + key + '" /><span><strong>Keep Figma</strong> \u2192 ' + figmaDesc + "</span></label></div></div>";
}
function renderPullPreview(preview) {
  if (preview.error) return '<div class="panel-error">' + esc(preview.error) + "</div>";
  const { modeRecon, conflicts, autoApply, figmaWins, summary, hasBase } = preview;
  let html = "";
  html += '<div class="pull-summary-pills">';
  if (!hasBase) html += '<span class="pill muted-pill" title="No prior sync found \u2014 all repo values will be applied without conflict detection">First sync \u2014 no base</span>';
  if (summary.modeChanges) html += '<span class="pill changed">' + summary.modeChanges + " mode change" + (summary.modeChanges > 1 ? "s" : "") + "</span>";
  if (summary.autoApply) html += '<span class="pill added">' + summary.autoApply + " auto-apply</span>";
  if (summary.conflicts) html += '<span class="pill conflict">' + summary.conflicts + " conflict" + (summary.conflicts > 1 ? "s" : "") + "</span>";
  if (summary.figmaWins) html += '<span class="pill muted-pill">' + summary.figmaWins + " Figma-wins (skip)</span>";
  if (summary.added) html += '<span class="pill added">' + summary.added + " new variable" + (summary.added > 1 ? "s" : "") + "</span>";
  if (summary.removed) html += '<span class="pill removed">' + summary.removed + " Figma-only (kept)</span>";
  html += "</div>";
  html += renderModeRecon(modeRecon);
  if (conflicts.length) {
    html += '<div class="pull-section">';
    html += '<div class="pull-section-title">Conflicts \u2014 choose which value to keep (' + conflicts.length + ")</div>";
    conflicts.forEach((c, i) => {
      html += renderConflictCard(c, i);
    });
    html += "</div>";
  }
  if (autoApply.length) {
    html += '<details class="diff-collapse pull-section"><summary>Auto-applying (' + autoApply.length + " mode-values)</summary>";
    for (const item of autoApply.slice(0, 60)) {
      html += '<div class="diff-row">';
      html += '<div class="var-name changed">' + esc(item.name) + "</div>";
      html += renderModeChange(item);
      html += "</div>";
    }
    if (autoApply.length > 60) html += '<div class="diff-more">\u2026 ' + (autoApply.length - 60) + " more</div>";
    html += "</details>";
  }
  if (figmaWins.length) {
    html += '<details class="diff-collapse pull-section"><summary>Figma-wins \u2014 skipping (' + figmaWins.length + ")</summary>";
    for (const item of figmaWins.slice(0, 40)) {
      html += '<div class="diff-row"><div class="var-name">' + esc(item.name) + "</div></div>";
    }
    if (figmaWins.length > 40) html += '<div class="diff-more">\u2026 ' + (figmaWins.length - 40) + " more</div>";
    html += "</details>";
  }
  return html;
}
function collectResolutions() {
  const resolutions = {};
  document.querySelectorAll('#pull-body input[type="radio"]:checked').forEach((radio) => {
    const key = radio.dataset.key.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
    resolutions[key] = radio.value;
  });
  return resolutions;
}
const SOURCE_FILES = ["core", "color-light", "color-dark", "components", "components-dark", "platform-web", "platform-ios", "platform-android"];
const SOURCE_BASE = "packages/tokens/source/";
const MODE_SOURCE_PRIORITY = {
  "Light \xB7 Web": ["platform-web", "components", "color-light", "core"],
  "Dark \xB7 Web": ["platform-web", "components-dark", "components", "color-dark", "core"],
  "Light \xB7 iOS": ["platform-ios", "components", "color-light", "core"],
  "Dark \xB7 iOS": ["platform-ios", "components-dark", "components", "color-dark", "core"],
  "Light \xB7 Android": ["platform-android", "components", "color-light", "core"],
  "Dark \xB7 Android": ["platform-android", "components-dark", "components", "color-dark", "core"]
};
function flattenTokens(obj) {
  const result = /* @__PURE__ */ new Map();
  function walk(node, path) {
    if (!node || typeof node !== "object") return;
    if ("$value" in node || "value" in node) {
      result.set(path, node);
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith("$")) continue;
      walk(v, path ? path + "/" + k : k);
    }
  }
  walk(obj, "");
  return result;
}
function srcVal(entry) {
  return "$value" in entry ? entry["$value"] : entry["value"];
}
function normSrcVal(entry) {
  return String(srcVal(entry)).trim().toLowerCase();
}
function parseDimension(str) {
  const m = String(str).trim().match(/^(-?[\d.]+)\s*([a-zA-Z%]*)$/);
  return m ? { num: parseFloat(m[1]), unit: m[2] } : null;
}
function parseColorStr(str) {
  const s = String(str).trim().toLowerCase();
  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  if (s.startsWith("#")) {
    const h = s.slice(1);
    if (h.length === 6) return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1
    };
    if (h.length === 8) return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: parseInt(h.slice(6, 8), 16) / 255
    };
  }
  const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (m) return { r: parseFloat(m[1]), g: parseFloat(m[2]), b: parseFloat(m[3]), a: m[4] !== void 0 ? parseFloat(m[4]) : 1 };
  return null;
}
function colorsEqual(a, b) {
  return Math.abs(a.r - b.r) <= 1 && Math.abs(a.g - b.g) <= 1 && Math.abs(a.b - b.b) <= 1 && Math.abs(a.a - b.a) < 1.5 / 255;
}
function formatColor(parsed, srcStr) {
  if (parsed.a < 0.5 / 255) {
    return String(srcStr).trim().toLowerCase() === "transparent" ? "transparent" : "rgba(0, 0, 0, 0)";
  }
  if (parsed.a > 254.5 / 255) {
    return "#" + Math.round(parsed.r).toString(16).padStart(2, "0") + Math.round(parsed.g).toString(16).padStart(2, "0") + Math.round(parsed.b).toString(16).padStart(2, "0");
  }
  const alphaMatch = String(srcStr).match(/,\s*([\d.]+)\s*\)$/);
  const alphaDp = alphaMatch && alphaMatch[1].includes(".") ? alphaMatch[1].split(".")[1].length : 2;
  return "rgba(" + Math.round(parsed.r) + ", " + Math.round(parsed.g) + ", " + Math.round(parsed.b) + ", " + parsed.a.toFixed(Math.max(alphaDp, 2)) + ")";
}
function decimalPlaces(str) {
  const m = String(str).trim().match(/\.(\d+)$/);
  return m ? m[1].length : 0;
}
function figmaValToSrcEntry(figmaVal, existingEntry) {
  const key = "$value" in existingEntry ? "$value" : "value";
  const updated = Object.assign({}, existingEntry);
  if (figmaVal.alias) {
    updated[key] = "{" + figmaVal.alias.replace(/\//g, ".") + "}";
    return updated;
  }
  const extObj = existingEntry["$extensions"];
  const ext = extObj && extObj["design-system.figma-value"];
  if (ext !== void 0) {
    const updatedExt = Object.assign({}, extObj);
    updatedExt["design-system.figma-value"] = figmaVal.value;
    updated["$extensions"] = updatedExt;
    return updated;
  }
  const srcStr = String(srcVal(existingEntry));
  const figmaColor = parseColorStr(String(figmaVal.value));
  if (figmaColor) {
    updated[key] = formatColor(figmaColor, srcStr);
    return updated;
  }
  const dim = parseDimension(srcStr);
  if (dim && dim.unit) {
    const n = typeof figmaVal.value === "number" ? figmaVal.value : parseFloat(figmaVal.value);
    updated[key] = String(n) + dim.unit;
    return updated;
  }
  if (typeof figmaVal.value === "number") {
    const dp = decimalPlaces(srcStr);
    updated[key] = figmaVal.value.toFixed(dp);
    return updated;
  }
  updated[key] = figmaVal.value;
  return updated;
}
function figmaValMatchesSrc(figmaVal, existingEntry) {
  if (figmaVal.alias) {
    const expected = "{" + figmaVal.alias.replace(/\//g, ".") + "}";
    return normSrcVal(existingEntry) === expected.toLowerCase();
  }
  const extObj = existingEntry["$extensions"];
  const ext = extObj && extObj["design-system.figma-value"];
  if (ext !== void 0) {
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
    return Math.abs(dim.num - n) < 1e-4;
  }
  if (typeof figmaVal.value === "number") {
    const dp = decimalPlaces(srcStr);
    return parseFloat(figmaVal.value.toFixed(dp)) === parseFloat(srcStr);
  }
  return normSrcVal(existingEntry) === String(figmaVal.value).trim().toLowerCase();
}
async function fetchSourceFilesWithMeta() {
  const result = {};
  await Promise.all(SOURCE_FILES.map(async (name) => {
    const path = SOURCE_BASE + name + ".json";
    const meta = await ghFetchMeta(path, BRANCH);
    if (!meta) {
      result[name] = null;
      return;
    }
    const text = atob(meta.content.replace(/\n/g, ""));
    const json = JSON.parse(text);
    result[name] = { json, sha: meta.sha, path, flat: flattenTokens(json), text };
  }));
  return result;
}
function computePushChanges(figmaCollection, sourceFiles) {
  const changes = {};
  for (const fv of figmaCollection.variables) {
    for (const [modeName, figmaVal] of Object.entries(fv.values)) {
      const priority = MODE_SOURCE_PRIORITY[modeName];
      if (!priority) continue;
      const srcFile = priority.find((f) => sourceFiles[f] && sourceFiles[f].flat && sourceFiles[f].flat.has(fv.name));
      if (!srcFile) continue;
      const existingEntry = sourceFiles[srcFile].flat.get(fv.name);
      if (figmaValMatchesSrc(figmaVal, existingEntry)) continue;
      const newEntry = figmaValToSrcEntry(figmaVal, existingEntry);
      if (!changes[srcFile]) changes[srcFile] = /* @__PURE__ */ new Map();
      const existing = changes[srcFile].get(fv.name);
      if (existing) {
        existing.modes.push(modeName);
      } else {
        changes[srcFile].set(fv.name, { old: existingEntry, new: newEntry, modes: [modeName] });
      }
    }
  }
  return changes;
}
function escapeRe(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function toJsonLiteral(val) {
  return typeof val === "string" ? JSON.stringify(val) : String(val);
}
function patchSingleLine(line, change) {
  const vk = "$value" in change.new ? "$value" : "value";
  const oldLit = toJsonLiteral(change.old[vk]);
  const newLit = toJsonLiteral(change.new[vk]);
  if (oldLit === newLit) return line;
  return line.replace(
    new RegExp('"(?:\\$value|value)"\\s*:\\s*' + escapeRe(oldLit)),
    '"$value": ' + newLit
  );
}
function patchMultiLine(line, change) {
  const vk = "$value" in change.new ? "$value" : "value";
  const oldLit = toJsonLiteral(change.old[vk]);
  const newLit = toJsonLiteral(change.new[vk]);
  if (oldLit !== newLit && (line.includes('"$value"') || line.includes('"value"'))) {
    const patched = line.replace(
      new RegExp('"(?:\\$value|value)"\\s*:\\s*' + escapeRe(oldLit)),
      '"$value": ' + newLit
    );
    if (patched !== line) return patched;
  }
  if (line.includes('"design-system.figma-value"')) {
    const extObj = change.old["$extensions"];
    const oldExt = extObj && extObj["design-system.figma-value"];
    const newExt = change.new["$extensions"] && change.new["$extensions"]["design-system.figma-value"];
    if (oldExt !== void 0 && toJsonLiteral(oldExt) !== toJsonLiteral(newExt)) {
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
      if (trimmed[0] === "]") {
        if (arrayDepth > 0) arrayDepth--;
      } else {
        if (activeChange) activeChange = null;
        if (pathStack.length > 0) pathStack.pop();
      }
      continue;
    }
    const m = trimmed.match(/^"([^"]+)"\s*:\s*([\s\S]*)/);
    if (!m) continue;
    const key = m[1];
    const rest = m[2].trimEnd();
    if (activeChange && key.startsWith("$")) {
      if (rest === "[") arrayDepth++;
      const patched = patchMultiLine(line, activeChange);
      if (patched !== line) result[i] = patched;
      continue;
    }
    if (key.startsWith("$")) {
      if (rest === "[") arrayDepth++;
      continue;
    }
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
        if (lt.startsWith('"$')) {
          if (change) activeChange = change;
        }
        break;
      }
      continue;
    }
    if (rest === "[") {
      pathStack.push(key);
      arrayDepth++;
      continue;
    }
  }
  return result.join("\n");
}
async function ghGetMainSha() {
  const url = "https://api.github.com/repos/" + REPO + "/git/ref/heads/" + BRANCH;
  const resp = await fetch(url, {
    headers: {
      "Authorization": "Bearer " + activePat,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    if (resp.status === 403) throw new Error("PAT lacks read scope to get branch ref. " + body.slice(0, 120));
    throw new Error("GitHub " + resp.status + " getting main ref: " + body.slice(0, 100));
  }
  const data = await resp.json();
  return data.object.sha;
}
async function ghCreateBranch(branchName, sha) {
  const resp = await fetch("https://api.github.com/repos/" + REPO + "/git/refs", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + activePat,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: JSON.stringify({ ref: "refs/heads/" + branchName, sha })
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    if (resp.status === 403) throw new Error("PAT lacks Contents: Write or Pull Requests: Write scope \u2014 cannot create branch. Response: " + body.slice(0, 150));
    throw new Error("GitHub " + resp.status + " creating branch: " + body.slice(0, 100));
  }
  return resp.json();
}
async function ghPutFile(filePath, content, sha, branch, message) {
  const b64 = btoa(unescape(encodeURIComponent(content)));
  const resp = await fetch("https://api.github.com/repos/" + REPO + "/contents/" + filePath, {
    method: "PUT",
    headers: {
      "Authorization": "Bearer " + activePat,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: JSON.stringify({ message, content: b64, sha, branch })
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    if (resp.status === 403) throw new Error("PAT lacks Contents: Write scope \u2014 cannot commit file. Response: " + body.slice(0, 150));
    throw new Error("GitHub " + resp.status + " committing " + filePath + ": " + body.slice(0, 100));
  }
  return resp.json();
}
async function ghCreatePR(branchName, title, body) {
  const resp = await fetch("https://api.github.com/repos/" + REPO + "/pulls", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + activePat,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: JSON.stringify({ title, head: branchName, base: BRANCH, body })
  });
  if (!resp.ok) {
    const body2 = await resp.text().catch(() => "");
    if (resp.status === 403) throw new Error("PAT lacks Pull Requests: Write scope \u2014 cannot create PR. Response: " + body2.slice(0, 150));
    throw new Error("GitHub " + resp.status + " creating PR: " + body2.slice(0, 100));
  }
  return resp.json();
}
async function ghEnableAutoMerge(prNodeId) {
  const query = "mutation M($id:ID!){enablePullRequestAutoMerge(input:{pullRequestId:$id,mergeMethod:SQUASH}){pullRequest{autoMergeRequest{enabledAt}}}}";
  const resp = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + activePat,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables: { id: prNodeId } })
  });
  if (!resp.ok) throw new Error("GitHub " + resp.status + " enabling auto-merge");
  const data = await resp.json();
  if (data.errors && data.errors.length) {
    throw new Error(data.errors.map(function(e) {
      return e.message;
    }).join("; "));
  }
}
async function executePush(sourceFiles, changes) {
  const now = /* @__PURE__ */ new Date();
  const ts = now.toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
  const branch = "figma/push-" + ts;
  let totalTokens = 0;
  for (const fc of Object.values(changes)) totalTokens += fc.size;
  const fileNames = Object.keys(changes);
  log("Getting main branch SHA\u2026", "muted");
  const mainSha = await ghGetMainSha();
  log("Creating branch " + branch + "\u2026", "muted");
  await ghCreateBranch(branch, mainSha);
  for (const fname of fileNames) {
    const fileChanges = changes[fname];
    const srcFile = sourceFiles[fname];
    const content = applyChangesToText(srcFile.text, fileChanges);
    const commitMsg = "tokens(figma-push): " + fileChanges.size + " change" + (fileChanges.size > 1 ? "s" : "") + " in " + fname + ".json";
    log("Committing " + fname + ".json (" + fileChanges.size + " tokens)\u2026", "muted");
    await ghPutFile(srcFile.path, content, srcFile.sha, branch, commitMsg);
  }
  const prBody = [
    "## Figma \u2192 Source Token Push",
    "",
    "**" + totalTokens + " token" + (totalTokens > 1 ? "s" : "") + " changed** across " + fileNames.length + " source file" + (fileNames.length > 1 ? "s" : "") + ".",
    "",
    "| Source file | Changed tokens |",
    "|---|:---:|",
    ...fileNames.map((f) => "| `" + SOURCE_BASE + f + ".json` | " + changes[f].size + " |"),
    "",
    "CI will automatically regenerate and commit the build output; the PR auto-merges when green.",
    "",
    "After it lands on main, sync the new `tokens.figma-variables.json` back to Figma via **Sync tokens**.",
    "",
    "> Generated by the Design System Sync Figma plugin on " + now.toLocaleDateString() + "."
  ].join("\n");
  const prTitle = "tokens(figma-push): " + totalTokens + " token" + (totalTokens > 1 ? "s" : "") + " from Figma Foundations";
  log("Opening PR\u2026", "muted");
  const pr = await ghCreatePR(branch, prTitle, prBody);
  log("Enabling auto-merge\u2026", "muted");
  try {
    await ghEnableAutoMerge(pr.node_id);
  } catch (e) {
    log("Auto-merge not enabled: " + e.message, "warn");
  }
  return { pr, branch, totalTokens, fileNames };
}
function renderPushPreview(changes) {
  let totalTokens = 0;
  for (const fc of Object.values(changes)) totalTokens += fc.size;
  if (totalTokens === 0) {
    return `<div class="push-ok">\u2713 Figma variables match the source files \u2014 nothing to push.</div><p style="font-size:11px;color:var(--fg-muted);margin:0">If you expected changes, make sure you've synced first so the collection is up to date.</p>`;
  }
  let html = '<div class="push-scope-note"><strong>' + totalTokens + " token" + (totalTokens > 1 ? "s" : "") + "</strong> will be written to " + Object.keys(changes).length + " source file" + (Object.keys(changes).length > 1 ? "s" : "") + ". Only tokens that already exist in <code>packages/tokens/source/</code> are updated \u2014 new Figma variables are skipped.</div>";
  for (const [fname, fileChanges] of Object.entries(changes)) {
    html += '<div class="push-file-section">';
    html += '<div class="push-file-title"><span class="push-file-badge">' + fileChanges.size + "</span>" + esc(fname) + ".json</div>";
    let count = 0;
    for (const [tokenPath, change] of fileChanges) {
      if (count++ >= 40) {
        html += '<div class="diff-more">\u2026 ' + (fileChanges.size - 40) + " more</div>";
        break;
      }
      const oldV = String(srcVal(change.old));
      const newV = String(srcVal(change.new));
      const isColor = /^#[0-9a-f]{6}/i.test(oldV) || /^#[0-9a-f]{6}/i.test(newV);
      html += '<div class="diff-row">';
      html += '<div class="var-name changed">' + esc(tokenPath) + "</div>";
      html += '<div class="mode-change"><span class="mode-lbl">' + esc(change.modes.map((m) => m.replace(" \xB7 ", "\xB7").replace("Light", "L").replace("Dark", "D")).join(", ")) + "</span> ";
      if (isColor) {
        const oldHex = oldV.toLowerCase();
        const newHex = newV.toLowerCase();
        html += '<span class="val-old">' + renderSwatch(oldHex) + esc(oldV) + "</span>";
        html += '<span class="val-arr">\u2192</span>';
        html += renderSwatch(newHex) + esc(newV);
      } else {
        html += '<span class="val-old"><code>' + esc(oldV) + "</code></span>";
        html += '<span class="val-arr">\u2192</span>';
        html += "<code>" + esc(newV) + "</code>";
      }
      html += "</div></div>";
    }
    html += "</div>";
  }
  return html;
}
let pushState = null;
let ensureTsPreviewData = null;
function renderEnsureTextStylesPreview(preview) {
  if (preview.error) return '<div class="panel-error">' + esc(preview.error) + "</div>";
  const s = preview.summary;
  let html = '<div class="ets-summary">';
  if (s.create > 0) html += '<span class="pill added">' + s.create + " to create</span>";
  if (s.update > 0) html += '<span class="pill changed">' + s.update + " to update</span>";
  if (s.alreadyCorrect > 0) html += '<span class="pill ok">' + s.alreadyCorrect + " already correct</span>";
  if (s.skippedMissing > 0) html += '<span class="pill removed">' + s.skippedMissing + " skipped (missing vars)</span>";
  if (s.create === 0 && s.update === 0 && s.skippedMissing === 0) {
    html += '<span class="pill ok">\u2713 All styles already bound correctly</span>';
  }
  html += "</div>";
  if (preview.rows.length > 0) {
    html += '<table class="ets-table"><thead><tr><th>Action</th><th>Style</th><th>Variables (Foundations)</th></tr></thead><tbody>';
    for (let i = 0; i < preview.rows.length; i++) {
      const row = preview.rows[i];
      const cls = row.action === "create" ? "create" : row.action === "update" ? "update" : "correct";
      const lbl = row.action === "already-correct" ? "\u2713 correct" : row.action;
      const vn = row.varNames;
      html += "<tr>";
      html += '<td><span class="ets-badge ' + cls + '">' + esc(lbl) + "</span></td>";
      html += '<td class="ets-style">' + esc(row.styleName) + "</td>";
      html += "<td>";
      html += '<div class="ets-var">size \u2192 ' + esc(vn.size) + "</div>";
      html += '<div class="ets-var">line \u2192 ' + esc(vn.line) + "</div>";
      html += '<div class="ets-var">weight \u2192 ' + esc(vn.weight) + "</div>";
      html += '<div class="ets-var">family \u2192 ' + esc(vn.family) + "</div>";
      if (vn.spacing) html += '<div class="ets-var">spacing \u2192 ' + esc(vn.spacing) + " <em>(literal)</em></div>";
      html += "</td>";
      html += "</tr>";
    }
    html += "</tbody></table>";
  }
  if (preview.missingVars && preview.missingVars.length > 0) {
    html += '<div class="ets-missing"><strong>' + preview.missingVars.length + " role" + (preview.missingVars.length > 1 ? "s" : "") + " skipped \u2014 vars not in library:</strong>";
    for (let j = 0; j < preview.missingVars.length; j++) {
      const mv = preview.missingVars[j];
      html += "<div>" + esc(mv.styleName) + ": " + mv.missing.map(function(m) {
        return esc(m);
      }).join(", ") + "</div>";
    }
    html += "</div>";
  }
  return html;
}
function closeEnsureTsPanel() {
  document.getElementById("ensure-ts-panel").hidden = true;
  ensureTsPreviewData = null;
  document.getElementById("ensure-ts-apply").disabled = true;
  document.getElementById("ensure-ts-preview-btn").disabled = false;
  document.getElementById("ensure-ts-cancel").disabled = false;
  document.getElementById("ensure-ts-preview-area").innerHTML = '<p style="font-size:11px;color:var(--fg-muted);margin:0">Click <strong>Preview</strong> to check existing styles and show what will change. Foundations must be enabled as a library in this file.</p>';
  setBusy(false);
}
document.getElementById("ensure-text-styles").addEventListener("click", function() {
  document.getElementById("ensure-ts-panel").hidden = false;
  setBusy(true);
  parent.postMessage({ pluginMessage: { type: "get-file-info" } }, "*");
});
document.getElementById("close-ensure-ts").addEventListener("click", closeEnsureTsPanel);
document.getElementById("ensure-ts-cancel").addEventListener("click", closeEnsureTsPanel);
document.getElementById("ensure-ts-preview-btn").addEventListener("click", function() {
  const platform = document.querySelector('[name="ets-platform"]:checked').value;
  document.getElementById("ensure-ts-preview-area").innerHTML = '<div class="line muted">Computing preview\u2026</div>';
  document.getElementById("ensure-ts-apply").disabled = true;
  ensureTsPreviewData = null;
  setBusy(true);
  parent.postMessage({ pluginMessage: { type: "ensure-text-styles-preview", platform } }, "*");
});
document.getElementById("ensure-ts-apply").addEventListener("click", function() {
  if (!ensureTsPreviewData) return;
  const platform = document.querySelector('[name="ets-platform"]:checked').value;
  document.getElementById("ensure-ts-apply").disabled = true;
  document.getElementById("ensure-ts-preview-btn").disabled = true;
  document.getElementById("ensure-ts-cancel").disabled = true;
  log("Applying Text Styles for " + platform + "\u2026", "muted");
  setBusy(true);
  parent.postMessage({ pluginMessage: { type: "ensure-text-styles-apply", platform } }, "*");
});
document.getElementById("sync-tokens").addEventListener("click", async () => {
  setBusy(true);
  log("Fetching tokens via GitHub API\u2026", "muted");
  try {
    const data = await ghFetch("packages/tokens/tokens.figma-variables.json");
    log("Fetched " + data.variables.length + " variables across " + data.modes.length + " modes", "info");
    parent.postMessage({ pluginMessage: { type: "sync-tokens", data } }, "*");
  } catch (e) {
    log("Fetch failed: " + e.message, "err");
    setBusy(false);
  }
});
document.getElementById("btn-diff").addEventListener("click", async () => {
  setBusy(true);
  log("Fetching tokens for diff\u2026", "muted");
  try {
    const repoData = await ghFetch("packages/tokens/tokens.figma-variables.json");
    log("Comparing " + repoData.variables.length + " variables \xD7 " + repoData.modes.length + " modes\u2026", "muted");
    parent.postMessage({ pluginMessage: { type: "compute-diff", repoData } }, "*");
  } catch (e) {
    log("Fetch failed: " + e.message, "err");
    setBusy(false);
  }
});
document.getElementById("sync-text-styles").addEventListener("click", () => {
  setBusy(true);
  log("Syncing Text Styles\u2026", "muted");
  parent.postMessage({ pluginMessage: { type: "sync-text-styles" } }, "*");
});
document.getElementById("generate-foundations").addEventListener("click", () => {
  setBusy(true);
  log("Generating Foundations pages\u2026", "muted");
  parent.postMessage({ pluginMessage: { type: "generate-foundations" } }, "*");
});
document.getElementById("generate-components").addEventListener("click", async () => {
  setBusy(true);
  log("Fetching " + SPECS.length + " component spec(s)\u2026", "muted");
  try {
    const specs = [];
    for (const name of SPECS) {
      const data = await ghFetch("packages/web/src/component-specs/" + name + ".json");
      specs.push(data);
      log("  \xB7 " + name + ".json", "muted");
    }
    log("Fetched " + specs.length + " spec(s)", "info");
    parent.postMessage({ pluginMessage: { type: "generate-components", specs } }, "*");
  } catch (e) {
    log("Fetch failed: " + e.message, "err");
    setBusy(false);
  }
});
document.getElementById("save-pat").addEventListener("click", () => {
  const input = document.getElementById("pat-input");
  const pat = input.value.trim();
  if (!pat) {
    log("PAT is empty \u2014 nothing saved", "warn");
    return;
  }
  parent.postMessage({ pluginMessage: { type: "set-pat", pat } }, "*");
  input.value = "";
});
document.getElementById("btn-pull").addEventListener("click", async () => {
  setBusy(true);
  log("Fetching tokens for pull preview\u2026", "muted");
  try {
    const repoData = await ghFetch("packages/tokens/tokens.figma-variables.json");
    log("Computing 3-way preview\u2026", "muted");
    parent.postMessage({ pluginMessage: { type: "compute-pull-preview", repoData } }, "*");
  } catch (e) {
    log("Fetch failed: " + e.message, "err");
    setBusy(false);
  }
});
document.getElementById("close-pull").addEventListener("click", () => {
  document.getElementById("pull-panel").hidden = true;
  pullPreviewCache = null;
  setBusy(false);
});
document.getElementById("pull-cancel").addEventListener("click", () => {
  document.getElementById("pull-panel").hidden = true;
  pullPreviewCache = null;
  setBusy(false);
});
document.getElementById("pull-apply").addEventListener("click", () => {
  if (!pullPreviewCache) return;
  const resolutions = collectResolutions();
  document.getElementById("pull-apply").disabled = true;
  document.getElementById("pull-cancel").disabled = true;
  log("Applying pull\u2026", "muted");
  parent.postMessage({ pluginMessage: { type: "apply-pull", resolutions } }, "*");
});
document.getElementById("close-diff").addEventListener("click", () => {
  document.getElementById("diff-panel").hidden = true;
  setBusy(false);
});
document.getElementById("btn-push").addEventListener("click", () => {
  setBusy(true);
  log("Reading Figma variable collection\u2026", "muted");
  parent.postMessage({ pluginMessage: { type: "read-collection" } }, "*");
});
function closePushPanel() {
  document.getElementById("push-panel").hidden = true;
  pushState = null;
  setBusy(false);
}
document.getElementById("close-push").addEventListener("click", closePushPanel);
document.getElementById("push-cancel").addEventListener("click", closePushPanel);
document.getElementById("push-confirm").addEventListener("click", async () => {
  if (!pushState || !Object.keys(pushState.changes).length) {
    closePushPanel();
    return;
  }
  document.getElementById("push-confirm").disabled = true;
  document.getElementById("push-cancel").disabled = true;
  try {
    const { pr, branch, totalTokens, fileNames } = await executePush(pushState.sourceFiles, pushState.changes);
    document.getElementById("push-panel").hidden = true;
    pushState = null;
    log("PR opened: " + pr.html_url, "ok");
    log("Branch: " + branch + " \xB7 " + totalTokens + " token" + (totalTokens > 1 ? "s" : "") + " in " + fileNames.join(", "), "ok");
    const prLinkHtml = '<div class="line ok">PR: <a class="pr-link" href="' + esc(pr.html_url) + '" target="_blank">' + esc(pr.html_url) + "</a></div>";
    const logEl2 = document.getElementById("log");
    logEl2.insertAdjacentHTML("beforeend", prLinkHtml);
    logEl2.scrollTop = logEl2.scrollHeight;
  } catch (e) {
    log("Push failed: " + e.message, "err");
  }
  document.getElementById("push-confirm").disabled = false;
  document.getElementById("push-cancel").disabled = false;
  setBusy(false);
});
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;
  switch (msg.type) {
    case "pat-loaded":
      activePat = msg.pat || null;
      updatePatStatus(!!activePat);
      break;
    case "pat-saved":
      activePat = msg.pat;
      updatePatStatus(true);
      log("PAT saved to clientStorage", "ok");
      document.getElementById("pat-settings").open = false;
      break;
    case "collection-data": {
      const colResult = msg.result;
      if (colResult.error) {
        log("Push error: " + colResult.error, "err");
        setBusy(false);
        break;
      }
      (async () => {
        try {
          log("Fetching " + SOURCE_FILES.length + " source token files from GitHub\u2026", "muted");
          const sourceFiles = await fetchSourceFilesWithMeta();
          log("Computing changes\u2026", "muted");
          const changes = computePushChanges(colResult, sourceFiles);
          pushState = { figmaCollection: colResult, sourceFiles, changes };
          document.getElementById("push-body").innerHTML = renderPushPreview(changes);
          document.getElementById("push-panel").hidden = false;
          document.getElementById("push-confirm").disabled = false;
          document.getElementById("push-cancel").disabled = false;
          let total = 0;
          for (const fc of Object.values(changes)) total += fc.size;
          const fileCount = Object.keys(changes).length;
          if (total === 0) {
            log("Push preview: Figma matches source \u2014 nothing to push", "info");
          } else {
            log("Push preview: " + total + " token" + (total > 1 ? "s" : "") + " changed across " + fileCount + " file" + (fileCount > 1 ? "s" : ""), "info");
          }
          setBusy(false);
        } catch (e) {
          log("Push preview failed: " + e.message, "err");
          setBusy(false);
        }
      })();
      break;
    }
    case "pull-preview": {
      const preview = msg.preview;
      pullPreviewCache = preview;
      document.getElementById("pull-body").innerHTML = renderPullPreview(preview);
      document.getElementById("pull-panel").hidden = false;
      document.getElementById("pull-apply").disabled = false;
      document.getElementById("pull-cancel").disabled = false;
      if (!preview.error) {
        const s = preview.summary;
        log("Pull preview: " + s.autoApply + " auto \xB7 " + s.conflicts + " conflicts \xB7 " + s.figmaWins + " Figma-wins", "info");
      }
      setBusy(false);
      break;
    }
    case "pull-done": {
      document.getElementById("pull-panel").hidden = true;
      pullPreviewCache = null;
      const n = msg.totalApplied != null ? msg.totalApplied + " values applied" : "done";
      log("Pull complete \u2014 " + n + (msg.skipped ? " (" + msg.skipped + " Figma-wins kept)" : ""), "ok");
      setBusy(false);
      break;
    }
    case "diff-result": {
      const html = renderDiff(msg.result);
      document.getElementById("diff-body").innerHTML = html;
      document.getElementById("diff-panel").hidden = false;
      const r = msg.result;
      if (!r.error) {
        log("Diff: " + (r.changed || []).length + " changed \xB7 " + (r.added || []).length + " added \xB7 " + (r.removed || []).length + " removed", "info");
      }
      setBusy(false);
      break;
    }
    case "file-info": {
      const isMobile = /mobile/i.test(msg.fileName || "");
      document.getElementById(isMobile ? "ets-mobile" : "ets-web").checked = true;
      setBusy(false);
      break;
    }
    case "ensure-ts-preview-result": {
      const prev = msg.preview;
      ensureTsPreviewData = prev;
      document.getElementById("ensure-ts-preview-area").innerHTML = renderEnsureTextStylesPreview(prev);
      if (!prev.error && (prev.summary.create > 0 || prev.summary.update > 0)) {
        document.getElementById("ensure-ts-apply").disabled = false;
      }
      if (prev.fileName) {
        const isMobile2 = /mobile/i.test(prev.fileName);
        document.getElementById(isMobile2 ? "ets-mobile" : "ets-web").checked = true;
      }
      setBusy(false);
      break;
    }
    case "ensure-text-styles-done":
      document.getElementById("ensure-ts-panel").hidden = true;
      ensureTsPreviewData = null;
      log(
        "Ensure Text Styles: " + (msg.created || 0) + " created, " + (msg.updated || 0) + " updated, " + (msg.skipped || 0) + " already-correct" + (msg.failures > 0 ? ", " + msg.failures + " failed" : ""),
        msg.failures > 0 ? "warn" : "ok"
      );
      document.getElementById("ensure-ts-apply").disabled = true;
      document.getElementById("ensure-ts-preview-btn").disabled = false;
      document.getElementById("ensure-ts-cancel").disabled = false;
      setBusy(false);
      break;
    case "log":
      log(msg.text, msg.kind || "info");
      break;
    // 'sync-done' is sent by uiDone() in code.js on success or error — always unblock UI.
    case "done":
    case "sync-done":
    case "sync-text-styles-done":
    case "foundations-done":
    case "generate-done":
      setBusy(false);
      break;
  }
};
parent.postMessage({ pluginMessage: { type: "get-pat" } }, "*");
