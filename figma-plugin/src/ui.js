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
let prunePreviewData = null;
let exportAssetsState = null; // { icons, illustrations, images } — each { add, update, remove, unchanged, errors }

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
const ALL_BTNS = ['sync-tokens','btn-diff','btn-pull','btn-push','btn-prune','sync-text-styles','ensure-text-styles','generate-foundations','generate-components','btn-component-drift','btn-export-assets','save-pat'];
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
   PRUNE RENDERING
   ══════════════════════════════════════════════════════════ */

function renderPrunePreview(preview) {
  if (preview.error) return '<div class="panel-error">' + esc(preview.error) + '</div>';
  const { canDelete, willSkip, total } = preview;
  if (total === 0) {
    return '<div class="diff-summary"><span class="pill ok">✓ No Figma-only variables — collection is clean</span></div>';
  }
  let html = '<div class="diff-summary">';
  if (canDelete.length) html += '<span class="pill removed">' + canDelete.length + ' to delete</span>';
  if (willSkip.length)  html += '<span class="pill muted-pill">' + willSkip.length + ' skipped (still referenced)</span>';
  html += '</div>';

  if (canDelete.length) {
    html += '<details class="diff-collapse" open><summary>Will delete (' + canDelete.length + ')</summary>';
    const show = canDelete.slice(0, 60);
    for (const item of show) {
      html += '<div class="diff-row"><div class="var-name removed">' + esc(item.name) + '</div></div>';
    }
    if (canDelete.length > 60) html += '<div class="diff-more">… ' + (canDelete.length - 60) + ' more</div>';
    html += '</details>';
  }

  if (willSkip.length) {
    html += '<details class="diff-collapse"><summary>Skipped — still referenced (' + willSkip.length + ')</summary>';
    for (const item of willSkip) {
      html += '<div class="diff-row">';
      html += '<div class="var-name" style="color:var(--fg-muted)">' + esc(item.name) + '</div>';
      const refLabel = item.refs.slice(0, 3).map(esc).join(', ') + (item.refs.length > 3 ? ' +' + (item.refs.length - 3) + ' more' : '');
      html += '<div class="mode-change" style="font-size:10px">refs: ' + refLabel + '</div>';
      html += '</div>';
    }
    html += '</details>';
  }

  return html;
}

function closePrunePanel() {
  document.getElementById('prune-panel').hidden = true;
  prunePreviewData = null;
  document.getElementById('prune-apply').disabled = true;
  document.getElementById('prune-preview-btn').disabled = false;
  document.getElementById('prune-cancel').disabled = false;
  document.getElementById('prune-preview-area').innerHTML =
    '<p style="font-size:11px;color:var(--fg-muted);margin:0">Click <strong>Preview</strong> to fetch the repo variable list and compare against the live collection.</p>';
  setBusy(false);
}

document.getElementById('btn-prune').addEventListener('click', function() {
  document.getElementById('prune-panel').hidden = false;
  setBusy(true);
});

document.getElementById('close-prune').addEventListener('click', closePrunePanel);
document.getElementById('prune-cancel').addEventListener('click', closePrunePanel);

document.getElementById('prune-preview-btn').addEventListener('click', async function() {
  document.getElementById('prune-preview-area').innerHTML = '<div class="line muted">Fetching repo variable list and computing diff…</div>';
  document.getElementById('prune-apply').disabled = true;
  document.getElementById('prune-preview-btn').disabled = true;
  prunePreviewData = null;
  try {
    const repoData = await ghFetch('packages/tokens/tokens.figma-variables.json');
    parent.postMessage({ pluginMessage: { type: 'prune-preview', repoData: repoData } }, '*');
  } catch (e) {
    log('Prune preview failed: ' + e.message, 'err');
    document.getElementById('prune-preview-area').innerHTML = '<div class="panel-error">' + esc(e.message) + '</div>';
    document.getElementById('prune-preview-btn').disabled = false;
  }
});

document.getElementById('prune-apply').addEventListener('click', function() {
  if (!prunePreviewData || !prunePreviewData.canDelete || !prunePreviewData.canDelete.length) return;
  document.getElementById('prune-apply').disabled = true;
  document.getElementById('prune-preview-btn').disabled = true;
  document.getElementById('prune-cancel').disabled = true;
  const names = prunePreviewData.canDelete.map(function(item) { return item.name; });
  log('Pruning ' + names.length + ' unreferenced variable(s)…', 'muted');
  parent.postMessage({ pluginMessage: { type: 'prune-apply', names: names } }, '*');
});

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
 * Returns {num, unit:""} for bare numbers. Returns null only on non-numeric input.
 */
function parseDimension(str) {
  const m = String(str).trim().match(/^(-?[\d.]+)\s*([a-zA-Z%]*)$/);
  return m ? { num: parseFloat(m[1]), unit: m[2] } : null;
}

/**
 * Parse a CSS color string into {r, g, b} (0-255) and a (0-1).
 * Handles: "transparent", "#rrggbb", "#rrggbbaa", "rgba(...)", "rgb(...)".
 * Returns null if the string is not a recognisable color.
 */
function parseColorStr(str) {
  const s = String(str).trim().toLowerCase();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (s.startsWith('#')) {
    const h = s.slice(1);
    if (h.length === 6) return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16), a: 1
    };
    if (h.length === 8) return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: parseInt(h.slice(6, 8), 16) / 255
    };
  }
  const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (m) return { r: parseFloat(m[1]), g: parseFloat(m[2]), b: parseFloat(m[3]), a: m[4] !== undefined ? parseFloat(m[4]) : 1 };
  return null;
}

/** True when two parsed colors represent the same visual color within 8-bit rounding. */
function colorsEqual(a, b) {
  return Math.abs(a.r - b.r) <= 1 &&
         Math.abs(a.g - b.g) <= 1 &&
         Math.abs(a.b - b.b) <= 1 &&
         Math.abs(a.a - b.a) < (1.5 / 255); // ~0.006, one 8-bit step
}

/**
 * Serialise a parsed color back to a string, preserving the source token's
 * convention (transparent / hex6 for opaque / rgba() for alpha).
 */
function formatColor(parsed, srcStr) {
  if (parsed.a < (0.5 / 255)) {
    return String(srcStr).trim().toLowerCase() === 'transparent' ? 'transparent' : 'rgba(0, 0, 0, 0)';
  }
  if (parsed.a > (254.5 / 255)) {
    return '#' +
      Math.round(parsed.r).toString(16).padStart(2, '0') +
      Math.round(parsed.g).toString(16).padStart(2, '0') +
      Math.round(parsed.b).toString(16).padStart(2, '0');
  }
  // Alpha channel: preserve source decimal places (e.g. "0.40" -> 2dp).
  const alphaMatch = String(srcStr).match(/,\s*([\d.]+)\s*\)$/);
  const alphaDp = alphaMatch && alphaMatch[1].includes('.') ? alphaMatch[1].split('.')[1].length : 2;
  return 'rgba(' + Math.round(parsed.r) + ', ' + Math.round(parsed.g) + ', ' +
         Math.round(parsed.b) + ', ' + parsed.a.toFixed(Math.max(alphaDp, 2)) + ')';
}

/** Count decimal places in a numeric string: "0.10" -> 2, "1" -> 0. */
function decimalPlaces(str) {
  const m = String(str).trim().match(/\.(\d+)$/);
  return m ? m[1].length : 0;
}

/**
 * Convert a serialised Figma variable value into the source token entry format.
 *
 * Round-trip invariant: reading the collection and pushing straight back = zero changes.
 *
 *   Alias     → Figma slash-path to source dot-path in {}
 *   $extensions → update only extension field; leave $value intact
 *   Color     → parse Figma hex8/hex6; format using source convention
 *               (transparent / hex6 / rgba()) with source alpha precision
 *   Dimension → re-attach source unit (26 -> "26px")
 *   Number    → round to source decimal places to strip float32 noise
 */
