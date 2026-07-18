// Acceptance suite for process-guard hardening (contract PG-H1..PG-H4).
// Black-box: drives process-guard/scripts/check.mjs over real git fixtures and
// asserts pass/fail. Frozen — see acceptance.manifest.json. Runs with `node --test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const CHECK = join(
  dirname(fileURLToPath(import.meta.url)),
  "..", "..", "..", "process-guard", "scripts", "check.mjs",
);

// Run check.mjs inside a fixture repo; return {code, out}.
function runGuard(repo, env = {}) {
  try {
    const out = execFileSync("node", [CHECK], {
      cwd: repo, encoding: "utf8",
      env: { ...process.env, PG_BASE_REF: "base", ...env },
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

const git = (repo, ...args) =>
  execFileSync("git", args, { cwd: repo, encoding: "utf8" });

// Fresh repo with a `base` branch as the diff target.
function initRepo() {
  const repo = mkdtempSync(join(tmpdir(), "pg-"));
  git(repo, "init", "-q", "-b", "base");
  git(repo, "config", "user.email", "t@t.t");
  git(repo, "config", "user.name", "t");
  return repo;
}
function write(repo, rel, body) {
  const p = join(repo, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, body);
}
function commitAll(repo, msg) {
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", msg);
}
const cleanup = (repo) => rmSync(repo, { recursive: true, force: true });

// sha256 helper mirroring generate-manifest
import { createHash } from "node:crypto";
const sha = (s) => createHash("sha256").update(s).digest("hex");

test("PG-H1: a PR that adds .process-guard-exempt itself does not exempt itself", () => {
  const repo = initRepo();
  try {
    write(repo, "README.md", "base\n");
    commitAll(repo, "base");
    git(repo, "checkout", "-q", "-b", "pr");
    write(repo, "src/app.ts", "export const x = 1\n");     // a src change
    write(repo, ".process-guard-exempt", "self-added\n");   // marker in the PR's own diff
    commitAll(repo, "pr");
    const { code, out } = runGuard(repo);
    assert.equal(code, 1, `stage-artifact must fail; got pass:\n${out}`);
    assert.match(out, /stage-artifact/);
  } finally { cleanup(repo); }
});

test("PG-H2: deleting an unlisted acceptance file on base is a freeze violation", () => {
  const repo = initRepo();
  try {
    write(repo, "test/acceptance/a.test.ts", "test a\n");
    write(repo, "test/acceptance/b.test.ts", "test b\n"); // present but NOT in manifest
    write(repo, "test/acceptance/acceptance.manifest.json",
      JSON.stringify({ files: { "a.test.ts": sha("test a\n") } }, null, 2) + "\n");
    commitAll(repo, "base");
    git(repo, "checkout", "-q", "-b", "pr");
    rmSync(join(repo, "test/acceptance/b.test.ts"));       // delete the unlisted file
    commitAll(repo, "pr");
    const { code, out } = runGuard(repo);
    assert.equal(code, 1, `freeze-hash must fail on unlisted deletion; got pass:\n${out}`);
    assert.match(out, /freeze-hash/);
    assert.match(out, /b\.test\.ts/);
  } finally { cleanup(repo); }
});

// PG-H3 (the re-freeze invariant) is DEFERRED pending redesign — see
// contracts.md. No test here on purpose: a test that pins current behavior
// would be tautological, and the intended invariant has no agreed mechanism yet.

test("PG-H4: stage-artifact pass message states the global limit", () => {
  const repo = initRepo();
  try {
    write(repo, "test/acceptance/a.test.ts", "test a\n");
    write(repo, "test/acceptance/acceptance.manifest.json",
      JSON.stringify({ files: { "a.test.ts": sha("test a\n") } }, null, 2) + "\n");
    commitAll(repo, "base");
    git(repo, "checkout", "-q", "-b", "pr");
    write(repo, "src/app.ts", "export const y = 2\n");
    commitAll(repo, "pr");
    const { code, out } = runGuard(repo);
    assert.equal(code, 0, `expected pass:\n${out}`);
    assert.match(out, /global/i, "stage-artifact must name its global limit");
  } finally { cleanup(repo); }
});

// A sanity guard so the harness itself is not vacuous: the legitimate path passes.
test("baseline: contract-related freeze update on the reviewed path passes", () => {
  const repo = initRepo();
  try {
    write(repo, "test/acceptance/a.test.ts", "v1\n");
    write(repo, "test/acceptance/acceptance.manifest.json",
      JSON.stringify({ files: { "a.test.ts": sha("v1\n") } }, null, 2) + "\n");
    write(repo, "contracts.md", "# Contracts\n\n## a\nold\n");
    commitAll(repo, "base");
    git(repo, "checkout", "-q", "-b", "pr");
    write(repo, "test/acceptance/a.test.ts", "v2\n");
    write(repo, "test/acceptance/acceptance.manifest.json",
      JSON.stringify({ files: { "a.test.ts": sha("v2\n") } }, null, 2) + "\n");
    write(repo, "contracts.md", "# Contracts\n\n## a\nold\nnow covers a.test.ts behavior.\n");
    commitAll(repo, "pr");
    const { code, out } = runGuard(repo);
    assert.equal(code, 0, `legitimate contract-linked re-freeze should pass:\n${out}`);
  } finally { cleanup(repo); }
});
