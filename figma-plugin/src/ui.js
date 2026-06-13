/* ── global error surfacing (must be first) ── */
window.addEventListener('error', (e) => {
  // Surface JS errors that would otherwise silently break all listeners.
  try {
    const logEl = document.getElementById('log');
    if (logEl) {
      const line = document.createElement('div');
      line.className = 'line err';
      line.textContent = 'Script error: ' + (e.message || String(e));
      logEl.appendChild(line);
      logEl.scrollTop = logEl.scrollHeight;
    }
  } catch (_) {}
});
window.addEventListener('unhandledrejection', (e) => {
  try {
    const logEl = document.getElementById('log');
    if (logEl) {
      const msg = (e.reason && e.reason.message) ? e.reason.message : String(e.reason);
      const line = document.createElement('div');
      line.className = 'line err';
      line.textContent = 'Unhandled error: ' + msg;
      logEl.appendChild(line);
      logEl.scrollTop = logEl.scrollHeight;
    }
  } catch (_) {}
});

/* ── constants ── */
const REPO   = 'spiro-rajat-mukati/design-system';
const BRANCH = 'main';
const SPECS = [
  'Button','Badge','ButtonGroup','Field','TextInput','Textarea',
  'NumericInput','Radio','Checkbox','Tag','Toast','Tabs',
  'Select','MultiSelect','Menu','ProgressBar'
];

/* ── session state ── */
let activePat = null;
let pullPreviewCache = null; // last pull-preview result, used on Apply

/* ── logging ── */
const logEl = document.getElementById('log');
function log(msg, kind) {
  const empty = logEl.querySelector('.empty');
  if (empty) empty.remove();
  const line = document.createElement('div');
  line.className = 'line ' + (kind || 'info');
  line.textContent = msg;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

/* ── PAT status ── */
function updatePatStatus(hasPat) {
  const el = document.getElementById('pat-status');
  el.innerHTML = hasPat
    ? '<strong>PAT:</strong> <span class="pat-ok">✓ stored</span>'
    : '<strong>PAT:</strong> <span class="pat-err">not set — open PAT Settings below</span>';
  if (!hasPat) document.getElementById('pat-settings').open = true;
}

/* ── HTML escaping (variable names / values from repo JSON) ── */
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── GitHub Contents API ── */
async function ghFetch(repoPath) {
  if (!activePat) throw new Error('No PAT — enter it in PAT Settings');
  const url = 'https://api.github.com/repos/' + REPO + '/contents/' + repoPath + '?ref=' + BRANCH;
  const resp = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Authorization': 'Bearer ' + activePat,
      'Accept': 'application/vnd.github.raw+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error('GitHub API ' + resp.status + ' for ' + repoPath + (body ? ': ' + body.slice(0,100) : ''));
  }
  return resp.json();
}

/* ── GitHub Contents API (raw JSON) ── */
async function ghFetchMeta(repoPath, ref) {
  if (!activePat) throw new Error('No PAT — enter it in PAT Settings');
  const url = 'https://api.github.com/repos/' + REPO + '/contents/' + repoPath + (ref ? '?ref=' + ref : '');
  const resp = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Authorization': 'Bearer ' + activePat,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    if (resp.status === 403) throw new Error('PAT lacks required scope. Push needs Contents: Write + Pull Requests: Write. GitHub said: ' + body.slice(0, 120));
    if (resp.status === 404) return null;
    throw new Error('GitHub ' + resp.status + ' for ' + repoPath + (body ? ': ' + body.slice(0, 100) : ''));
  }
  return resp.json();
}

/* ── busy state (all interactive buttons) ── */
const ALL_BTNS = ['sync-tokens','btn-diff','btn-pull','btn-push','sync-text-styles','generate-foundations','generate-components','save-pat'];
function setBusy(busy) {
  for (const id of ALL_BTNS) { const el = document.getElementById(id); if (el) el.disabled = busy; }
}

/* ══════════════════════════════════════════════════════════
   DIFF RENDERING
   ══════════════════════════════════════════════════════════ */

function shortMode(name) {
  // "Light · Web" → "Light·W", "Dark · iOS" → "Dark·iOS" etc.
  return name.replace(' · ', '·').replace('Web','W').replace('Android','And');
}

function renderSwatch(hex) {
  // hex is always #[0-9a-f]+ from our normalizer — safe for style attr
  return '<span class="swatch" style="background:' + hex + '"></span>';
}

function renderModeChange(mc) {
  let html = '<div class="mode-change">';
  html += '<span class="mode-lbl">' + esc(shortMode(mc.modeName)) + '</span> ';
  if (mc.isColor) {
    html += '<span class="val-old">' + renderSwatch(mc.figmaStr) + esc(mc.figmaLabel) + '</span>';
    html += '<span class="val-arr">→</span>';
    html += renderSwatch(mc.repoStr) + esc(mc.repoLabel);
  } else {
    html += '<span class="val-old"><code>' + esc(mc.figmaLabel) + '</code></span>';
    html += '<span class="val-arr">→</span>';
    html += '<code>' + esc(mc.repoLabel) + '</code>';
  }
  html += '</div>';
  return html;
}

