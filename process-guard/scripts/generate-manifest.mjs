#!/usr/bin/env node
// Generates acceptance.manifest.json: sha256 over every file in the acceptance
// directory. Run by the acceptance author (stage 4) after the suite is written.
// The activation file (phases.json) and the manifest itself are excluded — the
// implementer may change activation, never test content.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const dir = process.argv[2] ?? "test/acceptance";
const EXCLUDE = new Set(["acceptance.manifest.json", "phases.json"]);

function* walk(d) {
  for (const entry of readdirSync(d)) {
    const p = join(d, entry);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

const files = {};
for (const p of walk(dir)) {
  const rel = relative(dir, p).split(sep).join("/");
  if (EXCLUDE.has(rel)) continue;
  files[rel] = createHash("sha256").update(readFileSync(p)).digest("hex");
}

const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
const manifest = { version: 1, files: sorted };
writeFileSync(join(dir, "acceptance.manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`manifest: ${Object.keys(sorted).length} file(s) hashed in ${dir}`);
