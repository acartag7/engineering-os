# Spec-driven development with AI: what worked, what did not, and where I was still needed

I have spent the last few weeks using AI agents to build two security-sensitive
projects.

In one project, I started with almost no process. I described what I wanted, let the
agents generate it, and kept moving. There were documents, but no consistent method
connecting decisions, tests, review, and merge.

It produced what I now call AI slop: software that looked substantial, worked in
places, and had no trustworthy reason for being shaped the way it was.

On July 22 I reset the project around spec-driven development. In a second public
project, I was already applying a stricter security process and preparing a release.
The two projects gave me a useful comparison.

My conclusion is not that writing a specification makes AI reliable.

It is this:

> A reviewed specification can move hard questions out of code review, but only when
> the human has also decided what matters and made the task small enough to finish.

## The before-picture

Before the July 22 reset, the private project was developed mostly through direct
AI-generated commits. Architecture and requirements moved together. There was no
consistent review process and no lasting record of why one design beat another.

The reset front-loaded a lot of work:

- 35 planning and evaluation files;
- 13,116 added lines;
- written rules that would not change during coding;
- security notes;
- implementation notes;
- reviews that tried to break the specification;
- a way to compare different implementations.

Those 13,116 lines are not a productivity claim. Much of the volume was captured
model output, review findings, and evaluation machinery. The meaningful change was
that disagreement became visible before implementation.

The agents were no longer guessing against a moving conversation. They had decisions
they could be wrong about.

## A detailed specification was still not enough

The first major write-path slice after the reset was enormous:

- 6,565 changed lines;
- 46 files;
- 44 commits;
- 43 submitted AI reviews;
- 129 inline findings.

The process existed. The written rules were detailed. The tests were extensive. The change
was still too broad.

This corrected one of my early beliefs about spec-driven development. I had treated
complete rules and a well-sized task as almost the same problem. They are not.

A specification answers, “What must be true?”

A well-sized change answers, “What one clear decision can a reviewer hold in their head?”

You need both.

After that outlier, the next 16 real changes looked very different:

- median change size: approximately 1,264 lines;
- median reviews with findings: 2;
- median inline findings: 2;
- median PR-open-to-merge window: approximately 0.98 hours.

These were not trivial changes. Reviewers tried to break the plans, tests, and code.
But final review increasingly checked decisions already made earlier instead of
designing the feature one finding at a time.

## The public security project showed the opposite failure

In my public OAuth library, I ran a deliberate deep security review before a
release. This was normal release work, not an accidental review storm.

The exercise was productive and expensive:

- 15 product and process PRs;
- 110 submitted reviews;
- approximately 186 findings in the final audit.

Many findings were real. The problem was where they appeared. Review was often
completing contracts and tests that had looked finished.

One incident made the human role painfully obvious.

After merging CIMD support, I asked Fable to review the code as an attacker would.
Its safeguards refused the security audit. I gave the same task to GPT-5.6 Sol on
Ultra. It explored cases the existing tests did not cover and found a real JavaScript
bug: a safety option could be inherited from an object prototype instead of being
explicitly set. The actual safety fix was four lines across three files.

I then let the same agent fix the bug class “everywhere,” unattended.

The task had no edge. Six hours later it had become a 104-file pull request with 6,900
additions. The protection the agent built eventually repeated the same unsafe
inherited-property mistake inside itself.

Then I asked the question I should have asked first: could an external attacker reach
the bug?

They could not. Exploitation first required attacker-controlled code already running
inside the process. The gap was worth fixing, but it did not justify building a new
security subsystem around it.