function figmaValToSrcEntry(figmaVal, existingEntry) {
  const key = ('$value' in existingEntry) ? '$value' : 'value';
  const updated = Object.assign({}, existingEntry);

  if (figmaVal.alias) {
    updated[key] = '{' + figmaVal.alias.replace(/\//g, '.') + '}';
    return updated;
  }

  // $extensions token: only update the extension field; $value intentionally differs.
  const extObj = existingEntry['$extensions'];
  const ext = extObj && extObj['design-system.figma-value'];
  if (ext !== undefined) {
    const updatedExt = Object.assign({}, extObj);
    updatedExt['design-system.figma-value'] = figmaVal.value;
    updated['$extensions'] = updatedExt;
    return updated;
  }

  const srcStr = String(srcVal(existingEntry));

  // Color tokens: Figma colors arrive as hex strings from figmaColorToHex().
  const figmaColor = parseColorStr(String(figmaVal.value));
  if (figmaColor) {
    updated[key] = formatColor(figmaColor, srcStr);
    return updated;
  }

  // Dimension tokens: Figma FLOAT bare number -> re-attach source unit.
  const dim = parseDimension(srcStr);
  if (dim && dim.unit) {
    const n = typeof figmaVal.value === 'number' ? figmaVal.value : parseFloat(figmaVal.value);
    updated[key] = String(n) + dim.unit;
    return updated;
  }

  // Opacity tokens: Figma uses 0–100 scale, repo uses 0–1 (L7).
  if (typeof figmaVal.value === 'number' && existingEntry['$type'] === 'opacity') {
    const dp = decimalPlaces(srcStr);
    updated[key] = (figmaVal.value / 100).toFixed(dp);
    return updated;
  }

  // Pure number (non-opacity): round to source string's decimal precision.
  if (typeof figmaVal.value === 'number') {
    const dp = decimalPlaces(srcStr);
    updated[key] = figmaVal.value.toFixed(dp);
    return updated;
  }

  updated[key] = figmaVal.value;
  return updated;
}

/**
 * Compare a Figma value against a source entry; true iff they represent the same
 * token value after accounting for format differences (round-trip equal).
 *
 * Priority:
 *   1. Alias        — Figma slash-path vs source dot-path in {}
 *   2. $extensions  — compare against extension field, not $value
 *   3. Color        — parse both to RGBA, compare with 8-bit tolerance
 *   4. Dimension    — strip unit, compare as floats
 *   5. Pure number  — round figma float to source precision, compare
 *   6. Fallback     — lowercased string equality
 */
function figmaValMatchesSrc(figmaVal, existingEntry) {
  if (figmaVal.alias) {
    const expected = '{' + figmaVal.alias.replace(/\//g, '.') + '}';
    return normSrcVal(existingEntry) === expected.toLowerCase();
  }

  const extObj = existingEntry['$extensions'];
  const ext = extObj && extObj['design-system.figma-value'];
  if (ext !== undefined) {
    return String(ext).trim().toLowerCase() === String(figmaVal.value).trim().toLowerCase();
  }

  const srcStr = String(srcVal(existingEntry));

  // Color: parse both sides and compare numerically.
  const figmaColor = parseColorStr(String(figmaVal.value));
  if (figmaColor) {
    const srcColor = parseColorStr(srcStr);
    return srcColor ? colorsEqual(figmaColor, srcColor) : false;
  }

  // Dimension with unit: compare as floats.
  const dim = parseDimension(srcStr);
  if (dim && dim.unit) {
    const n = typeof figmaVal.value === 'number' ? figmaVal.value : parseFloat(String(figmaVal.value));
    return Math.abs(dim.num - n) < 0.0001;
  }

  // Opacity tokens: Figma uses 0–100 scale, repo uses 0–1 (L7).
  if (typeof figmaVal.value === 'number' && existingEntry['$type'] === 'opacity') {
    const dp = decimalPlaces(srcStr);
    return parseFloat((figmaVal.value / 100).toFixed(dp)) === parseFloat(srcStr);
  }

  // Pure number (non-opacity): round Figma float32 to source precision.
  if (typeof figmaVal.value === 'number') {
    const dp = decimalPlaces(srcStr);
    return parseFloat(figmaVal.value.toFixed(dp)) === parseFloat(srcStr);
  }

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
    const text = atob(meta.content.replace(/\n/g, ''));
    const json = JSON.parse(text);
    result[name] = { json, sha: meta.sha, path, flat: flattenTokens(json), text };
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

/** Escape a value for use as a literal in a RegExp. */
function escapeRe(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Return the JSON literal for a token value: strings are quoted, numbers/booleans are bare. */
function toJsonLiteral(val) {
  return typeof val === 'string' ? JSON.stringify(val) : String(val);
}

/**
 * Patch the $value field on a single-line token line.
 * Only replaces the value bytes; indentation, $type, $description, etc. are untouched.
 */
function patchSingleLine(line, change) {
  const vk = ('$value' in change.new) ? '$value' : 'value';
  const oldLit = toJsonLiteral(change.old[vk]);
  const newLit = toJsonLiteral(change.new[vk]);
  if (oldLit === newLit) return line;
  return line.replace(
    new RegExp('"(?:\\$value|value)"\\s*:\\s*' + escapeRe(oldLit)),
    '"$value": ' + newLit
  );
}

/**
 * Patch a single inner line of a multi-line token block.
 * Handles the "$value" line and the "$extensions" line.
 */
function patchMultiLine(line, change) {
  const vk = ('$value' in change.new) ? '$value' : 'value';
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
    const extObj = change.old['$extensions'];
    const oldExt = extObj && extObj['design-system.figma-value'];
    const newExt = change.new['$extensions'] && change.new['$extensions']['design-system.figma-value'];
    if (oldExt !== undefined && toJsonLiteral(oldExt) !== toJsonLiteral(newExt)) {
      return line.replace(
        new RegExp('"design-system\\.figma-value"\\s*:\\s*' + escapeRe(toJsonLiteral(oldExt))),
        '"design-system.figma-value": ' + toJsonLiteral(newExt)
      );
    }
  }

  return line;
}

/**
 * Apply token changes to the original source file text, editing ONLY the
 * specific bytes that changed.  Every other byte — indentation, key order,
 * trailing commas, compact one-liner style, $description, sibling fields —
 * is left exactly as-is.
 *
 * Algorithm: line-by-line scan with a pathStack that mirrors the JSON nesting.
 *   • Single-line tokens ("key": { … })  → patchSingleLine on that line.
 *   • Multi-line token blocks ("key": {\n  "$value": …\n  …\n}) →
 *     lookahead detects the opening, then patchMultiLine on each inner line.
 *   • Shadow $value arrays ("$value": […]) → arrayDepth counter prevents
 *     the closing ] from being mistaken for a scope-closing }.
 *   • Empty changesMap → original text returned verbatim (zero byte change).
 */
function applyChangesToText(originalText, changesMap) {
  if (changesMap.size === 0) return originalText;

  const lines = originalText.split('\n');
  const result = lines.slice();
  const pathStack = [];
  let activeChange = null; // non-null while inside a multi-line token block
  let arrayDepth = 0;      // counts unmatched '[' inside $value arrays

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    // ── Closing brace or bracket ─────────────────────────────────────────────
    if (/^[}\]],?$/.test(trimmed)) {
      if (trimmed[0] === ']') {
        if (arrayDepth > 0) arrayDepth--;
        // Never pop pathStack for ']' — arrays don't open a new path segment.
      } else {
        if (activeChange) activeChange = null;
        if (pathStack.length > 0) pathStack.pop();
      }
      continue;
    }

    // ── Key-value line ───────────────────────────────────────────────────────
    const m = trimmed.match(/^"([^"]+)"\s*:\s*([\s\S]*)/);
    if (!m) continue;

    const key = m[1];
    const rest = m[2].trimEnd();

    // Inside a multi-line token block: patch $ fields as they appear.
    if (activeChange && key.startsWith('$')) {
      if (rest === '[') arrayDepth++;
      const patched = patchMultiLine(line, activeChange);
      if (patched !== line) result[i] = patched;
      continue;
    }

    // Skip $ keys when not inside an active block (track array depth for $value:[...]).
    if (key.startsWith('$')) {
      if (rest === '[') arrayDepth++;
      continue;
    }

    const fullPath = pathStack.length > 0 ? pathStack.join('/') + '/' + key : key;
    const change = changesMap.get(fullPath);

    // ── Single-line token: "key": { "$value": …, … } ───────────────────────
    if (rest.startsWith('{') && /\}[,]?\s*$/.test(rest)) {
      if (change) result[i] = patchSingleLine(line, change);
      continue;
    }

    // ── Multi-line object opening: "key": { ─────────────────────────────────
    if (rest === '{') {
      pathStack.push(key);
      // Lookahead: if the next non-empty line starts with "$", this is a
      // multi-line token block (not a nested group of tokens).
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

    // ── Array opening for a non-$ key: "key": [ ─────────────────────────────
    if (rest === '[') {
      pathStack.push(key);
      arrayDepth++;
      continue;
    }
  }

  return result.join('\n');
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

async function ghEnableAutoMerge(prNodeId) {
  const query = 'mutation M($id:ID!){enablePullRequestAutoMerge(input:{pullRequestId:$id,mergeMethod:SQUASH}){pullRequest{autoMergeRequest{enabledAt}}}}';
  const resp = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + activePat,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: query, variables: { id: prNodeId } }),
  });
  if (!resp.ok) throw new Error('GitHub ' + resp.status + ' enabling auto-merge');
  const data = await resp.json();
  if (data.errors && data.errors.length) {
    throw new Error(data.errors.map(function(e) { return e.message; }).join('; '));
  }
}

/* ── Git Data API helpers (used by Export Assets for an atomic multi-file commit) ── */

async function ghGetCommitTree(commitSha) {
  const resp = await fetch('https://api.github.com/repos/' + REPO + '/git/commits/' + commitSha, {
    headers: {
      'Authorization': 'Bearer ' + activePat,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!resp.ok) throw new Error('GitHub ' + resp.status + ' getting base commit tree');
  return (await resp.json()).tree.sha;
}

async function ghCreateBlob(content) {
  const resp = await fetch('https://api.github.com/repos/' + REPO + '/git/blobs', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + activePat,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ content: btoa(unescape(encodeURIComponent(content))), encoding: 'base64' }),
  });
  if (!resp.ok) throw new Error('GitHub ' + resp.status + ' creating blob');
  return (await resp.json()).sha;
}

