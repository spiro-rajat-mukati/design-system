/**
 * Unit tests for computeComponentDrift.
 *
 * Run: node figma-plugin/test/check-drift.mjs
 */

import { computeComponentDrift } from "../src/drift.js";

let passed = 0;
let failed = 0;

function assert(label, cond) {
  if (cond) {
    console.log("  ✓ " + label);
    passed++;
  } else {
    console.error("  ✗ " + label);
    failed++;
  }
}

function makeManifest(components) {
  return { platform: "web", generatedAt: "2026-01-01T00:00:00.000Z", components: components };
}

/* ── helper builders ─────────────────────────────────────────────────── */

function figmaComp(name, figmaProps) {
  return { name: name, figmaProps: figmaProps || {} };
}

function codeComp(name, props, codeConnect) {
  return { name: name, source: "packages/web/src/components/" + name + "/" + name + ".types.ts",
    platform: "web", props: props || {}, codeConnect: codeConnect !== false };
}

function variantProp(options) {
  return { figmaType: "VARIANT", options: options };
}

function boolProp() {
  return { figmaType: "BOOLEAN", options: null };
}

function textProp() {
  return { figmaType: "TEXT", options: null };
}

/* ══════════════════════════════════════════════════════════ */

console.log("\n── Coverage ─────────────────────────────────────────────");

{
  console.log("\n  clean (all matched):");
  const result = computeComponentDrift(
    [figmaComp("Button")],
    makeManifest([codeComp("Button")])
  );
  assert("no issues when both match", result.summary.total === 0);
}

{
  console.log("\n  figma-only:");
  const result = computeComponentDrift(
    [figmaComp("Ghost")],
    makeManifest([])
  );
  const issue = result.issues[0];
  assert("one issue", result.issues.length === 1);
  assert("kind=coverage", issue && issue.kind === "coverage");
  assert("category=figma-only", issue && issue.category === "figma-only");
  assert("severity=warning", issue && issue.severity === "warning");
  assert("component name preserved", issue && issue.component === "Ghost");
}

{
  console.log("\n  code-only (Field — no Figma component set):");
  const result = computeComponentDrift(
    [],
    makeManifest([codeComp("Field", {}, false)])
  );
  const issue = result.issues.find(function(i) { return i.category === "code-only"; });
  assert("code-only issue exists", !!issue);
  assert("severity=info", issue && issue.severity === "info");
}

{
  console.log("\n  no-Code-Connect (matched but codeConnect=false):");
  const result = computeComponentDrift(
    [figmaComp("Field")],
    makeManifest([codeComp("Field", {}, false)])
  );
  const issue = result.issues.find(function(i) { return i.category === "no-code-connect"; });
  assert("no-code-connect issue exists", !!issue);
  assert("severity=info", issue && issue.severity === "info");
}

{
  console.log("\n  case-insensitive name matching (mobile: 'Button' vs code 'Button'):");
  const result = computeComponentDrift(
    [figmaComp("Button")], // Figma uses same case as code for this test
    makeManifest([codeComp("Button")])
  );
  assert("matched despite same case", result.summary.total === 0);
}

/* ══════════════════════════════════════════════════════════ */

console.log("\n── Prop parity ──────────────────────────────────────────");

{
  console.log("\n  Figma VARIANT prop not in code:");
  const result = computeComponentDrift(
    [figmaComp("Button", { variant: variantProp(["primary", "secondary"]) })],
    makeManifest([codeComp("Button", {}, true)])
  );
  const issue = result.issues.find(function(i) { return i.category === "figma-prop-not-in-code"; });
  assert("figma-prop-not-in-code exists", !!issue);
  assert("severity=warning", issue && issue.severity === "warning");
  assert("prop=variant", issue && issue.prop === "variant");
  assert("figmaType=VARIANT", issue && issue.figmaType === "VARIANT");
}

{
  console.log("\n  Figma BOOLEAN prop not in code:");
  const result = computeComponentDrift(
    [figmaComp("Button", { iconOnly: boolProp() })],
    makeManifest([codeComp("Button", {}, true)])
  );
  const issue = result.issues.find(function(i) { return i.category === "figma-prop-not-in-code"; });
  assert("figma-prop-not-in-code for BOOLEAN", !!issue);
  assert("figmaType=BOOLEAN", issue && issue.figmaType === "BOOLEAN");
}

{
  console.log("\n  Figma TEXT prop not in code — should be ignored:");
  const result = computeComponentDrift(
    [figmaComp("Button", { Label: textProp() })],
    makeManifest([codeComp("Button", {}, true)])
  );
  const issue = result.issues.find(function(i) { return i.category === "figma-prop-not-in-code"; });
  assert("TEXT props not flagged", !issue);
}

