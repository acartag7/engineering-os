# The Operating System

This is the source of truth for how work moves from an idea to `main`. Every rule says
where it is enforced. A written rule that no machine checks is guidance, not a gate.

## Three principles

### 1. Rules become checks, or stay honestly labeled

Important rules should move into GitHub, CI, tests, or small guard scripts. Until that
happens, mark them as prompt or audit rules. A green check must never claim more than
it proved.

### 2. The agent runner never approves itself

The tool that writes or dispatches work cannot be the final judge. Required CI lives
in the repository. The final review uses a fresh context and binds its result to the
exact commit reviewed.

### 3. Every gate checks its inputs

A check that ran against the wrong files, skipped its important suite, or reviewed an
old commit is not green. It is missing evidence.

**Enforcement: repository review + monthly audit; an individual principle becomes
HARD only through the specific check named by the rule that applies it.**

## Where rules live

| Layer | Place | Meaning |
|---|---|---|
| **0** | GitHub | Pull requests, required checks, and protected branches block merge |
| **1** | Repository | CI, tests, lints, and scripts check repeatable facts |
| **2** | Task prompt | Agents receive guidance that they may still miss |
| **3** | Written docs | People can understand the rule, but nothing automatically checks it |

Use the strongest practical layer. Always name weaker enforcement honestly.

**Enforcement: documentation + repository review. Each operational rule below names
its own real enforcement layer.**

## Plain language across every project

This rule is about writing, not the programming language used to build the project.

Use plain, easy English in documentation, specs, issues, pull requests, prompts, code
comments, error messages, and user-facing text. Use a technical term only when
accuracy needs it, and explain it the first time. Do not use jargon to sound formal.
Keep exact code names, commands, and protocol terms when changing them would reduce
accuracy.

Why: difficult wording hides unclear thinking and makes review and adoption harder.
**Enforcement: Layer 2 prompt guidance + Layer 3 docs; not machine-enforced.**

## Discover and configure the workflow

Use the `engineering-os` skill to onboard a repository, explain the process, change
settings, migrate the older process, start one change, or report status. It inspects
the repository first, then asks every unresolved applicable question one at a time.
Each recommendation explains what it enables, costs, weakens, and leaves unchanged.

Accepted project defaults live in root `engineering-os.json`. The included
deterministic validator rejects unknown fields, wrong types, unsafe keys, invalid
providers, expired exceptions, symlinks, and paths outside the repository. The skill
is guidance; validation becomes a hard wall only when required CI runs it.

Multi-agent tools are optional. A fresh AI session, a named human, or a multi-agent
seat may provide independent judgment. A solo owner never fabricates another human.

**Enforcement: configuration validation is Layer 1 when required by branch
protection; skill questions and recommendations are Layer 2 prompt guidance plus
Layer 3 audit evidence.**

## The workflow for one slice

A slice changes one clear rule that one reviewer can understand in one sitting.

| Step | Who | Result |
|---|---|---|
| 0. Cut | Owner + agent | One bounded slice with dependencies and exclusions |
| 1. Contract | Owner + agent | Required behavior, failures, and open questions resolved |
| 2. Critique | Fresh human or AI context | Missing decisions and unsafe silences found before code |
| 3. Independent tests | Strict routing or matching configured coverage | Small behavior tests written and proven red before code |
| 4. Implement | One implementer | One implementation plus its normal tests |
| 5. Verify | Repository CI | The repository's verification command and real entrypoint pass |
| 6. Review | Fresh human or AI context | Findings and reviewed final commit SHA recorded |
| 7. Merge | Owner | The only required human decides after checks and review are complete |

The `basic` profile is the smallest valid path. `standard` adds a fresh critic and
fresh final reviewer. `strict` also adds an independent test author before
implementation. T0 may use basic. T1 uses the configured default. T2 and T3 always
use strict. Every Docs route uses at least standard. The configured independent-test
coverage can add a test author to a lower route for security work, bug fixes, or all
behavior changes. Configuration may raise but never lower these route floors.

**Enforcement: roles, route floors, and sequence are prompt + pull-request evidence +
monthly audit. The verify step is HARD only when branch protection requires it; no
fleet-wide gate checks the whole sequence.**

### Slice limits

- About 300 changed lines is a warning to check whether the work should be split. It
  is not an automatic rejection. Necessary tests and generated files are explained.
