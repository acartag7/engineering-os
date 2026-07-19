import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const DEFAULT_CHECK_PATH = decodeURIComponent(
  new URL("../../../process-guard/scripts/check.mjs", import.meta.url).pathname,
);
const CHECK_PATH = process.env.PG_CHECK_PATH ?? DEFAULT_CHECK_PATH;
const ACC = "test/acceptance";

function git(repo, args, options = {}) {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8", ...options }).trim();
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function manifest(files) {
  return `${JSON.stringify({ version: 1, files }, null, 2)}\n`;
}

function write(repo, relativePath, content) {
  const destination = join(repo, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, content);
}

function remove(repo, relativePath) {
  rmSync(join(repo, relativePath), { recursive: true, force: true });
}

function commit(repo, message, stagedBlobs) {
  git(repo, ["add", "-A"]);
  for (const { path, content, mode } of stagedBlobs.splice(0)) {
    const blob = git(repo, ["hash-object", "-w", "--stdin"], { input: content });
    git(repo, ["update-index", "--add", "--cacheinfo", `${mode},${blob},${path}`]);
  }
  git(repo, ["commit", "-q", "-m", message]);
}

function assertTreeMode(repo, ref, relativePath, expectedMode) {
  const entry = git(repo, ["ls-tree", ref, "--", relativePath]);
  assert.match(entry, new RegExp(`^${expectedMode}\\s+blob\\s+`),
    `expected ${relativePath} to be a ${expectedMode} git blob`);
}

function makeFixture(baseSetup = () => {}, prSetup = () => {}) {
  const repo = mkdtempSync(join(tmpdir(), "process-guard-acceptance-"));
  const baseStagedBlobs = [];
  const prStagedBlobs = [];
  const api = (stagedBlobs) => ({
    write: (relativePath, content) => write(repo, relativePath, content),
    remove: (relativePath) => remove(repo, relativePath),
    move: (from, to) => {
      mkdirSync(dirname(join(repo, to)), { recursive: true });
      renameSync(join(repo, from), join(repo, to));
    },
    symlink: (target, relativePath) => {
      const destination = join(repo, relativePath);
      mkdirSync(dirname(destination), { recursive: true });
      symlinkSync(target, destination);
    },
    // This is deliberately git plumbing: it permits byte-distinct names even on
    // filesystems that canonicalize Unicode filenames.
    stageBlob: (relativePath, content, mode = "100644") => {
      stagedBlobs.push({ path: relativePath, content, mode });
    },
  });

  git(repo, ["init", "-q"]);
  git(repo, ["config", "core.precomposeunicode", "false"]);
  git(repo, ["config", "core.quotepath", "false"]);
  git(repo, ["config", "user.email", "acceptance@example.invalid"]);
  git(repo, ["config", "user.name", "Process Guard Acceptance"]);
  git(repo, ["checkout", "-q", "-b", "base"]);
  write(repo, "README.md", "base canary\n");
  baseSetup(api(baseStagedBlobs));
  commit(repo, "base", baseStagedBlobs);

  git(repo, ["checkout", "-q", "-b", "pr"]);
  prSetup(api(prStagedBlobs));
  // Every fixture has a PR commit, including probes whose bad state is already on base.
  write(repo, ".fixture-pr", "pr\n");
  commit(repo, "pr", prStagedBlobs);
  return repo;
}

function runGuard(repoDir, overrides = {}) {
  const cleanEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("PG_")),
  );
  const env = { ...cleanEnv, PG_BASE_REF: "base" };
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) env[key] = value;
  }
  const child = spawnSync(process.execPath, [CHECK_PATH], {
    cwd: repoDir,
    env,
    encoding: "utf8",
  });
  return {
    code: child.status ?? -1,
    out: `${child.stdout ?? ""}${child.stderr ?? ""}`,
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertVerdict(result, symbol, check, reasonCode, filename) {
  const token = new RegExp(`${escapeRegExp(symbol)}\\s+${escapeRegExp(check)}:\\s*${escapeRegExp(reasonCode)}\\b`);
  assert.match(result.out, token, `expected ${symbol} ${check}: ${reasonCode}; output:\n${result.out}`);
  if (filename !== undefined) {
    assert.match(result.out, new RegExp(escapeRegExp(filename)),
      `expected load-bearing filename ${filename}; output:\n${result.out}`);
  }
}

function assertFailure(result, check, reasonCode, filename) {
  assert.notEqual(result.code, 0, `guard unexpectedly passed; output:\n${result.out}`);
  assertVerdict(result, "✗", check, reasonCode, filename);
}

function assertPass(result, check, reasonCode) {
  assert.equal(result.code, 0, `guard unexpectedly failed; output:\n${result.out}`);
  assertVerdict(result, "✓", check, reasonCode);
}

function withFixture(baseSetup, prSetup, body) {
  const repo = makeFixture(baseSetup, prSetup);
  try {
    body(repo);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
}

function baseFrozen(api, files = { "a.test.mjs": "export const a = 1;\n" }) {
  const hashes = {};
  for (const [name, content] of Object.entries(files)) {
    api.write(`${ACC}/${name}`, content);
    hashes[name] = sha256(content);
  }
  api.write(`${ACC}/acceptance.manifest.json`, manifest(hashes));
}

test("BYPASS-DELTA H1: PR-only exemption cannot satisfy stage-artifact", () => {
  withFixture(
    () => {},
    (api) => {
      api.write("src/change.ts", "export const changed = true;\n");
      api.write(".process-guard-exempt", "attempted self exemption\n");
    },
    (repo) => assertFailure(runGuard(repo), "stage-artifact", "missing-on-base"),
  );
});

test("BYPASS-DELTA H2: deleting an unlisted base test remains blocked under contract", () => {
  withFixture(
    (api) => {
      baseFrozen(api);
      api.write(`${ACC}/b.test.mjs`, "export const b = 1;\n");
    },
    (api) => {
      api.remove(`${ACC}/b.test.mjs`);
      api.write("contracts.md", "reviewed recovery attempt\n");
    },
    (repo) => assertFailure(runGuard(repo), "freeze-hash", "unlisted-on-base", "b.test.mjs"),
  );
});

test("BYPASS-DELTA H2b/H6: self-consistent rewrite is compared to the base blob", () => {
  const changed = "export const a = 2;\n";
  withFixture(
    (api) => baseFrozen(api),
    (api) => {
      api.write(`${ACC}/a.test.mjs`, changed);
      api.write(`${ACC}/acceptance.manifest.json`, manifest({ "a.test.mjs": sha256(changed) }));
    },
    (repo) => assertFailure(runGuard(repo), "freeze-hash", "edited", "a.test.mjs"),
  );
});

test("BYPASS-DELTA H7.1: non-ASCII unlisted mandatory test is not skipped", () => {
  const name = "café.test.mjs";
  withFixture(
    (api) => baseFrozen(api),
    (api) => api.write(`${ACC}/${name}`, "export const cafe = true;\n"),
    (repo) => assertFailure(runGuard(repo), "freeze-hash", "unlisted", name),
  );
});

test("BYPASS-DELTA H7.2: rename out of src is detected without rename collapse", () => {
  withFixture(
    (api) => api.write("src/a.ts", "export const a = 1;\n"),
    (api) => api.move("src/a.ts", "vendor/a.ts"),
    (repo) => assertFailure(runGuard(repo), "stage-artifact", "missing-on-base"),
  );
});

test("BYPASS-DELTA H7.4: traversal manifest key is rejected before its external canary can be read", () => {
  const canary = "base canary\n";
  withFixture(
    (api) => {
      // The only hash in this manifest is deliberately for README.md, outside ACC.
      // A guard that joins and reads this key will accept the canary, proving the escape.
      api.write(`${ACC}/acceptance.manifest.json`, manifest({ "../../README.md": sha256(canary) }));
    },
    () => {},
    (repo) => assertFailure(runGuard(repo), "freeze-hash", "key-unsafe", "../../README.md"),
  );
});

test("BYPASS-DELTA H7.5: trailing acceptance slash is normalized before matching", () => {
  withFixture(
    (api) => baseFrozen(api),
    (api) => api.write(`${ACC}/b.test.mjs`, "export const b = 1;\n"),
    (repo) => assertFailure(
      runGuard(repo, { PG_ACCEPTANCE_DIR: "test/acceptance/" }),
      "freeze-hash",
      "unlisted",
      "b.test.mjs",
    ),
  );
});

test("BYPASS-DELTA H5: deleting only the manifest cannot turn a suite into no-suite", () => {
  withFixture(
    (api) => baseFrozen(api),
    (api) => api.remove(`${ACC}/acceptance.manifest.json`),
    (repo) => assertFailure(runGuard(repo), "freeze-hash", "manifest-deleted"),
  );
});

test("OUTPUT-DELTA H4: both stage-artifact pass paths state the global residual", () => {
  withFixture(
    (api) => baseFrozen(api),
    (api) => api.write("src/change.ts", "export const changed = true;\n"),
    (repo) => {
      const result = runGuard(repo);
      assertPass(result, "stage-artifact", "manifest-on-base");
      assert.match(result.out, /✓ stage-artifact: manifest-on-base[^\n]*\bglobal\b/);
      assert.doesNotMatch(result.out, /R-2/);
    },
  );
  withFixture(
    (api) => api.write(".process-guard-exempt", "onboarded separately\n"),
    (api) => api.write("src/change.ts", "export const changed = true;\n"),
    (repo) => {
      const result = runGuard(repo);
      assertPass(result, "stage-artifact", "exempt-on-base");
      assert.match(result.out, /✓ stage-artifact: exempt-on-base[^\n]*\bglobal\b/);
      assert.doesNotMatch(result.out, /R-2/);
    },
  );
});

test("FIXED-ONLY whole-dir delete: manifest deletion has the distinct reason code", () => {
  withFixture(
    (api) => baseFrozen(api),
    (api) => api.remove(ACC),
    (repo) => assertFailure(runGuard(repo), "freeze-hash", "manifest-deleted"),
  );
});

test("FIXED-ONLY git-error: an invalid base ref fails closed", () => {
  withFixture(
    (api) => baseFrozen(api),
    () => {},
    (repo) => assertFailure(runGuard(repo, { PG_BASE_REF: "not-a-real-base-ref" }), "process-guard", "git-error"),
  );
});

test("FIXED-ONLY empty-suite intro: an empty manifest is not an introduction", () => {
  withFixture(
    () => {},
    (api) => api.write(`${ACC}/acceptance.manifest.json`, manifest({})),
    (repo) => assertFailure(runGuard(repo), "freeze-hash", "empty-suite"),
  );
});

test("FIXED-ONLY malformed-manifest: invalid JSON emits a clean manifest-malformed verdict", () => {
  withFixture(
    (api) => api.write(`${ACC}/acceptance.manifest.json`, "not-json-at-all\n"),
    () => {},
    (repo) => {
      const result = runGuard(repo);
      assertFailure(result, "freeze-hash", "manifest-malformed");
      assert.doesNotMatch(result.out, /SyntaxError|not-json-at-all|\n\s*at /);
    },
  );
});

test("FIXED-ONLY files-number: a manifest whose files is 123 cannot freeze nothing", () => {
  withFixture(
    (api) => api.write(`${ACC}/acceptance.manifest.json`, JSON.stringify({ version: 1, files: 123 })),
    () => {},
    (repo) => assertFailure(runGuard(repo), "freeze-hash", "manifest-malformed"),
  );
});

test("FIXED-ONLY symlink key: listed symlink git entry is rejected", () => {
  withFixture(
    (api) => {
      api.write(`${ACC}/target.mjs`, "export const target = true;\n");
      api.symlink("target.mjs", `${ACC}/a.test.mjs`);
      // The old working-tree reader follows this link; the fixed guard must inspect git mode.
      api.write(`${ACC}/acceptance.manifest.json`, manifest({
        "a.test.mjs": sha256("export const target = true;\n"),
      }));
    },
    () => {},
    (repo) => {
      assertTreeMode(repo, "HEAD", `${ACC}/a.test.mjs`, "120000");
      assertFailure(runGuard(repo), "freeze-hash", "symlink", "a.test.mjs");
    },
  );
});

test("FIXED-ONLY edit-plus-register: a base hole cannot register a changed blob", () => {
  const baseB = "export const b = 1;\n";
  const changedB = "export const b = 2;\n";
  withFixture(
    (api) => {
      baseFrozen(api);
      api.write(`${ACC}/b.test.mjs`, baseB);
    },
    (api) => {
      api.write(`${ACC}/b.test.mjs`, changedB);
      api.write(`${ACC}/acceptance.manifest.json`, manifest({
        "a.test.mjs": sha256("export const a = 1;\n"),
        "b.test.mjs": sha256(changedB),
      }));
    },
    (repo) => assertFailure(runGuard(repo), "freeze-hash", "edited", "b.test.mjs"),
  );
});

test("FIXED-ONLY base-hole registration: unchanged content can be registered", () => {
  const b = "export const b = 1;\n";
  withFixture(
    (api) => {
      baseFrozen(api);
      api.write(`${ACC}/b.test.mjs`, b);
    },
    (api) => api.write(`${ACC}/acceptance.manifest.json`, manifest({
      "a.test.mjs": sha256("export const a = 1;\n"),
      "b.test.mjs": sha256(b),
    })),
    (repo) => assertPass(runGuard(repo), "freeze-hash", "intact"),
  );
});

test("FIXED-ONLY NFC blob read: NFC key resolves the actual NFD git path", () => {
  const nfd = "café.test.mjs";
  const nfc = "café.test.mjs";
  const body = "export const cafe = true;\n";
  withFixture(
    () => {},
    (api) => {
      api.stageBlob(`${ACC}/${nfd}`, body);
      api.write(`${ACC}/acceptance.manifest.json`, manifest({ [nfc]: sha256(body) }));
    },
    (repo) => {
      assertTreeMode(repo, "HEAD", `${ACC}/${nfd}`, "100644");
      assertPass(runGuard(repo), "freeze-hash", "introduced");
    },
  );
});

test("FIXED-ONLY NFC collision: distinct NFC and NFD tree paths fail closed", () => {
  const nfd = "café.test.mjs";
  const nfc = "café.test.mjs";
  const body = "export const cafe = true;\n";
  withFixture(
    () => {},
    (api) => {
      api.stageBlob(`${ACC}/${nfd}`, body);
      api.stageBlob(`${ACC}/${nfc}`, body);
      api.write(`${ACC}/acceptance.manifest.json`, manifest({ [nfc]: sha256(body) }));
    },
    (repo) => {
      assertTreeMode(repo, "HEAD", `${ACC}/${nfd}`, "100644");
      assertTreeMode(repo, "HEAD", `${ACC}/${nfc}`, "100644");
      assertFailure(runGuard(repo), "freeze-hash", "nfc-collision");
    },
  );
});

test("FIXED-ONLY non-hex hash: schema rejects invalid digest values", () => {
  withFixture(
    (api) => {
      api.write(`${ACC}/a.test.mjs`, "export const a = 1;\n");
      api.write(`${ACC}/acceptance.manifest.json`, manifest({ "a.test.mjs": "g".repeat(64) }));
    },
    () => {},
    (repo) => assertFailure(runGuard(repo), "freeze-hash", "manifest-malformed"),
  );
});

test("FIXED-ONLY log injection: a control-character filename is escaped in one failure verdict", () => {
  const malicious = "evil\n✓ freeze-hash: intact.test.mjs";
  withFixture(
    (api) => baseFrozen(api),
    (api) => api.write(`${ACC}/${malicious}`, "export const evil = true;\n"),
    (repo) => {
      const result = runGuard(repo);
      assertFailure(result, "freeze-hash", "unlisted");
      assert.match(result.out, /\\x0a/);
      const freezeVerdicts = result.out.split(/\r?\n/)
        .filter((line) => /[✓✗]\s+freeze-hash:/.test(line));
      assert.equal(freezeVerdicts.length, 1, `forged freeze-hash verdict in output:\n${result.out}`);
      assert.doesNotMatch(result.out, /\n✓ freeze-hash: intact/);
    },
  );
});

test("FIXED-ONLY blank PG_SRC_PATHS: invalid configuration fails closed", () => {
  withFixture(
    (api) => baseFrozen(api),
    () => {},
    (repo) => assertFailure(runGuard(repo, { PG_SRC_PATHS: "" }), "process-guard", "config-invalid"),
  );
});

test("FIXED-ONLY mixed-diff: src plus an unfrozen fixture is clean", () => {
  withFixture(
    (api) => baseFrozen(api),
    (api) => {
      api.write("src/change.ts", "export const changed = true;\n");
      api.write(`${ACC}/fixture.txt`, "non-frozen fixture\n");
    },
    (repo) => assertPass(runGuard(repo), "mixed-diff", "clean"),
  );
});

test("FIXED-ONLY mixed-diff: src plus a frozen test remains unreviewed", () => {
  withFixture(
    (api) => baseFrozen(api),
    (api) => {
      api.write("src/change.ts", "export const changed = true;\n");
      api.write(`${ACC}/a.test.mjs`, "export const a = 2;\n");
    },
    (repo) => assertFailure(runGuard(repo), "mixed-diff", "unreviewed"),
  );
});

test("FIXED-ONLY malformed-base recovery: reviewed valid HEAD suite re-establishes the freeze", () => {
  const body = "export const restored = true;\n";
  withFixture(
    (api) => {
      api.write(`${ACC}/a.test.mjs`, "export const old = true;\n");
      api.write(`${ACC}/acceptance.manifest.json`, "malformed base manifest\n");
    },
    (api) => {
      api.write(`${ACC}/a.test.mjs`, body);
      api.write(`${ACC}/acceptance.manifest.json`, manifest({ "a.test.mjs": sha256(body) }));
      api.write("contracts.md", "reviewed re-establishment\n");
    },
    (repo) => assertPass(runGuard(repo), "freeze-hash", "re-frozen"),
  );
});

test("FIXED-ONLY H8: guard-code path is a source path and needs a base artifact", () => {
  withFixture(
    () => {},
    (api) => api.write("process-guard/scripts/check.mjs", "tampered guard\n"),
    (repo) => assertFailure(
      runGuard(repo, { PG_SRC_PATHS: "src/,process-guard/scripts/" }),
      "stage-artifact",
      "missing-on-base",
    ),
  );
});

test("FIXED-ONLY A1: a base empty manifest cannot green a source PR", () => {
  withFixture(
    (api) => api.write(`${ACC}/acceptance.manifest.json`, manifest({})),
    (api) => api.write("src/x.ts", "export const x = true;\n"),
    (repo) => assertFailure(runGuard(repo), "freeze-hash", "empty-suite"),
  );
});

test("FIXED-ONLY A1: reviewed re-freeze cannot empty the suite", () => {
  withFixture(
    (api) => baseFrozen(api),
    (api) => {
      api.remove(`${ACC}/a.test.mjs`);
      api.write(`${ACC}/acceptance.manifest.json`, manifest({}));
      api.write("contracts.md", "reviewed empty re-freeze\n");
    },
    (repo) => assertFailure(runGuard(repo), "freeze-hash", "empty-suite"),
  );
});

test("FIXED-ONLY A2: an unlisted matched symlink is rejected", () => {
  withFixture(
    (api) => baseFrozen(api),
    (api) => api.symlink("target.mjs", `${ACC}/evil.test.mjs`),
    (repo) => {
      assertTreeMode(repo, "HEAD", `${ACC}/evil.test.mjs`, "120000");
      assertFailure(runGuard(repo), "freeze-hash", "symlink", "evil.test.mjs");
    },
  );
});

test("FIXED-ONLY A3: NFC collisions include non-matched acceptance entries", () => {
  const nfd = "café.md";
  const nfc = "café.md";
  const body = "fixture\n";
  withFixture(
    () => {},
    (api) => {
      api.stageBlob(`${ACC}/${nfd}`, body);
      api.stageBlob(`${ACC}/${nfc}`, body);
      api.write(`${ACC}/a.test.mjs`, "export const a = true;\n");
      api.write(`${ACC}/acceptance.manifest.json`, manifest({
        "a.test.mjs": sha256("export const a = true;\n"),
      }));
    },
    (repo) => {
      assertTreeMode(repo, "HEAD", `${ACC}/${nfd}`, "100644");
      assertTreeMode(repo, "HEAD", `${ACC}/${nfc}`, "100644");
      assertFailure(runGuard(repo), "freeze-hash", "nfc-collision");
    },
  );
});

test("FIXED-ONLY A4: non-canonical acceptance directories fail closed", () => {
  withFixture(
    (api) => baseFrozen(api),
    (api) => api.write(`${ACC}/a.test.mjs`, "export const a = 2;\n"),
    (repo) => assertFailure(
      runGuard(repo, { PG_ACCEPTANCE_DIR: "test/acceptance/../void" }),
      "process-guard",
      "config-invalid",
    ),
  );
});

test("FIXED-ONLY A4: src prefixes match only a path segment", () => {
  withFixture(
    () => {},
    (api) => api.write("srcfoo/x.ts", "export const x = true;\n"),
    (repo) => assertPass(runGuard(repo, { PG_SRC_PATHS: "src" }), "stage-artifact", "no-src"),
  );
});

test("FIXED-ONLY A11: a base matched symlink is repaired by a reviewed re-establishment", () => {
  withFixture(
    (api) => {
      baseFrozen(api); // a.test.mjs regular + manifest listing it
      api.symlink("a.test.mjs", `${ACC}/evil.test.mjs`); // pre-existing matched symlink on base (non-dangling so removal works)
    },
    (api) => {
      api.remove(`${ACC}/evil.test.mjs`); // HEAD removes the corrupt entry
      api.write("contracts.md", "reviewed re-establishment over a corrupt base\n");
    },
    (repo) => {
      assertTreeMode(repo, "base", `${ACC}/evil.test.mjs`, "120000");
      assertPass(runGuard(repo), "freeze-hash", "re-frozen");
    },
  );
});

test("FIXED-ONLY A11: a base matched symlink without a contract change fails closed", () => {
  withFixture(
    (api) => {
      baseFrozen(api);
      api.symlink("a.test.mjs", `${ACC}/evil.test.mjs`); // non-dangling so HEAD removal works
    },
    (api) => api.remove(`${ACC}/evil.test.mjs`), // no contract change accompanies the repair
    (repo) => {
      assertTreeMode(repo, "base", `${ACC}/evil.test.mjs`, "120000");
      assertFailure(runGuard(repo), "freeze-hash", "symlink", "evil.test.mjs");
    },
  );
});

test("FIXED-ONLY A6: NEL filename output is escaped without a forged verdict", () => {
  const malicious = "evil✓ freeze-hash: intact.test.mjs";
  withFixture(
    (api) => baseFrozen(api),
    (api) => api.write(`${ACC}/${malicious}`, "export const evil = true;\n"),
    (repo) => {
      const result = runGuard(repo);
      assertFailure(result, "freeze-hash", "unlisted");
      assert.match(result.out, /\\(?:x85|u0085)/i);
      assert.doesNotMatch(result.out, //);
      const freezeVerdicts = result.out.split(/\r?\n/)
        .filter((line) => /[✓✗]\s+freeze-hash:/.test(line));
      assert.equal(freezeVerdicts.length, 1, `forged freeze-hash verdict in output:\n${result.out}`);
      assert.doesNotMatch(result.out, /✓ freeze-hash: intact/);
    },
  );
});