async function ghCreateTree(baseTreeSha, treeEntries) {
  const resp = await fetch('https://api.github.com/repos/' + REPO + '/git/trees', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + activePat,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
  });
  if (!resp.ok) throw new Error('GitHub ' + resp.status + ' creating tree');
  return (await resp.json()).sha;
}

async function ghCreateCommitObj(message, treeSha, parentSha) {
  const resp = await fetch('https://api.github.com/repos/' + REPO + '/git/commits', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + activePat,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ message, tree: treeSha, parents: [parentSha] }),
  });
  if (!resp.ok) throw new Error('GitHub ' + resp.status + ' creating commit object');
  return (await resp.json()).sha;
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
    const content = applyChangesToText(srcFile.text, fileChanges);
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
    'CI will automatically regenerate and commit the build output; the PR auto-merges when green.',
    '',
    'After it lands on main, sync the new `tokens.figma-variables.json` back to Figma via **Sync tokens**.',
    '',
    '> Generated by the Design System Sync Figma plugin on ' + now.toLocaleDateString() + '.',
  ].join('\n');

  const prTitle = 'tokens(figma-push): ' + totalTokens + ' token' +
    (totalTokens > 1 ? 's' : '') + ' from Figma Foundations';
  log('Opening PR…', 'muted');
  const pr = await ghCreatePR(branch, prTitle, prBody);

  log('Enabling auto-merge…', 'muted');
  try {
    await ghEnableAutoMerge(pr.node_id);
  } catch (e) {
    log('Auto-merge not enabled: ' + e.message, 'warn');
  }

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
   EXPORT ASSETS
   Three lanes: icon/* → icons SVG, illustration/* → illustrations SVG,
   image/* → illustrations raster-src PNG.
   ══════════════════════════════════════════════════════════ */

/**
 * Optimize an SVG exported from Figma for the ICON lane:
 *  - Strip width/height, id/class/data-* from all elements.
 *  - Detect distinct fill/stroke colors; replace with currentColor if single-color.
 *  - Flag multi-color icons without altering their colors.
 * Returns { svg, warnings: string[], multiColor: bool } or { error: string }.
 */
function optimizeSVG(svgStr) {
  const s = svgStr.trim();
  if (!s) return { error: 'Empty SVG' };

  const colorAttrRe = /(fill|stroke|stop-color|color)="(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))"/g;
  const neutral = new Set(['none', 'transparent', 'currentcolor', 'inherit']);
  const colors = new Set();
  let m;
  while ((m = colorAttrRe.exec(s)) !== null) {
    const v = m[2].toLowerCase();
    if (neutral.has(v)) continue;
    if (/^rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)$/.test(v)) continue;
    colors.add(v);
  }

  const multiColor = colors.size > 1;
  const warnings = [];
  if (multiColor) {
    warnings.push('multi-color (' + [...colors].slice(0, 3).join(', ') + (colors.size > 3 ? ', …' : '') + ')');
  }

  const vbMatch = s.match(/viewBox="([^"]*)"/);
  if (!vbMatch) {
    warnings.push('missing viewBox (expected "0 0 24 24")');
  } else if (vbMatch[1] !== '0 0 24 24') {
    warnings.push('viewBox "' + vbMatch[1] + '" ≠ "0 0 24 24"');
  }

  let result = s.replace(/<svg([^>]*)>/, (_, attrs) => {
    attrs = attrs.replace(/\s+width="[^"]*"/g, '');
    attrs = attrs.replace(/\s+height="[^"]*"/g, '');
    attrs = attrs.replace(/\s+id="[^"]*"/g, '');
    attrs = attrs.replace(/\s+data-[\w-]+="[^"]*"/g, '');
    return '<svg' + attrs + '>';
  });
  result = result.replace(/\s+(?:id|class|data-[\w-]+)="[^"]*"/g, '');

  if (!multiColor) {
    result = result.replace(
      /(fill|stroke|stop-color|color)="(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))"/g,
      (match, attr, val) => {
        const v = val.toLowerCase();
        if (neutral.has(v)) return match;
        if (/^rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)$/.test(v)) return match;
        return attr + '="currentColor"';
      }
    );
  }

  if (!result.endsWith('\n')) result += '\n';
  return { svg: result, warnings, multiColor };
}

/**
 * Clean an SVG for the ILLUSTRATION lane:
 *  - Strip editor metadata/namespaces/comments but NEVER touch colors.
 *  - Remove width/height from the root <svg> (the build.mjs consumer controls size).
 *  - Strip id/class/data-* from all elements.
 * Returns { svg, warnings: string[] } or { error: string }.
 */
function cleanIllustrationSVG(svgStr) {
  let s = svgStr.trim();
  if (!s) return { error: 'Empty SVG' };

  s = s.replace(/<\?xml[^?]*\?>\s*/gi, '');
  s = s.replace(/<!DOCTYPE[^>]*>\s*/gi, '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
  s = s.replace(/<title>[\s\S]*?<\/title>/gi, '');
  s = s.replace(/<desc>[\s\S]*?<\/desc>/gi, '');
  s = s.replace(/\s+(?:inkscape|sodipodi|sketch|dc|cc|rdf):[\w-]+="[^"]*"/g, '');
  s = s.replace(/\s+xmlns:(?:inkscape|sodipodi|sketch|xlink|dc|cc|rdf)="[^"]*"/g, '');

  // Strip width/height from root <svg> (keep viewBox and everything else)
  s = s.replace(/<svg([^>]*)>/, (_, attrs) => {
    attrs = attrs.replace(/\s+width="[^"]*"/g, '');
    attrs = attrs.replace(/\s+height="[^"]*"/g, '');
    return '<svg' + attrs + '>';
  });

  // Strip id/class/data-* from inner elements (not the root svg open tag we just handled)
  // Use a replace that skips the first occurrence since we've already handled <svg ...>
  let svgTagDone = false;
  s = s.replace(/<[^/][^>]*>/g, (tag) => {
    if (!svgTagDone && tag.startsWith('<svg')) { svgTagDone = true; return tag; }
    return tag.replace(/\s+(?:id|class|data-[\w-]+)="[^"]*"/g, '');
  });

  const warnings = [];
  if (!s.includes('viewBox=')) warnings.push('missing viewBox');

  if (!s.endsWith('\n')) s += '\n';
  return { svg: s, warnings };
}

/**
 * Pure-JS SHA-1 — fallback for contexts where crypto.subtle is unavailable
 * (some Figma iframe environments). Operates on a Uint8Array; returns a 40-char hex string.
 * Only used as a fallback; crypto.subtle is preferred when available.
 */
function sha1PureJs(data) {
  const ml = data.length;
  // Round (ml + 1 + 8) up to the next multiple of 64 for SHA-1 padding.
  const totalLen = ((ml + 9 + 63) & ~63) >>> 0;
  const msg = new Uint8Array(totalLen);
  msg.set(data);
  msg[ml] = 0x80;
  // 64-bit big-endian bit length at the end (files < 512 MB; upper 32 bits stay 0)
  const bl = (ml * 8) >>> 0;
  msg[totalLen - 4] = (bl >>> 24) & 0xff;
  msg[totalLen - 3] = (bl >>> 16) & 0xff;
  msg[totalLen - 2] = (bl >>>  8) & 0xff;
  msg[totalLen - 1] =  bl         & 0xff;

  // SHA-1 constants (pre-applied |0 so all are signed 32-bit)
  const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0];
  let h0 = 0x67452301, h1 = 0xefcdab89 | 0, h2 = 0x98badcfe | 0,
      h3 = 0x10325476, h4 = 0xc3d2e1f0 | 0;

  for (let i = 0; i < totalLen; i += 64) {
    const W = new Int32Array(80);
    for (let j = 0; j < 16; j++) {
      W[j] = (msg[i + j*4] << 24) | (msg[i + j*4 + 1] << 16) |
              (msg[i + j*4 + 2] << 8) | msg[i + j*4 + 3];
    }
    for (let j = 16; j < 80; j++) {
      const x = W[j-3] ^ W[j-8] ^ W[j-14] ^ W[j-16];
      W[j] = (x << 1) | (x >>> 31);
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let j = 0; j < 80; j++) {
      let f, k;
      if      (j < 20) { f = (b & c) | (~b & d);            k = K[0]; }
      else if (j < 40) { f = b ^ c ^ d;                     k = K[1]; }
      else if (j < 60) { f = (b & c) | (b & d) | (c & d);  k = K[2]; }
      else             { f = b ^ c ^ d;                     k = K[3]; }
      const t = (((a << 5) | (a >>> 27)) + f + e + k + W[j]) | 0;
      e = d; d = c; c = (b << 30) | (b >>> 2); b = a; a = t;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
  }
  return [h0, h1, h2, h3, h4].map(n => (n >>> 0).toString(16).padStart(8, '0')).join('');
}

/**
 * Core helper: SHA1("blob " + byteLen + "\0" + bytes).
 * Prefers crypto.subtle (hardware-accelerated); falls back to sha1PureJs when
 * crypto.subtle is absent (some Figma iframe environments) or throws.
 * Always operates on bytes, so the result is identical for text (UTF-8 encoded)
 * and binary (PNG etc.) — Git uses byte length in the blob header, not char count.
 */
async function gitBlobShaBytes(bytes) {
  const enc = new TextEncoder();
  const header = enc.encode('blob ' + bytes.length + '\0');
  const combined = new Uint8Array(header.length + bytes.length);
  combined.set(header, 0);
  combined.set(bytes, header.length);
  if (typeof crypto !== 'undefined' && crypto?.subtle) {
    try {
      const buf = await crypto.subtle.digest('SHA-1', combined);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (_) { /* fall through */ }
  }
  return sha1PureJs(combined);
}

/** Git blob SHA for a UTF-8 string (SVG source). */
async function computeGitBlobSha(content) {
  return gitBlobShaBytes(new TextEncoder().encode(content));
}

/** Git blob SHA for raw binary bytes (PNG etc.). */
async function computeGitBlobShaBytes(bytes) {
  return gitBlobShaBytes(bytes);
}

/**
 * Upload a binary blob (Uint8Array) to the GitHub Git Data API.
 * Encodes as base64 in chunks to avoid call-stack overflow on large files.
 */
async function ghCreateBinaryBlob(bytes) {
  let b64 = '';
  const CHUNK = 4096;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    b64 += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK, bytes.length)));
  }
  b64 = btoa(b64);
  const resp = await fetch('https://api.github.com/repos/' + REPO + '/git/blobs', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + activePat,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ content: b64, encoding: 'base64' }),
  });
  if (!resp.ok) throw new Error('GitHub ' + resp.status + ' creating binary blob');
  return (await resp.json()).sha;
}

