# Engineering OS

**A practical way to build software with AI agents without relying on them to remember
every rule.**

I use Engineering OS in my own projects. It combines:

- written decisions before code;
- reviews that try to break those decisions;
- tests written separately from the implementation for risky changes;
- normal CI and GitHub branch protection;
- `process-guard`, which checks that code and its protected tests did not quietly
  change together;
- a lessons file that turns real mistakes into the next check.

The goal is not to add the most process. The goal is to use enough process for what a
change could break.

<p align="center">
  <img src="docs/engineering-os-overview.svg" alt="A risky change moves from written rules to review, protected tests, implementation, final review, and required GitHub checks." />
</p>

<p align="center"><a href="docs/engineering-os-overview.svg">Open the full-size diagram</a></p>

## Why this exists

AI agents are good at moving quickly and checking many local details. They also:

- skip written steps when under pressure;
- write tests that agree with their own wrong code;
- report green when an important test did not run;
- keep expanding a task when nobody gave it a clear end;
- fix the finding in front of them without checking similar code.

Instructions help, but important rules need a check outside the agent.

## Three rules

1. **Important rules become checks.** If a mistake would matter, do not depend only on
   a prompt or someone remembering.
2. **The AI running the work does not approve its own evidence.** Final checks live in
   CI and GitHub.
3. **A green check must prove it used the right input.** A test run against the wrong
   files or an old commit proves nothing.

## Choose how much checking a change needs

[`POLICY.md`](POLICY.md) defines the full routes.

| Change | Usual route |
|---|---|
| **T0 — no behavior change** | Normal pull request and CI |
| **T1 — ordinary behavior change** | Pipeline by default; record why if a stage is skipped |
| **T2 — security or data decision** | Review the rules → protected tests → code → independent review |
| **T3 — new or especially dangerous decision** | T2 plus 2–3 implementations and two review families |
| **Docs** | Check every safety promise against real code and tests |

Examples of T2/T3 work include deciding who may log in, which data they may read or
write, where the program may connect, and how untrusted input is accepted or rejected.

A second question matters too: **Is the task small enough to review?**

A detailed plan can still produce a bad result when one change contains too many rules,
code paths, or open decisions.

## What `process-guard` does

`process-guard` is the small CI control in [`process-guard/`](process-guard/).

When GitHub requires it before merge, it checks:

- protected acceptance tests existed before implementation;
- those test files still match their saved hashes;
- implementation and protected tests did not silently change together;
- the saved test list and Git history are valid.

It does not decide whether the written rule is correct or whether the task is worth
doing. Those remain human decisions.

Wrong acceptance tests can be corrected. The normal route is a separate rule-and-test
pull request that merges before implementation continues. The current approval signal
for that route is too broad and is tracked in
[issue #12](https://github.com/acartag7/engineering-os/issues/12).

## What I have seen so far

The full numbers and limits are in [`EVIDENCE.md`](EVIDENCE.md).

Two results stand out:

- In a public security project, reviewing one rule across nine code paths took
  27 submitted reviews and found 49 issues. The later code-and-test PR took 3 reviews
  with findings and found 3 narrow issues.
- In a private project, one oversized change took 43 submitted reviews and produced
  129 findings. In the next 16 real changes, the middle result was 2 reviews with
  findings and 2 findings, even though the middle change was about 1,264 lines.

These are two projects I run. They show that the method is useful to me. They do not
yet show that it works for other developers.

The next test is deliberately small: three repositories I do not own, five real
changes in each, with setup time and developer friction published even when the result
is bad. See [`PILOT.md`](PILOT.md).

## Try it in one repository

1. Use [`ONBOARDING.md`](ONBOARDING.md) to declare what the repository can expose or
   damage.
2. Add the short agent instructions from
   [`templates/agent-context-block.md`](templates/agent-context-block.md).
3. Add `process-guard` to CI and make it, tests, and builds required in GitHub.
4. Use [`DISPATCH.md`](DISPATCH.md) when starting a change.
5. Optionally install the [Claude Code plugin](plugins/engineering-os/) to help run
   the steps. The plugin does not replace CI or GitHub settings.

## The human still decides

Before coding, a person must decide:

- what the software must do;
- which risks are acceptable;
- whether a reported threat can really happen;
- whether the proposed fix is worth its cost;
- whether this is one change or several;
- when an agent must stop.

AI review is useful because it finds unclear rules and missing cases. It does not make
those product and security decisions for you.

## Where to go next

| I want to… | Read |
|---|---|
| See the numbers | [`EVIDENCE.md`](EVIDENCE.md) |
| Read the outside-repository test plan | [`PILOT.md`](PILOT.md) |
| Understand the full method | [`OS.md`](OS.md) |
| Start a change | [`DISPATCH.md`](DISPATCH.md) |
| Choose how much checking to use | [`POLICY.md`](POLICY.md) |
| Add it to a repository | [`ONBOARDING.md`](ONBOARDING.md) |
| See where each rule came from | [`BASELINE.md`](BASELINE.md) and [`LESSONS.md`](LESSONS.md) |
| Inspect the CI control | [`process-guard/`](process-guard/) |
| Read the field-notes article draft | [`docs/spec-driven-development-field-notes.md`](docs/spec-driven-development-field-notes.md) |

## Honest limits

- A reviewed rule can still be wrong.
- The current CI check proves that a protected test suite exists, not that every
  feature has the right tests.
- A contract-file change currently opens the test-correction path more broadly than
  intended.
- A check stored in the same repository cannot fully protect its own workflow file.
  Stronger protection needs a GitHub rule that uses a trusted workflow.
- Separate AI roles reduce shared mistakes, but the repository owner can still bypass
  that separation.
- The current evidence comes from my own projects.

More detail is in [`OS.md`](OS.md), [`BASELINE.md`](BASELINE.md), and
[`contracts.md`](contracts.md).

## License

Apache-2.0. If you try this process, I would genuinely like to hear what broke first.