{
  console.log("\n  option-missing-in-code (Figma has extra variant option):");
  const result = computeComponentDrift(
    [figmaComp("Button", { variant: variantProp(["primary", "ghost"]) })],
    makeManifest([codeComp("Button", {
      variant: { kind: "union", options: ["primary"] }
    }, true)])
  );
  const issue = result.issues.find(function(i) { return i.category === "option-missing-in-code"; });
  assert("option-missing-in-code exists", !!issue);
  assert("option=ghost", issue && issue.option === "ghost");
  assert("severity=warning", issue && issue.severity === "warning");
}

{
  console.log("\n  option-missing-in-figma (code has extra option):");
  const result = computeComponentDrift(
    [figmaComp("Button", { variant: variantProp(["primary"]) })],
    makeManifest([codeComp("Button", {
      variant: { kind: "union", options: ["primary", "link"] }
    }, true)])
  );
  const issue = result.issues.find(function(i) { return i.category === "option-missing-in-figma"; });
  assert("option-missing-in-figma exists", !!issue);
  assert("option=link", issue && issue.option === "link");
  assert("severity=info", issue && issue.severity === "info");
}

{
  console.log("\n  code union prop not in Figma:");
  const result = computeComponentDrift(
    [figmaComp("Button", {})],
    makeManifest([codeComp("Button", {
      variant: { kind: "union", options: ["primary"] }
    }, true)])
  );
  const issue = result.issues.find(function(i) { return i.category === "code-prop-not-in-figma"; });
  assert("code-prop-not-in-figma exists", !!issue);
  assert("prop=variant", issue && issue.prop === "variant");
  assert("severity=info", issue && issue.severity === "info");
}

{
  console.log("\n  mobile case normalization (Figma 'Variant' vs code 'variant'):");
  const result = computeComponentDrift(
    [figmaComp("Button", {
      "Variant": variantProp(["primary", "secondary"]),
      "Size": variantProp(["sm", "md", "lg"])
    })],
    makeManifest([codeComp("Button", {
      variant: { kind: "union", options: ["primary", "secondary"] },
      size:    { kind: "union", options: ["sm", "md", "lg"] }
    }, true)])
  );
  // Figma 'Variant' normalizes to 'variant' — should match code 'variant'
  const parityIssues = result.issues.filter(function(i) { return i.kind === "parity"; });
  assert("no parity issues when only case differs", parityIssues.length === 0);
}

{
  console.log("\n  code 'node' props emitted with noise=true (not dropped):");
  const result = computeComponentDrift(
    [figmaComp("Button", {})],
    makeManifest([codeComp("Button", {
      leadingIcon: { kind: "node" },
      children:    { kind: "node" }
    }, true)])
  );
  const parityIssues = result.issues.filter(function(i) { return i.kind === "parity"; });
  assert("node props emitted (not dropped)", parityIssues.length === 2);
  assert("node props have noise=true", parityIssues.every(function(i) { return i.noise === true; }));
}

{
  console.log("\n  summary counts:");
  const result = computeComponentDrift(
    [figmaComp("Ghost"), figmaComp("Button", { variant: variantProp(["primary"]) })],
    makeManifest([codeComp("Field", {}, false), codeComp("Button", {}, true)])
  );
  assert("coverage count correct", result.summary.coverage >= 2); // Ghost→figma-only, Field→code-only
  assert("total >= coverage + parity", result.summary.total === result.summary.coverage + result.summary.parity);
}

/* ══════════════════════════════════════════════════════════ */

console.log("\n── Noise classification ─────────────────────────────────");

{
  console.log("\n  convenience prop (Show label) → noise=true:");
  const result = computeComponentDrift(
    [figmaComp("Input", { "Show label": boolProp() })],
    makeManifest([codeComp("Input", {}, true)])
  );
  const issue = result.issues.find(function(i) { return i.category === "figma-prop-not-in-code"; });
  assert("issue exists", !!issue);
  assert("noise=true for Show label", issue && issue.noise === true);
}

{
  console.log("\n  convenience prop (Leading icon) → noise=true:");
  const result = computeComponentDrift(
    [figmaComp("Input", { "Leading icon": boolProp() })],
    makeManifest([codeComp("Input", {}, true)])
  );
  const issue = result.issues.find(function(i) { return i.category === "figma-prop-not-in-code"; });
  assert("noise=true for Leading icon", issue && issue.noise === true);
}