/** Render one diff lane (icons / illustrations / images) as HTML rows. */
function renderAssetLane(laneTitle, ext, diff) {
  const { add, update, remove, unchanged, errors } = diff;
  const total = add.length + update.length + remove.length;
  let html = '<div class="ei-lane">';
  html += '<div class="ei-lane-title">' + esc(laneTitle) + '</div>';

  // Summary pills
  html += '<div class="diff-summary">';
  if (total === 0 && errors.length === 0) {
    html += '<span class="pill ok">✓ in sync</span>';
    if (unchanged.length) html += '<span class="pill muted-pill">' + unchanged.length + ' unchanged</span>';
  } else {
    if (add.length)       html += '<span class="pill added">'     + add.length    + ' to add</span>';
    if (update.length)    html += '<span class="pill changed">'   + update.length + ' to update</span>';
    if (remove.length)    html += '<span class="pill removed">'   + remove.length + ' to remove</span>';
    if (unchanged.length) html += '<span class="pill muted-pill">' + unchanged.length + ' unchanged</span>';
    if (errors.length)    html += '<span class="pill removed">'   + errors.length + ' error(s)</span>';
  }
  html += '</div>';

  // Multi-color banner (icons only — illustrations always preserve colors)
  const multiColorItems = [...add, ...update].filter(i => i.multiColor);
  if (multiColorItems.length) {
    html += '<div class="ei-mc-banner">⚠ <strong>' + multiColorItems.length +
      ' multi-color</strong> — colors NOT replaced with <code>currentColor</code>. Review manually.<br>' +
      multiColorItems.map(i => '<code>' + esc(i.name) + '</code>').join(', ') + '</div>';
  }

  const rowHtml = (item, cls) => {
    let r = '<div class="ei-row"><span class="var-name ' + cls + ' ei-name">' + esc(item.name) + '.' + ext + '</span>';
    if (item.multiColor) r += '<span class="ei-warn">⚠ multi-color</span>';
    else if (item.warnings && item.warnings.length) r += '<span class="ei-warn">' + esc(item.warnings.join('; ')) + '</span>';
    return r + '</div>';
  };

  if (add.length) {
    html += '<div class="ei-section"><div class="ei-section-title">Add (' + add.length + ')</div>';
    html += add.slice(0, 30).map(i => rowHtml(i, 'added')).join('');
    if (add.length > 30) html += '<div class="diff-more">… ' + (add.length - 30) + ' more</div>';
    html += '</div>';
  }
  if (update.length) {
    html += '<div class="ei-section"><div class="ei-section-title">Update (' + update.length + ')</div>';
    html += update.slice(0, 30).map(i => rowHtml(i, 'changed')).join('');
    if (update.length > 30) html += '<div class="diff-more">… ' + (update.length - 30) + ' more</div>';
    html += '</div>';
  }
  if (remove.length) {
    html += '<details class="diff-collapse"><summary>Remove (' + remove.length + ') — in repo, not in Figma</summary>';
    html += remove.slice(0, 30).map(i =>
      '<div class="ei-row"><span class="var-name removed ei-name">' + esc(i.name) + '.' + ext + '</span></div>'
    ).join('');
    if (remove.length > 30) html += '<div class="diff-more">… ' + (remove.length - 30) + ' more</div>';
    html += '</details>';
  }
  if (errors.length) {
    html += '<details class="diff-collapse"><summary>Errors — skipped (' + errors.length + ')</summary>';
    html += errors.map(i =>
      '<div class="ei-row"><span class="var-name removed ei-name">' + esc(i.name) + '</span>' +
      '<span class="ei-warn">' + esc(i.exportError || 'Unknown error') + '</span></div>'
    ).join('');
    html += '</details>';
  }

  html += '</div>';
  return html;
}

function renderExportAssetsPreview(state) {
  const { icons, illustrations, images } = state;
  const totalChanges =
    icons.add.length + icons.update.length + icons.remove.length +
    illustrations.add.length + illustrations.update.length + illustrations.remove.length +
    images.add.length + images.update.length + images.remove.length;
  const totalErrors = icons.errors.length + illustrations.errors.length + images.errors.length;

  let html = '';
  if (totalChanges === 0 && totalErrors === 0) {
    html += '<div class="diff-summary"><span class="pill ok">✓ All assets in sync — nothing to export</span></div>';
  }

  const hasIcons  = icons.add.length + icons.update.length + icons.remove.length + icons.unchanged.length + icons.errors.length > 0;
  const hasIllu   = illustrations.add.length + illustrations.update.length + illustrations.remove.length + illustrations.unchanged.length + illustrations.errors.length > 0;
  const hasImages = images.add.length + images.update.length + images.remove.length + images.unchanged.length + images.errors.length > 0;

  if (hasIcons)  html += renderAssetLane('Icons → packages/icons/svg/',               'svg', icons);
  if (hasIllu)   html += renderAssetLane('Illustrations → packages/illustrations/svg/', 'svg', illustrations);
  if (hasImages) html += renderAssetLane('Images → packages/illustrations/raster-src/', 'png', images);

  if (!hasIcons && !hasIllu && !hasImages) {
    html += '<p style="font-size:11px;color:var(--fg-muted);margin:8px 0 0">No <code>icon/*</code>, <code>illustration/*</code>, or <code>image/*</code> components found in this file.</p>';
  }

  return html;
}

function closeExportAssetsPanel() {
  document.getElementById('export-assets-panel').hidden = true;
  exportAssetsState = null;
  document.getElementById('export-assets-confirm').disabled = true;
  document.getElementById('export-assets-scan-btn').disabled = false;
  document.getElementById('export-assets-preview-area').innerHTML =
    '<p style="font-size:11px;color:var(--fg-muted);margin:0">Click <strong>Scan</strong> to export assets and compare against the repo.</p>';
  setBusy(false);
}

