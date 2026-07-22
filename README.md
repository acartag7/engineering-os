# Engineering OS

**Ship software with AI agents—without trusting them to follow rules.**

This repository contains a risk-based delivery process, agent prompts, onboarding
templates, and a CI guard for AI-assisted software development. When its status checks
are required by branch protection, GitHub—not the agent that produced the work—holds
the merge boundary.

<p align="center">
  <img src="docs/engineering-os-overview.svg" alt="The shared T2 and T3 trust-boundary path: contract, independent critique, separately authored acceptance tests, and a hash freeze. T2 then uses one implementation and a different-family review. T3 branches to two or three parallel implementations, frozen-suite scoring, and blind two-family review before required CI checks." />
</p>

<p align="center"><a href="docs/engineering-os-overview.svg">Open the full-size diagram</a></p>

> The diagram shows the shared **T2/T3 path and its T3 escalation**. T3 requires 2–3
> parallel candidates, frozen-suite judging, blind two-family review, and stronger
> verification. T0, T1, and documentation changes take lighter routes defined in
> [`POLICY.md`](POLICY.md).

## Three principles

- **Rules become checks, or they do not count.** Important instructions should not
  decay into optional prose.
- **The orchestrator never guards itself.** An AI-driven system should not approve its
  own evidence.
- **Every gate checks its inputs.** A green result from missing, wrong, or silently
  skipped evidence proves nothing.

For T2/T3 work, policy separates the acceptance-test author from the implementer.
`process-guard` then checks the available artifact and freeze invariants from Git
history rather than trusting the pull request’s working tree.

## Why this is not vibe coding

| Vibe-driven delivery | Engineering OS |
|---|---|
| Code discovers the requirements | A contract fixes the promises first |
| The coder defines its own grading criteria | A separate seat authors acceptance evidence |
| Tests move when implementation struggles | A hash manifest exposes changed test bytes |
| The agent reports success | Required external checks evaluate repository artifacts |
| A failure becomes another instruction | A failure can become a reusable check |

This does not make AI output automatically correct. It creates independent points of
disagreement instead of deriving the contract, tests, code, review, and verdict from
one generation.

**[Read the balanced rationale](RATIONALE.md)** for where this process earns its
weight, where it can become too heavy, and how to avoid “vibe governance.”

## Process follows risk

[`POLICY.md`](POLICY.md) classifies the **change**, not the diff size:

| Change | Route |
|---|---|
| **T0 — mechanical** | Normal pull request + CI floor |
| **T1 — behavior, no trust boundary** | Pipeline default-on; explicit audited skip possible |
| **T2 — trust boundary** | Critique → frozen independent acceptance → implementation → cross-family review |
| **T3 — novel or critical boundary** | T2 controls + 2–3 candidates + frozen-suite judging + blind two-family review |
| **Docs** | Claims-vs-enforcement pass + guarantee-verb grep |

The friction is deliberate where a mistake can leak credentials, widen permission,
corrupt evidence, or write unsafe state. A rename should not behave like an
authorization change.

## Try it in one repository

1. Use [`ONBOARDING.md`](ONBOARDING.md) to declare the repository tier and add the
   [`agent context`](templates/agent-context-block.md).
2. Introduce the acceptance-suite manifest or the temporary onboarding exemption in
   the order described there.
3. Add [`process-guard`](process-guard/) to CI and make the repository’s verification
   jobs required status checks in branch protection.
4. Start work from [`DISPATCH.md`](DISPATCH.md), or install the optional
   [Claude Code plugin](plugins/engineering-os/) to make the compliant path easier.

The plugin is orchestration convenience at prompt layer 2. It does not replace CI or
branch protection.

## Where to go next

| I want to… | Read |
|---|---|
| Understand the authoritative system | [`OS.md`](OS.md) |
| Start a change | [`DISPATCH.md`](DISPATCH.md) |
| Choose verification depth | [`POLICY.md`](POLICY.md) |
| Onboard a repository | [`ONBOARDING.md`](ONBOARDING.md) |
| See every control and its origin | [`BASELINE.md`](BASELINE.md) + [`LESSONS.md`](LESSONS.md) |
| Inspect the enforcement | [`process-guard/`](process-guard/) |
| Reuse the four agent seats | [`prompts/`](prompts/) |
| Understand changes to this OS itself | [`contracts.md`](contracts.md) |

## Honest limits

Engineering OS reduces correlated mistakes; it does not prove that a contract is
correct or that every feature has its own acceptance coverage. The current freeze gate
is global rather than per-feature, and any configured contract-path change opens its
coarse re-freeze path. Author separation is also owner-forgeable and audited rather
than a hard identity boundary. Full accepted risks and incomplete controls are named
in [`OS.md`](OS.md), [`BASELINE.md`](BASELINE.md), and [`contracts.md`](contracts.md).

## License

Apache-2.0. If you copy this process, I would genuinely like to hear what broke first.
