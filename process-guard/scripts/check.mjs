#!/usr/bin/env node
// process-guard check — runs on every PR. Three checks:
//   freeze-hash:    acceptance test content must match the committed manifest
//   mixed-diff:     src/** and acceptance tests may not change in the same PR
//                   unless the contract changed too (owner-reviewed path)
//   stage-artifact: a PR touching src/** requires the manifest on the base branch
// Exit 0 = all pass. Exit 1 = at least one check failed. Fail-closed on errors.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.PG_BASE_REF ?? "origin/main";
const ACC_DIR = process.env.PG_ACCEPTANCE_DIR ?? "test/acceptance";
const SRC_PREFIXES = (process.env.PG_SRC_PATHS ?? "src/").split(",").map((s) => s.trim());
const CONTRACTS = (process.env.PG_CONTRACT_PATHS ?? "contracts.md,docs/contracts.md")
  .split(",").map((s) => s.trim());
const MANIFEST = `${ACC_DIR}/acceptance.manifest.json`;
const ACTIVATION = `${ACC_DIR}/phases.json`;

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

let failed = false;
const fail = (check, msg) => { failed = true; console.error(`✗ ${check}: ${msg}`); };
const pass = (check, msg) => console.log(`✓ ${check}: ${msg}`);

const mergeBase = git("merge-base", BASE, "HEAD");
const changed = git("diff", "--name-only", mergeBase, "HEAD").split("\n").filter(Boolean);

const touchesSrc = changed.some((f) => SRC_PREFIXES.some((p) => f.startsWith(p)));
const touchesAcceptance = changed.some(
  (f) => f.startsWith(ACC_DIR + "/") && f !== MANIFEST && f !== ACTIVATION,
);
const touchesManifest = changed.includes(MANIFEST);
const touchesContract = changed.some((f) => CONTRACTS.includes(f));

// --- stage-artifact: src changes require the frozen suite to exist on base ---
if (touchesSrc) {
  const onBase = git("ls-tree", "-r", "--name-only", mergeBase).split("\n");
  if (onBase.includes(MANIFEST)) {
    pass("stage-artifact", `manifest present on base (${MANIFEST}) — global check; ` +
      "per-feature coverage is not gated here, it is audited monthly (R-2)");
  } else if (onBase.includes(".process-guard-exempt")) {
    // PG-H1: the exemption is decided from the base tree, never the working tree —
    // a PR cannot add the marker in its own diff to exempt itself.
    pass("stage-artifact", "repo not yet onboarded (exempt marker present on base)");
  } else {
    fail("stage-artifact", `src/** changed but ${MANIFEST} missing on base branch — ` +
      "author and merge the acceptance suite first (pipeline stage 4)");
  }
}

// --- mixed-diff: implementation and acceptance tests in one PR ---
if (touchesSrc && (touchesAcceptance || touchesManifest)) {
  if (touchesContract) {
    pass("mixed-diff", "src + acceptance changed together, contract changed too (reviewed path)");
  } else {
    fail("mixed-diff", "PR changes src/** and acceptance tests without a contract change — " +
      "the suite may only change via a contract change, in its own reviewed PR");
  }
} else {
  pass("mixed-diff", "no mixed src/acceptance diff");
}

// --- freeze-hash: recompute and compare every hash in the manifest ---
if (existsSync(MANIFEST)) {
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const mismatches = new Set();
  const listed = new Set(Object.keys(manifest.files));
  for (const [rel, expected] of Object.entries(manifest.files)) {
    const p = join(ACC_DIR, rel);
    if (!existsSync(p)) { mismatches.add(`${rel} (deleted)`); continue; }
    const actual = createHash("sha256").update(readFileSync(p)).digest("hex");
    if (actual !== expected) mismatches.add(rel);
  }
  // new acceptance files not in the manifest are a freeze violation
  for (const f of changed) {
    if (!f.startsWith(ACC_DIR + "/") || f === MANIFEST || f === ACTIVATION) continue;
    const rel = f.slice(ACC_DIR.length + 1);
    if (!listed.has(rel) && existsSync(f)) mismatches.add(`${rel} (unlisted)`);
  }
  // PG-H2: the manifest must enumerate EVERY acceptance file on the base tree.
  // An unlisted base file — and therefore its deletion — is a freeze violation,
  // so the freeze is an allowlist over the directory, not a per-named-file check.
  const baseAcc = git("ls-tree", "-r", "--name-only", mergeBase, "--", ACC_DIR)
    .split("\n").filter(Boolean);
  for (const f of baseAcc) {
    if (f === MANIFEST || f === ACTIVATION) continue;
    const rel = f.slice(ACC_DIR.length + 1);
    if (!listed.has(rel)) mismatches.add(`${rel} (unlisted on base)`);
  }
  if (mismatches.size === 0) {
    pass("freeze-hash", `${listed.size} file(s) intact; manifest covers the acceptance tree`);
  } else if (touchesManifest && touchesContract) {
    // NOTE: contract-unlock is still coarse (PG-H3, deferred — see contracts.md):
    // any contract touch unlocks a re-freeze. The re-freeze invariant needs a
    // redesign; until then R-2 audits acceptance changes vs contract changes.
    pass("freeze-hash", `manifest updated alongside contract change (${mismatches.size} re-frozen)`);
  } else {
    fail("freeze-hash", `acceptance content diverges from manifest: ${[...mismatches].join(", ")} — ` +
      "tests are frozen; changing them requires a contract change in the same PR");
  }
} else if (touchesAcceptance) {
  fail("freeze-hash", `acceptance files changed but ${MANIFEST} does not exist — ` +
    "generate it with generate-manifest.mjs in the acceptance PR");
} else {
  pass("freeze-hash", "no acceptance suite in this repo yet");
}

process.exit(failed ? 1 : 0);