async function executeExportAssetsPR() {
  const state = exportAssetsState;
  const now = new Date();
  const ts = now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
  const branch = 'figma/export-assets-' + ts;

  log('Getting main branch SHA…', 'muted');
  const mainSha = await ghGetMainSha();

  log('Getting base tree…', 'muted');
  const baseTreeSha = await ghGetCommitTree(mainSha);

  const treeEntries = [];
  const prParts = [];

  // ── Icons lane ──
  const iconAddUpdate = [...state.icons.add, ...state.icons.update];
  for (const item of iconAddUpdate) {
    log('Blob: icons/' + item.name + '.svg…', 'muted');
    const blobSha = await ghCreateBlob(item.svg);
    treeEntries.push({ path: 'packages/icons/svg/' + item.name + '.svg', mode: '100644', type: 'blob', sha: blobSha });
  }
  for (const item of state.icons.remove) {
    treeEntries.push({ path: 'packages/icons/svg/' + item.name + '.svg', mode: '100644', type: 'blob', sha: null });
  }
  if (state.icons.add.length + state.icons.update.length + state.icons.remove.length > 0) {
    const parts = [];
    if (state.icons.add.length)    parts.push('add ' + state.icons.add.map(i => i.name).join(', '));
    if (state.icons.update.length) parts.push('update ' + state.icons.update.map(i => i.name).join(', '));
    if (state.icons.remove.length) parts.push('remove ' + state.icons.remove.map(i => i.name).join(', '));
    prParts.push('icons: ' + parts.join('; '));
  }

  // ── Illustrations lane ──
  const illuAddUpdate = [...state.illustrations.add, ...state.illustrations.update];
  for (const item of illuAddUpdate) {
    log('Blob: illustrations/' + item.name + '.svg…', 'muted');
    const blobSha = await ghCreateBlob(item.svg);
    treeEntries.push({ path: 'packages/illustrations/svg/' + item.name + '.svg', mode: '100644', type: 'blob', sha: blobSha });
  }
  for (const item of state.illustrations.remove) {
    treeEntries.push({ path: 'packages/illustrations/svg/' + item.name + '.svg', mode: '100644', type: 'blob', sha: null });
  }
  if (state.illustrations.add.length + state.illustrations.update.length + state.illustrations.remove.length > 0) {
    const parts = [];
    if (state.illustrations.add.length)    parts.push('add ' + state.illustrations.add.map(i => i.name).join(', '));
    if (state.illustrations.update.length) parts.push('update ' + state.illustrations.update.map(i => i.name).join(', '));
    if (state.illustrations.remove.length) parts.push('remove ' + state.illustrations.remove.map(i => i.name).join(', '));
    prParts.push('illustrations: ' + parts.join('; '));
  }

  // ── Images lane (PNG — binary blob) ──
  const imgAddUpdate = [...state.images.add, ...state.images.update];
  for (const item of imgAddUpdate) {
    log('Binary blob: images/' + item.name + '.png…', 'muted');
    const blobSha = await ghCreateBinaryBlob(item.bytes);
    treeEntries.push({ path: 'packages/illustrations/raster-src/' + item.name + '.png', mode: '100644', type: 'blob', sha: blobSha });
  }
  for (const item of state.images.remove) {
    treeEntries.push({ path: 'packages/illustrations/raster-src/' + item.name + '.png', mode: '100644', type: 'blob', sha: null });
  }
  if (state.images.add.length + state.images.update.length + state.images.remove.length > 0) {
    const parts = [];
    if (state.images.add.length)    parts.push('add ' + state.images.add.map(i => i.name).join(', '));
    if (state.images.update.length) parts.push('update ' + state.images.update.map(i => i.name).join(', '));
    if (state.images.remove.length) parts.push('remove ' + state.images.remove.map(i => i.name).join(', '));
    prParts.push('images: ' + parts.join('; '));
  }

  if (treeEntries.length === 0) throw new Error('No file changes to commit');

  log('Creating tree (' + treeEntries.length + ' entries)…', 'muted');
  const newTreeSha = await ghCreateTree(baseTreeSha, treeEntries);

  const commitMsg = 'chore(assets): ' + prParts.join(' | ');
  log('Creating commit…', 'muted');
  const commitSha = await ghCreateCommitObj(commitMsg, newTreeSha, mainSha);

  log('Creating branch ' + branch + '…', 'muted');
  await ghCreateBranch(branch, commitSha);

  // ── PR body ──
  const iconTotal = state.icons.add.length + state.icons.update.length + state.icons.remove.length;
  const illuTotal = state.illustrations.add.length + state.illustrations.update.length + state.illustrations.remove.length;
  const imgTotal  = state.images.add.length  + state.images.update.length  + state.images.remove.length;
  const grandTotal = iconTotal + illuTotal + imgTotal;

  const buildTable = (label, target, lane, ext) => {
    if (!lane.add.length && !lane.update.length && !lane.remove.length) return '';
    const rows = [
      lane.add.length    ? '| ➕ | ' + lane.add.map(i    => '`' + i.name + '.' + ext + '`').join(', ') + ' |' : null,
      lane.update.length ? '| ✏️ | ' + lane.update.map(i => '`' + i.name + '.' + ext + '`').join(', ') + ' |' : null,
      lane.remove.length ? '| 🗑️ | ' + lane.remove.map(i => '`' + i.name + '.' + ext + '`').join(', ') + ' |' : null,
    ].filter(Boolean);
    return [
      '### ' + label + ' → `' + target + '`',
      '| | Files |',
      '|:---:|---|',
      ...rows,
      '',
    ].join('\n');
  };

  const multiColorNames = [...state.icons.add, ...state.icons.update].filter(i => i.multiColor).map(i => '`' + i.name + '`');

  const prBody = [
    '## Export Assets — Figma → GitHub',
    '',
    '**Source:** Kijani — Assets Figma file · **Total changes:** ' + grandTotal + ' file' + (grandTotal !== 1 ? 's' : ''),
    '',
    buildTable('Icons', 'packages/icons/svg/', state.icons, 'svg'),
    buildTable('Illustrations', 'packages/illustrations/svg/', state.illustrations, 'svg'),
    buildTable('Images', 'packages/illustrations/raster-src/', state.images, 'png'),
    multiColorNames.length
      ? '> ⚠️ **Multi-color icons** (colors not replaced with `currentColor`): ' + multiColorNames.join(', ') + '.\n'
      : '',
    'CI workflows regenerate web + RN components from the source files and commit them automatically; the PR auto-merges when green.',
    '',
    '> Generated by the Design System Sync Figma plugin on ' + now.toLocaleDateString() + '.',
  ].filter(s => s !== null).join('\n');

  const prTitle = 'chore(assets): export ' + grandTotal + ' asset' + (grandTotal !== 1 ? 's' : '') + ' from Figma';
  log('Opening PR…', 'muted');
  const pr = await ghCreatePR(branch, prTitle, prBody);

  log('Enabling auto-merge…', 'muted');
  try { await ghEnableAutoMerge(pr.node_id); } catch (e) { log('Auto-merge: ' + e.message, 'warn'); }

  return pr;
}

/* ══════════════════════════════════════════════════════════
   ENSURE TEXT STYLES
   ══════════════════════════════════════════════════════════ */

let ensureTsPreviewData = null;

