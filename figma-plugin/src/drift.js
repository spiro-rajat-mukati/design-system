/**
 * computeComponentDrift — pure, dependency-free comparator.
 *
 * Every issue carries a `noise: boolean` flag. Noise findings are real data
 * but classified as low-signal (e.g. node/other prop kinds, show-hide booleans,
 * known state encodings). The UI shows real findings first; noise lives behind
 * a "Show N minor" toggle. Nothing is dropped.
 *
 * @param {Array<{name:string, figmaProps:{[p]:{figmaType:string, options:string[]|null}}}>} figmaComponents
 * @param {{platform:string, components:Array<{name,props,codeConnect}>}} codeManifest
 * @returns {{ issues: Issue[], summary: { coverage, parity, total, realCoverage, realParity } }}
 *
 * Issue shapes (all include noise: boolean):
 *   { kind:'coverage', severity, category:'figma-only'|'code-only'|'no-code-connect', component, noise }
 *   { kind:'parity',   severity, category:'figma-prop-not-in-code'|'code-prop-not-in-figma'
 *                                        |'option-missing-in-code'|'option-missing-in-figma',
 *                       component, prop, figmaType?, codeKind?, option?, noise }
 */

// Figma-only boolean props with no code counterpart (show/hide helpers)
var FIGMA_CONVENIENCE_PROPS = [
  'show label', 'show help', 'show description', 'show count',
  'leading icon', 'trailing icon',
];
// Code props that encode into Figma variant axes rather than standalone props
var FIGMA_ENCODED_CODE_PROPS = ['loading', 'disabled', 'icononly', 'fullwidth'];
// Internal helper component names (not user-facing)
var INTERNAL_HELPER_NAMES = ['icon placeholder'];

function computeComponentDrift(figmaComponents, codeManifest) {
  var issues = [];

  function norm(s) { return String(s).toLowerCase().trim(); }

  var figmaByName = {};
  figmaComponents.forEach(function(c) { figmaByName[norm(c.name)] = c; });

  var codeByName = {};
  (codeManifest.components || []).forEach(function(c) { codeByName[norm(c.name)] = c; });

  // 1. Coverage — figma-only
  Object.keys(figmaByName).forEach(function(k) {
    if (!codeByName[k]) {
      var name = figmaByName[k].name;
      issues.push({ kind: 'coverage', severity: 'warning', category: 'figma-only',
        component: name, noise: INTERNAL_HELPER_NAMES.indexOf(norm(name)) !== -1 });
    }
  });

  // 2. Coverage — code-only
  Object.keys(codeByName).forEach(function(k) {
    if (!figmaByName[k]) {
      var name = codeByName[k].name;
      issues.push({ kind: 'coverage', severity: 'info', category: 'code-only',
        component: name, noise: INTERNAL_HELPER_NAMES.indexOf(norm(name)) !== -1 });
    }
  });

  // 3. Matched components — no-Code-Connect + prop parity
  Object.keys(figmaByName).forEach(function(k) {
    var fc = figmaByName[k];
    var cc = codeByName[k];
    if (!cc) return;

    // no-code-connect: always real (a genuine gap in Code Connect wiring)
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

    // Figma VARIANT/BOOLEAN props not in code
    Object.keys(fProps).forEach(function(pk) {
      var fp = fProps[pk];
      if (fp.type !== 'VARIANT' && fp.type !== 'BOOLEAN') return; // TEXT/INSTANCE_SWAP ignored
      if (!cProps[pk]) {
        var noiseConv = FIGMA_CONVENIENCE_PROPS.indexOf(norm(fp.original)) !== -1;
        issues.push({ kind: 'parity', severity: 'warning', category: 'figma-prop-not-in-code',
          component: cc.name, prop: fp.original, figmaType: fp.type, noise: noiseConv });
        return;
      }
      // Option-level parity (VARIANT ↔ code union)
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

    // Code props (union / boolean / node / other) not in Figma
    Object.keys(cProps).forEach(function(pk) {
      var cp = cProps[pk];
      // Emit for all actionable kinds; skip truly-unknown kinds
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
    if (i.kind === 'coverage') {
      coverageCount++;
      if (!i.noise) realCoverage++;
    } else {
      parityCount++;
      if (!i.noise) realParity++;
    }
  });

  return {
    issues: issues,
    summary: {
      coverage: coverageCount,
      parity:   parityCount,
      total:    issues.length,
      realCoverage: realCoverage,
      realParity:   realParity,
    },
  };
}

// Export for Node.js unit tests (ESM).
// ui.js inlines this function directly — bundle:false can't follow imports.
export { computeComponentDrift };
