/**
 * build-manifest.mjs
 *
 * Parses every packages/{web,mobile}/src/components/<Name>/<Name>.types.ts
 * via the TypeScript compiler AST and emits:
 *   packages/web/component-manifest.json
 *   packages/mobile/component-manifest.json
 *
 * Schema per component:
 *   { name, source, platform, props: { [prop]: { kind, options? } }, codeConnect }
 *
 * Run: node scripts/build-manifest.mjs
 */

import { createRequire } from "module";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PACKAGES = [
  {
    platform: "web",
    srcDir: path.join(ROOT, "packages/web/src/components"),
    outFile: path.join(ROOT, "packages/web/component-manifest.json"),
  },
  {
    platform: "mobile",
    srcDir: path.join(ROOT, "packages/mobile/src/components"),
    outFile: path.join(ROOT, "packages/mobile/component-manifest.json"),
  },
];

/* ── TypeScript AST helpers ────────────────────────────────────────────── */

/** Return string literal union members if typeNode is a union of string literals only, else null. */
function extractStringLiterals(typeNode) {
  if (!typeNode || !ts.isUnionTypeNode(typeNode)) return null;
  const options = [];
  for (const t of typeNode.types) {
    if (ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal)) {
      options.push(t.literal.text);
    } else {
      return null; // non-string member — not a pure string union
    }
  }
  return options.length > 0 ? options : null;
}

/** Get the text of a property name node (handles Identifiers and StringLiterals). */
function propNameText(nameNode, sf) {
  if (ts.isIdentifier(nameNode)) return nameNode.text;
  if (ts.isStringLiteral(nameNode)) return nameNode.text;
  return nameNode.getText(sf);
}

/** Classify a TypeNode into { kind, options? }.
 *  typeAliases: Map<string, string[] | null> — local type alias name → options */
function classifyType(typeNode, typeAliases, sf) {
  if (!typeNode) return { kind: "other" };

  switch (typeNode.kind) {
    case ts.SyntaxKind.BooleanKeyword:
      return { kind: "boolean" };
    case ts.SyntaxKind.StringKeyword:
    case ts.SyntaxKind.NumberKeyword:
    case ts.SyntaxKind.FunctionType:
      return { kind: "other" };
    default:
      break;
  }

  if (ts.isTypeReferenceNode(typeNode)) {
    const refName = ts.isIdentifier(typeNode.typeName)
      ? typeNode.typeName.text
      : typeNode.typeName.getText(sf);

    if (refName === "boolean") return { kind: "boolean" };
    if (refName === "ReactNode") return { kind: "node" };

    if (typeAliases.has(refName)) {
      const opts = typeAliases.get(refName);
      if (opts !== null) return { kind: "union", options: opts };
    }
    // Check for common callback patterns: not a union
    return { kind: "other" };
  }

  if (ts.isUnionTypeNode(typeNode)) {
    const literalOptions = [];
    let hasBoolean = false;
    let hasReactNode = false;
    let hasOther = false;

    for (const t of typeNode.types) {
      if (t.kind === ts.SyntaxKind.UndefinedKeyword || t.kind === ts.SyntaxKind.NullKeyword) {
        // optional marker — skip
      } else if (ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal)) {
        literalOptions.push(t.literal.text);
      } else if (t.kind === ts.SyntaxKind.BooleanKeyword) {
        hasBoolean = true;
      } else if (ts.isTypeReferenceNode(t)) {
        const n = ts.isIdentifier(t.typeName) ? t.typeName.text : t.typeName.getText(sf);
        if (n === "boolean") { hasBoolean = true; }
        else if (n === "ReactNode") { hasReactNode = true; }
        else if (typeAliases.has(n)) {
          const opts = typeAliases.get(n);
          if (opts !== null) opts.forEach(o => literalOptions.push(o));
          else hasOther = true;
        } else { hasOther = true; }
      } else {
        hasOther = true;
      }
    }

    if (literalOptions.length > 0) return { kind: "union", options: literalOptions };
    if (hasBoolean && !hasOther && !hasReactNode) return { kind: "boolean" };
    if (hasReactNode) return { kind: "node" };
    return { kind: "other" };
  }

  if (ts.isFunctionTypeNode(typeNode) || ts.isIndexedAccessTypeNode(typeNode) || ts.isMappedTypeNode(typeNode)) {
    return { kind: "other" };
  }

  return { kind: "other" };
}

/** Parse one file (types or tsx) and return { props, typeAliases } or null. */
function parseOneFile(targetFile, propsName) {
  const compilerOptions = {
    noEmit: true,
    strict: false,
    noResolve: true,
    skipLibCheck: true,
    allowJs: true, // allow .tsx parsing
    jsx: ts.JsxEmit.React,
  };

  const host = ts.createCompilerHost(compilerOptions);
  const origReadFile = host.readFile.bind(host);
  host.readFile = (fileName) => {
    if (path.resolve(fileName) !== path.resolve(targetFile)) return "export {};";
    return origReadFile(fileName);
  };

  const program = ts.createProgram([targetFile], compilerOptions, host);
  const sf = program.getSourceFile(targetFile);
  if (!sf) return null;

  const typeAliases = new Map();
  ts.forEachChild(sf, (node) => {
    if (!ts.isTypeAliasDeclaration(node)) return;
    const aliasName = node.name.text;
    const opts = extractStringLiterals(node.type);
    typeAliases.set(aliasName, opts);
  });

  let propsInterface = null;
  ts.forEachChild(sf, (node) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === propsName) {
      propsInterface = node;
    }
  });
  if (!propsInterface) return null;

  const props = {};
  for (const member of propsInterface.members) {
    if (!ts.isPropertySignature(member) || !member.name) continue;
    const propName = propNameText(member.name, sf);
    if (!propName) continue;
    if (!member.type) continue;
    props[propName] = classifyType(member.type, typeAliases, sf);
  }

  return { props };
}

