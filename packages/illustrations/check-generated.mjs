#!/usr/bin/env node
/**
 * Idempotency guard for the illustrations package.
 * Snapshots generated files → re-runs build → compares → restores + exits 1 on mismatch.
 * Works for both text (TypeScript) and binary (WebP) outputs.
 *
 * Run: node packages/illustrations/check-generated.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Collect all generated file paths (relative to __dirname). */
function generatedPaths() {
  const paths = ['index.ts', 'native.ts', 'manifest.ts'];
  for (const sub of ['src/web', 'src/native']) {
    const dir = join(__dirname, sub);
    if (existsSync(dir)) {
      for (const f of readdirSync(dir)) paths.push(sub + '/' + f);
    }
  }
  // Raster WebP outputs are binary-compared via Buffer
  const rasterDir = join(__dirname, 'raster');
  if (existsSync(rasterDir)) {
    for (const f of readdirSync(rasterDir)) paths.push('raster/' + f);
  }
  return paths;
}

// 1. Snapshot current state
// Always read as Buffer (works for both text and binary; never specify encoding)
const before = new Map();
for (const rel of generatedPaths()) {
  const abs = join(__dirname, rel);
  before.set(rel, existsSync(abs) ? readFileSync(abs) : null);
}

// 2. Re-run build
const result = spawnSync('node', [join(__dirname, 'build.mjs')], {
  stdio: 'inherit',
  // Pass PATH so sharp's native bindings can be found
  env: process.env,
});
if (result.status !== 0) {
  process.stderr.write('illustrations:check — build.mjs exited with error\n');
  process.exit(1);
}

// 3. Compare and restore originals
let dirty = false;
for (const rel of generatedPaths()) {
  const abs   = join(__dirname, rel);
  const after = existsSync(abs) ? readFileSync(abs) : null;
  const was   = before.get(rel) ?? null;

  const changed = after === null
    ? was !== null                          // file deleted
    : was === null                          // file added
      || !after.equals(was);               // Buffer.equals for binary-safe compare

  if (changed) {
    process.stderr.write(`illustrations:check — generated file changed: ${rel}\n`);
    dirty = true;
    // Restore original so git status stays clean in CI
    if (was !== null) writeFileSync(abs, was);
  }
}

if (dirty) {
  process.stderr.write(
    'illustrations:check — run `npm run illustrations:build` and commit the result.\n'
  );
  process.exit(1);
}

console.log('illustrations:check — all generated files are up to date.');