- Never compress code or make mechanical file splits to satisfy a line target. Split
  only when the new files represent clear concepts.
- A solo owner keeps no more than two pull requests in active review.
- A third substantive review round stops the change. Fix the contract or cut a smaller
  slice before continuing.

**Enforcement: prompt + monthly audit. These are not yet fleet-wide CI gates.**

### Tests and regression proof

The implementer writes normal tests alongside the code. Strict work first uses an
independent test author. Configured coverage can also require that role on a lower
route for security work, bug fixes, or all behavior changes. The independent tests
are small, behavior-focused, and proven to fail at the pre-implementation commit.
Record the commit, command, failing result, and passing result. A test that passes
before and after implementation proves nothing.

**Enforcement: prompt + pull-request evidence + monthly audit; no fleet-wide
mechanical gate verifies author separation or the pre-implementation red proof yet.**

### Exact-head review

The reviewer receives the contract, threat notes, full diff, verification evidence,
and exact commit SHA. P1 and P2 findings block merge. Any later push makes the review
stale and requires another review of the new head.

Read the complete paginated review-thread inventory after every push and immediately
before reporting ready. Every reviewer message must be read, every actionable finding
addressed, and no unresolved actionable thread left. Green CI and a separate review
do not replace this check.

The owner is the only required human. A solo repository does not require approval
from a second human who does not exist. **Enforcement: prompt + review artifact today;
exact-head GitHub enforcement is not yet fleet-wide.**

## Language-neutral verification

Each repository owns one verification command. CI runs the same command. The command
uses the strongest suitable checks for that project and exercises the real shipped
entrypoint.

Engineering OS does not assume:

- a programming language;
- a package manager;
- a `src/` directory;
- a separate acceptance-test directory;
- a type checker where the language has none.

The required status check has a stable purpose—`verify`—while its implementation
belongs to the repository. **Enforcement: Layer 1 when `verify` is required by branch
protection.**

## Project Brief

Every governed repository carries `BRIEF.md` at its root. It lets a tired owner or a
new collaborator understand the project in about five minutes. It uses plain English
and names the real files and commands.

The fixed sections are: what it is, why it exists, one real action through the
system, the directory map, sharp edges, run and test commands, and current state plus
the next milestone. Start from [`templates/project-brief.md`](templates/project-brief.md).

A pull request updates the brief when it changes architecture, adds or removes a
module, or changes run or test commands. The monthly audit checks that the file
exists, its map matches the tree, and its commands still work. **Enforcement: review
+ monthly audit; no fleet-wide CI content check exists yet.**

## Project tiers

The tier depends on what a mistake can leak or break.

| Tier | Project | Minimum process |
|---|---|---|
| **S** | Public, published, or security product | Full applicable baseline |
| **I** | Internal with real data, credentials, or logins | Required verify, threat notes for boundaries, independent review |
| **X** | Experiment or scratch work | Secrets hygiene and an honest status |

**Enforcement: the tier value is HARD when configuration validation runs in required
CI. Applying the tier's minimum process is prompt + monthly audit; no fleet-wide
mechanical gate applies the whole table yet.**

## Optional frozen-test guard

`process-guard` remains supported for a repository that explicitly chooses hash-frozen
acceptance tests. It is not part of normal onboarding. Its current contract-change
path can permit a reviewed re-freeze and is broader than a machine-verifiable human
approval. That limitation stays documented in its README and issue tracker.

For a small contract amendment, the repository may update the contract, code, and
affected frozen tests in one pull request. The pull request names what changes, why,
and which tests move. Hash checks remain required. Only externally visible behavior
belongs in a frozen suite; implementation details do not.

**Enforcement: the `process-guard` hash check + review in repositories that enable
it; no frozen-test guard applies when the repository leaves this option disabled.**

## Evolution loop

1. A bug, false green, or dragged review becomes a class-level entry in `LESSONS.md`.
2. The lesson changes a baseline check, prompt, repository check, or named risk.
3. The changed rule is verified in this repository.
4. The monthly audit checks whether governed repositories adopted it.

The goal is not more process. The goal is a smaller change, one independent second
look, and evidence that the real thing works.

**Enforcement: repository review + monthly audit; no fleet-wide machine check
enforces the complete evolution loop yet.**
