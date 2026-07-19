#!/usr/bin/env node
// vendored from engineering-os@bec7a2b64e8ec41d6293dcac36f49e457e75624d process-guard/scripts/ — edit the original, re-vendor
// Regenerate acceptance.manifest.json for the acceptance author (pipeline stage 4).
// Sources content from git BLOB bytes over the STAGED index (`git cat-file blob
// :<path>`), never the working tree — closing CRLF/autocrlf/smudge and symlink
// differentials, in lockstep with check.mjs (D1). Hashes only mandatory-matched
// regular blobs by default; preserves pre-existing opt-in keys read from the HEAD
// manifest (aborts — never silently drops — if an opt-in target is gone/non-regular).
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { openSync, writeSync, closeSync, unlinkSync, renameSync, lstatSync, constants } from "node:fs";
import { isFrozenBasename, canonicalRelDir } from "./freeze-set.mjs";

// Single-source the PG_ACCEPTANCE_DIR validation with the guard (A4/A11): a `.`/`..`,
// `//`, non-NFC, backslash, or absolute path is rejected BEFORE any git/fs side effect,
// so a traversal path can never redirect the manifest write outside the acceptance tree.
const ACC_DIR = canonicalRelDir(process.argv[2] ?? process.env.PG_ACCEPTANCE_DIR ?? "test/acceptance");
if (ACC_DIR === null) {
  die(`invalid acceptance dir: ${process.argv[2] ?? process.env.PG_ACCEPTANCE_DIR ?? "test/acceptance"}`);
}
const MANIFEST = `${ACC_DIR}/acceptance.manifest.json`;
const RESERVED = new Set(["acceptance.manifest.json", "phases.json"]);
const MAXBUF = 64 * 1024 * 1024;
const GIT_HARDEN = ["-c", "core.precomposeunicode=false", "-c", "core.quotePath=false"];

function die(msg) {
  console.error(`generate-manifest: ${msg}`);
  process.exit(1);
}

function gitRaw(args) {
  return spawnSync("git", [...GIT_HARDEN, ...args], { maxBuffer: MAXBUF });
}
function gitBuf(args) {
  const r = gitRaw(args);
  if (r.error || r.status !== 0) die(`git failed: ${args.join(" ")}`);
  return r.stdout;
}
const UTF8 = new TextDecoder("utf-8", { fatal: true });
function decodeStrict(buf) {
  try {
    return UTF8.decode(buf);
  } catch {
    die("invalid utf-8 in a git path");
  }
}
function splitNul(buf) {
  const parts = [];
  let start = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0) {
      parts.push(buf.subarray(start, i));
      start = i + 1;
    }
  }
  if (start < buf.length) parts.push(buf.subarray(start));
  return parts;
}
const isRegular = (mode) => mode === "100644" || mode === "100755";
const basename = (rel) => rel.split("/").pop();
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const stagedBlob = (rel) => sha256(gitBuf(["cat-file", "blob", `:${ACC_DIR}/${rel}`]));

// Enumerate the STAGED acceptance tree with modes. `git ls-files -s -z` emits
// `<mode> <sha> <stage>\t<path>\0`.
function stagedEntries() {
  const buf = gitBuf(["ls-files", "-s", "-z", "--", ACC_DIR]);
  const out = [];
  for (const seg of splitNul(buf)) {
    if (seg.length === 0) continue;
    const tab = seg.indexOf(0x09);
    if (tab < 0) continue;
    const mode = seg.subarray(0, tab).toString("latin1").split(" ")[0];
    const path = decodeStrict(seg.subarray(tab + 1));
    if (path !== ACC_DIR && !path.startsWith(ACC_DIR + "/")) continue;
    const rel = path.slice(ACC_DIR.length + 1);
    if (rel.length === 0 || RESERVED.has(rel)) continue;
    out.push({ rel, mode });
  }
  return out;
}

// HEAD manifest keys. Absence on HEAD is legitimate (first generation) => empty.
// But a git plumbing failure, a decode failure, or a malformed/undecodable present
// manifest ABORTS (A9) — never silently drops opt-in keys the author must preserve.
function headManifestKeys() {
  const probe = gitRaw(["cat-file", "-e", `HEAD:${MANIFEST}`]);
  if (probe.error) die("git failed probing HEAD manifest");
  if (probe.status !== 0) return new Set(); // cleanly absent on HEAD (first generation)
  const r = gitRaw(["cat-file", "blob", `HEAD:${MANIFEST}`]);
  if (r.error || r.status !== 0) die("git failed reading HEAD manifest");
  let text;
  try {
    text = UTF8.decode(r.stdout);
  } catch {
    die("HEAD manifest is not valid utf-8");
  }
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    die("HEAD manifest is malformed JSON — cannot preserve opt-in keys");
  }
  if (!obj || typeof obj !== "object" || !obj.files || typeof obj.files !== "object") {
    die("HEAD manifest has no files object — cannot preserve opt-in keys");
  }
  return new Set(Object.keys(obj.files));
}