function renderDiff(result) {
  if (result.error) return '<div class="panel-error">' + esc(result.error) + '</div>';

  const { modeMap, unmatchedFigmaModes, added, changed, removed } = result;
  const matched = modeMap.filter(m => m.matched).length;
  let html = '';

  // Summary pills
  html += '<div class="diff-summary">';
  if (!changed.length && !added.length && !removed.length) {
    html += '<span class="pill ok">✓ Figma is in sync with the repo</span>';
  } else {
    if (changed.length) html += '<span class="pill changed">' + changed.length + ' changed</span>';
    if (added.length)   html += '<span class="pill added">'   + added.length   + ' added</span>';
    if (removed.length) html += '<span class="pill removed">' + removed.length + ' removed</span>';
  }
  html += '</div>';

  // Mode matching summary
  const unmatchedRepo = modeMap.filter(m => !m.matched).map(m => m.name);
  html += '<div class="diff-modes">';
  html += 'Modes matched: <strong>' + matched + ' / ' + modeMap.length + '</strong>';
  if (unmatchedRepo.length)      html += ' · Repo-only: ' + unmatchedRepo.map(n => '<em>' + esc(n) + '</em>').join(', ');
  if (unmatchedFigmaModes.length) html += ' · Figma-only: ' + unmatchedFigmaModes.map(n => '<em>' + esc(n) + '</em>').join(', ');
  html += '</div>';

  if (!changed.length && !added.length && !removed.length) return html;

  // Changed
  if (changed.length) {
    html += '<div class="diff-stitle">Changed (' + changed.length + ')</div>';
    const show = changed.slice(0, 60);
    for (const item of show) {
      html += '<div class="diff-row">';
      html += '<div class="var-name changed">' + esc(item.name) + '</div>';
      for (const mc of item.modeChanges.slice(0, 4)) html += renderModeChange(mc);
      if (item.modeChanges.length > 4) html += '<div class="mode-change diff-more">+' + (item.modeChanges.length - 4) + ' more modes</div>';
      html += '</div>';
    }
    if (changed.length > 60) html += '<div class="diff-more">… ' + (changed.length - 60) + ' more</div>';
  }

  // Added (collapsed)
  if (added.length) {
    html += '<details class="diff-collapse"><summary>Added in repo, not in Figma (' + added.length + ')</summary>';
    for (const item of added.slice(0, 40)) {
      html += '<div class="diff-row"><div class="var-name added">' + esc(item.name) + '</div>';
      for (const [modeName, v] of Object.entries(item.preview).slice(0, 2)) {
        html += '<div class="mode-change"><span class="mode-lbl">' + esc(shortMode(modeName)) + '</span> ';
        if (v.isColor && v.hex) html += renderSwatch(v.hex);
        html += esc(v.label) + '</div>';
      }
      html += '</div>';
    }
    if (added.length > 40) html += '<div class="diff-more">… ' + (added.length - 40) + ' more</div>';
    html += '</details>';
  }

  // Removed (collapsed)
  if (removed.length) {
    html += '<details class="diff-collapse"><summary>In Figma, not in repo (' + removed.length + ') — Pull will not delete these</summary>';
    for (const item of removed.slice(0, 40)) {
      html += '<div class="diff-row"><div class="var-name removed">' + esc(item.name) + '</div></div>';
    }
    if (removed.length > 40) html += '<div class="diff-more">… ' + (removed.length - 40) + ' more</div>';
    html += '</details>';
  }

  return html;
}

/* ══════════════════════════════════════════════════════════
   PULL RENDERING
   ══════════════════════════════════════════════════════════ */

function renderModeRecon(recon) {
  const { toRename, toAdd, toRemove } = recon;
  const total = toRename.length + toAdd.length + toRemove.length;
  if (total === 0) {
    return '<div class="pull-section">' +
      '<div class="pull-section-title">Mode reconciliation</div>' +
      '<div class="mode-recon-item"><span class="mode-badge ok">✓</span> Collection already has all 6 correct modes</div>' +
      '</div>';
  }
  let html = '<div class="pull-section">' +
    '<div class="pull-section-title">Mode reconciliation (' + total + ' change' + (total > 1 ? 's' : '') + ')</div>';
  for (const r of toRename) {
    html += '<div class="mode-recon-item"><span class="mode-badge rename">rename</span> <span>' + esc(r.fromName) + ' → ' + esc(r.toName) + '</span></div>';
  }
  for (const name of toAdd) {
    html += '<div class="mode-recon-item"><span class="mode-badge add">add</span> <span>' + esc(name) + '</span></div>';
  }
  for (const r of toRemove) {
    html += '<div class="mode-recon-item"><span class="mode-badge remove">remove</span> <span>' + esc(r.name) + '</span></div>';
  }
  html += '</div>';
  return html;
}

