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
  assert.match(reviewer, /Reviewer Prompt — v2\.6/);
  assert.match(reviewer, /paginated current-head thread inventory/i);
  assert.match(reviewer, /`process-stop`/);
  assert.match(reviewer, /code: string/);
  assert.match(reviewer, /`BRIEF\.md` changed/);
  assert.match(audit, /Monthly Audit — agent prompt v2\.5/);
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
  assert.match(read("prompts/acceptance-author.md"), /Independent Test Author Prompt — v3\.1/);
  assert.match(read("prompts/critique.md"), /Critique Prompt — v2\.3/);
  assert.match(read("prompts/implementer.md"), /Implementer Prompt — v2\.4/);
  assert.match(read("prompts/implementer.md"), /Do not weaken, remove, or rewrite independent tests/);
  assert.match(read("prompts/reviewer.md"), /Reviewer Prompt — v2\.6/);
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

const bulletOf = (text, pattern) =>
  text.split(/\n- /).find((entry) => pattern.test(entry)) ?? "";

test("every review-round stop rule ends at the configured maxReviewRounds", () => {
  // engineering-os.json makes the stop round configurable and CES-25 stops at "the
  // configured maximum review round," with three only the highest value the validator
  // accepts. Each operational stop rule must point at that configured round; a
  // hard-coded round three overstates the rule for a repository configured lower.
  // Historical LESSONS.md narrative is not scanned here; it is not an operational rule.
  assert.match(
    read("skills/engineering-os/scripts/validate_config.mjs"),
    /boundedInteger\(workflow\.maxReviewRounds, 1, 3\)/,
    "three must stay only the allowed maximum for maxReviewRounds",
  );
  const rounds = JSON.parse(read("engineering-os.json")).workflow.maxReviewRounds;
  assert.ok(Number.isInteger(rounds) && rounds >= 1 && rounds <= 3);

  const stopsAtConfiguredRound = (rule, label) => {
    assert.ok(rule.trim(), `${label}: the review-round stop rule must exist`);
    assert.match(
      rule,
      /configured|maxReviewRounds/i,
      `${label} must stop at the configured final review round`,
    );
    assert.doesNotMatch(
      rule,
      /third substantive (review )?round|round three|after round three|over 3 rounds/i,
      `${label} must not hard-code round three as the universal stop`,
    );
    if (/\b(three|3)\b/i.test(rule)) {
      assert.match(
        rule,
        /maximum|at most|up to|no more than|one through three|1 to 3/i,
        `${label} may name three only as the allowed maximum`,
      );
    }
  };
  const numberedItem = (text, pattern) =>
    text.split(/\n\d+\. /).find((entry) => pattern.test(entry)) ?? "";

  const osLimits = read("OS.md").match(/### Slice limits([\s\S]*?)(?=\n### )/)?.[1] ?? "";
  stopsAtConfiguredRound(bulletOf(osLimits, /review round|stops the change/i), "OS.md slice limits");

  const policyLimits = read("POLICY.md").match(/## Review limits([\s\S]*?)(?=\n## )/)?.[1] ?? "";
  stopsAtConfiguredRound(
    bulletOf(policyLimits, /stops the change|review round/i),
    "POLICY.md review limits",
  );

  const slw10 = read("specs/solo-language-neutral-workflow.md")
    .match(/- \*\*SLW-10[\s\S]*?(?=\n- \*\*SLW-11)/)?.[0] ?? "";
  stopsAtConfiguredRound(slw10, "SLW-10");

  stopsAtConfiguredRound(read("BASELINE.md").match(/\| PC-15 \|[^\n]*/)?.[0] ?? "", "PC-15");

  const r2 = read("ROUTINES.md").match(/## R-2([\s\S]*?)(?=\n## R-3)/)?.[1] ?? "";
  stopsAtConfiguredRound(
    numberedItem(r2, /LESSONS\.md` entry/),
    "ROUTINES.md R-2 rounds-per-PR check",
  );
  stopsAtConfiguredRound(numberedItem(r2, /Review limits/), "ROUTINES.md R-2 review limits");

  stopsAtConfiguredRound(
    bulletOf(read("templates/agent-context-block.md"), /P1 and P2 review findings block/),
    "agent context block",
  );
});

test("copied agent rules and baseline rows follow the effective profile", () => {
  // CES-9, CES-13, and the configuration reference give basic work owner review
  // (owner or CI for T0, owner for a closed low-risk T1) and reserve the fresh
  // independent contexts for standard and strict, while a final review stays
  // mandatory on every profile and matching configured independent-test coverage is
  // required, not recommended. The context block copied into governed repositories
  // and the baseline rows must state the same rules.
  const block = read("templates/agent-context-block.md");

  const review = bulletOf(block, /independent reviewer|final review|exact final commit/i);
  assert.ok(review.trim(), "the agent block must keep its final-review rule");
  assert.match(
    review,
    /standard|strict|profile|configured/i,
    "the fresh independent reviewer must be tied to the standard and strict profiles",
  );
  assert.match(review, /owner/i, "basic review by the owner (or CI for T0) must stay allowed");
  assert.match(
    review,
    /exact final commit/,
    "the final review must stay mandatory on the exact final commit",
  );

  const contract = bulletOf(block, /contract before coding|open decisions/i);
  assert.ok(contract.trim(), "the agent block must keep its contract rule");
  assert.match(
    contract,
    /profile|basic|configured/i,
    "the contract requirement must follow the effective profile, not apply universally",
  );

  const coverage = bulletOf(block, /independent test|test author/i);
  assert.ok(coverage.trim(), "the agent block must carry the independent-test coverage rule");
  assert.match(coverage, /configured/i, "the coverage rule must name the configured setting");
  assert.match(coverage, /requir/i, "matching configured coverage must be required");
  assert.doesNotMatch(coverage, /only recommend|merely recommend/i);

  const baselineRule = (id) =>
    read("BASELINE.md").match(new RegExp(`\\| ${id} \\|([^|]*)\\|`))?.[1] ?? "";

  const pc08 = baselineRule("PC-08");
  assert.match(pc08, /bounded slice/);
  assert.match(
    pc08,
    /profile|basic|configured/i,
    "PC-08's closed contract must follow the effective profile",
  );

  const pc10 = baselineRule("PC-10");
  assert.match(pc10, /exact final commit SHA/);
  assert.match(
    pc10,
    /standard|strict|profile|configured/i,
    "PC-10 must require the fresh reviewer only for standard and strict",
  );
  assert.match(pc10, /owner/i, "PC-10 must preserve owner (or CI) review for basic work");

  const pc13 = baselineRule("PC-13");
  assert.match(pc13, /strict/i);
  assert.match(pc13, /configured/i, "PC-13 must name the configured independent-test coverage");
  assert.match(
    pc13,
    /configured[^|]*requir|requir[^|]*configured/i,
    "PC-13 must make matching configured coverage required, not merely recommended",
  );

  const slw3 = read("specs/solo-language-neutral-workflow.md")
    .match(/- \*\*SLW-3[\s\S]*?(?=\n- \*\*SLW-4)/)?.[0] ?? "";
  assert.match(slw3, /final review appropriate to that profile/);
  assert.match(
    read("skills/engineering-os/references/configuration.md"),
    /A reviewer can never be not required/,
  );

  const finalReviewCells = (read("POLICY.md")
    .match(/\| Independent final review \|([^\n]*)/)?.[1] ?? "").split("|");
  assert.match(finalReviewCells[0] ?? "", /owner or CI/, "T0 keeps owner or CI review");
  assert.match(finalReviewCells[1] ?? "", /configured|owner/i, "T1 keeps profile-selected review");
  assert.match(finalReviewCells[2] ?? "", /fresh/i, "T2 keeps a fresh review context");
});

test("the OS workflow review step is selected by the effective profile", () => {
  const os = read("OS.md");
  const row = os.match(/\| 6\. Review \|([^\n]*)/)?.[1] ?? "";
  const who = row.split("|")[0] ?? "";
  assert.ok(who.trim(), "OS.md must keep the Review workflow row");
  assert.match(
    who,
    /profile|configured|owner/i,
    "the Review row must select the reviewer by the effective profile, not demand a fresh context on every route",
  );
  assert.match(who, /fresh/i, "standard and strict keep the fresh review context");
  assert.doesNotMatch(
    who,
    /^\s*Fresh human or AI context\s*$/i,
    "an unconditionally fresh reviewer contradicts the basic profile's owner review",
  );
  assert.match(row, /final commit SHA recorded/, "the final review itself stays mandatory");
});

test("L-015's outcome describes the configurable workflow, not fixed requirements", () => {
  const l015 = read("LESSONS.md").match(/## L-015[\s\S]*?(?=\n## L-016)/)?.[0] ?? "";
  assert.ok(l015.trim(), "LESSONS.md must keep L-015");
  const became = l015.match(/\*\*Became:\*\*([\s\S]*)/)?.[1] ?? "";
  assert.ok(became.trim(), "L-015 must keep its Became outcome");

  // R-4 verifies that Became items still exist. After the configurable skill, the
  // fixed critic, reviewer, and round-three requirements no longer exist as rules, so
  // the outcome must describe the profile-configured behavior that replaced them.
  assert.match(
    became,
    /profile|configur/i,
    "the outcome must point at the current profile-configured workflow",
  );
  assert.doesNotMatch(
    became,
    /round-three stop|round three stop/i,
    "the fixed round-three stop was superseded by the configured maxReviewRounds",
  );
  assert.match(
    became,
    /configured[^.;]*round|round[^.;]*configured/i,
    "the stop must be described as the configured final review round",
  );
  if (/fresh/i.test(became)) {
    assert.match(
      became,
      /standard|strict|profile/i,
      "fresh critic and reviewer must be described as the standard/strict addition, not a universal requirement",
    );
  }
});

const promptTemplate = (name) => read(`prompts/${name}`).match(/```text([\s\S]*?)```/)?.[1] ?? "";
const contractInputLines = (template) =>
  template
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- ") && /\b(contract|critique)\b/i.test(line));

test("the implementer prompt accepts route-based N/A contract and critique inputs", () => {
  // A valid basic route reaches implementation without a closed contract or fresh
  // critique, so the template's contract and critique inputs must accept the same
  // route-based N/A its independent-tests input already carries, and ROLE must not
  // demand the closed contract unconditionally.
  const template = promptTemplate("implementer.md");
  assert.ok(template.trim(), "implementer.md must keep its fill-in template");

  const inputs = contractInputLines(template);
  assert.ok(inputs.some((line) => /contract/i.test(line)), "the template must keep a contract input");
  assert.ok(inputs.some((line) => /critique/i.test(line)), "the template must keep a critique input");
  for (const line of inputs) {
    assert.match(
      line,
      /route-based N\/A/i,
      `implementer input "${line}" must accept a route-based N/A on a valid basic route`,
    );
  }

  const role = template.match(/ROLE\n([\s\S]*?)\nINPUTS/)?.[1] ?? "";
  assert.ok(role.trim(), "the template must keep its ROLE section");
  if (/closed contract/i.test(role)) {
    assert.match(
      role,
      /\b(basic|route|profile|when|if|unless|N\/A)\b/i,
      "ROLE may demand the closed contract only conditionally; a valid basic route has none",
    );
  }
});

test("the reviewer prompt accepts route-based N/A contract and critique inputs", () => {
  // Basic routes reach review without a closed contract or critique, so the
  // reviewer's contract-and-critique input must accept a route-based N/A while the
  // full-diff final review itself stays mandatory on every route.
  const template = promptTemplate("reviewer.md");
  assert.ok(template.trim(), "reviewer.md must keep its fill-in template");

  const inputs = contractInputLines(template);
  assert.ok(inputs.some((line) => /contract/i.test(line)), "the template must keep a contract input");
  assert.ok(inputs.some((line) => /critique/i.test(line)), "the template must keep a critique input");
  for (const line of inputs) {
    assert.match(
      line,
      /route-based N\/A/i,
      `reviewer input "${line}" must accept a route-based N/A on a valid basic route`,
    );
  }

  assert.match(template, /CHECK THE FULL DIFF/, "the full-diff review stays mandatory");
  assert.match(template, /VERDICT: PASS \| FAIL/, "the review verdict stays mandatory");
});

test("the independent test-author prompt triggers on strict routing or configured coverage", () => {
  // OS.md, POLICY.md, and the dispatch guide require this role for strict routing OR
  // when the configured independentTests coverage adds it on a lower route (security
  // work, every bug fix, or every behavior change). The role prompt must state that
  // required trigger instead of recommending separation "when practical".
  const body = read("prompts/acceptance-author.md").split("## Changelog")[0];
  const flat = body.replace(/\s+/g, " ");
  const template = promptTemplate("acceptance-author.md");
  const inputSection = template.match(/INPUTS\n([\s\S]*?)\nRULES/)?.[1] ?? "";
  const inputs = contractInputLines(inputSection);

  assert.match(flat, /\bstrict\b/i, "the prompt must keep strict routing as a trigger");
  assert.match(
    flat,
    /configured|independentTests/i,
    "the prompt must name matching configured independent-test coverage as the other trigger",
  );
  assert.match(flat, /requir/i, "matching configured coverage must be required, not suggested");
  assert.match(flat, /security/i, "the trigger must cover configured lower-route security work");
  assert.match(flat, /bug fix/i, "the trigger must cover configured bug-fix coverage");
  assert.match(flat, /behavior change/i, "the trigger must cover configured all-behavior-changes coverage");
  assert.ok(inputs.length > 0, "the prompt must keep its contract and critique input");
  for (const line of inputs) {
    assert.match(
      line,
      /route-based N\/A/i,
      `test-author input "${line}" must accept a route-based N/A on a valid basic route`,
    );
  }
  assert.doesNotMatch(
    flat,
    /should use the same separation when practical/i,
    "configured coverage is a requirement, not a when-practical recommendation",
  );
});

test("plugin acceptance-author agents trigger on strict routing or configured coverage", () => {
  // Both agent front doors copy the role trigger, so they must carry the same
  // strict-or-configured-coverage rule as the canonical prompt.
  for (const path of [
    "plugins/engineering-os/agents/acceptance-author.md",
    "plugins/engineering-os/agents/eos-acceptance-author.md",
  ]) {
    const agent = read(path).replace(/\s+/g, " ");
    assert.match(agent, /\bstrict\b/i, `${path} must keep strict routing as a trigger`);
    assert.match(
      agent,
      /configured|independentTests|coverage/i,
      `${path} must also trigger on matching configured independent-test coverage`,
    );
  }
});

test("route-based and coverage prompt fixes bump versions with changelog entries", () => {
  // AGENTS.md: prompt changes bump the version and add a changelog line. The
  // route-based N/A inputs and the strict-or-configured trigger change these three
  // prompts, so each version must move past its pre-fix value with a matching
  // changelog entry. The existing exact-parity test keeps the vendored
  // plugins/engineering-os/prompts copies byte-identical to these sources.
  const bumped = (name, title, major, minor) => {
    const text = read(`prompts/${name}`);
    const header = text.match(new RegExp(`^# ${title} — v(\\d+)\\.(\\d+)$`, "m"));
    assert.ok(header, `${name} must keep its versioned title`);
    const [maj, min] = [Number(header[1]), Number(header[2])];
    assert.ok(
      maj > major || (maj === major && min > minor),
      `${name} changed for this fix, so its version must move past v${major}.${minor}`,
    );
    assert.match(
      text,
      new RegExp(`\\n- \\*\\*v${maj}\\.${min}\\*\\* — \\S`),
      `${name} must add a changelog entry for v${maj}.${min}`,
    );
  };
  bumped("implementer.md", "Implementer Prompt", 2, 2);
  bumped("reviewer.md", "Reviewer Prompt", 2, 4);
  bumped("acceptance-author.md", "Independent Test Author Prompt", 3, 0);
});

test("public incident narratives never use the security-header term", () => {
  // AGENTS.md public-content boundary: incidents are described class-level only,
  // without repo-identifying specifics. The security-header term names one findable
  // incident, so LESSONS.md and the prompt and audit changelog narratives must
  // describe the class instead. Concrete enforceable checks — security-relevant
  // headers, duplicated credential headers — stay expressible; the exact-parity test
  // above covers the vendored prompt copies.
  const term = /security[-\s]headers?/i;
  for (const allowed of [
    "rejects more than one value for a security-relevant HTTP header",
    "duplicated credential header rejection tests",
  ]) {
    assert.doesNotMatch(allowed, term, `the ban must keep "${allowed}" expressible`);
  }
  for (const path of [
    "LESSONS.md",
    "prompts/critique.md",
    "prompts/implementer.md",
    "prompts/reviewer.md",
    "routines/monthly-audit-prompt.md",
  ]) {
    assert.doesNotMatch(read(path), term, `${path} must not use the security-header term`);
  }
});

test("the security-header rewording advances prompt and audit versions with changelogs", () => {
  // AGENTS.md: prompt templates are versioned; changes bump the version and add a
  // changelog line. Removing the security-header term changes these three role
  // prompts and the monthly audit prompt, so each version must move past its
  // pre-fix value with a matching changelog entry.
  const advanced = (path, header, major, minor) => {
    const text = read(path);
    const found = text.match(header);
    assert.ok(found, `${path} must keep its versioned title`);
    const [maj, min] = [Number(found[1]), Number(found[2])];
    assert.ok(
      maj > major || (maj === major && min > minor),
      `${path} changed for this fix, so its version must move past v${major}.${minor}`,
    );
    assert.match(
      text,
      new RegExp(`\\n- \\*\\*v${maj}\\.${min}\\*\\* — \\S`),
      `${path} must add a changelog entry for v${maj}.${min}`,
    );
  };
  advanced("prompts/critique.md", /^# Critique Prompt — v(\d+)\.(\d+)$/m, 2, 2);
  advanced("prompts/implementer.md", /^# Implementer Prompt — v(\d+)\.(\d+)$/m, 2, 3);
  advanced("prompts/reviewer.md", /^# Reviewer Prompt — v(\d+)\.(\d+)$/m, 2, 5);
  advanced("routines/monthly-audit-prompt.md", /^# Monthly Audit — agent prompt v(\d+)\.(\d+)/m, 2, 4);
});

test("CES-19 and the validator keep the exception schema and whole-rule boundaries", () => {
  // The exception-semantics fix documents what an active exception does; the schema
  // and the deterministic validator must stay exactly as CES-19 states them: six
  // recorded fields, a protected-rule wall, rejection of unknown or protected rule
  // names, and expiry that stays invalid until renewal with a new reason and date.
  const ces19 = read("specs/configurable-engineering-os-skill.md")
    .match(/- \*\*CES-19[\s\S]*?(?=\n- \*\*CES-20)/)?.[0] ?? "";
  assert.ok(ces19.trim(), "the spec must keep CES-19");
  const flat = ces19.replace(/\s+/g, " ");
  assert.match(flat, /records the rule, reason, owner, creation date, review date, and removal condition/);
  assert.match(flat, /cannot weaken/);
  assert.match(flat, /validator rejects an exception that names a nonexistent CES rule or any protected rule/);
  assert.match(flat, /invalid until removed or renewed with a new reason and date/);

  const validator = read("skills/engineering-os/scripts/validate_config.mjs");
  assert.match(
    validator,
    /objectShape\(exception, \["rule", "reason", "owner", "created", "reviewBy", "removalCondition"\]\)/,
    "the validator must keep the six-field exception schema",
  );
  for (const code of ["date-order", "expired-exception", "unknown-rule", "protected-rule"]) {
    assert.match(validator, new RegExp(`reject\\("${code}"\\)`), `the validator must keep reject("${code}")`);
  }
  assert.match(validator, /PROTECTED_RULES = new Set\(/);
});