const entries = stagedEntries();

// A3: NFC-key collision across EVERY raw staged entry under ACC_DIR (any mode),
// before building any normalized map or hashing anything.
{
  const seen = new Map();
  for (const e of entries) {
    const key = e.rel.normalize("NFC");
    const prev = seen.get(key);
    if (prev !== undefined && prev !== e.rel) {
      die(`NFC collision under ${ACC_DIR}: ${prev} and ${e.rel} normalize to the same key`);
    }
    seen.set(key, e.rel);
  }
}

const byKey = new Map(); // nfcKey -> rel (raw)
const files = {};

function register(rel, mode) {
  if (!isRegular(mode)) die(`refusing to freeze non-regular blob (mode ${mode}): ${ACC_DIR}/${rel}`);
  const key = rel.normalize("NFC");
  if (byKey.has(key) && byKey.get(key) !== rel) {
    die(`NFC collision: ${byKey.get(key)} and ${rel} normalize to the same key`);
  }
  byKey.set(key, rel);
  files[key] = stagedBlob(rel);
}

// 1. mandatory-matched regular blobs
const matchedByKey = new Map();
for (const e of entries) {
  if (!isFrozenBasename(basename(e.rel))) continue;
  register(e.rel, e.mode);
  matchedByKey.set(e.rel.normalize("NFC"), e.rel);
}

// 2. preserve pre-existing opt-in keys (non-matching) listed in the HEAD manifest
const stagedByKey = new Map(entries.map((e) => [e.rel.normalize("NFC"), e]));
for (const key of headManifestKeys()) {
  const nfcKey = key.normalize("NFC");
  if (matchedByKey.has(nfcKey) || byKey.has(nfcKey)) continue; // already covered by the mandatory set
  const staged = stagedByKey.get(nfcKey);
  if (!staged) die(`opt-in key '${key}' has no staged blob under ${ACC_DIR} — restore it or drop it from the manifest`);
  register(staged.rel, staged.mode);
}

const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
const manifest = JSON.stringify({ version: 1, files: sorted }, null, 2) + "\n";

// A9: reject a symlinked acceptance directory or ANY symlinked ancestor of the
// output path (not only the final component) before writing — a symlinked ancestor
// redirects the atomic write out of the repo just as a symlinked final component does.
{
  const segs = MANIFEST.split("/");
  segs.pop(); // drop the manifest filename; the O_NOFOLLOW write guards that component
  let cur = "";
  for (const s of segs) {
    cur = cur.length === 0 ? s : `${cur}/${s}`;
    try {
      if (lstatSync(cur).isSymbolicLink()) die(`refusing symlinked ancestor of manifest: ${cur}`);
    } catch (e) {
      if (e && e.code !== "ENOENT") throw e; // absent ancestor is fine
    }
  }
}

// Atomic, no-follow write: refuse to write through a symlinked manifest path.
const tmp = `${MANIFEST}.tmp-${process.pid}`;
let fd;
try {
  fd = openSync(tmp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o644);
  writeSync(fd, manifest);
  closeSync(fd);
  fd = undefined;
  // reject an existing symlink at the destination before replacing it, then rename
  // (O_NOFOLLOW on the tmp guarantees we did not traverse a link while writing)
  try {
    if (lstatSync(MANIFEST).isSymbolicLink()) die(`refusing to overwrite symlinked manifest: ${MANIFEST}`);
  } catch (e) {
    if (e && e.code !== "ENOENT") throw e; // absent target is fine
  }
  renameSync(tmp, MANIFEST);
} catch (e) {
  if (fd !== undefined) {
    try { closeSync(fd); } catch { /* ignore */ }
  }
  try { unlinkSync(tmp); } catch { /* ignore */ }
  die(`could not write ${MANIFEST}: ${e && e.code ? e.code : e}`);
}

console.log(`manifest: ${Object.keys(sorted).length} file(s) hashed in ${ACC_DIR}`);
