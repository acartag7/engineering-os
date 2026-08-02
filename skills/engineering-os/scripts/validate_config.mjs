#!/usr/bin/env node

import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { TextDecoder } from "node:util";

const MAX_BYTES = 65_536;
const MAX_STRING = 2_048;
const MAX_REASON = 500;
const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const TIERS = new Set(["S", "I", "X"]);
const OWNERSHIP = new Set(["solo", "team"]);
const PROFILES = new Set(["basic", "standard", "strict"]);
const INDEPENDENT_TESTS = new Set([
  "security-only",
  "security-and-bug-fixes",
  "all-behavior-changes",
]);
const PROVIDERS = new Set([
  "owner",
  "human-teammate",
  "fresh-ai-session",
  "multi-agent-seat",
  "current-session",
  "ci",
  "not-required",
]);
const GROUPS = new Set([
  "mode",
  "project",
  "commands",
  "risk",
  "team",
  "workflow",
  "platform",
  "brief",
  "migration",
  "change",
  "confirmation",
]);
const LETTERED_RULES = ["CES-3A", "CES-14A", "CES-16A", "CES-16B", "CES-20A", "CES-21A"];
const RULES = new Set([
  ...Array.from({ length: 32 }, (_, index) => `CES-${index + 1}`),
  ...LETTERED_RULES,
]);
const PROTECTED_RULES = new Set([
  "CES-3A",
  "CES-8",
  "CES-9",
  "CES-10",
  "CES-11",
  "CES-12",
  "CES-13",
  "CES-14A",
  "CES-15",
  "CES-16",
  "CES-16A",
  "CES-16B",
  "CES-17",
  "CES-18",
  "CES-19",
  "CES-20A",
  "CES-21",
  "CES-21A",
  "CES-22",
  "CES-24",
  "CES-25",
  "CES-31",
  "CES-32",
]);

class ConfigError extends Error {
  constructor(reason) {
    super(reason);
    this.reason = reason;
  }
}

const reject = (reason) => {
  throw new ConfigError(reason);
};

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function objectShape(value, fields) {
  if (!isObject(value)) reject("wrong-type");
  for (const field of fields) {
    if (!Object.hasOwn(value, field)) reject("missing-field");
  }
  for (const field of Object.keys(value)) {
    if (!fields.includes(field)) reject("unknown-field");
  }
}

function text(value, maximum = MAX_STRING) {
  if (typeof value !== "string") reject("wrong-type");
  if (value.trim().length === 0) reject("blank-string");
  if ([...value].length > maximum) reject("out-of-bounds");
  return value;
}

function enumValue(value, allowed) {
  text(value);
  if (!allowed.has(value)) reject("bad-enum");
  return value;
}

function boundedInteger(value, minimum, maximum) {
  if (!Number.isInteger(value)) reject("wrong-type");
  if (value < minimum || value > maximum) reject("out-of-bounds");
}

function boundedArray(value, minimum, maximum) {
  if (!Array.isArray(value)) reject("wrong-type");
  if (value.length < minimum || value.length > maximum) reject("out-of-bounds");
}

function safeTree(root) {
  const pending = [root];
  while (pending.length > 0) {
    const value = pending.pop();
    if (value === null || typeof value !== "object") continue;
    for (const key of Object.keys(value)) {
      if (DANGEROUS_KEYS.has(key)) reject("unsafe-key");
      pending.push(value[key]);
    }
  }
}

function calendarDate(value) {
  text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) reject("invalid-date");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    reject("invalid-date");
  }
  return value;
}