function renderConflictCard(conflict, idx) {
  const key = esc(conflict.name + ':' + conflict.repoModeId);
  const isColor = conflict.isColor;
  const figmaDesc = isColor
    ? '<span style="display:inline-flex;align-items:center;gap:3px">' + renderSwatch(conflict.figmaStr) + esc(conflict.figmaLabel) + '</span>'
    : '<code>' + esc(conflict.figmaLabel) + '</code>';
  const repoDesc = isColor
    ? '<span style="display:inline-flex;align-items:center;gap:3px">' + renderSwatch(conflict.repoStr) + esc(conflict.repoLabel) + '</span>'
    : '<code>' + esc(conflict.repoLabel) + '</code>';

  return '<div class="conflict-card">' +
    '<div class="conflict-name">' + esc(conflict.name) + '</div>' +
    '<div class="conflict-mode">Mode: ' + esc(conflict.modeName) + '</div>' +
    '<div class="conflict-radios">' +
      '<label class="conflict-radio">' +
        '<input type="radio" name="conflict_' + idx + '" value="repo" data-key="' + key + '" checked />' +
        '<span><strong>Repo</strong> → ' + repoDesc + '</span>' +
      '</label>' +
      '<label class="conflict-radio">' +
        '<input type="radio" name="conflict_' + idx + '" value="figma" data-key="' + key + '" />' +
        '<span><strong>Keep Figma</strong> → ' + figmaDesc + '</span>' +
      '</label>' +
    '</div>' +
  '</div>';
}

function renderPullPreview(preview) {
  if (preview.error) return '<div class="panel-error">' + esc(preview.error) + '</div>';

  const { modeRecon, conflicts, autoApply, figmaWins, summary, hasBase } = preview;
  let html = '';

  // Top-level summary pills
  html += '<div class="pull-summary-pills">';
  if (!hasBase) html += '<span class="pill muted-pill" title="No prior sync found — all repo values will be applied without conflict detection">First sync — no base</span>';
  if (summary.modeChanges)  html += '<span class="pill changed">' + summary.modeChanges + ' mode change' + (summary.modeChanges > 1 ? 's' : '') + '</span>';
  if (summary.autoApply)    html += '<span class="pill added">' + summary.autoApply + ' auto-apply</span>';
  if (summary.conflicts)    html += '<span class="pill conflict">' + summary.conflicts + ' conflict' + (summary.conflicts > 1 ? 's' : '') + '</span>';
  if (summary.figmaWins)    html += '<span class="pill muted-pill">' + summary.figmaWins + ' Figma-wins (skip)</span>';
  if (summary.added)        html += '<span class="pill added">' + summary.added + ' new variable' + (summary.added > 1 ? 's' : '') + '</span>';
  if (summary.removed)      html += '<span class="pill removed">' + summary.removed + ' Figma-only (kept)</span>';
  html += '</div>';

  // Mode reconciliation
  html += renderModeRecon(modeRecon);

  // Conflicts — require user choice (default: repo wins)
  if (conflicts.length) {
    html += '<div class="pull-section">';
    html += '<div class="pull-section-title">Conflicts — choose which value to keep (' + conflicts.length + ')</div>';
    conflicts.forEach((c, i) => { html += renderConflictCard(c, i); });
    html += '</div>';
  }

  // Auto-apply preview (collapsed)
  if (autoApply.length) {
    html += '<details class="diff-collapse pull-section"><summary>Auto-applying (' + autoApply.length + ' mode-values)</summary>';
    for (const item of autoApply.slice(0, 60)) {
      html += '<div class="diff-row">';
      html += '<div class="var-name changed">' + esc(item.name) + '</div>';
      html += renderModeChange(item);
      html += '</div>';
    }
    if (autoApply.length > 60) html += '<div class="diff-more">… ' + (autoApply.length - 60) + ' more</div>';
    html += '</details>';
  }

  // Figma-wins (skipped)
  if (figmaWins.length) {
    html += '<details class="diff-collapse pull-section"><summary>Figma-wins — skipping (' + figmaWins.length + ')</summary>';
    for (const item of figmaWins.slice(0, 40)) {
      html += '<div class="diff-row"><div class="var-name">' + esc(item.name) + '</div></div>';
    }
    if (figmaWins.length > 40) html += '<div class="diff-more">… ' + (figmaWins.length - 40) + ' more</div>';
    html += '</details>';
  }

  return html;
}

/** Collect conflict radio resolutions from the Pull overlay DOM. */
function collectResolutions() {
  const resolutions = {};
  document.querySelectorAll('#pull-body input[type="radio"]:checked').forEach(radio => {
    // data-key = "varName:repoModeId" (HTML-escaped on write, unescaped here)
    const key = radio.dataset.key.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
    resolutions[key] = radio.value; // "repo" | "figma"
  });
  return resolutions;
}

/* ══════════════════════════════════════════════════════════
   PUSH — source file utilities + GitHub write flow
   ══════════════════════════════════════════════════════════ */

const SOURCE_FILES = ['core','color-light','color-dark','components','components-dark','platform-web','platform-ios','platform-android'];
const SOURCE_BASE  = 'packages/tokens/source/';

