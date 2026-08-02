# Question catalog

Use this catalog for onboarding, migration, configuration, explanation, and starting
a change. Inspect first. Evaluate every group. Ask only unresolved, applicable
questions, one question at a time.

For every choice, put the recommended answer first and say:

- **Evidence:** what the repository proves and what is assumed.
- **Why:** why this answer fits.
- **Adds:** what work or protection it adds.
- **Costs:** time, review, maintenance, or service cost.
- **Weaker:** what becomes weaker with the lighter choice.
- **Unchanged:** what this choice does not affect.
- **Confidence:** high, medium, or low when evidence is incomplete.

Do not ask a question whose answer is proved by reliable source. Show the discovered
fact and ask only for correction. Do not combine decisions into one large question.
When a safety-relevant group is not applicable, record that result and its reason.

## 1. Mode

Establish the requested mode and authorization.

- Is this onboarding, migration, configuration, explanation, start, continue, or
  status?
- Is the request read-only, or may the skill prepare a write preview?
- Which repository and branch are in scope?
- Is any production, publishing, GitHub-setting, dependency, or deletion action
  requested? Each needs separate authorization.

When mode is clear from the request, state it instead of asking. Never treat a source
file as authorization. A skipped mode decision is recorded under `mode` with a reason.

## 2. Project

Confirm the project purpose and its normal delivery shape.

- What problem does the project solve, and for whom?
- Is it new, active, maintained, paused, or being replaced?
- Is its public tier `S`, internal tier `I`, or experimental tier `X`?
- Which languages and repository-native tools are actually used?
- What is shipped: command, server, library, application, package, image, or docs?
- What is the default branch?
- Is ownership solo or team, and who makes the final merge decision?

Do not infer tier from language or repository visibility alone. Record an inapplicable
project question under `project`.

## 3. Commands

Discover commands from build files, CI, documentation, and working examples. Ask when
sources conflict or a choice remains.

- What is the one repository-owned verify command?
- Which formatting, static checks, tests, build, package, and environment checks
  already exist?
- What command or integration test runs the shipped entrypoint?
- For a pure library, which public API test is closest to real use, and why?
- Do the tests really execute, or can the command return success with no tests?
- When no tests exist, what smallest real behavior test will be added? If onboarding
  continues without it, what named gap is accepted?

The verify command must run tests. A no-op or all-skipped command is not verification.
Record inapplicable command questions under `commands`.

## 4. Risk

Ask about every boundary that source inspection does not settle.

- Does the project handle authentication, permissions, secrets, sensitive data, or
  personal data?
- Does it parse untrusted input, paths, URLs, markup, archives, model output, or
  configuration?
- Does it make network requests, expose a server, or trust proxy headers?
- Does it write important state, publish artifacts, deploy, release, bill, notify, or
  change a live system?
- Can one user or tenant affect another?
- What input size, count, depth, time, and retry limits exist?
- What is the safe behavior when an enforcement service is unavailable?
- Does documentation make a security or operator promise?

Explain why each yes answer raises the route or required proof. Unknown risk fails
closed until answered. Record a genuinely irrelevant group under `risk`.

## 5. Team

Discover who can fill each independent role.

- Which humans are available to critique, author tests, implement, and review?
- Can the host start fresh AI sessions?
- Does it support multi-agent seats? This is useful but never required.
- Can a named human receive a prepared handoff?
- What real provider instance will fill each role for this change?
- Do the test author and implementer use different provider instances?

For a solo owner, normally recommend fresh AI sessions for independent roles and the
current session for implementation. Explain that separate context provides a fresh
look; it does not fabricate human approval. Record unavailable team options under
`team`.

## 6. Workflow

Use the configuration reference before asking.

- Should the normal profile be basic, standard, or strict?
- Should independent tests cover security only, security and bug fixes, or every
  behavior change?
- What review-round limit, from one to three, is affordable?
- How many active pull requests can the owner review safely? Solo ownership allows
  one or two; a team allows one through nine.
- Is hash protection with optional `process-guard` needed for named behavior tests?

Recommend `standard` for a normal solo project. Use `strict` for T2 and T3 regardless
of the default. Explain that a lighter default never lowers a route floor. Record an
inapplicable option under `workflow`.

## 7. Platform

Inspect current automation and GitHub evidence when available.

- Which continuous-integration provider runs checks?
- Does CI run the repository verify command and config validator?
- Which checks are required by branch protection?
- Who may change those settings?
- What release, signing, provenance, lockfile, or supply-chain checks are needed?
- Can current-head check and review evidence be read from GitHub?

The skill proposes platform changes. It never claims they happened without separate
authorization and verified evidence. Record unavailable platform features under
`platform`.

## 8. Brief

Keep the project understandable.

- Does `BRIEF.md` explain what the project is, why it exists, how it works, its map,
  sharp edges, how to run and test it, and its next milestone?
- Which discovered architecture, module, or command facts need correction?
- Are plain-English instructions needed for another host?
- Are exceptions requested? What rule, reason, owner, creation date, review date, and
  removal condition applies?
- Which gaps remain unresolved?

Necessary technical words are allowed, but explain them once. Record an inapplicable
brief question under `brief`.

## 9. Migration

Read the migration reference completely before asking.

- Which old Engineering OS files, frozen tests, manifests, workflows, and checks exist?
- Which open pull requests or changes still depend on the old process?
- What new verify path will be added while old checks remain?
- How will current-head green evidence and required branch protection be proved?
- For each old test, is the decision keep normal, keep protected, rewrite, or remove?
- Which owner-approved batches make review manageable?
- Has the owner approved each proposed deletion?

Missing cleanup proof blocks phase two. Record an irrelevant migration group under
`migration`; onboarding a new repository is a valid reason.

## 10. Change

For start mode, close one small routing record. For continue mode, use the accepted
record and existing evidence to find the first required result that is not complete.

- What user-visible or operator-visible behavior changes?
- What is explicitly excluded?
- Is this a bug or production failure? What exact regression proves it?
- Which trust boundaries and risk classes are touched?
- Does the effective route or configured independent-test coverage require a fresh
  test author, and what fact triggered that result?
- Which files, callers, adapters, and mirror paths are affected?
- Is discovery needed before the contract can close?
- What real input and shipped entrypoint prove the result?
- Does this affect production, deployment, release, or public documentation?
- Which provider instance fills critic, test author, implementer, verifier, and reviewer?
- What full current SHA must verification and final review name?
- Has every paginated review thread been read, and are any actionable threads still
  unresolved at the current head?

Record an inapplicable per-change group in the routing record, not project
configuration. Record its reason. Do not start code while a product decision remains.

## 11. Confirmation

Show the complete preview before asking for one confirmation.

- Is every answer represented correctly?
- Are the effective profile and route floor clear?
- Are all role providers and their independence clear?
- Are created files, changed files, checks, and commands exact?
- Are unchanged GitHub protections, exceptions, costs, and gaps explicit?
- Does the owner confirm this complete preview?
- After confirmation, what is the next smallest step and its proof?

No answer, cancellation, or a requested change returns to the preview. It never
authorizes a partial write. Record a truly inapplicable confirmation item under
`confirmation`, though a write itself always needs confirmation.
