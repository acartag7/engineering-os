# Engineering OS

**A configurable, understandable delivery process for one developer or a team.**

Engineering OS helps a repository decide how much contract, testing, verification,
and independent review a change needs. The `engineering-os` skill inspects the real
project, asks the unresolved questions, recommends a safe default, and explains how
each choice affects the work.

It works without multi-agent tools. A solo developer can use fresh AI sessions for
independent judgment. A team can use people. A host with multi-agent seats can use
those. The safety result matters; the tool shape does not.

## What it enables

- Onboard Go, Python, Rust, Java, TypeScript, and other repositories using their own
  commands and layout.
- Choose `basic`, `standard`, or `strict` project defaults without lowering the safety
  floor of a risky change.
- Use one implementation, with an independent test author before T2/T3 work.
- Keep verification and final review tied to the exact current commit.
- Move an older governed repository to the new process without removing its old
  protection too early.
- Explain the process in plain English at the moment a person needs it.

## Start here

Use `$engineering-os` in Codex, or install the Claude Code plugin and ask it to use
the Engineering OS skill.

Typical requests:

```text
Use $engineering-os to onboard this repository and explain every recommendation.
Use $engineering-os to explain the current workflow in plain English.
Use $engineering-os to migrate this repository from the old process.
Use $engineering-os to start the change described in issue 42.
Use $engineering-os to report status without changing anything.
```

The skill asks one question at a time. Before any write, it shows the complete
configuration, workflow, providers, files, checks, unchanged protections, costs, and
known gaps. Nothing is written until the owner confirms that preview.

## Profiles

| Profile | Normal use | Independent work |
|---|---|---|
| `basic` | T0 and closed low-risk work | Owner or CI review where allowed |
| `standard` | Recommended normal default | Fresh critic and final reviewer |
| `strict` | T2, T3, and high-risk work | Fresh critic, independent test author, and final reviewer |

Configuration can make work stricter. It cannot lower the route floor.

## Language-neutral verification

Every repository owns one verify command. CI runs the same command. It must run real
tests and exercise the shipped command, service, library, package, or application
where practical. Engineering OS does not guess the language, package manager, source
directory, or test layout. See [`ONBOARDING.md`](ONBOARDING.md) for the real Go
fixture.

## What remains enforcement

The skill guides and records decisions. It does not approve its own work or merge.
The deterministic configuration validator checks the settings. Repository tests, CI,
and branch protection are the real walls. The owner makes the final merge decision.

## Where to go next

| Need | Read |
|---|---|
| Source-of-truth workflow and enforcement | [`OS.md`](OS.md) |
| Onboard or migrate a repository | [`ONBOARDING.md`](ONBOARDING.md) |
| Start one change | [`DISPATCH.md`](DISPATCH.md) |
| Choose the risk route | [`POLICY.md`](POLICY.md) |
| Understand the skill package | [`skills/engineering-os/`](skills/engineering-os/) |
| Install the Claude Code plugin | [`plugins/engineering-os/`](plugins/engineering-os/) |
| See controls and their origins | [`BASELINE.md`](BASELINE.md), [`LESSONS.md`](LESSONS.md) |

## Optional frozen-test guard

[`process-guard`](process-guard/) remains available when a repository deliberately
hash-protects named behavior tests. It is not the default and its cost and limitations
must be explained before enabling it.

## Plain language

All project writing uses plain, easy English. Use technical words only when needed
for accuracy, and explain them the first time.

## License

Apache-2.0.