/** Follow a `export type { <propsName> } from "<specifier>"` re-export
 *  and return the resolved absolute path, or null if not found. */
function findReExportPath(typesFile, propsName) {
  const src = fs.readFileSync(typesFile, "utf8");
  const sf = ts.createSourceFile(typesFile, src, ts.ScriptTarget.Latest, true);

  let resolved = null;
  ts.forEachChild(sf, (node) => {
    if (resolved) return;
    if (!ts.isExportDeclaration(node)) return;
    if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) return;
    const specifier = node.moduleSpecifier.text;
    // Check if the export clause names our propsName
    if (node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const el of node.exportClause.elements) {
        const exported = el.name.text;
        const original = el.propertyName ? el.propertyName.text : el.name.text;
        if (exported === propsName || original === propsName) {
          // Resolve the specifier relative to the types file
          let candidate = path.resolve(path.dirname(typesFile), specifier);
          // Try with .ts, .tsx, .d.ts suffixes
          for (const ext of [".ts", ".tsx", ".d.ts", ""]) {
            const p = candidate + ext;
            if (fs.existsSync(p)) { resolved = p; break; }
          }
          if (!resolved && fs.existsSync(candidate)) resolved = candidate;
          break;
        }
      }
    }
  });
  return resolved;
}

/** Parse <Name>.types.ts (with re-export fallback → .tsx fallback) for <Name>Props. */
function parseComponentTypes(name, compDir) {
  const propsName = `${name}Props`;
  const typesFile = path.join(compDir, `${name}.types.ts`);
  const tsxFile = path.join(compDir, `${name}.tsx`);

  // 1. Try the types file directly
  if (fs.existsSync(typesFile)) {
    const result = parseOneFile(typesFile, propsName);
    if (result) return result;

    // 2. Types file doesn't have the interface — look for a re-export
    const reExportPath = findReExportPath(typesFile, propsName);
    if (reExportPath) {
      const result2 = parseOneFile(reExportPath, propsName);
      if (result2) return result2;
    }
  }

  // 3. Try the .tsx file directly
  if (fs.existsSync(tsxFile)) {
    const result = parseOneFile(tsxFile, propsName);
    if (result) return result;
  }

  return null;
}

/* ── Manifest builder ──────────────────────────────────────────────────── */

function buildManifest({ platform, srcDir, outFile }) {
  if (!fs.existsSync(srcDir)) {
    console.warn(`[manifest] srcDir not found, skipping: ${srcDir}`);
    return;
  }

  const compDirs = fs.readdirSync(srcDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const components = [];

  for (const name of compDirs) {
    const compDir = path.join(srcDir, name);
    const figmaFile = path.join(compDir, `${name}.figma.tsx`);

    const hasTsx = fs.existsSync(path.join(compDir, `${name}.tsx`));
    const hasTypes = fs.existsSync(path.join(compDir, `${name}.types.ts`));
    const hasFigma = fs.existsSync(figmaFile);

    // Skip truly empty placeholder directories
    if (!hasTsx && !hasTypes && !hasFigma) continue;

    let parsed;
    try {
      parsed = parseComponentTypes(name, compDir);
    } catch (e) {
      console.error(`[manifest] parse error for ${name}: ${e.message}`);
      parsed = null;
    }

    if (!parsed) {
      if (!hasFigma && !hasTsx) continue; // no useful entry to emit
      console.warn(`[manifest] no ${name}Props interface in ${compDir} — emitting with props: {}`);
      parsed = { props: {} };
    }

    const pkgDir = platform === "web" ? "web" : "mobile";
    const typesExists = fs.existsSync(path.join(compDir, `${name}.types.ts`));
    components.push({
      name,
      source: `packages/${pkgDir}/src/components/${name}/${name}${typesExists ? ".types.ts" : ".tsx"}`,
      platform,
      props: parsed.props,
      codeConnect: fs.existsSync(figmaFile),
    });

    console.log(`[manifest] ${platform}/${name}: ${Object.keys(parsed.props).length} props, codeConnect=${fs.existsSync(figmaFile)}`);
  }

  const manifest = { platform, generatedAt: new Date().toISOString(), components };
  const json = JSON.stringify(manifest, null, 2) + "\n";
  fs.writeFileSync(outFile, json, "utf8");
  console.log(`[manifest] wrote ${components.length} components → ${path.relative(ROOT, outFile)}`);
}

/* ── Entry point ─────────────────────────────────────────────────────────*/

let hadError = false;
for (const pkg of PACKAGES) {
  try {
    buildManifest(pkg);
  } catch (e) {
    console.error(`[manifest] fatal for ${pkg.platform}: ${e.message}`);
    hadError = true;
  }
}
if (hadError) process.exit(1);
