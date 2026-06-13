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

/* ── busy state (all interactive buttons) ── */
const ALL_BTNS = ['sync-tokens','btn-diff','btn-pull','sync-text-styles','generate-foundations','generate-components','save-pat'];
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
