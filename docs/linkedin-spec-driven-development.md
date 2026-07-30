# LinkedIn draft — spec-driven development field notes

I used spec-driven development with AI agents across two security-sensitive projects.

The result was not “write a spec and the AI becomes reliable.”

It was more useful than that.

Before July 22, one private project was built mostly through AI-generated commits:
changing architecture, changing requirements, no consistent review process. It produced
a lot of software and not enough reason to trust its shape.

I reset it around written rules, threat notes, reviews that tried to break the plan,
and tests that fail again when a fix is removed.

The first major slice still went badly:

→ 6,565 changed lines

→ 43 submitted AI reviews

→ 129 inline findings

The specification was detailed. The task was still too broad.

After that, the next 16 real PRs had:

→ median ~1,264 changed lines

→ median 2 reviews with findings

→ median 2 inline findings

The changes were not tiny. The difference was that review increasingly verified
decisions already made before coding.

In `mcp-sso`, I saw the same effect even more clearly.

A redirect rule had to work the same way in nine parts of the program:

Contract review: 27 submitted reviews with findings, 49 findings.

Implementation review: 3 submitted reviews with findings, 3 narrow findings.

Most discovery happened while reviewing the rule, when changing a decision was cheap.

But AI still could not make the most important decisions for me.

Fable refused an attacker-style audit because of its safeguards. GPT-5.6 Sol on Ultra
accepted the same task and found a real bug with a four-line fix. I then let the agent
“fix it everywhere,” unattended. It produced a 104-file PR with 6,900 additions to
defend against an attack that an outside attacker could not reach.

The AI was capable. I had not said exactly where the task ended, whether an attacker
could reach the bug, or when the work should stop.

Now I ask two separate questions:

1. Possible harm determines how much checking is needed.
2. Open questions and the number of affected code paths determine how small the
   change must be.

Specs work well when the outcome is real, every affected part of the program can be
listed, the important decisions are made, and tests fail when the bug returns.

They work poorly when discovery is disguised as delivery or “everywhere” is the scope.

The human part is still deciding:

Can an attacker reach the bug? Is the fix worth its cost? Is this one change or five? When
has review stopped verifying and started designing?

I wrote up the evidence, including the ugly numbers, in Engineering OS. Next I want
to test it on three repositories I do not own and publish the unflattering results
too.

[Engineering OS link]

#SoftwareEngineering #AI #Security #Testing
