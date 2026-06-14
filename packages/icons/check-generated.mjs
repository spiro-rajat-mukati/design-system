#!/usr/bin/env node
// Idempotency guard for the icons package.
// Snapshots the current generated files, re-runs the build, and compares.
// Exits 1 (CI fails) if any file changed. Restores originals on mismatch.
//
// Run: node packages/icons/check-generated.mjs

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Collect all generated file paths (relative to __dirname). */
function generatedPaths() {
  const paths = ['index.ts', 'native.ts'];
  for (const sub of ['src/web', 'src/native']) {
    const dir = join(__dirname, sub);
    if (existsSync(dir)) {
      for (const f of readdirSync(dir)) paths.push(sub + '/' + f);
    }
  }
  return paths;
}

// 1. Snapshot current state
const before = new Map();
for (const rel of generatedPaths()) {
  const abs = join(__dirname, rel);
  before.set(rel, existsSync(abs) ? readFileSync(abs, 'utf8') : null);
}

// 2. Re-run build
const result = spawnSync('node', [join(__dirname, 'build.mjs')], { stdio: 'inherit' });
if (result.status !== 0) {
  process.stderr.write('icons:check — build.mjs exited with error\n');
  process.exit(1);
}

// 3. Compare and restore
let dirty = false;
for (const rel of generatedPaths()) {
  const abs = join(__dirname, rel);
  const after = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
  const was   = before.get(rel) ?? null;
  if (after !== was) {
    process.stderr.write(`icons:check — generated file changed: ${rel}\n`);
    dirty = true;
    // Restore original so git status stays clean in CI
    if (was !== null) writeFileSync(abs, was);
  }
}

if (dirty) {
  process.stderr.write('icons:check — run `npm run icons:build` and commit the result.\n');
  process.exit(1);
}

console.log('icons:check — all generated files are up to date.');
