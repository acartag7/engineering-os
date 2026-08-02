import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("source-of-truth docs use the configurable language-neutral workflow", () => {
  const os = read("OS.md");
  const policy = read("POLICY.md");
  const onboarding = read("ONBOARDING.md");

  assert.match(os, /Each repository owns one verification command/);
  assert.match(os, /engineering-os\.json/);
  assert.match(os, /T2 and T3 always\s+use strict/i);
  assert.match(os, /Multi-agent tools are optional/i);
  assert.match(os, /Every governed repository carries `BRIEF\.md`/);
  assert.doesNotMatch(os, /\| 4\. Acceptance tests \|/);

  assert.match(policy, /\| Implementations \| 1 \| 1 \| 1 \| 1 \| 1 \|/);
  assert.match(policy, /Independent test author before implementation/);
  assert.match(policy, /basic.*standard.*strict/is);
  assert.match(policy, /language-appropriate linter or static analyzer/);
  assert.match(policy, /more than one value for a security-relevant HTTP/);
  assert.match(policy, /closed language type/);
  assert.match(policy, /Small frozen-contract amendment/);
  assert.doesNotMatch(policy, /2[–-]3 candidates/);

  assert.match(onboarding, /## Go example/);
  assert.match(onboarding, /templates\/project-brief\.md/);
  assert.match(onboarding, /engineering-os\.json/);
  assert.match(onboarding, /Recommended solo default/);
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

test("engineering-os governs itself with validated configuration", () => {
  const config = JSON.parse(read("engineering-os.json"));
  const packageJson = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");
  assert.equal(config.version, 1);
  assert.equal(config.project.tier, "S");
  assert.equal(config.commands.verify, "./scripts/verify");
  assert.equal(config.optional.processGuard, true);
  assert.match(read("scripts/verify"), /validate_config\.mjs engineering-os\.json/);
  assert.equal(packageJson.packageManager, "pnpm@10.15.0");
  assert.equal(packageJson.devDependencies.eslint, "9.39.5");
  assert.deepEqual(packageJson.pnpm.onlyBuiltDependencies, []);
  assert.match(read("pnpm-lock.yaml"), /eslint:\n\s+specifier: 9\.39\.5/);
  assert.match(ci, /pnpm install --frozen-lockfile --ignore-scripts/);
});

test("fleet-audit additions are connected to rules, lessons, prompts, and audit", () => {
  const baseline = read("BASELINE.md");
  const lessons = read("LESSONS.md");
  const reviewer = read("prompts/reviewer.md");
  const audit = read("routines/monthly-audit-prompt.md");
  const guardReadme = read("process-guard/README.md");

  for (const id of ["PC-32", "PC-33", "PC-34", "PC-35", "PC-36", "PC-37", "PC-38", "PC-39"]) {
    assert.match(baseline, new RegExp(`\\| ${id} \\|`));
  }
  for (const id of ["L-016", "L-017", "L-018", "L-019", "L-020"]) {
    assert.match(lessons, new RegExp(`## ${id} `));
  }
  assert.match(reviewer, /Reviewer Prompt — v2\.4/);
  assert.match(reviewer, /paginated current-head thread inventory/i);
  assert.match(reviewer, /`process-stop`/);
  assert.match(reviewer, /code: string/);
  assert.match(reviewer, /`BRIEF\.md` changed/);
  assert.match(audit, /Monthly Audit — agent prompt v2\.3/);
  assert.match(guardReadme, /## Small amendment flow/);
});

test("old pipeline helper only forwards to the configurable skill", () => {
  const skill = read("plugins/engineering-os/skills/pipeline/SKILL.md");

  assert.match(skill, /v5\.1\.0/);
  assert.match(skill, /Compatibility forwarder/);
  assert.match(skill, /use the `engineering-os` skill/i);
  assert.match(skill, /same questions, route floors, configuration/);
  assert.match(skill, /`process-stop`/);
  assert.match(skill, /status.*read-only/is);
  assert.doesNotMatch(skill, /## Review stage/);
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

test("role prompts carry the configurable independent-test workflow", () => {
  assert.match(read("prompts/acceptance-author.md"), /Independent Test Author Prompt — v3\.0/);
  assert.match(read("prompts/critique.md"), /Critique Prompt — v2\.2/);
  assert.match(read("prompts/implementer.md"), /Implementer Prompt — v2\.2/);
  assert.match(read("prompts/implementer.md"), /Do not weaken, remove, or rewrite independent tests/);
  assert.match(read("prompts/reviewer.md"), /Reviewer Prompt — v2\.4/);
});

test("one implementation and bug-fix proof name their enforcement", () => {
  const policy = read("POLICY.md");
  const oneImplementation = policy.match(/## One implementation([\s\S]*?)## Review limits/)?.[1] ?? "";
  const bugFix = policy.match(/## Bug-fix proof([\s\S]*?)## Production changes/)?.[1] ?? "";

  assert.match(oneImplementation, /\*\*Enforcement:/);
  assert.match(bugFix, /\*\*Enforcement:/);
  assert.doesNotMatch(read("LESSONS.md"), /HTTP credential ambiguity/);
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

test("project-tier minimum-process rules name their honest enforcement layer", () => {
  const os = read("OS.md");
  const section = os.match(/## Project tiers([\s\S]*?)(?=\n## )/)?.[1] ?? "";
  assert.match(section, /Minimum process/, "OS.md must keep the tier minimum-process table");
  assert.match(section, /\| \*\*S\*\* \|/, "OS.md must keep the tier rows");

  const enforcement = section.match(/\*\*Enforcement:[^*]*\*\*/)?.[0] ?? "";
  assert.ok(
    enforcement,
    "the Project tiers section states minimum-process rules, so it must carry an **Enforcement:** label",
  );
  assert.match(
    enforcement,
    /(prompt|audit|review|Layer|CI|branch protection|not (yet )?enforced)/i,
    "the tier enforcement label must honestly name where the rules are checked",
  );
});

test("the workflow table routes independent tests by strict routing or configured coverage", () => {
  const os = read("OS.md");
  const who = os.match(/\| 3\. Independent tests \|([^|]*)\|/)?.[1] ?? "";
  assert.ok(who.trim(), "OS.md must keep the Independent tests workflow row");
  assert.match(who, /strict/i, "the Independent tests row must name strict routing");
  assert.match(
    who,
    /configured|coverage/i,
    "the Independent tests row must also admit matching configured independent-test coverage",
  );
  assert.doesNotMatch(
    who,
    /strict profile only/i,
    "the Independent tests row must not claim the role belongs to strict alone",
  );
});

test("the tests-and-regression-proof rules name their honest enforcement layer", () => {
  const os = read("OS.md");
  const section = os.match(/### Tests and regression proof([\s\S]*?)(?=\n#{2,3} )/)?.[1] ?? "";
  assert.ok(section.trim(), "OS.md must keep the Tests and regression proof subsection");

  const enforcement = section.match(/\*\*Enforcement:[^*]*\*\*/)?.[0] ?? "";
  assert.ok(
    enforcement,
    "the Tests and regression proof subsection states proof rules, so it must carry an **Enforcement:** label before the next subsection",
  );
  assert.match(
    enforcement,
    /(prompt|audit|review|Layer|CI|branch protection|not (yet )?enforced)/i,
    "the enforcement label must honestly name where the rules are checked",
  );
});

test("every top-level OS section names its enforcement layer", () => {
  const sections = read("OS.md").split(/^## /m).slice(1);
  assert.ok(sections.length > 0, "OS.md must keep its source-of-truth sections");
  for (const section of sections) {
    const heading = section.split("\n", 1)[0];
    assert.match(
      section,
      /\*\*Enforcement:/,
      `OS.md section "${heading}" must name its enforcement layer`,
    );
  }

  const workflowPrelude = sections
    .find((section) => section.startsWith("The workflow for one slice\n"))
    ?.split("\n### Slice limits", 1)[0] ?? "";
  assert.match(
    workflowPrelude,
    /\*\*Enforcement:/,
    "the main workflow table and route floors need their own enforcement label",
  );
});

test("every top-level policy section names enforcement and configured test coverage", () => {
  const policy = read("POLICY.md");
  const sections = policy.split(/^## /m).slice(1);
  assert.ok(sections.length > 0, "POLICY.md must keep its source-of-truth sections");
  for (const section of sections) {
    const heading = section.split("\n", 1)[0];
    assert.match(
      section,
      /\*\*Enforcement:/,
      `POLICY.md section "${heading}" must name its enforcement layer`,
    );
  }

  const row = policy.match(/\| Independent test author before implementation \|([^\n]*)/)?.[1] ?? "";
  assert.match(row, /configured coverage/i);
  assert.match(row, /required/);
});

test("binding SLW-3 follows the effective configurable profile", () => {
  const spec = read("specs/solo-language-neutral-workflow.md");
  const slw3 = spec.match(/- \*\*SLW-3[\s\S]*?(?=\n- \*\*SLW-4)/)?.[0] ?? "";
  assert.ok(slw3.trim(), "the spec must keep the SLW-3 binding rule");

  assert.match(slw3, /profile/i, "SLW-3 must route the path by the effective configurable profile");
  assert.match(slw3, /basic/, "SLW-3 must name the basic profile");
  assert.match(slw3, /standard/, "SLW-3 must name the standard profile");
  assert.match(slw3, /strict/, "SLW-3 must name the strict profile");
  assert.match(
    slw3,
    /omit|skip|without|does not (need|require)|may drop/i,
    "SLW-3 must let already-clear basic work omit the contract and critique",
  );
  assert.match(slw3, /contract/i, "SLW-3 must keep the contract for standard and strict");
  assert.match(slw3, /criti/i, "SLW-3 must keep the fresh critique for standard and strict");
  assert.match(slw3, /one implement/i, "SLW-3 must keep one implementation on every profile");
  assert.match(slw3, /verification/i, "SLW-3 must keep one real verification run on every profile");
  assert.match(slw3, /review/i, "SLW-3 must keep one final review on every profile");

  const invariants =
    read("contracts.md").match(
      /## Solo, language-neutral workflow[\s\S]*?\*\*Normative invariants\*\*([\s\S]*?)\n\*\*Supporting rationale/,
    )?.[1] ?? "";
  assert.ok(invariants.trim(), "contracts.md must keep the solo-workflow normative summary");

  const slw3Note = invariants.split(/\n- /).find((entry) => entry.includes("SLW-3")) ?? "";
  assert.ok(slw3Note, "the normative summary must record what now governs SLW-3");
  assert.match(
    slw3Note,
    /supersed|replac/i,
    "the summary must say configurable profile rules replace the former fixed SLW-3 requirement",
  );
  assert.match(slw3Note, /profile/i, "the SLW-3 note must point at the configurable profile rules");
});

test("the dispatch guide carries one honest enforcement statement", () => {
  const dispatch = read("DISPATCH.md");
  const statements = dispatch.match(/\*\*Enforcement:[^*]*\*\*/g) ?? [];
  assert.equal(
    statements.length,
    1,
    "DISPATCH.md must carry exactly one explicit Enforcement statement covering the guide",
  );

  const statement = statements[0] ?? "";
  assert.match(statement, /prompt/i, "the statement must name prompt guidance");
  assert.match(statement, /review/i, "the statement must name review guidance");
  assert.match(statement, /audit/i, "the statement must name audit guidance");
  assert.match(statement, /verif/i, "the statement must name repository verification");
  assert.match(
    statement,
    /hard/i,
    "the statement must distinguish guidance from the hard repository verification wall",
  );
});

test("the onboarding guide carries one honest enforcement statement", () => {
  const onboarding = read("ONBOARDING.md");
  const statements = onboarding.match(/\*\*Enforcement:[^*]*\*\*/g) ?? [];
  assert.equal(statements.length, 1);
  const statement = statements[0] ?? "";
  for (const layer of ["prompt", "review", "audit", "verification", "hard"]) {
    assert.match(statement, new RegExp(layer, "i"), layer);
  }
});

test("every Docs route carries the standard effective profile", () => {
  // The Docs column of the required-path table demands a claims list and a fresh
  // claims review. Those results exist only from the standard profile up, so the
  // route floors must give every Docs change at least standard — not only
  // documentation that makes security or operator promises.
  const standardDocsFloor = (text) =>
    text
      .replace(/\s+/g, " ")
      .split(/(?<=\.)\s+/)
      .find((sentence) => {
        if (!/\b(Docs|documentation)\b/i.test(sentence)) return false;
        const floor = sentence.search(/at least[^.]{0,20}standard/i);
        return floor !== -1 && !/promise/i.test(sentence.slice(0, floor));
      });

  const policy = read("POLICY.md");
  assert.match(policy, /\| Small contract \|[^\n]*claims list \|/);
  assert.match(policy, /\| Fresh critique before code \|[^\n]*claims review \|/);
  assert.ok(
    standardDocsFloor(policy),
    "POLICY.md must state that every Docs route uses at least the standard profile",
  );
  assert.ok(
    standardDocsFloor(read("OS.md")),
    "the OS.md route floors must give Docs changes at least the standard profile",
  );

  const spec = read("specs/configurable-engineering-os-skill.md");
  const ces10 = spec.match(/- \*\*CES-10[\s\S]*?(?=\n- \*\*CES-11)/)?.[0] ?? "";
  assert.ok(ces10.trim(), "the spec must keep the CES-10 risk floor");
  assert.ok(
    standardDocsFloor(ces10),
    "CES-10 must give every documentation change at least standard, not only promise-bearing documentation",
  );
});

test("root verify runs a dedicated formatting check beside the correctness lint", async () => {
  // POLICY.md's verification floor requires formatting checks, so the repository's
  // own verify command must run an explicit ESLint formatting pass backed by a
  // formatting-only configuration while the correctness lint stays.
  assert.match(read("POLICY.md"), /formatting checks/);

  const lines = read("scripts/verify")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  const correctness = lines.find((line) => /\beslint\b/.test(line) && !/(--config[= ]|-c )/.test(line));
  assert.ok(correctness, "scripts/verify must keep the default-config correctness lint");

  const formatting = lines.find((line) => /\beslint\b/.test(line) && /(--config[= ]|-c )/.test(line));
  assert.ok(formatting, "scripts/verify must run an explicit ESLint formatting check with its own config");
  const configPath = formatting.match(/(?:--config[= ]|-c )["']?([^\s"']+)/)?.[1];
  assert.ok(configPath, "the formatting check must name its configuration file");

  const [formatConfig, lintConfig] = await Promise.all([
    import(pathToFileURL(resolve(configPath)).href),
    import(pathToFileURL(resolve("eslint.config.mjs")).href),
  ]);
  const rulesOf = (flat) => Object.assign({}, ...flat.default.map((entry) => entry.rules ?? {}));
  const severity = (value) => (Array.isArray(value) ? value[0] : value);

  const lintRules = rulesOf(lintConfig);
  assert.ok(
    ["error", 2].includes(severity(lintRules["no-unused-vars"])),
    "eslint.config.mjs must keep its correctness rules",
  );

  const formatRules = rulesOf(formatConfig);
  const stylePattern =
    /(^|\/)(indent|indent-binary-ops|semi|semi-spacing|semi-style|quotes|quote-props|comma-dangle|comma-spacing|comma-style|key-spacing|keyword-spacing|space-before-blocks|space-before-function-paren|space-in-parens|space-infix-ops|space-unary-ops|no-trailing-spaces|no-multi-spaces|eol-last|no-multiple-empty-lines|brace-style|object-curly-spacing|object-curly-newline|array-bracket-spacing|array-bracket-newline|arrow-spacing|arrow-parens|linebreak-style|max-len|padded-blocks|operator-linebreak|dot-location|func-call-spacing|function-call-spacing|rest-spread-spacing|template-curly-spacing|block-spacing|computed-property-spacing|no-whitespace-before-property|switch-colon-spacing|spaced-comment|new-parens)$/;
  const enabledStyle = Object.entries(formatRules).filter(
    ([name, value]) => stylePattern.test(name) && ["error", 2].includes(severity(value)),
  );
  assert.ok(
    enabledStyle.length >= 2,
    "the formatting config must enable real style rules as errors",
  );

  for (const name of Object.keys(lintRules)) {
    assert.ok(
      !(name in formatRules),
      `${name} is a correctness rule; the formatting config must stay formatting-only`,
    );
  }
});

test("the final-round stop token requires a remaining P1 or P2", () => {
  const reviewer = read("prompts/reviewer.md").replace(/\s+/g, " ");
  assert.match(
    reviewer,
    /On the configured final review round[^.]*`process-stop` only when a P1 or P2 remains/,
  );
  assert.doesNotMatch(reviewer, /the exact token `process-stop`[;.]/);
  assert.match(reviewer, /- \*\*v2\.3\*\* — [^.]*(P1 or P2|final round)/);
});
