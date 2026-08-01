import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("source-of-truth docs use the solo language-neutral workflow", () => {
  const os = read("OS.md");
  const policy = read("POLICY.md");
  const onboarding = read("ONBOARDING.md");

  assert.match(os, /Each repository owns one verification command/);
  assert.match(os, /one fresh AI reviewer/i);
  assert.match(os, /Every governed repository carries `BRIEF\.md`/);
  assert.doesNotMatch(os, /\| 4\. Acceptance tests \|/);

  assert.match(policy, /\| Implementations \| 1 \| 1 \| 1 \| 1 \| 1 \|/);
  assert.match(policy, /language-appropriate linter or static analyzer/);
  assert.match(policy, /more than one value for a security-relevant HTTP/);
  assert.match(policy, /closed language type/);
  assert.match(policy, /Small frozen-contract amendment/);
  assert.doesNotMatch(policy, /2[–-]3 candidates/);

  assert.match(onboarding, /## Go example/);
  assert.match(onboarding, /templates\/project-brief\.md/);
  assert.match(onboarding, /Do not install `process-guard` by default/);
  assert.doesNotMatch(onboarding, /repo verify \(typecheck, tests, build\)/);
});

test("project brief template and repository brief carry the fixed structure", () => {
  for (const path of ["templates/project-brief.md", "BRIEF.md"]) {
    const brief = read(path);
    for (const heading of [
      "What it is",
      "Why it exists",
      "How it works",
      "The map",
      "Sharp edges",
      "How to run and test it",
      "State and next milestone",
    ]) {
      assert.match(brief, new RegExp(`## ${heading}`), `${path}: ${heading}`);
    }
  }
});

test("fleet-audit additions are connected to rules, lessons, prompts, and audit", () => {
  const baseline = read("BASELINE.md");
  const lessons = read("LESSONS.md");
  const reviewer = read("prompts/reviewer.md");
  const audit = read("routines/monthly-audit-prompt.md");
  const guardReadme = read("process-guard/README.md");

  for (const id of ["PC-32", "PC-33", "PC-34", "PC-35"]) {
    assert.match(baseline, new RegExp(`\\| ${id} \\|`));
  }
  for (const id of ["L-016", "L-017", "L-018"]) {
    assert.match(lessons, new RegExp(`## ${id} `));
  }
  assert.match(reviewer, /Reviewer Prompt — v2\.1/);
  assert.match(reviewer, /code: string/);
  assert.match(reviewer, /`BRIEF\.md` changed/);
  assert.match(audit, /Monthly Audit — agent prompt v2\.1/);
  assert.match(guardReadme, /## Small amendment flow/);
});

test("pipeline helper has one reviewer and no frozen default stage", () => {
  const skill = read("plugins/engineering-os/skills/pipeline/SKILL.md");

  assert.match(skill, /v4\.1\.0/);
  assert.match(skill, /Use one seat, never a panel/);
  assert.match(skill, /repository verify command/);
  assert.match(skill, /language-appropriate linter or static analyzer/);
  assert.match(skill, /root `BRIEF\.md` exists/);
  assert.match(skill, /REVIEWED_SHA: <full exact head SHA>/);
  assert.match(skill, /Never commit the review result onto the branch/);
  assert.doesNotMatch(skill, /Panel mode/);
  assert.doesNotMatch(skill, /test\/acceptance/);
});

test("vendored prompts exactly match their canonical sources", () => {
  for (const name of [
    "acceptance-author.md",
    "critique.md",
    "implementer.md",
    "reviewer.md",
  ]) {
    const canonical = read(`prompts/${name}`);
    const vendored = read(`plugins/engineering-os/prompts/${name}`)
      .split("\n")
      .slice(1)
      .join("\n");
    assert.equal(vendored, canonical, `${name} drifted`);
  }
});

test("prompt headers do not claim a stale source commit", () => {
  for (const name of [
    "acceptance-author.md",
    "critique.md",
    "implementer.md",
    "reviewer.md",
  ]) {
    const header = read(`plugins/engineering-os/prompts/${name}`).split("\n", 1)[0];
    assert.doesNotMatch(header, /engineering-os@[0-9a-f]{7,40}/);
    assert.match(header, /CI checks exact byte parity/);
  }
});