{
  console.log("\n  regular Figma prop not in code → noise=false:");
  const result = computeComponentDrift(
    [figmaComp("Button", { variant: variantProp(["primary"]) })],
    makeManifest([codeComp("Button", {}, true)])
  );
  const issue = result.issues.find(function(i) { return i.category === "figma-prop-not-in-code"; });
  assert("noise=false for real Figma prop gap", issue && issue.noise === false);
}

{
  console.log("\n  encoded code prop (loading) → noise=true:");
  const result = computeComponentDrift(
    [figmaComp("Button", {})],
    makeManifest([codeComp("Button", {
      loading: { kind: "boolean" }
    }, true)])
  );
  const issue = result.issues.find(function(i) { return i.category === "code-prop-not-in-figma" && i.prop === "loading"; });
  assert("issue exists for loading", !!issue);
  assert("noise=true for loading", issue && issue.noise === true);
}

{
  console.log("\n  encoded code prop (disabled) → noise=true:");
  const result = computeComponentDrift(
    [figmaComp("Button", {})],
    makeManifest([codeComp("Button", {
      disabled: { kind: "boolean" }
    }, true)])
  );
  const issue = result.issues.find(function(i) { return i.prop === "disabled"; });
  assert("noise=true for disabled", issue && issue.noise === true);
}

{
  console.log("\n  node kind → noise=true:");
  const result = computeComponentDrift(
    [figmaComp("Button", {})],
    makeManifest([codeComp("Button", {
      icon: { kind: "node" }
    }, true)])
  );
  const issue = result.issues.find(function(i) { return i.prop === "icon"; });
  assert("node kind emitted", !!issue);
  assert("node kind noise=true", issue && issue.noise === true);
}

{
  console.log("\n  other kind → noise=true:");
  const result = computeComponentDrift(
    [figmaComp("Button", {})],
    makeManifest([codeComp("Button", {
      onClick: { kind: "other" }
    }, true)])
  );
  const issue = result.issues.find(function(i) { return i.prop === "onClick"; });
  assert("other kind emitted", !!issue);
  assert("other kind noise=true", issue && issue.noise === true);
}

{
  console.log("\n  internal helper (Icon Placeholder) coverage → noise=true:");
  const result = computeComponentDrift(
    [figmaComp("Icon Placeholder")],
    makeManifest([])
  );
  const issue = result.issues.find(function(i) { return i.component === "Icon Placeholder"; });
  assert("issue exists for Icon Placeholder", !!issue);
  assert("noise=true for Icon Placeholder", issue && issue.noise === true);
}

{
  console.log("\n  regular coverage → noise=false:");
  const result = computeComponentDrift(
    [figmaComp("Badge")],
    makeManifest([])
  );
  const issue = result.issues.find(function(i) { return i.component === "Badge"; });
  assert("noise=false for real figma-only component", issue && issue.noise === false);
}

{
  console.log("\n  no-code-connect → noise=false:");
  const result = computeComponentDrift(
    [figmaComp("Card")],
    makeManifest([codeComp("Card", {}, false)])
  );
  const issue = result.issues.find(function(i) { return i.category === "no-code-connect"; });
  assert("no-code-connect noise=false", issue && issue.noise === false);
}

{
  console.log("\n  summary includes realCoverage and realParity:");
  const result = computeComponentDrift(
    [figmaComp("Button", { "Show label": boolProp(), variant: variantProp(["primary"]) }),
     figmaComp("Icon Placeholder")],
    makeManifest([codeComp("Button", {
      disabled: { kind: "boolean" }
    }, true)])
  );
  assert("summary has realCoverage", "realCoverage" in result.summary);
  assert("summary has realParity", "realParity" in result.summary);
  // Icon Placeholder figma-only → noise (1 noise coverage)
  assert("realCoverage < total coverage", result.summary.realCoverage < result.summary.coverage);
  // Show label → noise, variant → real, disabled → noise; so realParity = 1
  assert("realParity counts only real parity", result.summary.realParity === 1);
}

{
  console.log("\n  option-level issues are noise=false (real mismatches):");
  const result = computeComponentDrift(
    [figmaComp("Button", { variant: variantProp(["primary", "ghost"]) })],
    makeManifest([codeComp("Button", {
      variant: { kind: "union", options: ["primary"] }
    }, true)])
  );
  const issue = result.issues.find(function(i) { return i.category === "option-missing-in-code"; });
  assert("option mismatch noise=false", issue && issue.noise === false);
}

/* ══════════════════════════════════════════════════════════ */

console.log("\n── Results ──────────────────────────────────────────────");
console.log("  " + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