I closed the PR unmerged. The complete incident is public in
[A 4-line security fix turned into a 100-file pull request](https://dev.to/acartag7/a-4-line-security-fix-turned-into-a-100-file-pull-request-and-i-nearly-merged-it-1gkf).

The model did not fail because it was incapable. Its audit was excellent. It failed
because I gave a relentlessly capable system a rule that applied everywhere, without
first deciding whether an attacker could reach the bug or when the work should stop.

## The strongest written-rules-first result

The same public project later needed one redirect rule across nine parts of the
program. Pretending it was a five-file change would have hidden the real work.

I reviewed the rule first:

| Stage | Changed lines | Submitted reviews with findings | Inline findings |
|---|---:|---:|---:|
| Written rule and plan | 1,031 | 27 | 49 |
| Code and tests | 1,546 | 3 | 3 |

The implementation included 770 added test lines and connected the rule to all nine
places. Its three findings were narrow consistency corrections. None discovered a
new kind of redirect input.

Submitted implementation reviews were about 89% lower than at the contract stage.
Inline findings were about 94% lower.

That is what I want from spec-driven development. It did not remove hard review. It
moved that review to the point where changing a decision was cheap.

It also taught me not to use raw diff size as the only slicing rule. A large test
matrix and nine users of the rule can still be one clear change. The better question
is whether the work contains one decided rule or several open questions.

## A smaller security fix showed the same pattern

Another review found that two login pages could be embedded inside a hostile web page.
This mattered because the user’s consent decision was the final protection against a
client pretending to be someone else.

Before implementation review, the change listed:

- the exact attack being stopped;
- both HTML pages that needed protection;
- every adapter that had to pass the setting through;
- the built JavaScript that users would run;
- proof that removing the fix made the new test fail.

The result was 131 changed lines across five files, one submitted review, and then a
clean result.

Small helped. Decided helped more.

## Where spec-driven development worked well

It worked best when:

1. **The threat or product outcome was real and reachable.**
   The specification described something worth building.
2. **We could list the inputs and every part of the program affected.**
   Empty, malformed, stored, and older states could be named before coding.
3. **Firm decisions were clearly marked.**
   The agent could tell what it must follow and what was only background.
4. **The specification was attacked before implementation.**
   Review asked what the contract permitted accidentally, not whether it sounded
   reasonable.
5. **Tests proved the fix mattered.**
   Removing the fix had to make the new test fail.
6. **The change had a clear end.**
   Review had an end condition.

## Where it did not work

It worked poorly when:

- the task was really discovery presented as delivery;
- exploitability or user value had not been decided;
- one rule was applied to “everywhere” without listing the affected code paths;
- the specification contained several architecture changes disguised as one task;
- test and evaluation volume was mistaken for decision quality;
- review was allowed to complete the design indefinitely;
- an unattended agent had no automatic reason to stop.

A long specification can hide all of these.

## What I could not delegate

The agents were often better than me at checking every nearby detail. They found
unusual inputs, similar code paths, old claims, and test weaknesses I had missed.

But I still had to decide:

- Is this threat reachable?
- Is the consequence large enough to justify the extra code and process?
- Which behavior is actually part of the product?
- Is this one change or five?
- When has review stopped verifying and started designing?
- When is the cure becoming riskier than the original defect?

Those are not ceremonial approvals. They are the work.

## Why I kept an automated process guard

Agents skipped written stages under pressure. So I built `process-guard`, a small CI
check for the parts of the process that a script can verify.

When GitHub requires it to pass before merge, it checks that acceptance tests existed
before implementation, that those test files have not changed since they were frozen,
and that the code and the tests judging it did not silently move together.

It is useful, but it cannot decide whether the written rules are good or whether a fix
is worth its cost. It also needs a way to update frozen tests when the expected
behavior genuinely changes. Today it treats a contract change as permission to do
that. My normal workflow puts the contract and acceptance-test change in a separate
PR, but the check itself cannot prove that the repository owner approved the change.
That weakness is recorded rather than hidden.

A guard should check a small number of clear rules. It is not the whole method.

## I now ask two separate questions

I used to classify work only by what could go wrong:

- routine maintenance;
- ordinary product behavior;
- security or sensitive-data behavior;
- new or critical security work.

That determines how much checking a change deserves.

Then I separately ask whether the task is ready and small enough:

- Are decisions still open?
- How many rules change?
- How many parts of the program must agree?
- Can one reviewer understand the whole change in one sitting?
- What would make the agent stop?

Possible harm determines how much checking is needed. Open questions and the number
of affected code paths determine how the work is split.

Neither question replaces the other.

## What I can claim today

Across two projects I run, this method made decisions easier to inspect, stopped
tests and code from quietly changing together, and moved many hard questions earlier.

I cannot yet claim that it works for other developers or produces fewer bugs after
release than good CI and good review.

So the next experiment is intentionally small: three repositories I do not own,
five real changes each, measured onboarding and friction, and publication of the
unflattering results too. I continue only if at least two developers keep using it
without my help.

That experiment is public in the
[Engineering OS pilot protocol](https://github.com/acartag7/engineering-os/blob/main/PILOT.md).

The outcome I want is not more process.

It is knowing which decisions must happen before an AI starts moving quickly—and
having enough evidence to notice when I chose wrong.
