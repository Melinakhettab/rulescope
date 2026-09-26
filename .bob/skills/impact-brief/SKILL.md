---
name: impact-brief
description: Produce an evidence-based Impact Brief for a change request (text, GitHub issue, PDF or DOCX) across one or several repositories, before any code is written.
---

# Impact Brief procedure

Inputs: the change request (read it, including PDF/DOCX) and the repository paths to analyze.
Output: an ImpactReport (see docs/DESIGN.md §4) saved with save_impact_report, and the brief presented in chat.

## Step 1 — Understand the request
- Summarize the intent in one sentence.
- Extract keywords (business terms, constants, labels, amounts, table names) and regex patterns (e.g. numeric thresholds, SQL dialect functions).
- List ambiguities as open questions.

## Step 2 — Map the repositories (root agent)
- Call find_cross_repo_links ONCE with all repository paths.

## Step 3 — Analyze each repository IN PARALLEL (one subagent per repository)
Each subagent:
1. Calls find_candidates on its repository with the keywords and patterns.
2. Reads every candidate file, and follows related code: callers, duplicated checks, similar constants, hardcoded texts, jobs and reports that use the same concept.
3. Calls git_context on each impacted line range to learn WHY it exists and WHO changed it.
4. Calls coverage_map on the impacted files.
5. Returns ImpactItems with evidence, classified as CHANGE / CHECK / NOT AFFECTED, plus the contradictions and duplicates it found.

## Step 4 — Merge (root agent)
- Combine subagent results and cross-repo links.
- Establish the evaluation order of related rules.
- Classify files per repository: filesToChange / filesToCheck / filesNotAffected.
- Give every ImpactItem a "severity" (required field): critical (regulatory, legal, security or money-loss impact), high (a core user flow breaks), medium (a secondary flow breaks), low (cosmetic or no functional impact).

## Step 5 — Prove with simulation
- Write a vitest test file with sample inputs: one `it()` per input; the test name describes the input and the expected outcome. Import application code with paths relative to the repository root (e.g. "./src/transfers/limits").
- Call simulate_change with empty edits to measure CURRENT behavior.
- Then simulate the most obvious, naive implementation (usually a one-line change) with search/replace edits, to reveal what it misses (hidden duplicates, blocking rules, other repositories).
- Report the before/after table with ✅/❌.

## Step 6 — Save and present
- Assess risk level and effort, and write a step-by-step safe change plan.
- Set createdAt to the real current date and time: run the command `Get-Date -Format o` and use its output. Never invent a date.
- filesToChange lists EVERY file that will be edited or created — source, test, config (package.json) and new files (migrations) alike.
- filesToCheck lists only files that are NOT edited but must be reviewed (callers, blocking rules, related reports). A file that blocks the change (e.g. a fraud rule needing sign-off) goes here, never in filesNotAffected.
- The three lists must not overlap, and every file in changePlan[].targetFiles must be in filesToChange or filesToCheck — save_impact_report rejects the report otherwise.
- effortEstimate gives time and size only (e.g. "4–6 h backend + 2–3 h mobile, ~50 lines"). Never write file counts in it: the report page computes them.
- Every ImpactItem must have a "severity" (critical / high / medium / low) — save_impact_report rejects items without one.
- If the work is blocked by a sign-off, set blockedBy = { "owner": "<team or person>", "reason": "<the blocking question>" }; otherwise set blockedBy to null.
- Do not fill repoFileCounts: save_impact_report adds it (git ls-files) so the page can show the real repository size.
- Call save_impact_report with the full ImpactReport (ticketId = the ticket ID, e.g. PROD-482).
- Then update report/data/index.json: add or replace the entry { "ticketId", "title", "riskLevel" } for this report, keep the other entries, and never list sample.json.
- Present the brief in chat: request + open questions, entry points, files to CHANGE / CHECK / NOT AFFECTED, contradictions, simulation table, git history, coverage gaps, risk & effort, plan.
- End by offering to apply the plan in Agent mode.