import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillPath =
  process.env.PIPELINE_SKILL_PATH ??
  path.join(repoRoot, "plugins/engineering-os/skills/pipeline/SKILL.md");
const reviewerPath = path.join(repoRoot, "prompts/reviewer.md");

const skill = readFileSync(skillPath, "utf8");
const reviewer = readFileSync(reviewerPath, "utf8");

function stageSixJavaScript(markdown) {
  const stage = markdown.indexOf("## Stage 6 ");
  assert.notEqual(stage, -1, "stage 6 section is missing");
  const open = markdown.indexOf("```js\n", stage);
  assert.notEqual(open, -1, "stage 6 JavaScript block is missing");
  const start = open + "```js\n".length;
  const end = markdown.indexOf("\n```", start);
  assert.notEqual(end, -1, "stage 6 JavaScript block is not closed");
  return markdown.slice(start, end);
}

const stageSix = stageSixJavaScript(skill);

test("stage 6 rebuilds evidence inside every review round", () => {
  const loop = stageSix.indexOf("for (let round = 1; round <= 3; round++)");
  const collect = stageSix.indexOf(
    "const evidence = await collectEvidence(sha, round)",
    loop,
  );
  const dispatch = stageSix.indexOf(
    "let verdicts = (await review(sha, round, evidence))",
    collect,
  );
  const nextHead = stageSix.indexOf("sha = fix.commit", dispatch);

  assert.notEqual(loop, -1, "bounded review loop is missing");
  assert.ok(collect > loop, "evidence must be collected inside the round loop");
  assert.ok(dispatch > collect, "reviewers must run after fresh evidence");
  assert.ok(nextHead > dispatch, "a fixer push must feed the next round");
  assert.doesNotMatch(
    stageSix,
    /args\.reviewEvidence/,
    "static invocation-time evidence must not be reused",
  );
});

test("review evidence and verdicts bind both immutable revisions", () => {
  assert.match(stageSix, /reviewed_head/);
  assert.match(stageSix, /reviewed_base/);
  assert.match(stageSix, /v\.reviewed_head !== sha/);
  assert.match(stageSix, /v\.reviewed_base !== evidence\.reviewed_base/);
  assert.match(skill, /REVIEWED_HEAD:/);
  assert.match(skill, /REVIEWED_BASE:/);
  assert.match(reviewer, /REVIEWED_HEAD:/);
  assert.match(reviewer, /REVIEWED_BASE:/);
});

test("stage 6 workflow JavaScript parses", () => {
  const source =
    "async function workflow(args) {\n" +
    stageSix.replace(/^export const meta/m, "const meta") +
    "\n}\n";
  const parsed = spawnSync(process.execPath, ["--check"], {
    input: source,
    encoding: "utf8",
  });
  assert.equal(parsed.status, 0, parsed.stderr);
});