// Each Figma mode → ordered list of source sets (highest-priority first).
// The first set in this list that CONTAINS the token is the one we update.
const MODE_SOURCE_PRIORITY = {
  'Light · Web':     ['platform-web',     'components', 'color-light', 'core'],
  'Dark · Web':      ['platform-web',     'components-dark', 'components', 'color-dark', 'core'],
  'Light · iOS':     ['platform-ios',     'components', 'color-light', 'core'],
  'Dark · iOS':      ['platform-ios',     'components-dark', 'components', 'color-dark', 'core'],
  'Light · Android': ['platform-android', 'components', 'color-light', 'core'],
  'Dark · Android':  ['platform-android', 'components-dark', 'components', 'color-dark', 'core'],
};

/** Flatten a nested W3C/Tokens-Studio JSON into a Map<"path/to/token", entry>. */
function flattenTokens(obj) {
  const result = new Map();
  function walk(node, path) {
    if (!node || typeof node !== 'object') return;
    // Token leaf: has $value (W3C) or value (Tokens Studio)
    if ('$value' in node || 'value' in node) { result.set(path, node); return; }
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue; // skip $description, $type at root
      walk(v, path ? path + '/' + k : k);
    }
  }
  walk(obj, '');
  return result;
}

/** Return the $value or value from a source token entry. */
function srcVal(entry) {
  return ('$value' in entry) ? entry['$value'] : entry['value'];
}

/** Normalise a source value for comparison: lowercase, strip outer whitespace. */
function normSrcVal(entry) {
  return String(srcVal(entry)).trim().toLowerCase();
}

/**
 * Parse a dimension string like "26px", "-0.02em", "1500ms" into {num, unit}.
 * Returns null if the string isn't a recognisable dimension.
 */
function parseDimension(str) {
  const m = String(str).trim().match(/^(-?[\d.]+)\s*([a-zA-Z%]*)$/);
  return m ? { num: parseFloat(m[1]), unit: m[2] } : null;
}

/**
 * Convert a serialised Figma variable value into the source token entry format.
 *
 * Round-trip invariant: reading the collection and immediately pushing back
 * must produce zero changes. Key cases:
 *   - Alias: Figma slash-path -> source dot-path inside {}
 *   - Dimension: Figma FLOAT (bare 26) -> source "26px" (re-attach unit from existing entry)
 *   - $extensions["design-system.figma-value"] tokens: update the extension field,
 *     leave $value intact (those tokens intentionally store a different value in Figma)
 */
