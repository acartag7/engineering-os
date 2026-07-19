#!/usr/bin/env node
// process-guard check — runs on every PR. Fail-closed CI gate over three checks:
//   stage-artifact: a PR touching src/** requires the frozen suite ON THE BASE tree
//   mixed-diff:     src/** and an effective-frozen test may not change together
//                   unless the contract changed too (owner-reviewed path)
//   freeze-hash:    acceptance content is frozen against the committed manifest,
//                   sourced from git blobs (never the working tree)
// Guard-level aborts (emitted before any per-check verdict, exit 1):
//   process-guard: config-invalid <field>   — a blank/invalid PG_* value
//   process-guard: git-error                 — ANY git failure (base ref, probe, overflow)
//   process-guard: internal                  — any other unexpected throw (fail-closed)
// Exit 0 = all checks pass. Exit 1 = a check failed or the guard aborted.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { isFrozenBasename, canonicalRelDir } from "./freeze-set.mjs";

const MAXBUF = 64 * 1024 * 1024;
const KNOWN_VERSIONS = new Set([1]);

class GitError extends Error {}

// ---------------------------------------------------------------------------
// output — fixed reason codes, bounded + control-escaped fields, never throws
// ---------------------------------------------------------------------------
let failed = false;

// Every code point that could forge a verdict line or corrupt terminal state is
// escaped by code point (A6): C0/C1 controls, DEL, NEL, line/paragraph separators,
// and bidi/zero-width format controls. Allowlist-in-spirit: escape anything unsafe.
function shouldEscape(cp) {
  if (cp < 0x20 || cp === 0x7f) return true; // C0 + DEL
  if (cp >= 0x80 && cp <= 0x9f) return true; // C1 (incl. NEL U+0085)
  if (cp === 0x2028 || cp === 0x2029) return true; // line/paragraph separator
  if (cp === 0x061c) return true; // ALM
  if (cp === 0x200b || cp === 0x200c || cp === 0x200d) return true; // ZWSP/ZWNJ/ZWJ
  if (cp === 0x200e || cp === 0x200f) return true; // LRM/RLM
  if (cp >= 0x202a && cp <= 0x202e) return true; // bidi embeddings/overrides
  if (cp >= 0x2066 && cp <= 0x2069) return true; // bidi isolates
  if (cp === 0xfeff) return true; // ZWNBSP / BOM
  return false;
}

function fmtField(value) {
  const nfc = String(value).normalize("NFC");
  let out = "";
  for (const ch of nfc) {
    const cp = ch.codePointAt(0);
    if (!shouldEscape(cp)) out += ch;
    else if (cp <= 0xff) out += "\\x" + cp.toString(16).padStart(2, "0");
    else if (cp <= 0xffff) out += "\\u" + cp.toString(16).padStart(4, "0");
    else out += "\\u{" + cp.toString(16) + "}";
  }
  if (out.length > 200) out = out.slice(0, 200) + `…(+${out.length - 200} more)`;
  return out;
}

function verdict(symbol, check, code, field, extra) {
  let line = `${symbol} ${check}: ${code}`;
  if (field !== undefined && field !== null) line += " " + fmtField(field);
  if (extra) line += " " + extra;
  console.log(line);
}

function fail(check, code, field, extra) {
  failed = true;
  verdict("✗", check, code, field, extra);
}
function pass(check, code, field, extra) {
  verdict("✓", check, code, field, extra);
}