function todayUtc() {
  const now = new Date();
  return [
    String(now.getUTCFullYear()).padStart(4, "0"),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function validateProject(project) {
  objectShape(project, ["tier", "defaultBranch", "languages", "ownership"]);
  enumValue(project.tier, TIERS);
  text(project.defaultBranch);
  boundedArray(project.languages, 1, 16);
  for (const language of project.languages) text(language);
  return enumValue(project.ownership, OWNERSHIP);
}

function validateCommands(commands) {
  objectShape(commands, ["verify", "entrypoint", "entrypointReason"]);
  text(commands.verify);
  text(commands.entrypoint);
  text(commands.entrypointReason);
}

function validateWorkflow(workflow) {
  const fields = [
    "defaultProfile",
    "critic",
    "testAuthor",
    "implementer",
    "reviewer",
    "independentTests",
    "maxReviewRounds",
    "maxActivePullRequests",
  ];
  objectShape(workflow, fields);
  const profile = enumValue(workflow.defaultProfile, PROFILES);
  const critic = enumValue(workflow.critic, PROVIDERS);
  const testAuthor = enumValue(workflow.testAuthor, PROVIDERS);
  const implementer = enumValue(workflow.implementer, PROVIDERS);
  const reviewer = enumValue(workflow.reviewer, PROVIDERS);
  enumValue(workflow.independentTests, INDEPENDENT_TESTS);
  boundedInteger(workflow.maxReviewRounds, 1, 3);
  boundedInteger(workflow.maxActivePullRequests, 1, 9);

  return {
    profile,
    critic,
    testAuthor,
    implementer,
    reviewer,
    maxActivePullRequests: workflow.maxActivePullRequests,
  };
}

function validateProviderConflicts({ profile, critic, testAuthor, implementer, reviewer }) {
  if (["ci", "not-required"].includes(implementer)) reject("provider-conflict");
  if (["standard", "strict"].includes(profile)) {
    if (["current-session", "ci", "not-required"].includes(critic)) reject("provider-conflict");
    if (["current-session", "ci", "not-required"].includes(reviewer)) reject("provider-conflict");
  }
  if (profile === "strict" && ["current-session", "ci", "not-required"].includes(testAuthor)) {
    reject("provider-conflict");
  }
}

function validateOptional(optional) {
  objectShape(optional, ["processGuard"]);
  if (typeof optional.processGuard !== "boolean") reject("wrong-type");
}

function validateDecisions(decisions) {
  objectShape(decisions, ["notApplicable"]);
  boundedArray(decisions.notApplicable, 0, 32);
  for (const decision of decisions.notApplicable) {
    objectShape(decision, ["group", "reason"]);
    enumValue(decision.group, GROUPS);
    text(decision.reason, MAX_REASON);
  }
}

function validateExceptions(exceptions) {
  boundedArray(exceptions, 0, 32);
  for (const exception of exceptions) {
    objectShape(exception, ["rule", "reason", "owner", "created", "reviewBy", "removalCondition"]);
    const rule = text(exception.rule);
    text(exception.reason, MAX_REASON);
    text(exception.owner);
    const created = calendarDate(exception.created);
    const reviewBy = calendarDate(exception.reviewBy);
    text(exception.removalCondition);
    if (!RULES.has(rule)) reject("unknown-rule");
    if (PROTECTED_RULES.has(rule)) reject("protected-rule");
    if (reviewBy < created) reject("date-order");
    if (reviewBy < todayUtc()) reject("expired-exception");
  }
}

function validateConfig(config) {
  objectShape(config, ["version", "project", "commands", "workflow", "optional", "decisions", "exceptions"]);
  if (typeof config.version !== "number") reject("wrong-type");
  if (config.version !== 1) reject("bad-enum");
  const ownership = validateProject(config.project);
  validateCommands(config.commands);
  const providers = validateWorkflow(config.workflow);
  if (ownership === "solo" && providers.maxActivePullRequests > 2) reject("out-of-bounds");
  validateOptional(config.optional);
  validateDecisions(config.decisions);
  validateExceptions(config.exceptions);
  validateProviderConflicts(providers);
}

function readBounded(descriptor, positioned = true) {
  const buffer = Buffer.alloc(MAX_BYTES + 1);
  let total = 0;
  while (total < buffer.length) {
    const position = positioned ? total : null;
    const count = readSync(descriptor, buffer, total, buffer.length - total, position);
    if (count === 0) break;
    total += count;
  }
  return buffer.subarray(0, total);
}

function decodeConfig(bytes) {
  if (bytes.length > MAX_BYTES) reject("too-large");

  let source;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    reject("invalid-utf8");
  }

  let config;
  try {
    config = JSON.parse(source);
  } catch {
    reject("parse-error");
  }
  safeTree(config);
  return config;
}

function loadStdin() {
  let bytes;
  try {
    bytes = readBounded(0, false);
  } catch {
    reject("read-error");
  }
  return decodeConfig(bytes);
}

function loadFile(path) {

  const repository = resolve(process.cwd());
  const target = resolve(repository, path);
  const fromRoot = relative(repository, target);
  if (isAbsolute(fromRoot) || fromRoot === ".." || fromRoot.startsWith(`..${sep}`)) {
    reject("outside-repository");
  }

  let current = repository;
  for (const part of fromRoot.split(sep).filter(Boolean)) {
    current = join(current, part);
    try {
      const component = lstatSync(current);
      if (component.isSymbolicLink()) reject("symlink");
    } catch (error) {
      if (error instanceof ConfigError) throw error;
      if (error && typeof error === "object" && error.code === "ENOENT") reject("missing");
      reject("read-error");
    }
  }

  let stats;
  try {
    stats = lstatSync(target);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") reject("missing");
    reject("read-error");
  }
  if (stats.isSymbolicLink()) reject("symlink");
  if (!stats.isFile()) reject("not-file");

  let descriptor;
  try {
    descriptor = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ELOOP") reject("symlink");
    reject("read-error");
  }

  let bytes;
  try {
    const opened = fstatSync(descriptor);
    if (!opened.isFile()) reject("not-file");
    if (opened.dev !== stats.dev || opened.ino !== stats.ino) reject("read-error");
    if (opened.size > MAX_BYTES) reject("too-large");
    bytes = readBounded(descriptor);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    reject("read-error");
  } finally {
    try {
      closeSync(descriptor);
    } catch {}
  }
  return decodeConfig(bytes);
}

function loadConfig() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--stdin") return loadStdin();
  if (args.length > 1 || (args.length === 1 && args[0].startsWith("-"))) {
    reject("argument-count");
  }
  return loadFile(args[0] ?? "engineering-os.json");
}

try {
  validateConfig(loadConfig());
  process.stdout.write("engineering-os config: valid\n");
} catch (error) {
  const reason = error instanceof ConfigError ? error.reason : "read-error";
  process.stderr.write(`engineering-os config: invalid (${reason})\n`);
  process.exitCode = 1;
}
