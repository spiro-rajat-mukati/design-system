/**
 * check-manifest.mjs
 *
 * CI idempotency guard: regenerates both manifests into a temp directory,
 * diffs them against the committed versions, and exits non-zero if they differ.
 *
 * Run: node scripts/check-manifest.mjs
 */

import { createRequire } from "module";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const MANIFESTS = [
  path.join(ROOT, "packages/web/component-manifest.json"),
  path.join(ROOT, "packages/mobile/component-manifest.json"),
];

// Save originals
const originals = MANIFESTS.map((p) => ({
  path: p,
  content: fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null,
}));

// Backup originals to temp
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "kijani-manifest-"));
const backups = originals.map((o) => {
  const tmp = path.join(tmpDir, path.basename(o.path));
  if (o.content !== null) fs.writeFileSync(tmp, o.content, "utf8");
  return { ...o, tmp };
});

let hadError = false;

try {
  // Regenerate in-place
  execSync("node scripts/build-manifest.mjs", { cwd: ROOT, stdio: "inherit" });

  // Compare
  for (const b of backups) {
    if (b.content === null) {
      if (fs.existsSync(b.path)) {
        console.error(`[manifest:check] FAIL — ${path.relative(ROOT, b.path)} was generated but not committed`);
        hadError = true;
      }
      continue;
    }

    const regenerated = fs.readFileSync(b.path, "utf8");

    // Normalise: strip generatedAt timestamp before comparing
    const strip = (s) => JSON.stringify(
      Object.assign({}, JSON.parse(s), { generatedAt: "" }),
      null, 2
    );

    if (strip(regenerated) !== strip(b.content)) {
      console.error(
        `[manifest:check] FAIL — ${path.relative(ROOT, b.path)} is stale.\n` +
        `  Run: node scripts/build-manifest.mjs  then commit the result.`
      );
      hadError = true;
    } else {
      console.log(`[manifest:check] OK — ${path.relative(ROOT, b.path)}`);
    }
  }
} catch (e) {
  console.error(`[manifest:check] build-manifest failed: ${e.message}`);
  hadError = true;
} finally {
  // Restore originals
  for (const b of backups) {
    if (b.content !== null) fs.writeFileSync(b.path, b.content, "utf8");
    else if (fs.existsSync(b.path)) fs.unlinkSync(b.path);
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

if (hadError) process.exit(1);