function figmaValToSrcEntry(figmaVal, existingEntry) {
  const key = ('$value' in existingEntry) ? '$value' : 'value';
  const updated = Object.assign({}, existingEntry);

  if (figmaVal.alias) {
    updated[key] = '{' + figmaVal.alias.replace(/\//g, '.') + '}';
    return updated;
  }

  // $extensions token: Figma holds a different representation intentionally
  // (e.g. "Inter", 110, "Regular"). Update only the extension field; $value stays.
  const ext = existingEntry['$extensions'] && existingEntry['$extensions']['design-system.figma-value'];
  if (ext !== undefined) {
    const updatedExt = Object.assign({}, existingEntry['$extensions']);
    updatedExt['design-system.figma-value'] = figmaVal.value;
    updated['$extensions'] = updatedExt;
    return updated;
  }

  // Dimension tokens: Figma stores bare floats; source stores strings with units.
  const srcStr = String(srcVal(existingEntry));
  const dim = parseDimension(srcStr);
  if (dim && dim.unit) {
    const newNum = typeof figmaVal.value === 'number' ? figmaVal.value : parseFloat(figmaVal.value);
    updated[key] = String(newNum) + dim.unit;
    return updated;
  }

  // Default: write the value as-is (colors are already hex strings from code.js).
  updated[key] = figmaVal.value;
  return updated;
}

/**
 * Compare a Figma value against a source entry; returns true if they represent
 * the same token value (round-trip equal).
 *
 * Priority order:
 *   1. Alias comparison (Figma slash-path vs source dot-path in braces)
 *   2. $extensions token: compare figmaVal against extension field, not $value
 *   3. Dimension: strip unit from source, compare as floats (26 === "26px")
 *   4. Fallback: lowercased string equality (colors, booleans, etc.)
 */
function figmaValMatchesSrc(figmaVal, existingEntry) {
  if (figmaVal.alias) {
    const expected = '{' + figmaVal.alias.replace(/\//g, '.') + '}';
    return normSrcVal(existingEntry) === expected.toLowerCase();
  }

  // $extensions token: compare against the Figma-specific extension value.
  const ext = existingEntry['$extensions'] && existingEntry['$extensions']['design-system.figma-value'];
  if (ext !== undefined) {
    return String(ext).trim().toLowerCase() === String(figmaVal.value).trim().toLowerCase();
  }

  // Dimension tokens: compare numerically after stripping units.
  const srcStr = String(srcVal(existingEntry));
  const dim = parseDimension(srcStr);
  if (dim && dim.unit) {
    const figmaNum = typeof figmaVal.value === 'number' ? figmaVal.value : parseFloat(String(figmaVal.value));
    return Math.abs(dim.num - figmaNum) < 0.0001;
  }

  // Default: lowercased string equality (colors already normalised by code.js).
  return normSrcVal(existingEntry) === String(figmaVal.value).trim().toLowerCase();
}

/**
 * Fetch all token source files from GitHub, returning:
 *   { [filename]: { json, sha, path, flat: Map } | null }
 * Includes the file SHA needed for the PUT operation.
 */
async function fetchSourceFilesWithMeta() {
  const result = {};
  await Promise.all(SOURCE_FILES.map(async (name) => {
    const path = SOURCE_BASE + name + '.json';
    const meta = await ghFetchMeta(path, BRANCH);
    if (!meta) { result[name] = null; return; }
    // GitHub encodes content as base64 with line breaks
    const json = JSON.parse(atob(meta.content.replace(/\n/g, '')));
    result[name] = { json, sha: meta.sha, path, flat: flattenTokens(json) };
  }));
  return result;
}

/**
 * Diff the serialised Figma collection against the source files.
 *
 * Returns:
 *   { [sourceFileName]: Map<tokenPath, { old, new, modes: string[] }> }
 *
 * Only tokens that ALREADY EXIST in the source are included (no new-token creation).
 * A single Figma variable may map to multiple source files (e.g. color-light AND color-dark).
 * Duplicate writes to the same file+path from different modes are merged.
 */
function computePushChanges(figmaCollection, sourceFiles) {
  const changes = {}; // { filename: Map<path, { old, new, modes }> }

  for (const fv of figmaCollection.variables) {
    for (const [modeName, figmaVal] of Object.entries(fv.values)) {
      const priority = MODE_SOURCE_PRIORITY[modeName];
      if (!priority) continue;

      // Find the highest-priority source file that defines this token
      const srcFile = priority.find(f => sourceFiles[f] && sourceFiles[f].flat && sourceFiles[f].flat.has(fv.name));
      if (!srcFile) continue;

      const existingEntry = sourceFiles[srcFile].flat.get(fv.name);
      if (figmaValMatchesSrc(figmaVal, existingEntry)) continue; // no change

      const newEntry = figmaValToSrcEntry(figmaVal, existingEntry);

      if (!changes[srcFile]) changes[srcFile] = new Map();
      const existing = changes[srcFile].get(fv.name);
      if (existing) {
        // Same token already recorded for this file from another mode — merge modes list
        existing.modes.push(modeName);
      } else {
        changes[srcFile].set(fv.name, { old: existingEntry, new: newEntry, modes: [modeName] });
      }
    }
  }
  return changes;
}

/**
 * Deep-clone a JSON object and overwrite token values at the given paths.
 * Uses the existing nested structure — does not create new keys.
 */
function applyChangesToJson(originalJson, changesMap) {
  const updated = JSON.parse(JSON.stringify(originalJson));
  for (const [tokenPath, change] of changesMap) {
    const parts = tokenPath.split('/');
    let node = updated;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]] || typeof node[parts[i]] !== 'object') { node = null; break; }
      node = node[parts[i]];
    }
    if (!node) continue;
    const last = parts[parts.length - 1];
    if (node[last] && typeof node[last] === 'object') {
      Object.assign(node[last], change.new);
    }
  }
  return updated;
}

/* ── GitHub write helpers ── */

async function ghGetMainSha() {
  const url = 'https://api.github.com/repos/' + REPO + '/git/ref/heads/' + BRANCH;
  const resp = await fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + activePat,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    if (resp.status === 403) throw new Error('PAT lacks read scope to get branch ref. ' + body.slice(0, 120));
    throw new Error('GitHub ' + resp.status + ' getting main ref: ' + body.slice(0, 100));
  }
  const data = await resp.json();
  return data.object.sha;
}

async function ghCreateBranch(branchName, sha) {
  const resp = await fetch('https://api.github.com/repos/' + REPO + '/git/refs', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + activePat,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ ref: 'refs/heads/' + branchName, sha }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    if (resp.status === 403) throw new Error('PAT lacks Contents: Write or Pull Requests: Write scope — cannot create branch. Response: ' + body.slice(0, 150));
    throw new Error('GitHub ' + resp.status + ' creating branch: ' + body.slice(0, 100));
  }
  return resp.json();
}

async function ghPutFile(filePath, content, sha, branch, message) {
  // btoa() only handles ASCII; use encodeURIComponent+unescape for unicode safety
  const b64 = btoa(unescape(encodeURIComponent(content)));
  const resp = await fetch('https://api.github.com/repos/' + REPO + '/contents/' + filePath, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + activePat,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ message, content: b64, sha, branch }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    if (resp.status === 403) throw new Error('PAT lacks Contents: Write scope — cannot commit file. Response: ' + body.slice(0, 150));
    throw new Error('GitHub ' + resp.status + ' committing ' + filePath + ': ' + body.slice(0, 100));
  }
  return resp.json();
}

