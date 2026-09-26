# RuleScope: submission texts

Texts ready to paste into the lablab.ai submission form.

## Project title

RuleScope: know what a change request touches, before you code

## Short description

A custom IBM Bob mode, skill and MCP server that turns any change request into an evidence-based Impact Brief: every file to change or check across repositories, hidden blockers, a simulated before/after of the naive fix, and a safe plan.

## Problem and solution

**The problem.** A developer gets a ticket: "raise the Premium transfer limit to €5,000". It looks like a one-line change. In a real codebase it rarely is. The same limit is copied in the mobile app, a fraud rule silently blocks anything above €2,000, a compliance report depends on the same amounts, and three tests assume the old value. Nobody sees this until code review, QA or production. The cost of a change request is decided before the first line of code, but that is exactly when developers know the least about it.

**The solution.** RuleScope makes IBM Bob do the investigation first. The developer gives Bob a ticket (text, GitHub issue or PDF) and the repositories to analyse. In the RuleScope mode, Bob follows the `impact-brief` skill: it maps the links between repositories, launches one subagent per repository in parallel, and calls our `rulescope-mcp` server to search the code (`git grep`), read the history (`git blame`/`git log`), measure test coverage, and simulate the naive change in a temporary git worktree with vitest. The real code is never touched.

The result is an Impact Brief, shown in Bob's chat and saved as JSON for a web report:
- the questions to settle before coding, and who must sign off;
- every file to change, to check and not affected, per repository;
- contradictions, hidden duplicates and cross-repository links;
- a before/after table proving what the naive fix breaks;
- git history, coverage gaps, risk, effort and a step-by-step safe plan that Bob can then apply in Agent mode.

**The evidence rule.** Every finding must come from a tool result, never from a guess. The MCP server enforces it: `save_impact_report` rejects a report with an item without evidence or severity, a file listed twice, or a planned file that was never classified.

**The demo.** NovaBank is two linked repositories, an API and a mobile app, built by a script with a realistic git history. We ran four tickets against it:
- **Premium limit:** RuleScope finds the duplicated mobile check and the fraud blocker, and proves the naive fix raises every Standard customer's limit.
- **GDPR erasure** (a PDF ticket): it finds personal data leaking into logs and an external analytics service, and flags the conflict with 10-year AML retention for Legal.
- **SQLite to PostgreSQL:** it finds a hidden regulatory report that needs compliance sign-off.
- **Button colour:** it honestly reports that the analysed repositories hold no UI code, instead of inventing a file.

## How we used IBM Bob

IBM Bob is both how we built RuleScope and what RuleScope runs on.

**Plan mode first.** Our first task, costing under one Bobcoin, was a Plan-mode design session. Bob wrote the architecture (`docs/DESIGN.md`) and a six-step implementation plan with checkboxes (`rulescope-mcp-plan.md`). Every later task pointed Bob at one step of that plan and ended with "run the type checker and the tests, then tick the plan", so Bob checked its own work.

**Agent mode to build.** Bob wrote the `rulescope-mcp` server in TypeScript in three Agent tasks: code search, git history, cross-repository links, the worktree simulation, coverage and report validation. It also wrote the NovaBank demo generator and the report web page. The web page was built from a static mockup we designed. When a run exposed engine bugs, one Agent task fixed all three, and Bob found and fixed a fourth bug of its own: Windows line endings breaking `git grep` parsing.

**Bob as the product.** RuleScope is not a separate app that calls an AI. It is a set of Bob extensions:
- a custom mode (RuleScope) with non-negotiable rules: evidence first, never edit code without approval, mask personal data;
- the `impact-brief` skill, a six-step procedure;
- our MCP server, registered in Bob.

In that mode, Bob launches one subagent per repository in parallel, reads PDF tickets directly, and ends by offering to apply the plan in Agent mode.

**What we learned.**
- Stating the environment in the prompt (Windows, PowerShell, "run tools with node, stop after the same error twice") turned our most expensive tasks into one-prompt successes.
- Corrections work best as a diagnosis, not as "try again".
- Replacing diff patches with search-and-replace edits made Bob's simulated changes reliable.

**Honest review.** We audited every saved report against the real demo code. Most findings were right, but some evidence lines and test counts were off. We corrected them and moved the checks into the MCP server, so the tool now rejects such reports on its own.

**Usage.** 14 Bob tasks for 63.51 Bobcoins in total, across both team members. Every prompt, export and screenshot is in `bob_sessions/`.

## Technologies

IBM Bob (custom mode, skill, subagents, MCP) · TypeScript · Node.js · Model Context Protocol SDK · Vitest · Git · HTML/JavaScript · Vercel

## Links

- Repository: https://github.com/Melinakhettab/rulescope
- Live demo (report page): https://rulescope-mu.vercel.app/?report=PROD-482