function renderEnsureTextStylesPreview(preview) {
  if (preview.error) return '<div class="panel-error">' + esc(preview.error) + '</div>';

  const s = preview.summary;
  let html = '<div class="ets-summary">';
  if (s.create > 0)         html += '<span class="pill added">'   + s.create   + ' to create</span>';
  if (s.update > 0)         html += '<span class="pill changed">' + s.update   + ' to update</span>';
  if (s.alreadyCorrect > 0) html += '<span class="pill ok">'      + s.alreadyCorrect + ' already correct</span>';
  if (s.skippedMissing > 0) html += '<span class="pill removed">' + s.skippedMissing + ' skipped (missing vars)</span>';
  if (s.create === 0 && s.update === 0 && s.skippedMissing === 0) {
    html += '<span class="pill ok">✓ All styles already bound correctly</span>';
  }
  html += '</div>';

  if (preview.rows.length > 0) {
    html += '<table class="ets-table"><thead><tr>' +
      '<th>Action</th><th>Style</th><th>Variables (Foundations)</th>' +
      '</tr></thead><tbody>';
    for (let i = 0; i < preview.rows.length; i++) {
      const row = preview.rows[i];
      const cls = row.action === 'create' ? 'create' : row.action === 'update' ? 'update' : 'correct';
      const lbl = row.action === 'already-correct' ? '✓ correct' : row.action;
      const vn  = row.varNames;
      html += '<tr>';
      html += '<td><span class="ets-badge ' + cls + '">' + esc(lbl) + '</span></td>';
      html += '<td class="ets-style">' + esc(row.styleName) + '</td>';
      html += '<td>';
      html += '<div class="ets-var">size → ' + esc(vn.size)   + '</div>';
      html += '<div class="ets-var">line → ' + esc(vn.line)   + '</div>';
      html += '<div class="ets-var">weight → ' + esc(vn.weight) + '</div>';
      html += '<div class="ets-var">family → ' + esc(vn.family) + '</div>';
      if (vn.spacing) html += '<div class="ets-var">spacing → ' + esc(vn.spacing) + ' <em>(literal)</em></div>';
      html += '</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
  }

  if (preview.missingVars && preview.missingVars.length > 0) {
    html += '<div class="ets-missing"><strong>' + preview.missingVars.length + ' role' +
      (preview.missingVars.length > 1 ? 's' : '') + ' skipped — vars not in library:</strong>';
    for (let j = 0; j < preview.missingVars.length; j++) {
      const mv = preview.missingVars[j];
      html += '<div>' + esc(mv.styleName) + ': ' + mv.missing.map(function(m) { return esc(m); }).join(', ') + '</div>';
    }
    html += '</div>';
  }

  return html;
}

function closeEnsureTsPanel() {
  document.getElementById('ensure-ts-panel').hidden = true;
  ensureTsPreviewData = null;
  document.getElementById('ensure-ts-apply').disabled = true;
  document.getElementById('ensure-ts-preview-btn').disabled = false;
  document.getElementById('ensure-ts-cancel').disabled = false;
  document.getElementById('ensure-ts-preview-area').innerHTML =
    '<p style="font-size:11px;color:var(--fg-muted);margin:0">Click <strong>Preview</strong> to check existing styles and show what will change. Foundations must be enabled as a library in this file.</p>';
  setBusy(false);
}

document.getElementById('ensure-text-styles').addEventListener('click', function() {
  document.getElementById('ensure-ts-panel').hidden = false;
  setBusy(true);
  parent.postMessage({ pluginMessage: { type: 'get-file-info' } }, '*');
});

document.getElementById('close-ensure-ts').addEventListener('click', closeEnsureTsPanel);
document.getElementById('ensure-ts-cancel').addEventListener('click', closeEnsureTsPanel);

document.getElementById('ensure-ts-preview-btn').addEventListener('click', function() {
  const platform = document.querySelector('[name="ets-platform"]:checked').value;
  document.getElementById('ensure-ts-preview-area').innerHTML = '<div class="line muted">Computing preview…</div>';
  document.getElementById('ensure-ts-apply').disabled = true;
  ensureTsPreviewData = null;
  setBusy(true);
  parent.postMessage({ pluginMessage: { type: 'ensure-text-styles-preview', platform: platform } }, '*');
});

document.getElementById('ensure-ts-apply').addEventListener('click', function() {
  if (!ensureTsPreviewData) return;
  const platform = document.querySelector('[name="ets-platform"]:checked').value;
  document.getElementById('ensure-ts-apply').disabled = true;
  document.getElementById('ensure-ts-preview-btn').disabled = true;
  document.getElementById('ensure-ts-cancel').disabled = true;
  log('Applying Text Styles for ' + platform + '…', 'muted');
  setBusy(true);
  parent.postMessage({ pluginMessage: { type: 'ensure-text-styles-apply', platform: platform } }, '*');
});

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

/* ── Export Assets event handlers ── */

document.getElementById('btn-export-assets').addEventListener('click', () => {
  document.getElementById('export-assets-panel').hidden = false;
  setBusy(true);
});

document.getElementById('close-export-assets').addEventListener('click', closeExportAssetsPanel);
document.getElementById('export-assets-cancel').addEventListener('click', closeExportAssetsPanel);

document.getElementById('export-assets-scan-btn').addEventListener('click', () => {
  document.getElementById('export-assets-scan-btn').disabled = true;
  document.getElementById('export-assets-confirm').disabled = true;
  document.getElementById('export-assets-preview-area').innerHTML =
    '<div class="line muted">Exporting icon/*, illustration/*, image/* components from Figma…</div>';
  setBusy(true);
  parent.postMessage({ pluginMessage: { type: 'export-assets-scan' } }, '*');
});

document.getElementById('export-assets-confirm').addEventListener('click', async () => {
  if (!exportAssetsState) return;
  document.getElementById('export-assets-confirm').disabled = true;
  document.getElementById('export-assets-scan-btn').disabled = true;
  document.getElementById('export-assets-cancel').disabled = true;
  log('Creating Export Assets PR…', 'muted');
  try {
    const pr = await executeExportAssetsPR();
    closeExportAssetsPanel();
    log('PR opened: ' + pr.html_url, 'ok');
    const logEl = document.getElementById('log');
    logEl.insertAdjacentHTML('beforeend',
      '<div class="line ok">PR: <a class="pr-link" href="' + esc(pr.html_url) +
      '" target="_blank">' + esc(pr.html_url) + '</a></div>');
    logEl.scrollTop = logEl.scrollHeight;
  } catch (e) {
    log('Export Assets PR failed: ' + e.message, 'err');
    document.getElementById('export-assets-confirm').disabled = false;
    document.getElementById('export-assets-scan-btn').disabled = false;
    document.getElementById('export-assets-cancel').disabled = false;
  }
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
    case 'file-info': {
      // Auto-select platform from file name: "mobile" in name → mobile, else web
      const isMobile = /mobile/i.test(msg.fileName || '');
      document.getElementById(isMobile ? 'ets-mobile' : 'ets-web').checked = true;
      setBusy(false);
      break;
    }
    case 'ensure-ts-preview-result': {
      const prev = msg.preview;
      ensureTsPreviewData = prev;
      document.getElementById('ensure-ts-preview-area').innerHTML = renderEnsureTextStylesPreview(prev);
      if (!prev.error && (prev.summary.create > 0 || prev.summary.update > 0)) {
        document.getElementById('ensure-ts-apply').disabled = false;
      }
      if (prev.fileName) {
        const isMobile2 = /mobile/i.test(prev.fileName);
        document.getElementById(isMobile2 ? 'ets-mobile' : 'ets-web').checked = true;
      }
      setBusy(false);
      break;
    }
    case 'ensure-text-styles-done':
      document.getElementById('ensure-ts-panel').hidden = true;
      ensureTsPreviewData = null;
      log(
        'Ensure Text Styles: ' + (msg.created || 0) + ' created, ' +
        (msg.updated  || 0) + ' updated, ' + (msg.skipped  || 0) + ' already-correct' +
        (msg.failures  > 0 ? ', ' + msg.failures + ' failed' : ''),
        msg.failures > 0 ? 'warn' : 'ok'
      );
      document.getElementById('ensure-ts-apply').disabled = true;
      document.getElementById('ensure-ts-preview-btn').disabled = false;
      document.getElementById('ensure-ts-cancel').disabled = false;
      setBusy(false);
      break;
    case 'prune-preview-result': {
      const prev = msg.preview;
      prunePreviewData = prev;
      document.getElementById('prune-preview-area').innerHTML = renderPrunePreview(prev);
      document.getElementById('prune-preview-btn').disabled = false;
      if (!prev.error && prev.canDelete && prev.canDelete.length > 0) {
        document.getElementById('prune-apply').disabled = false;
      }
      if (!prev.error) {
        log(
          'Prune preview: ' + (prev.canDelete ? prev.canDelete.length : 0) + ' to delete, ' +
          (prev.willSkip ? prev.willSkip.length : 0) + ' skipped (referenced)',
          'info'
        );
      }
      break;
    }
    case 'prune-done':
      closePrunePanel();
      log(
        'Prune: ' + (msg.deleted || 0) + ' deleted' +
        (msg.errors > 0 ? ', ' + msg.errors + ' error(s)' : ''),
        msg.errors > 0 ? 'warn' : 'ok'
      );
      break;
    case 'export-assets-scan-result': {
      (async () => {
        const previewEl = document.getElementById('export-assets-preview-area');
        if (msg.error) {
          previewEl.innerHTML = '<div class="panel-error">' + esc(msg.error) + '</div>';
          document.getElementById('export-assets-scan-btn').disabled = false;
          setBusy(false);
          return;
        }

        previewEl.innerHTML = '<div class="line muted">Processing assets and comparing with repo…</div>';

        // Partition raw assets by prefix
        const rawIcons         = msg.assets.filter(a => a.prefix === 'icon/');
        const rawIllustrations = msg.assets.filter(a => a.prefix === 'illustration/');
        const rawImages        = msg.assets.filter(a => a.prefix === 'image/');

        const emptyLane = () => ({ add: [], update: [], remove: [], unchanged: [], errors: [] });
        const state = {
          icons:         emptyLane(),
          illustrations: emptyLane(),
          images:        emptyLane(),
        };

        // ── Icons lane: SVG → optimizeSVG (currentColor normalization) ──
        const processedIcons = rawIcons.map(asset => {
          if (asset.error) return { name: asset.name, exportError: asset.error };
          const svgStr = new TextDecoder().decode(new Uint8Array(asset.bytes));
          const opt = optimizeSVG(svgStr);
          if (opt.error) return { name: asset.name, exportError: opt.error };
          return { name: asset.name, svg: opt.svg, warnings: opt.warnings, multiColor: opt.multiColor };
        });

        // ── Illustrations lane: SVG → cleanIllustrationSVG (colors preserved) ──
        const processedIllu = rawIllustrations.map(asset => {
          if (asset.error) return { name: asset.name, exportError: asset.error };
          const svgStr = new TextDecoder().decode(new Uint8Array(asset.bytes));
          const opt = cleanIllustrationSVG(svgStr);
          if (opt.error) return { name: asset.name, exportError: opt.error };
          return { name: asset.name, svg: opt.svg, warnings: opt.warnings };
        });

        // ── Images lane: PNG bytes kept as Uint8Array for binary blob upload ──
        const processedImages = rawImages.map(asset => {
          if (asset.error) return { name: asset.name, exportError: asset.error };
          return { name: asset.name, bytes: new Uint8Array(asset.bytes) };
        });

        // Fetch GitHub directory listings for all three paths (404 → empty dir)
        let ghIconFiles = [], ghIlluFiles = [], ghImgFiles = [];
        try {
          const [iconListing, illuListing, imgListing] = await Promise.all([
            ghFetchMeta('packages/icons/svg').then(r => Array.isArray(r) ? r : []),
            ghFetchMeta('packages/illustrations/svg').then(r => Array.isArray(r) ? r : []),
            ghFetchMeta('packages/illustrations/raster-src').then(r => Array.isArray(r) ? r : []),
          ]);
          ghIconFiles = iconListing;
          ghIlluFiles = illuListing;
          ghImgFiles  = imgListing;
        } catch (e) {
          previewEl.innerHTML = '<div class="panel-error">GitHub error: ' + esc(e.message) + '</div>';
          document.getElementById('export-assets-scan-btn').disabled = false;
          setBusy(false);
          return;
        }

        // Build name → SHA maps for each lane
        const buildShaMap = (files, ext) => {
          const m = new Map();
          for (const f of files) {
            if (f.type === 'file' && f.name.endsWith('.' + ext)) m.set(f.name.slice(0, -(ext.length + 1)), f.sha);
          }
          return m;
        };
        const iconShaMap = buildShaMap(ghIconFiles, 'svg');
        const illuShaMap = buildShaMap(ghIlluFiles, 'svg');
        const imgShaMap  = buildShaMap(ghImgFiles, 'png');

        // Categorize all lanes in parallel (per-item try/catch on SHA so one failure
        // can't freeze the whole scan — failing SHA is treated conservatively as "update").
        const iconFigmaNames = new Set();
        const illuFigmaNames = new Set();
        const imgFigmaNames  = new Set();

        await Promise.all([
          // Icons lane: SHA on UTF-8 SVG string
          ...processedIcons.map(async item => {
            if (item.exportError) { state.icons.errors.push(item); return; }
            iconFigmaNames.add(item.name);
            if (!iconShaMap.has(item.name)) {
              state.icons.add.push(item);
            } else {
              try {
                const newSha = await computeGitBlobSha(item.svg);
                if (newSha === iconShaMap.get(item.name)) state.icons.unchanged.push(item);
                else                                       state.icons.update.push(item);
              } catch (e) {
                item.warnings = (item.warnings || []).concat(['sha-check failed: ' + e.message]);
                state.icons.update.push(item);
              }
            }
          }),
          // Illustrations lane: SHA on UTF-8 SVG string
          ...processedIllu.map(async item => {
            if (item.exportError) { state.illustrations.errors.push(item); return; }
            illuFigmaNames.add(item.name);
            if (!illuShaMap.has(item.name)) {
              state.illustrations.add.push(item);
            } else {
              try {
                const newSha = await computeGitBlobSha(item.svg);
                if (newSha === illuShaMap.get(item.name)) state.illustrations.unchanged.push(item);
                else                                        state.illustrations.update.push(item);
              } catch (e) {
                item.warnings = (item.warnings || []).concat(['sha-check failed: ' + e.message]);
                state.illustrations.update.push(item);
              }
            }
          }),
          // Images lane: SHA on raw binary bytes
          ...processedImages.map(async item => {
            if (item.exportError) { state.images.errors.push(item); return; }
            imgFigmaNames.add(item.name);
            if (!imgShaMap.has(item.name)) {
              state.images.add.push(item);
            } else {
              try {
                const newSha = await computeGitBlobShaBytes(item.bytes);
                if (newSha === imgShaMap.get(item.name)) state.images.unchanged.push(item);
                else                                       state.images.update.push(item);
              } catch (e) {
                item.warnings = (item.warnings || []).concat(['sha-check failed: ' + e.message]);
                state.images.update.push(item);
              }
            }
          }),
        ]);

        for (const [name] of iconShaMap) {
          if (!iconFigmaNames.has(name)) state.icons.remove.push({ name });
        }
        for (const [name] of illuShaMap) {
          if (!illuFigmaNames.has(name)) state.illustrations.remove.push({ name });
        }
        for (const [name] of imgShaMap) {
          if (!imgFigmaNames.has(name)) state.images.remove.push({ name });
        }

        exportAssetsState = state;
        previewEl.innerHTML = renderExportAssetsPreview(state);

        const hasChanges =
          state.icons.add.length + state.icons.update.length + state.icons.remove.length +
          state.illustrations.add.length + state.illustrations.update.length + state.illustrations.remove.length +
          state.images.add.length + state.images.update.length + state.images.remove.length > 0;
        document.getElementById('export-assets-confirm').disabled = !hasChanges;
        document.getElementById('export-assets-scan-btn').disabled = false;

        const tot = (state.icons.add.length + state.icons.update.length + state.icons.remove.length) +
                    (state.illustrations.add.length + state.illustrations.update.length + state.illustrations.remove.length) +
                    (state.images.add.length + state.images.update.length + state.images.remove.length);
        const errs = state.icons.errors.length + state.illustrations.errors.length + state.images.errors.length;
        log('Asset scan: ' + tot + ' change' + (tot !== 1 ? 's' : '') + ' across all lanes' +
          (errs ? ', ' + errs + ' error(s)' : ''), tot > 0 ? 'info' : 'ok');
        setBusy(false);
      })().catch(e => {
        // Outer guard: prevents "Processing…" from hanging if any unhandled rejection escapes.
        const previewEl = document.getElementById('export-assets-preview-area');
        previewEl.innerHTML = '<div class="panel-error">Unexpected error: ' + esc(e.message) + '</div>';
        document.getElementById('export-assets-scan-btn').disabled = false;
        setBusy(false);
      });
      break;
    }
    case 'component-drift-scanned': {
      (async () => {
        const driftBody = document.getElementById('drift-body');
        const platform = msg.platform || 'web';
        const manifestPath = 'packages/' + platform + '/component-manifest.json';
        driftBody.innerHTML = '<div class="line muted">Fetching ' + esc(manifestPath) + '…</div>';
        let codeManifest;
        try {
          codeManifest = await ghFetch(manifestPath);
        } catch (e) {
          driftBody.innerHTML = '<div class="panel-error">Failed to fetch manifest: ' + esc(e.message) + '</div>';
          setBusy(false);
          return;
        }
        // Aggregate Phase C lint findings (each component now carries .lint[])
        var lintFindings = [];
        (msg.components || []).forEach(function(c) {
          if (Array.isArray(c.lint) && c.lint.length > 0) {
            c.lint.forEach(function(f) {
              lintFindings.push(Object.assign({}, f, { component: c.name }));
            });
          }
        });
        const result = computeComponentDrift(msg.components || [], codeManifest);
        driftBody.innerHTML = renderDriftReport(result, lintFindings);
        const s = result.summary;
        const lintNote = lintFindings.length > 0 ? ', ' + lintFindings.length + ' hardcoded-value' : '';
        log('Component Drift (' + esc(platform) + ' — ' + esc(msg.fileName || '') + '): ' +
          s.coverage + ' coverage, ' + s.parity + ' parity, ' + s.total + ' total' + lintNote,
          (s.total + lintFindings.length) > 0 ? 'warn' : 'ok');
        setBusy(false);
      })().catch(function(e) {
        document.getElementById('drift-body').innerHTML = '<div class="panel-error">Unexpected error: ' + esc(e.message) + '</div>';
        setBusy(false);
      });
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

/* ══════════════════════════════════════════════════════════
   COMPONENT DRIFT (Phase B)
   ══════════════════════════════════════════════════════════ */

// Inline copy of figma-plugin/src/drift.js (bundle:false cannot follow imports).
var FIGMA_CONVENIENCE_PROPS = [
  'show label', 'show help', 'show description', 'show count',
  'leading icon', 'trailing icon',
];
var FIGMA_ENCODED_AXES = ['state', 'status', 'masked'];
var FIGMA_ENCODED_CODE_PROPS = [
  'loading', 'disabled', 'icononly', 'fullwidth',
  'checked', 'indeterminate', 'defaultchecked', 'invalid', 'securetextentry',
];
var INTERNAL_HELPER_NAMES = ['icon placeholder'];

function computeComponentDrift(figmaComponents, codeManifest) {
  var issues = [];
  function norm(s) { return String(s).toLowerCase().trim(); }
  var figmaByName = {};
  figmaComponents.forEach(function(c) { figmaByName[norm(c.name)] = c; });
  var codeByName = {};
  (codeManifest.components || []).forEach(function(c) { codeByName[norm(c.name)] = c; });
  Object.keys(figmaByName).forEach(function(k) {
    if (!codeByName[k]) {
      var name = figmaByName[k].name;
      issues.push({ kind: 'coverage', severity: 'warning', category: 'figma-only',
        component: name, noise: INTERNAL_HELPER_NAMES.indexOf(norm(name)) !== -1 });
    }
  });
  Object.keys(codeByName).forEach(function(k) {
    if (!figmaByName[k]) {
      var name = codeByName[k].name;
      issues.push({ kind: 'coverage', severity: 'info', category: 'code-only',
        component: name, noise: INTERNAL_HELPER_NAMES.indexOf(norm(name)) !== -1 });
    }
  });
  Object.keys(figmaByName).forEach(function(k) {
    var fc = figmaByName[k];
    var cc = codeByName[k];
    if (!cc) return;
    if (!cc.codeConnect) {
      issues.push({ kind: 'coverage', severity: 'info', category: 'no-code-connect',
        component: cc.name, noise: false });
    }
    var fProps = {};
    Object.keys(fc.figmaProps || {}).forEach(function(p) {
      fProps[norm(p)] = { original: p, type: fc.figmaProps[p].figmaType, options: fc.figmaProps[p].options };
    });
    var cProps = {};
    Object.keys(cc.props || {}).forEach(function(p) {
      cProps[norm(p)] = { original: p, kind: cc.props[p].kind, options: cc.props[p].options };
    });
    Object.keys(fProps).forEach(function(pk) {
      var fp = fProps[pk];
      if (fp.type !== 'VARIANT' && fp.type !== 'BOOLEAN') return;
      if (!cProps[pk]) {
        var noiseConv = FIGMA_CONVENIENCE_PROPS.indexOf(norm(fp.original)) !== -1;
        var noiseAxis = FIGMA_ENCODED_AXES.indexOf(norm(fp.original)) !== -1;
        issues.push({ kind: 'parity', severity: 'warning', category: 'figma-prop-not-in-code',
          component: cc.name, prop: fp.original, figmaType: fp.type, noise: noiseConv || noiseAxis });
        return;
      }
      if (fp.type === 'VARIANT' && fp.options && cProps[pk].kind === 'union' && cProps[pk].options) {
        var fOpts = {};
        fp.options.forEach(function(o) { fOpts[norm(o)] = o; });
        var cOpts = {};
        cProps[pk].options.forEach(function(o) { cOpts[norm(o)] = o; });
        Object.keys(fOpts).forEach(function(o) {
          if (!cOpts[o]) {
            issues.push({ kind: 'parity', severity: 'warning', category: 'option-missing-in-code',
              component: cc.name, prop: fp.original, option: fOpts[o], noise: false });
          }
        });
        Object.keys(cOpts).forEach(function(o) {
          if (!fOpts[o]) {
            issues.push({ kind: 'parity', severity: 'info', category: 'option-missing-in-figma',
              component: cc.name, prop: fp.original, option: cOpts[o], noise: false });
          }
        });
      }
    });
    Object.keys(cProps).forEach(function(pk) {
      var cp = cProps[pk];
      if (cp.kind !== 'union' && cp.kind !== 'boolean' && cp.kind !== 'node' && cp.kind !== 'other') return;
      if (!fProps[pk]) {
        var noiseByKind = cp.kind === 'node' || cp.kind === 'other';
        var noiseByName = FIGMA_ENCODED_CODE_PROPS.indexOf(norm(cp.original)) !== -1;
        issues.push({ kind: 'parity', severity: 'info', category: 'code-prop-not-in-figma',
          component: cc.name, prop: cp.original, codeKind: cp.kind, noise: noiseByKind || noiseByName });
      }
    });
  });
  var coverageCount = 0, parityCount = 0, realCoverage = 0, realParity = 0;
  issues.forEach(function(i) {
    if (i.kind === 'coverage') { coverageCount++; if (!i.noise) realCoverage++; }
    else { parityCount++; if (!i.noise) realParity++; }
  });
  return { issues: issues, summary: {
    coverage: coverageCount, parity: parityCount, total: issues.length,
    realCoverage: realCoverage, realParity: realParity,
  }};
}

/* ── drift report rendering ── */

function severityBadge(severity) {
  return '<span class="drift-badge ' + severity + '">' + severity + '</span>';
}

function renderCoverageRow(i, isNoise) {
  var label = i.category === 'figma-only'      ? 'In Figma, not in code library'
            : i.category === 'code-only'       ? 'In code, no Figma component set'
            : i.category === 'no-code-connect' ? 'No Code Connect configured'
            : i.category;
  var cls = 'drift-row' + (isNoise ? ' noise' : '');
  return '<div class="' + cls + '">'
    + '<div class="drift-comp">' + esc(i.component) + '</div>'
    + '<div class="drift-issue">' + severityBadge(i.severity) + ' ' + esc(label) + '</div>'
    + '</div>';
}

function formatParityDesc(i) {
  if (i.category === 'figma-prop-not-in-code')
    return 'Figma ' + i.figmaType + ' "' + esc(i.prop) + '" has no code counterpart';
  if (i.category === 'code-prop-not-in-figma')
    return 'Code ' + i.codeKind + ' "' + esc(i.prop) + '" not in Figma';
  if (i.category === 'option-missing-in-code')
    return '"' + esc(i.prop) + '": Figma option "' + esc(i.option) + '" not in code union';
  if (i.category === 'option-missing-in-figma')
    return '"' + esc(i.prop) + '": code option "' + esc(i.option) + '" not in Figma variants';
  return esc(i.category);
}

function renderParityGroup(parityIssues, isNoise) {
  var html = '';
  var byComp = {};
  parityIssues.forEach(function(i) {
    if (!byComp[i.component]) byComp[i.component] = [];
    byComp[i.component].push(i);
  });
  var cls = 'drift-row' + (isNoise ? ' noise' : '');
  Object.keys(byComp).sort().forEach(function(comp) {
    html += '<div class="' + cls + '">';
    html += '<div class="drift-comp">' + esc(comp) + '</div>';
    byComp[comp].forEach(function(i) {
      html += '<div class="drift-issue">' + severityBadge(i.severity) + ' ' + formatParityDesc(i) + '</div>';
    });
    html += '</div>';
  });
  return html;
}

function renderLintGroup(items, isNoise) {
  var html = '';
  var byComp = {};
  items.forEach(function(f) {
    var k = f.component || '(unknown)';
    if (!byComp[k]) byComp[k] = [];
    byComp[k].push(f);
  });
  var cls = 'drift-row' + (isNoise ? ' noise' : '');
  Object.keys(byComp).sort().forEach(function(comp) {
    html += '<div class="' + cls + '">';
    html += '<div class="drift-comp">' + esc(comp) + '</div>';
    byComp[comp].forEach(function(f) {
      var isColor = /^#[0-9a-f]{6}/i.test(String(f.rawValue));
      html += '<div class="drift-issue drift-lint-row">';
      html += severityBadge('warning') + ' ';
      if (isColor) html += '<span class="swatch" style="background:' + esc(f.rawValue) + '"></span>';
      html += '<code>' + esc(f.field) + '</code>';
      html += ' = <span class="drift-lint-val">' + esc(String(f.rawValue)) + '</span>';
      var lp = f.layerPath;
      html += ' <span class="drift-lint-path" title="' + esc(lp) + '">' + esc(lp.length > 40 ? '…' + lp.slice(-38) : lp) + '</span>';
      html += '</div>';
    });
    html += '</div>';
  });
  return html;
}

function renderDriftReport(result, lintFindings) {
  if (result.error) return '<div class="panel-error">' + esc(result.error) + '</div>';
  var issues = result.issues;
  var summary = result.summary;
  var lint = lintFindings || [];
  var grandTotal = summary.total + lint.length;

  var realLint = lint.filter(function(f) { return !f.noise; }).length;
  var realCov = summary.realCoverage || 0;
  var realPar = summary.realParity || 0;

  var html = '<div class="drift-summary-pills">';
  if (grandTotal === 0) {
    html += '<span class="pill ok">✓ No drift — Figma and code are in sync</span>';
    html += '</div>';
    return html;
  }
  if (realCov === 0 && realPar === 0 && realLint === 0) {
    html += '<span class="pill ok">✓ No actionable drift</span>';
  } else {
    if (realCov > 0)   html += '<span class="pill changed">' + realCov + ' coverage</span>';
    if (realPar > 0)   html += '<span class="pill changed">' + realPar + ' parity</span>';
    if (realLint > 0)  html += '<span class="pill removed">' + realLint + ' hardcoded</span>';
  }
  html += '</div>';

  // Coverage section
  var covIssues = issues.filter(function(i) { return i.kind === 'coverage'; });
  var realCovIssues = covIssues.filter(function(i) { return !i.noise; });
  var noiseCovIssues = covIssues.filter(function(i) { return i.noise; });
  if (covIssues.length > 0) {
    html += '<div class="drift-section">';
    html += '<div class="drift-section-title">Coverage (' + realCovIssues.length
      + (noiseCovIssues.length > 0 ? ' real' : '') + ')</div>';
    realCovIssues.forEach(function(i) { html += renderCoverageRow(i, false); });
    if (noiseCovIssues.length > 0) {
      html += '<details class="drift-minor"><summary>Show ' + noiseCovIssues.length + ' minor</summary>';
      noiseCovIssues.forEach(function(i) { html += renderCoverageRow(i, true); });
      html += '</details>';
    }
    html += '</div>';
  }

  // Parity section — group by component; real first, noise in toggle
  var parIssues = issues.filter(function(i) { return i.kind === 'parity'; });
  var realParIssues = parIssues.filter(function(i) { return !i.noise; });
  var noiseParIssues = parIssues.filter(function(i) { return i.noise; });
  if (parIssues.length > 0) {
    html += '<div class="drift-section">';
    html += '<div class="drift-section-title">Prop / variant parity (' + realParIssues.length
      + (noiseParIssues.length > 0 ? ' real' : '') + ')</div>';
    html += renderParityGroup(realParIssues, false);
    if (noiseParIssues.length > 0) {
      html += '<details class="drift-minor"><summary>Show ' + noiseParIssues.length + ' minor</summary>';
      html += renderParityGroup(noiseParIssues, true);
      html += '</details>';
    }
    html += '</div>';
  }

  // Hardcoded values lint section — real first, noise in toggle
  var realLintItems = lint.filter(function(f) { return !f.noise; });
  var noiseLintItems = lint.filter(function(f) { return f.noise; });
  if (lint.length > 0) {
    html += '<div class="drift-section">';
    html += '<div class="drift-section-title">Hardcoded values (' + realLintItems.length
      + (noiseLintItems.length > 0 ? ' real' : '') + ')</div>';
    html += '<div class="drift-lint-note">Bindable fields with no variable binding on the default variant. Bind each to the matching design token.</div>';
    html += renderLintGroup(realLintItems, false);
    if (noiseLintItems.length > 0) {
      html += '<details class="drift-minor"><summary>Show ' + noiseLintItems.length + ' minor</summary>';
      html += renderLintGroup(noiseLintItems, true);
      html += '</details>';
    }
    html += '</div>';
  }

  return html;
}

/* ── drift panel wire-up ── */

function closeDriftPanel() {
  document.getElementById('drift-panel').hidden = true;
  setBusy(false);
}

document.getElementById('close-drift').addEventListener('click', closeDriftPanel);

document.getElementById('btn-component-drift').addEventListener('click', function() {
  document.getElementById('drift-body').innerHTML = '<div class="line muted">Scanning component sets…</div>';
  document.getElementById('drift-panel').hidden = false;
  setBusy(true);
  parent.postMessage({ pluginMessage: { type: 'scan-component-drift' } }, '*');
});

/* ── init ── */
parent.postMessage({ pluginMessage: { type: 'get-pat' } }, '*');