async function ghCreatePR(branchName, title, body) {
  const resp = await fetch('https://api.github.com/repos/' + REPO + '/pulls', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + activePat,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ title, head: branchName, base: BRANCH, body }),
  });
  if (!resp.ok) {
    const body2 = await resp.text().catch(() => '');
    if (resp.status === 403) throw new Error('PAT lacks Pull Requests: Write scope — cannot create PR. Response: ' + body2.slice(0, 150));
    throw new Error('GitHub ' + resp.status + ' creating PR: ' + body2.slice(0, 100));
  }
  return resp.json();
}

/**
 * Execute the full Push:
 * 1. Create a timestamped branch off main
 * 2. Commit each changed source file
 * 3. Open a PR
 */
async function executePush(sourceFiles, changes) {
  const now = new Date();
  const ts = now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
  const branch = 'figma/push-' + ts;

  let totalTokens = 0;
  for (const fc of Object.values(changes)) totalTokens += fc.size;
  const fileNames = Object.keys(changes);

  log('Getting main branch SHA…', 'muted');
  const mainSha = await ghGetMainSha();

  log('Creating branch ' + branch + '…', 'muted');
  await ghCreateBranch(branch, mainSha);

  for (const fname of fileNames) {
    const fileChanges = changes[fname];
    const srcFile = sourceFiles[fname];
    const updatedJson = applyChangesToJson(srcFile.json, fileChanges);
    const content = JSON.stringify(updatedJson, null, 2) + '\n';
    const commitMsg = 'tokens(figma-push): ' + fileChanges.size + ' change' +
      (fileChanges.size > 1 ? 's' : '') + ' in ' + fname + '.json';
    log('Committing ' + fname + '.json (' + fileChanges.size + ' tokens)…', 'muted');
    await ghPutFile(srcFile.path, content, srcFile.sha, branch, commitMsg);
  }

  const prBody = [
    '## Figma → Source Token Push',
    '',
    '**' + totalTokens + ' token' + (totalTokens > 1 ? 's' : '') + ' changed** across ' +
      fileNames.length + ' source file' + (fileNames.length > 1 ? 's' : '') + '.',
    '',
    '| Source file | Changed tokens |',
    '|---|:---:|',
    ...fileNames.map(f => '| `' + SOURCE_BASE + f + '.json` | ' + changes[f].size + ' |'),
    '',
    'After merging:',
    '- Run `npm run tokens:build` to regenerate `tokens.figma-variables.json`',
    '- Run `npm run tokens:check` to verify the build output',
    '- Sync the new `tokens.figma-variables.json` back to Figma via **Sync tokens**',
    '',
    '> Generated by the Design System Sync Figma plugin on ' + now.toLocaleDateString() + '.',
  ].join('\n');

  const prTitle = 'tokens(figma-push): ' + totalTokens + ' token' +
    (totalTokens > 1 ? 's' : '') + ' from Figma Foundations';
  log('Opening PR…', 'muted');
  const pr = await ghCreatePR(branch, prTitle, prBody);

  return { pr, branch, totalTokens, fileNames };
}

/* ── Push rendering ── */

function renderPushPreview(changes) {
  let totalTokens = 0;
  for (const fc of Object.values(changes)) totalTokens += fc.size;

  if (totalTokens === 0) {
    return '<div class="push-ok">✓ Figma variables match the source files — nothing to push.</div>' +
      '<p style="font-size:11px;color:var(--fg-muted);margin:0">If you expected changes, make sure you\'ve synced first so the collection is up to date.</p>';
  }

  let html = '<div class="push-scope-note"><strong>' + totalTokens + ' token' +
    (totalTokens > 1 ? 's' : '') + '</strong> will be written to ' +
    Object.keys(changes).length + ' source file' +
    (Object.keys(changes).length > 1 ? 's' : '') +
    '. Only tokens that already exist in <code>packages/tokens/source/</code> are updated — new Figma variables are skipped.</div>';

  for (const [fname, fileChanges] of Object.entries(changes)) {
    html += '<div class="push-file-section">';
    html += '<div class="push-file-title"><span class="push-file-badge">' + fileChanges.size + '</span>' + esc(fname) + '.json</div>';
    let count = 0;
    for (const [tokenPath, change] of fileChanges) {
      if (count++ >= 40) { html += '<div class="diff-more">… ' + (fileChanges.size - 40) + ' more</div>'; break; }
      const oldV = String(srcVal(change.old));
      const newV = String(srcVal(change.new));
      const isColor = /^#[0-9a-f]{6}/i.test(oldV) || /^#[0-9a-f]{6}/i.test(newV);
      html += '<div class="diff-row">';
      html += '<div class="var-name changed">' + esc(tokenPath) + '</div>';
      html += '<div class="mode-change"><span class="mode-lbl">' +
        esc(change.modes.map(m => m.replace(' · ', '·').replace('Light', 'L').replace('Dark', 'D')).join(', ')) +
        '</span> ';
      if (isColor) {
        const oldHex = oldV.toLowerCase();
        const newHex = newV.toLowerCase();
        html += '<span class="val-old">' + renderSwatch(oldHex) + esc(oldV) + '</span>';
        html += '<span class="val-arr">→</span>';
        html += renderSwatch(newHex) + esc(newV);
      } else {
        html += '<span class="val-old"><code>' + esc(oldV) + '</code></span>';
        html += '<span class="val-arr">→</span>';
        html += '<code>' + esc(newV) + '</code>';
      }
      html += '</div></div>';
    }
    html += '</div>';
  }
  return html;
}

