# Engineering OS

**How I ship software with AI agents — without trusting them to follow rules.**

## The story that started this

I gave the same feature spec to four AI models, in parallel. All four came back green:
tests passing, self-review says APPROVE. One of them had a serious bug — it treated
unverified user claims as confirmed facts. Its tests didn't catch that, because **it
wrote its own tests**, and nobody writes a test for the mistake they just made. Only
an independent review by a different model caught it.

Around the same time I noticed something else: rules I had written down in docs kept
getting ignored — by agents, and sometimes by me. Even my most careful repo had docs
describing a test harness that was never built. Written rules decay. Nobody notices.

Both problems have the same fix:

> **A rule doesn't count until a machine checks it. Everything else is a wish.**

## How it works, in short

Every step of work leaves a file behind: a spec, a critique, a test suite, a hash
manifest. CI checks that the previous step's file exists and is untouched before the
next step can merge. Skip a step, and the merge button turns red. GitHub can't tell
one AI from another — or from me — and that's the point: the rules hold no matter
which tool did the work.

The two rules that matter most:

1. **The tests that define "done" are written by a different AI than the one that
   writes the code** — from the spec, before any code exists.
   *Why: an agent that grades its own homework will pass itself. That's not a maybe —
   I watched it happen.*
2. **Those tests are frozen.** Every test file's hash is committed. If the coder edits
   a test, CI goes red. It can switch tests ON as it finishes a phase — it can never
   change what they check.
   *Why: "don't touch the tests" as an instruction is ignorable. A hash check isn't.*

## What's in this repo

| File | What it is | Read it when |
|---|---|---|
| [`OS.md`](OS.md) | The rules of the system: 3 principles, 4 enforcement layers, the step-by-step pipeline, project tiers | You want to understand or change how work flows |
| [`BASELINE.md`](BASELINE.md) | The checklist every repo is audited against. Each item says what it prevents and where it came from | You're onboarding a repo or reviewing an audit |
| [`LESSONS.md`](LESSONS.md) | Every real defect that taught me something, and the check it turned into | You want to know *why* a rule exists |
| [`POLICY.md`](POLICY.md) | How much process each kind of change gets — a doc tweak and an auth change are not the same | You're starting a piece of work and deciding its tier |
| [`ONBOARDING.md`](ONBOARDING.md) | How to put an existing repo under these rules, and what only a human can decide | You're adding a repo |
| [`prompts/`](prompts/) | Ready-to-use prompts for each seat: critic, test author, coder, reviewer | You're dispatching agents |
| [`process-guard/`](process-guard/) | The small CI action that does the actual enforcing | You're wiring up CI |

## The loop that keeps it alive

When a bug slips through anywhere, it becomes a short entry in `LESSONS.md`. The entry
becomes a new check. The check ships to every repo at once. That's the whole
maintenance model: **failures become checks, checks spread everywhere, and nothing
depends on me remembering.**

## License

Apache-2.0. If you copy this process, I'd genuinely like to hear what broke first.
