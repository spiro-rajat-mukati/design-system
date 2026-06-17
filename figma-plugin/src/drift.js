/**
 * computeComponentDrift — pure, dependency-free comparator.
 *
 * Exported as a Node module so tests can import it directly.
 * ui.js inlines the same logic (bundle: false can't follow imports).
 *
 * @param {Array<{name:string, figmaProps:{[propName]:{figmaType:string, options:string[]|null}}}>} figmaComponents
 *   COMPONENT_SET nodes extracted by the plugin main thread.
 *
 * @param {{platform:string, components:Array<{name,props,codeConnect}>}} codeManifest
 *   The parsed packages/{web|mobile}/component-manifest.json.
 *
 * @returns {{ issues: Issue[], summary: { coverage:number, parity:number, total:number } }}
 *
 * Issue shapes:
 *   { kind:'coverage', severity:'warning'|'info', category:'figma-only'|'code-only'|'no-code-connect', component }
 *   { kind:'parity',   severity:'warning'|'info', category:'figma-prop-not-in-code'|'code-prop-not-in-figma'
 *                                                          |'option-missing-in-code'|'option-missing-in-figma',
 *                       component, prop, figmaType?, codeKind?, option? }
 */
function computeComponentDrift(figmaComponents, codeManifest) {
  var issues = [];

  function norm(s) { return String(s).toLowerCase().trim(); }

  var figmaByName = {};
  figmaComponents.forEach(function(c) { figmaByName[norm(c.name)] = c; });

  var codeByName = {};
  (codeManifest.components || []).forEach(function(c) { codeByName[norm(c.name)] = c; });

  // 1. Coverage — figma-only (in Figma, not in code)
  Object.keys(figmaByName).forEach(function(k) {
    if (!codeByName[k]) {
      issues.push({ kind: 'coverage', severity: 'warning', category: 'figma-only', component: figmaByName[k].name });
    }
  });

  // 2. Coverage — code-only (in code manifest, no matching COMPONENT_SET in file)
  Object.keys(codeByName).forEach(function(k) {
    if (!figmaByName[k]) {
      issues.push({ kind: 'coverage', severity: 'info', category: 'code-only', component: codeByName[k].name });
    }
  });

  // 3. Matched components — no-Code-Connect + prop parity
  Object.keys(figmaByName).forEach(function(k) {
    var fc = figmaByName[k];
    var cc = codeByName[k];
    if (!cc) return;

    if (!cc.codeConnect) {
      issues.push({ kind: 'coverage', severity: 'info', category: 'no-code-connect', component: cc.name });
    }

    // Normalised figma prop map
    var fProps = {};
    Object.keys(fc.figmaProps || {}).forEach(function(p) {
      fProps[norm(p)] = { original: p, type: fc.figmaProps[p].figmaType, options: fc.figmaProps[p].options };
    });

    // Normalised code prop map
    var cProps = {};
    Object.keys(cc.props || {}).forEach(function(p) {
      cProps[norm(p)] = { original: p, kind: cc.props[p].kind, options: cc.props[p].options };
    });

    // Figma VARIANT/BOOLEAN props not in code
    Object.keys(fProps).forEach(function(pk) {
      var fp = fProps[pk];
      if (fp.type !== 'VARIANT' && fp.type !== 'BOOLEAN') return; // TEXT / INSTANCE_SWAP — skip
      if (!cProps[pk]) {
        issues.push({ kind: 'parity', severity: 'warning', category: 'figma-prop-not-in-code',
          component: cc.name, prop: fp.original, figmaType: fp.type });
        return;
      }
      // Option-level parity for VARIANT axes against code "union" props
      if (fp.type === 'VARIANT' && fp.options && cProps[pk].kind === 'union' && cProps[pk].options) {
        var fOpts = {};
        fp.options.forEach(function(o) { fOpts[norm(o)] = o; });
        var cOpts = {};
        cProps[pk].options.forEach(function(o) { cOpts[norm(o)] = o; });
        Object.keys(fOpts).forEach(function(o) {
          if (!cOpts[o]) {
            issues.push({ kind: 'parity', severity: 'warning', category: 'option-missing-in-code',
              component: cc.name, prop: fp.original, option: fOpts[o] });
          }
        });
        Object.keys(cOpts).forEach(function(o) {
          if (!fOpts[o]) {
            issues.push({ kind: 'parity', severity: 'info', category: 'option-missing-in-figma',
              component: cc.name, prop: fp.original, option: cOpts[o] });
          }
        });
      }
    });

    // Code union/boolean props not in Figma
    Object.keys(cProps).forEach(function(pk) {
      var cp = cProps[pk];
      if (cp.kind !== 'union' && cp.kind !== 'boolean') return;
      if (!fProps[pk]) {
        issues.push({ kind: 'parity', severity: 'info', category: 'code-prop-not-in-figma',
          component: cc.name, prop: cp.original, codeKind: cp.kind });
      }
    });
  });

  var coverageCount = 0;
  var parityCount = 0;
  issues.forEach(function(i) {
    if (i.kind === 'coverage') coverageCount++;
    else parityCount++;
  });

  return { issues: issues, summary: { coverage: coverageCount, parity: parityCount, total: issues.length } };
}

// Export for Node.js unit tests (ESM).
// ui.js inlines this function directly — bundle:false can't follow imports.
export { computeComponentDrift };