function abort(code, field) {
  // guard-level: emitted before per-check verdicts, aborts the run
  verdict("✗", "process-guard", code, field);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// git plumbing — explicit maxBuffer, byte-exact, fail-closed on any error
// ---------------------------------------------------------------------------
// Force core.precomposeunicode=false so enumeration sees RAW tree bytes, not a
// platform-normalized view (macOS git precomposes NFD→NFC in ls-tree output,
// which would hide an NFC/NFD collision on a macOS runner). NFC is applied only
// for set-membership, per D1/D3 — the guard must not inherit the runner's locale.
const GIT_HARDEN = ["-c", "core.precomposeunicode=false", "-c", "core.quotePath=false"];
function gitRaw(args) {
  const r = spawnSync("git", [...GIT_HARDEN, ...args], { maxBuffer: MAXBUF });
  return r;
}
function gitBuf(args) {
  const r = gitRaw(args);
  if (r.error || r.status !== 0) throw new GitError(args.join(" "));
  return r.stdout; // Buffer
}
function gitStr(args) {
  return decodeStrict(gitBuf(args)).trim();
}

const UTF8 = new TextDecoder("utf-8", { fatal: true });
function decodeStrict(buf) {
  try {
    return UTF8.decode(buf);
  } catch {
    throw new GitError("invalid utf-8 in git output");
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

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

// zero exit + entry => present; zero exit + empty => cleanly absent; nonzero => error
function treePresent(rev, path) {
  const r = gitRaw(["ls-tree", "-z", "--full-tree", rev, "--", path]);
  if (r.error || r.status !== 0) throw new GitError(`ls-tree ${rev} ${path}`);
  return r.stdout.length > 0;
}

// ---------------------------------------------------------------------------
// config validation — before ANY side effect; fail-closed on blank/invalid
// ---------------------------------------------------------------------------
function splitList(value) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// canonicalRelDir (A4) is single-sourced in freeze-set.mjs so the guard and the
// generator validate PG_ACCEPTANCE_DIR identically.

// A src prefix matches only on a path-segment boundary (A4): `src` never gates
// `srcfoo/`. Trailing slashes on the configured prefix are normalized first.
function matchesPrefix(f, prefix) {
  const p = prefix.replace(/\/+$/, "");
  return f === p || f.startsWith(p + "/");
}

const BASE = process.env.PG_BASE_REF ?? "origin/main";
if (BASE.trim().length === 0) abort("config-invalid", "PG_BASE_REF");

const ACC_DIR = canonicalRelDir(process.env.PG_ACCEPTANCE_DIR ?? "test/acceptance");
if (ACC_DIR === null) abort("config-invalid", "PG_ACCEPTANCE_DIR");

const SRC_PREFIXES = splitList(process.env.PG_SRC_PATHS ?? "src/");
if (SRC_PREFIXES.length === 0) abort("config-invalid", "PG_SRC_PATHS");

const CONTRACTS = splitList(process.env.PG_CONTRACT_PATHS ?? "contracts.md,docs/contracts.md");
if (CONTRACTS.length === 0) abort("config-invalid", "PG_CONTRACT_PATHS");

const MANIFEST = `${ACC_DIR}/acceptance.manifest.json`;
const ACTIVATION = `${ACC_DIR}/phases.json`;
const EXEMPT = ".process-guard-exempt";

// ---------------------------------------------------------------------------
// tree enumeration
// ---------------------------------------------------------------------------
// Returns [{ rel, mode }] for regular/symlink/... entries under ACC_DIR.
function lsTreeAcc(rev) {
  const buf = gitBuf(["ls-tree", "-z", "-r", "--full-tree", rev, "--", ACC_DIR]);
  const out = [];
  for (const seg of splitNul(buf)) {
    if (seg.length === 0) continue;
    const tab = seg.indexOf(0x09);
    if (tab < 0) continue;
    const meta = seg.subarray(0, tab).toString("latin1");
    const path = decodeStrict(seg.subarray(tab + 1));
    const mode = meta.split(" ")[0];
    if (path !== ACC_DIR && !path.startsWith(ACC_DIR + "/")) continue;
    const rel = path.slice(ACC_DIR.length + 1);
    if (rel.length === 0) continue;
    out.push({ rel, mode });
  }
  return out;
}

function basename(rel) {
  const parts = rel.split("/");
  return parts[parts.length - 1];
}
const isRegular = (mode) => mode === "100644" || mode === "100755";

// map nfc(rel) -> { rel, mode } for every entry (regular + symlink + others)
function indexEntries(entries) {
  const byKey = new Map();
  for (const e of entries) byKey.set(e.rel.normalize("NFC"), e);
  return byKey;
}

// mandatory-matched regular blobs; detects NFC collisions among them
function matchedRegular(entries) {
  const matched = new Set();
  const rawByKey = new Map();
  let collision = null;
  for (const e of entries) {
    if (e.rel === "acceptance.manifest.json" || e.rel === "phases.json") continue;
    if (!isFrozenBasename(basename(e.rel))) continue;
    if (!isRegular(e.mode)) continue;
    const key = e.rel.normalize("NFC");
    if (rawByKey.has(key) && rawByKey.get(key) !== e.rel) collision = key;
    matched.add(key);
    rawByKey.set(key, e.rel);
  }
  return { matched, rawByKey, collision };
}

// A3: NFC-key collision across EVERY raw entry under ACC_DIR (any mode). Returns
// the colliding NFC key, or null. Never last-write-wins a colliding key silently.
function wholeTreeCollision(entries) {
  const seen = new Map();
  for (const e of entries) {
    const key = e.rel.normalize("NFC");
    const prev = seen.get(key);
    if (prev !== undefined && prev !== e.rel) return key;
    seen.set(key, e.rel);
  }
  return null;
}

// A2: any entry that is mandatory-matched (frozen basename) OR a manifest key,
// whose git mode is not a regular blob, fails closed — before any blob read.
function nonRegularMatchedOrListed(entries, manifestKeys) {
  for (const e of entries) {
    if (e.rel === "acceptance.manifest.json" || e.rel === "phases.json") continue;
    const key = e.rel.normalize("NFC");
    if (!isFrozenBasename(basename(e.rel)) && !manifestKeys.has(key)) continue;
    if (!isRegular(e.mode)) return { file: e.rel };
  }
  return null;
}

// ---------------------------------------------------------------------------
// manifest schema (parse, don't validate) + NFC/key-safety
// ---------------------------------------------------------------------------
function isPlainObject(v) {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

function keySafe(key) {
  if (typeof key !== "string" || key.length === 0) return false;
  if (key === "__proto__" || key === "constructor" || key === "prototype") return false;
  if (key === "acceptance.manifest.json" || key === "phases.json") return false;
  if (/[\u0000-\u001f\u007f]/.test(key)) return false; // A7: no control byte in a key
  if (key.includes("\\")) return false;
  if (key.startsWith("/")) return false;
  if (key.normalize("NFC") !== key) return false; // canonical NFC, byte-identical
  const segs = key.split("/");
  for (const s of segs) {
    if (s.length === 0 || s === "." || s === "..") return false;
    if (s === "__proto__" || s === "constructor" || s === "prototype") return false;
  }
  return true;
}

// returns { ok:true, version, files:Map } | { ok:false, code, field? }
function parseManifest(buf) {
  let text;
  try {
    text = decodeStrict(buf);
  } catch {
    return { ok: false, code: "manifest-malformed" };
  }
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    return { ok: false, code: "manifest-malformed" };
  }
  if (!isPlainObject(obj)) return { ok: false, code: "manifest-malformed" };
  if (!KNOWN_VERSIONS.has(obj.version)) return { ok: false, code: "manifest-malformed" };
  if (!isPlainObject(obj.files)) return { ok: false, code: "manifest-malformed" };
  const files = new Map();
  for (const key of Object.keys(obj.files)) {
    if (!Object.prototype.hasOwnProperty.call(obj.files, key)) continue;
    if (!keySafe(key)) return { ok: false, code: "key-unsafe", field: key };
    const val = obj.files[key];
    if (typeof val !== "string" || !/^[0-9a-f]{64}$/.test(val)) {
      return { ok: false, code: "manifest-malformed" };
    }
    files.set(key, val);
  }
  return { ok: true, version: obj.version, files };
}

// ---------------------------------------------------------------------------
// gather diff + trees (all git — any failure => git-error)
// ---------------------------------------------------------------------------
function run() {
  const mergeBase = gitStr(["merge-base", BASE, "HEAD"]);
  gitStr(["rev-parse", "--verify", `${mergeBase}^{commit}`]);

  const diffBuf = gitBuf(["diff", "-z", "--no-renames", "--name-only", mergeBase, "HEAD"]);
  const changed = splitNul(diffBuf)
    .filter((s) => s.length > 0)
    .map((s) => decodeStrict(s));

  const baseManifestPresent = treePresent(mergeBase, MANIFEST);
  const headManifestPresent = treePresent("HEAD", MANIFEST);
  const exemptOnBase = treePresent(mergeBase, EXEMPT);

  const headEntries = lsTreeAcc("HEAD");
  const baseEntries = lsTreeAcc(mergeBase);
  const headByKey = indexEntries(headEntries);
  const headMatchedInfo = matchedRegular(headEntries);

  // A5: read + schema-parse the HEAD manifest ONCE through the fail-closed helper.
  // A git failure here throws GitError (=> git-error abort) and is never swallowed;
  // only a schema/JSON malformation is non-fatal (empty listed keys for mixed-diff).
  const headParsed = headManifestPresent
    ? parseManifest(gitBuf(["cat-file", "blob", `HEAD:${MANIFEST}`]))
    : null;
  const listedKeys = headParsed && headParsed.ok ? new Set(headParsed.files.keys()) : new Set();

  const touchesSrc = changed.some((f) => SRC_PREFIXES.some((p) => matchesPrefix(f, p)));
  const touchesContract = changed.some((f) => CONTRACTS.includes(f));
  const touchesAcceptance = changed.some((f) => isEffectiveFrozen(f, headMatchedInfo.matched, listedKeys));

  stageArtifact({ touchesSrc, baseManifestPresent, exemptOnBase });
  mixedDiff({ touchesSrc, touchesAcceptance, touchesContract });
  freezeHash({
    mergeBase,
    baseManifestPresent,
    headManifestPresent,
    headParsed,
    headEntries,
    headByKey,
    headMatchedInfo,
    baseEntries,
    touchesContract,
  });
}

function isEffectiveFrozen(f, matched, listedKeys) {
  if (f === MANIFEST || f === ACTIVATION) return false;
  if (f !== ACC_DIR && !f.startsWith(ACC_DIR + "/")) return false;
  const rel = f.slice(ACC_DIR.length + 1);
  const key = rel.normalize("NFC");
  if (isFrozenBasename(basename(rel))) return true;
  return listedKeys.has(key);
}

// ---------------------------------------------------------------------------
// stage-artifact — exemption + manifest presence read from the BASE tree
// ---------------------------------------------------------------------------
function stageArtifact({ touchesSrc, baseManifestPresent, exemptOnBase }) {
  if (!touchesSrc) {
    pass("stage-artifact", "no-src");
    return;
  }
  const note = "— stage-artifact is a global gate, not per-feature (accepted risk)";
  if (baseManifestPresent) {
    pass("stage-artifact", "manifest-on-base", undefined, note);
  } else if (exemptOnBase) {
    pass("stage-artifact", "exempt-on-base", undefined, note);
  } else {
    fail("stage-artifact", "missing-on-base", undefined,
      "— author and merge the acceptance suite (or the exempt marker) first");
  }
}

// ---------------------------------------------------------------------------
// mixed-diff — over the effective frozen set only
// ---------------------------------------------------------------------------
function mixedDiff({ touchesSrc, touchesAcceptance, touchesContract }) {
  if (touchesSrc && touchesAcceptance) {
    if (touchesContract) pass("mixed-diff", "reviewed", undefined, "— contract changed alongside");
    else fail("mixed-diff", "unreviewed", undefined, "— frozen tests change only via a contract change");
  } else {
    pass("mixed-diff", "clean");
  }
}

// ---------------------------------------------------------------------------
// freeze-hash
// ---------------------------------------------------------------------------
function selfConsistency(mergeBaseUnused, manifestFiles, headByKey, headMatched) {
  // 1. every listed key exists, is a regular blob, and hashes to its recorded value
  for (const [key, hash] of manifestFiles) {
    const e = headByKey.get(key);
    if (!e) return { code: "phantom-key", file: key };
    if (!isRegular(e.mode)) return { code: "symlink", file: key };
    const blob = gitBuf(["cat-file", "blob", `HEAD:${ACC_DIR}/${e.rel}`]);
    if (sha256(blob) !== hash) return { code: "edited", file: key };
  }
  // 2. every mandatory-matched HEAD blob must be listed
  for (const key of headMatched) {
    if (!manifestFiles.has(key)) return { code: "unlisted", file: key };
  }
  return null;
}

function freezeHash(ctx) {
  const {
    mergeBase,
    baseManifestPresent,
    headManifestPresent,
    headParsed,
    headEntries,
    headByKey,
    headMatchedInfo,
    baseEntries,
    touchesContract,
  } = ctx;
  const headMatched = headMatchedInfo.matched;

  // ---- HEAD structural checks: UNCONDITIONAL and FIRST. A PR can never commit an
  // NFC collision, a symlink, or an empty suite (A2/A3/A1). These bind HEAD content
  // regardless of the base's state.
  const headCollision = wholeTreeCollision(headEntries);
  if (headCollision) return void fail("freeze-hash", "nfc-collision", headCollision);

  // PG-H5: manifest present on base must remain present on HEAD (unconditional)
  if (baseManifestPresent && !headManifestPresent) {
    fail("freeze-hash", "manifest-deleted", undefined, "— the frozen manifest may not be removed");
    return;
  }
  if (!headManifestPresent) {
    pass("freeze-hash", "no-suite");
    return;
  }

  const head = headParsed;
  if (!head.ok) {
    fail("freeze-hash", head.code, head.field);
    return;
  }

  // A2: non-regular matched/listed HEAD entries fail closed, before any blob read.
  const headNonReg = nonRegularMatchedOrListed(headEntries, new Set(head.files.keys()));
  if (headNonReg) return void fail("freeze-hash", "symlink", headNonReg.file);

  // HEAD self-consistency (PG-H2) is unconditional on every manifest-present path.
  const uc = selfConsistency(mergeBase, head.files, headByKey, headMatched);
  if (uc) return void fail("freeze-hash", uc.code, uc.file);

  // A1: an empty suite is NEVER a freeze — on introduction, steady-state, AND the
  // reviewed re-freeze path. Zero mandatory-matched regular tests => empty-suite.
  if (headMatched.size === 0) {
    return void fail("freeze-hash", "empty-suite", undefined, "— an empty manifest is not an introduction");
  }

  // PG-H6: cleanly no manifest on base => reviewed introduction path
  if (!baseManifestPresent) {
    pass("freeze-hash", "introduced", undefined, `— ${headMatched.size} matched test(s) frozen`);
    return;
  }

  // ---- Base-present path. HEAD is now proven structurally clean. A11: a
  // structurally-corrupt BASE — a malformed base manifest, an NFC collision, or a
  // matched/listed symlink on the base tree — must NOT permanently wedge the repo.
  // Once HEAD is clean, a PR that also changes a contract re-establishes the suite
  // (`re-frozen`, skipping the untrustworthy base comparison); without a contract
  // change it fails closed with the specific code, pointing at the repair path.
  const base = parseManifest(gitBuf(["cat-file", "blob", `${mergeBase}:${MANIFEST}`]));
  const baseCollision = wholeTreeCollision(baseEntries);
  const baseNonReg = base.ok
    ? nonRegularMatchedOrListed(baseEntries, new Set(base.files.keys()))
    : null;

  if (!base.ok || baseCollision || baseNonReg) {
    if (touchesContract) {
      pass("freeze-hash", "re-frozen", undefined, "— reviewed re-establishment over a corrupt base");
      return;
    }
    if (!base.ok) {
      return void fail("freeze-hash", "manifest-malformed", undefined,
        "— base manifest is malformed; land a contract-gated re-establishment");
    }
    if (baseCollision) {
      return void fail("freeze-hash", "nfc-collision", baseCollision,
        "— corrupt base; land a contract-gated re-establishment");
    }
    return void fail("freeze-hash", "symlink", baseNonReg.file,
      "— corrupt base; land a contract-gated re-establishment");
  }

  // Only a structurally SOUND base reaches the base-hole + base-freeze comparisons.
  const baseByKey = indexEntries(baseEntries);
  const baseMatchedInfo = matchedRegular(baseEntries);
  const HK = head.files;
  const BK = base.files;

  let gated = null; // edited/deleted allowed only under a contract change

  // Base holes (PG-H2): matched on base but absent from the base manifest
  for (const key of baseMatchedInfo.matched) {
    if (BK.has(key)) continue;
    const baseRel = baseMatchedInfo.rawByKey.get(key);
    const baseBlob = sha256(gitBuf(["cat-file", "blob", `${mergeBase}:${ACC_DIR}/${baseRel}`]));
    const he = headByKey.get(key);
    if (he && isRegular(he.mode)) {
      const headBlob = sha256(gitBuf(["cat-file", "blob", `HEAD:${ACC_DIR}/${he.rel}`]));
      if (headBlob !== baseBlob) {
        gated = gated || { code: "edited", file: key }; // registration may not smuggle an edit
      } else if (!(HK.has(key) && HK.get(key) === baseBlob)) {
        return void fail("freeze-hash", "unlisted", key); // present, unchanged, unregistered
      }
    } else {
      return void fail("freeze-hash", "unlisted-on-base", key); // unfrozen deletion (unconditional)
    }
  }

  // Base freeze (PG-H2b): every base manifest key's HEAD blob == base blob, blob-to-blob
  for (const [key] of BK) {
    const be = baseByKey.get(key);
    if (!be) continue; // base key with no base blob (edge); nothing to compare
    const baseBlob = sha256(gitBuf(["cat-file", "blob", `${mergeBase}:${ACC_DIR}/${be.rel}`]));
    if (!HK.has(key)) {
      gated = gated || { code: "deleted", file: key };
      continue;
    }
    const he = headByKey.get(key);
    if (he && isRegular(he.mode)) {
      const headBlob = sha256(gitBuf(["cat-file", "blob", `HEAD:${ACC_DIR}/${he.rel}`]));
      if (headBlob !== baseBlob) gated = gated || { code: "edited", file: key };
    }
  }

  if (gated) {
    if (touchesContract) {
      pass("freeze-hash", "re-frozen", undefined, "— frozen content changed via the reviewed contract path");
      return;
    }
    fail("freeze-hash", gated.code, gated.file, "— frozen; change it via a contract change in the same PR");
    return;
  }

  pass("freeze-hash", "intact", undefined, `— ${HK.size} file(s) frozen`);
}

// ---------------------------------------------------------------------------
try {
  run();
} catch (e) {
  // A8: git failures are labeled git-error; any other throw is labeled internal.
  // Both fail closed (exit 1) — a throw never becomes a pass.
  if (e instanceof GitError) abort("git-error", undefined);
  abort("internal", undefined);
}
process.exit(failed ? 1 : 0);