/* ── Push session state ── */
let pushState = null; // { figmaCollection, sourceFiles, changes }

/* ══════════════════════════════════════════════════════════
   ACTION HANDLERS
   ══════════════════════════════════════════════════════════ */

document.getElementById('sync-tokens').addEventListener('click', async () => {
  setBusy(true);
  log('Fetching tokens via GitHub API…', 'muted');
  try {
    const data = await ghFetch('packages/tokens/tokens.figma-variables.json');
    log('Fetched ' + data.variables.length + ' variables across ' + data.modes.length + ' modes', 'info');
    parent.postMessage({ pluginMessage: { type: 'sync-tokens', data } }, '*');
  } catch (e) { log('Fetch failed: ' + e.message, 'err'); setBusy(false); }
});

document.getElementById('btn-diff').addEventListener('click', async () => {
  setBusy(true);
  log('Fetching tokens for diff…', 'muted');
  try {
    const repoData = await ghFetch('packages/tokens/tokens.figma-variables.json');
    log('Comparing ' + repoData.variables.length + ' variables × ' + repoData.modes.length + ' modes…', 'muted');
    parent.postMessage({ pluginMessage: { type: 'compute-diff', repoData } }, '*');
  } catch (e) { log('Fetch failed: ' + e.message, 'err'); setBusy(false); }
});

document.getElementById('sync-text-styles').addEventListener('click', () => {
  setBusy(true); log('Syncing Text Styles…', 'muted');
  parent.postMessage({ pluginMessage: { type: 'sync-text-styles' } }, '*');
});

document.getElementById('generate-foundations').addEventListener('click', () => {
  setBusy(true); log('Generating Foundations pages…', 'muted');
  parent.postMessage({ pluginMessage: { type: 'generate-foundations' } }, '*');
});

document.getElementById('generate-components').addEventListener('click', async () => {
  setBusy(true);
  log('Fetching ' + SPECS.length + ' component spec(s)…', 'muted');
  try {
    const specs = [];
    for (const name of SPECS) {
      const data = await ghFetch('packages/web/src/component-specs/' + name + '.json');
      specs.push(data); log('  · ' + name + '.json', 'muted');
    }
    log('Fetched ' + specs.length + ' spec(s)', 'info');
    parent.postMessage({ pluginMessage: { type: 'generate-components', specs } }, '*');
  } catch (e) { log('Fetch failed: ' + e.message, 'err'); setBusy(false); }
});

document.getElementById('save-pat').addEventListener('click', () => {
  const input = document.getElementById('pat-input');
  const pat = input.value.trim();
  if (!pat) { log('PAT is empty — nothing saved', 'warn'); return; }
  parent.postMessage({ pluginMessage: { type: 'set-pat', pat } }, '*');
  input.value = '';
});

document.getElementById('btn-pull').addEventListener('click', async () => {
  setBusy(true);
  log('Fetching tokens for pull preview…', 'muted');
  try {
    const repoData = await ghFetch('packages/tokens/tokens.figma-variables.json');
    log('Computing 3-way preview…', 'muted');
    parent.postMessage({ pluginMessage: { type: 'compute-pull-preview', repoData } }, '*');
  } catch (e) { log('Fetch failed: ' + e.message, 'err'); setBusy(false); }
});

document.getElementById('close-pull').addEventListener('click', () => {
  document.getElementById('pull-panel').hidden = true;
  pullPreviewCache = null;
  setBusy(false);
});
document.getElementById('pull-cancel').addEventListener('click', () => {
  document.getElementById('pull-panel').hidden = true;
  pullPreviewCache = null;
  setBusy(false);
});
document.getElementById('pull-apply').addEventListener('click', () => {
  if (!pullPreviewCache) return;
  const resolutions = collectResolutions();
  document.getElementById('pull-apply').disabled = true;
  document.getElementById('pull-cancel').disabled = true;
  log('Applying pull…', 'muted');
  parent.postMessage({ pluginMessage: { type: 'apply-pull', resolutions } }, '*');
});

document.getElementById('close-diff').addEventListener('click', () => {
  document.getElementById('diff-panel').hidden = true;
  setBusy(false);
});

/* ── Push button: ask code.js to read the Figma collection ── */
document.getElementById('btn-push').addEventListener('click', () => {
  setBusy(true);
  log('Reading Figma variable collection…', 'muted');
  parent.postMessage({ pluginMessage: { type: 'read-collection' } }, '*');
});

/* ── Push overlay: Cancel / Close ── */
function closePushPanel() {
  document.getElementById('push-panel').hidden = true;
  pushState = null;
  setBusy(false);
}
document.getElementById('close-push').addEventListener('click', closePushPanel);
document.getElementById('push-cancel').addEventListener('click', closePushPanel);

