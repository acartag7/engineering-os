import assert from "node:assert/strict";
import {
  chmodSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { test } from "node:test";

const ROOT = process.cwd();
const VALIDATOR = resolve(ROOT, "skills/engineering-os/scripts/validate_config.mjs");
const VALID_LINE = "engineering-os config: valid\n";

const starter = () => ({
  version: 1,
  project: {
    tier: "S",
    defaultBranch: "main",
    languages: ["Go"],
    ownership: "solo",
  },
  commands: {
    verify: "./scripts/verify",
    entrypoint: "go run ./cmd/server",
    entrypointReason: "Runs the shipped server through its real command",
  },
  workflow: {
    defaultProfile: "standard",
    critic: "fresh-ai-session",
    testAuthor: "fresh-ai-session",
    implementer: "current-session",
    reviewer: "fresh-ai-session",
    independentTests: "security-and-bug-fixes",
    maxReviewRounds: 3,
    maxActivePullRequests: 2,
  },
  optional: { processGuard: false },
  decisions: { notApplicable: [] },
  exceptions: [],
});

const tempRoot = () => mkdtempSync(join(tmpdir(), "engineering-os-config-"));

function runValidator({ config = starter(), raw, args = ["engineering-os.json"], setup } = {}) {
  const repository = tempRoot();
  const configPath = join(repository, "engineering-os.json");
  try {
    if (raw !== undefined) writeFileSync(configPath, raw);
    else writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
    setup?.({ repository, configPath });
    return spawnSync(process.execPath, [VALIDATOR, ...args], {
      cwd: repository,
      encoding: "utf8",
      env: {},
    });
  } finally {
    try {
      if (lstatSync(repository).mode) chmodSync(repository, 0o700);
    } catch {}
    rmSync(repository, { recursive: true, force: true });
  }
}

function expectValid(result) {
  assert.equal(result.status, 0);
  assert.equal(result.stdout, VALID_LINE);
  assert.equal(result.stderr, "");
}

function expectInvalid(result, reason) {
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(
    result.stderr,
    `engineering-os config: invalid (${reason})\n`,
  );
}

test("the exact starter and maximum allowed collections are valid", () => {
  expectValid(runValidator());

  const config = starter();
  config.project.languages = Array.from({ length: 16 }, (_, index) => `Language ${index}`);
  config.decisions.notApplicable = Array.from({ length: 32 }, (_, index) => ({
    group: "platform",
    reason: `No platform decision ${index}`,
  }));
  config.exceptions = Array.from({ length: 32 }, (_, index) => ({
    rule: "CES-6",
    reason: `Temporary exception ${index}`,
    owner: "repository owner",
    created: "2099-01-01",
    reviewBy: "2099-12-31",
    removalCondition: "A second maintainer joins",
  }));
  expectValid(runValidator({ config }));
});

test("versions, required fields, unknown fields, types, and blank strings fail closed", () => {
  const cases = [
    ["bad-enum", (c) => { c.version = 2; }],
    ["wrong-type", (c) => { c.version = "1"; }],
    ["missing-field", (c) => { delete c.optional; }],
    ["unknown-field", (c) => { c.extra = {}; }],
    ["unknown-field", (c) => { c.workflow.panelSize = 3; }],
    ["blank-string", (c) => { c.commands.verify = ""; }],
    ["blank-string", (c) => { c.commands.entrypointReason = "   "; }],
  ];

  for (const [reason, mutate] of cases) {
    const config = starter();
    mutate(config);
    expectInvalid(runValidator({ config }), reason);
  }
});

test("enums and profile provider rules are exact", () => {
  const cases = [
    ["bad-enum", (c) => { c.project.tier = "T2"; }],
    ["bad-enum", (c) => { c.project.ownership = "single"; }],
    ["bad-enum", (c) => { c.workflow.defaultProfile = "medium"; }],
    ["bad-enum", (c) => { c.workflow.independentTests = "never"; }],
    ["bad-enum", (c) => { c.workflow.critic = "gpt"; }],
    ["provider-conflict", (c) => { c.workflow.implementer = "ci"; }],
    ["provider-conflict", (c) => { c.workflow.implementer = "not-required"; }],
    ["provider-conflict", (c) => { c.workflow.critic = "current-session"; }],
    ["provider-conflict", (c) => { c.workflow.reviewer = "ci"; }],
    ["provider-conflict", (c) => { c.workflow.reviewer = "not-required"; }],
    ["provider-conflict", (c) => {
      c.workflow.defaultProfile = "strict";
      c.workflow.testAuthor = "current-session";
    }],
  ];

  for (const [reason, mutate] of cases) {
    const config = starter();
    mutate(config);
    expectInvalid(runValidator({ config }), reason);
  }

  const basic = starter();
  basic.workflow.defaultProfile = "basic";
  basic.workflow.critic = "current-session";
  basic.workflow.testAuthor = "not-required";
  basic.workflow.reviewer = "owner";
  expectValid(runValidator({ config: basic }));
});

test("numeric, array, and string bounds reject wrong values", () => {
  const cases = [
    ["out-of-bounds", (c) => { c.workflow.maxReviewRounds = 0; }],
    ["out-of-bounds", (c) => { c.workflow.maxReviewRounds = 4; }],
    ["wrong-type", (c) => { c.workflow.maxReviewRounds = 2.5; }],
    ["out-of-bounds", (c) => { c.workflow.maxActivePullRequests = 10; }],
    ["out-of-bounds", (c) => { c.project.languages = []; }],
    ["out-of-bounds", (c) => { c.project.languages = Array(17).fill("Go"); }],
    ["blank-string", (c) => { c.project.languages = [""]; }],
    ["out-of-bounds", (c) => { c.decisions.notApplicable = Array(33).fill({ group: "platform", reason: "none" }); }],
    ["out-of-bounds", (c) => { c.project.defaultBranch = "x".repeat(2049); }],
  ];
  for (const [reason, mutate] of cases) {
    const config = starter();
    mutate(config);
    expectInvalid(runValidator({ config }), reason);
  }
});

test("exception rules, shape, dates, and expiry are checked", () => {
  const allowed = {
    rule: "CES-6",
    reason: "Temporary wording experiment",
    owner: "repository owner",
    created: "2099-01-01",
    reviewBy: "2099-12-31",
    removalCondition: "The wording is settled",
  };
  const withException = (exception) => {
    const config = starter();
    config.exceptions = [exception];
    return config;
  };
  expectValid(runValidator({ config: withException(allowed) }));

  expectInvalid(runValidator({ config: withException({ ...allowed, rule: "CES-99" }) }), "unknown-rule");
  for (const rule of [
    "CES-3A", "CES-8", "CES-9", "CES-10", "CES-11", "CES-12", "CES-13", "CES-14A", "CES-15",
    "CES-16", "CES-16A",
    "CES-16B", "CES-17", "CES-18", "CES-19", "CES-20A", "CES-21", "CES-21A",
    "CES-22", "CES-24", "CES-25", "CES-31", "CES-32",
  ]) {
    expectInvalid(runValidator({ config: withException({ ...allowed, rule }) }), "protected-rule");
  }
  expectInvalid(runValidator({ config: withException({ ...allowed, created: "2026-02-30" }) }), "invalid-date");
  expectInvalid(runValidator({ config: withException({ ...allowed, reviewBy: "2098-12-31" }) }), "date-order");
  expectInvalid(runValidator({ config: withException({ ...allowed, created: "2000-01-01", reviewBy: "2000-01-02" }) }), "expired-exception");

  const missing = { ...allowed };
  delete missing.removalCondition;
  expectInvalid(runValidator({ config: withException(missing) }), "missing-field");
  expectInvalid(runValidator({ config: withException({ ...allowed, extra: true }) }), "unknown-field");
  expectInvalid(runValidator({ config: withException({ ...allowed, reason: "x".repeat(501) }) }), "out-of-bounds");

  const twoProblems = withException({
    ...allowed,
    created: "2000-01-01",
    reviewBy: "2000-01-02",
  });
  twoProblems.workflow.reviewer = "current-session";
  expectInvalid(runValidator({ config: twoProblems }), "expired-exception");
});

test("not-applicable decisions have exact groups, shape, and reasons", () => {
  const groups = [
    "mode", "project", "commands", "risk", "team", "workflow", "platform",
    "brief", "migration", "change", "confirmation",
  ];
  const valid = starter();
  valid.decisions.notApplicable = groups.map((group) => ({ group, reason: "Not needed here" }));
  expectValid(runValidator({ config: valid }));

  for (const item of [
    { group: "security", reason: "none" },
    { group: "platform", reason: "" },
    { group: "platform", reason: "none", extra: true },
  ]) {
    const config = starter();
    config.decisions.notApplicable = [item];
    expectInvalid(
      runValidator({ config }),
      item.extra ? "unknown-field" : item.reason ? "bad-enum" : "blank-string",
    );
  }
});

test("dangerous keys, malformed JSON, invalid UTF-8, and non-object roots never crash", () => {
  for (const key of ["__proto__", "constructor", "prototype"]) {
    expectInvalid(runValidator({ raw: `{"${key}":{},"version":1}` }), "unsafe-key");
    expectInvalid(runValidator({ raw: `{"version":1,"project":{"${key}":{}}}` }), "unsafe-key");
  }
  expectInvalid(runValidator({ raw: "{" }), "parse-error");
  expectInvalid(runValidator({ raw: Buffer.from([0xff, 0xfe, 0xfd]) }), "invalid-utf8");
  for (const raw of ["[]", '"x"', "null"]) {
    expectInvalid(runValidator({ raw }), "wrong-type");
  }
});

test("file and path boundaries are fail closed", () => {
  expectInvalid(runValidator({ raw: Buffer.alloc(65_537, 0x20) }), "too-large");
  expectInvalid(runValidator({ args: ["a.json", "b.json"] }), "argument-count");
  expectInvalid(runValidator({ args: ["missing.json"] }), "missing");

  const symlinkResult = runValidator({
    args: ["linked.json"],
    setup: ({ repository, configPath }) => symlinkSync(configPath, join(repository, "linked.json")),
  });
  expectInvalid(symlinkResult, "symlink");

  const ancestorRoot = tempRoot();
  const externalRoot = tempRoot();
  try {
    writeFileSync(join(externalRoot, "config.json"), `${JSON.stringify(starter())}\n`);
    symlinkSync(externalRoot, join(ancestorRoot, "linked-dir"), "dir");
    const result = spawnSync(process.execPath, [VALIDATOR, "linked-dir/config.json"], {
      cwd: ancestorRoot,
      encoding: "utf8",
      env: {},
    });
    expectInvalid(result, "symlink");
  } finally {
    rmSync(ancestorRoot, { recursive: true, force: true });
    rmSync(externalRoot, { recursive: true, force: true });
  }

  const outsideRoot = tempRoot();
  try {
    const outside = join(dirname(outsideRoot), `outside-${process.pid}.json`);
    writeFileSync(outside, `${JSON.stringify(starter())}\n`);
    const result = spawnSync(process.execPath, [VALIDATOR, outside], {
      cwd: outsideRoot,
      encoding: "utf8",
      env: {},
    });
    expectInvalid(result, "outside-repository");
    rmSync(outside, { force: true });
  } finally {
    rmSync(outsideRoot, { recursive: true, force: true });
  }
});

test("an oversized file is rejected before its content is read", () => {
  const repository = tempRoot();
  try {
    const configPath = join(repository, "engineering-os.json");
    const preloadPath = join(repository, "fail-on-read.cjs");
    writeFileSync(configPath, Buffer.alloc(65_537, 0x20));
    writeFileSync(
      preloadPath,
      [
        'const fs = require("node:fs");',
        'const { syncBuiltinESMExports } = require("node:module");',
        'const original = fs.readFileSync;',
        'fs.readFileSync = (path, ...args) => {',
        '  if (typeof path === "number") throw new Error("oversized file content was read");',
        '  return original(path, ...args);',
        '};',
        'syncBuiltinESMExports();',
        '',
      ].join("\n"),
    );
    const result = spawnSync(process.execPath, ["--require", preloadPath, VALIDATOR], {
      cwd: repository,
      encoding: "utf8",
      env: {},
    });
    expectInvalid(result, "too-large");
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
});

test("errors are one fixed safe line and validation is read-only and deterministic", () => {
  const canary = "CANARY-9f3";
  const first = runValidator({
    config: { ...starter(), [canary]: "\n✓ forged" },
  });
  expectInvalid(first, "unknown-field");
  assert.doesNotMatch(first.stderr, /CANARY|forged|✓|\n.*\n/s);

  const repository = tempRoot();
  try {
    const path = join(repository, "engineering-os.json");
    writeFileSync(path, `${JSON.stringify(starter(), null, 2)}\n`);
    const before = readdirSync(repository).sort();
    const one = spawnSync(process.execPath, [VALIDATOR], { cwd: repository, encoding: "utf8", env: {} });
    const two = spawnSync(process.execPath, [VALIDATOR], { cwd: repository, encoding: "utf8", env: {} });
    expectValid(one);
    assert.deepEqual(
      { status: two.status, stdout: two.stdout, stderr: two.stderr },
      { status: one.status, stdout: one.stdout, stderr: one.stderr },
    );
    assert.deepEqual(readdirSync(repository).sort(), before);
    assert.match(readFileSync(path, "utf8"), /"version": 1/);
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
});