/* ── Push overlay: Confirm → execute the GitHub write flow ── */
document.getElementById('push-confirm').addEventListener('click', async () => {
  if (!pushState || !Object.keys(pushState.changes).length) {
    closePushPanel();
    return;
  }
  document.getElementById('push-confirm').disabled = true;
  document.getElementById('push-cancel').disabled = true;
  try {
    const { pr, branch, totalTokens, fileNames } = await executePush(pushState.sourceFiles, pushState.changes);
    document.getElementById('push-panel').hidden = true;
    pushState = null;
    log('PR opened: ' + pr.html_url, 'ok');
    log('Branch: ' + branch + ' · ' + totalTokens + ' token' + (totalTokens > 1 ? 's' : '') +
      ' in ' + fileNames.join(', '), 'ok');
    // Show PR link in the body for easy copy
    const prLinkHtml = '<div class="line ok">PR: <a class="pr-link" href="' + esc(pr.html_url) +
      '" target="_blank">' + esc(pr.html_url) + '</a></div>';
    const logEl = document.getElementById('log');
    logEl.insertAdjacentHTML('beforeend', prLinkHtml);
    logEl.scrollTop = logEl.scrollHeight;
  } catch (e) {
    log('Push failed: ' + e.message, 'err');
  }
  document.getElementById('push-confirm').disabled = false;
  document.getElementById('push-cancel').disabled = false;
  setBusy(false);
});

/* ══════════════════════════════════════════════════════════
   MESSAGE HANDLER
   ══════════════════════════════════════════════════════════ */

window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;
  switch (msg.type) {
    case 'pat-loaded':
      activePat = msg.pat || null;
      updatePatStatus(!!activePat);
      break;
    case 'pat-saved':
      activePat = msg.pat;
      updatePatStatus(true);
      log('PAT saved to clientStorage', 'ok');
      document.getElementById('pat-settings').open = false;
      break;
    case 'collection-data': {
      // Push step 2: got Figma collection from code.js; fetch source files and compute diff.
      const colResult = msg.result;
      if (colResult.error) {
        log('Push error: ' + colResult.error, 'err');
        setBusy(false);
        break;
      }
      (async () => {
        try {
          log('Fetching ' + SOURCE_FILES.length + ' source token files from GitHub…', 'muted');
          const sourceFiles = await fetchSourceFilesWithMeta();
          log('Computing changes…', 'muted');
          const changes = computePushChanges(colResult, sourceFiles);
          pushState = { figmaCollection: colResult, sourceFiles, changes };

          document.getElementById('push-body').innerHTML = renderPushPreview(changes);
          document.getElementById('push-panel').hidden = false;
          document.getElementById('push-confirm').disabled = false;
          document.getElementById('push-cancel').disabled = false;

          let total = 0;
          for (const fc of Object.values(changes)) total += fc.size;
          const fileCount = Object.keys(changes).length;
          if (total === 0) {
            log('Push preview: Figma matches source — nothing to push', 'info');
          } else {
            log('Push preview: ' + total + ' token' + (total > 1 ? 's' : '') +
              ' changed across ' + fileCount + ' file' + (fileCount > 1 ? 's' : ''), 'info');
          }
          setBusy(false);
        } catch (e) {
          log('Push preview failed: ' + e.message, 'err');
          setBusy(false);
        }
      })();
      break;
    }
    case 'pull-preview': {
      const preview = msg.preview;
      pullPreviewCache = preview;
      document.getElementById('pull-body').innerHTML = renderPullPreview(preview);
      document.getElementById('pull-panel').hidden = false;
      document.getElementById('pull-apply').disabled = false;
      document.getElementById('pull-cancel').disabled = false;
      if (!preview.error) {
        const s = preview.summary;
        log('Pull preview: ' + s.autoApply + ' auto · ' + s.conflicts + ' conflicts · ' + s.figmaWins + ' Figma-wins', 'info');
      }
      setBusy(false);
      break;
    }
    case 'pull-done': {
      document.getElementById('pull-panel').hidden = true;
      pullPreviewCache = null;
      const n = msg.totalApplied != null ? msg.totalApplied + ' values applied' : 'done';
      log('Pull complete — ' + n + (msg.skipped ? ' (' + msg.skipped + ' Figma-wins kept)' : ''), 'ok');
      setBusy(false);
      break;
    }
    case 'diff-result': {
      const html = renderDiff(msg.result);
      document.getElementById('diff-body').innerHTML = html;
      document.getElementById('diff-panel').hidden = false;
      const r = msg.result;
      if (!r.error) {
        log('Diff: ' + (r.changed||[]).length + ' changed · ' + (r.added||[]).length + ' added · ' + (r.removed||[]).length + ' removed', 'info');
      }
      setBusy(false);
      break;
    }
    case 'log':  log(msg.text, msg.kind || 'info'); break;
    // 'sync-done' is sent by uiDone() in code.js on success or error — always unblock UI.
    case 'done':
    case 'sync-done':
    case 'sync-text-styles-done':
    case 'foundations-done':
    case 'generate-done':
      setBusy(false); break;
  }
};

/* ── init ── */
parent.postMessage({ pluginMessage: { type: 'get-pat' } }, '*');
