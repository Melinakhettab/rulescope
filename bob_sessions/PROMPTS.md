# How we built RuleScope with IBM Bob: every prompt we sent

Team **Kinetic** (Melina & Lisa), IBM Bob 2.0 Hackathon, September 2026.

This file lists every prompt we sent to IBM Bob while building RuleScope, in order. That includes the correction messages we sent when Bob got stuck. Each task matches a screenshot in this folder.

**How we worked**
- **Plan mode first.** Bob designed the architecture and wrote `docs/DESIGN.md` and `rulescope-mcp-plan.md` before any code existed.
- **Agent mode, one sub-task per Bob task.** Each prompt says "run the type checker and the tests, then tick the plan", so Bob checks its own work.
- **Our custom RuleScope mode for the real runs.** Once the MCP server worked, we analyzed the demo tickets in that mode. It uses the `impact-brief` skill, the mode rules and parallel subagents, one per repository.

## Summary

| # | Member | Bob mode | Task | Screenshot | Bobcoins |
|---|---|---|---|---|---|
| 01 | Melina | Plan | Design of RuleScope + MCP server plan | `kinetic_melina_task01_design_plan_summary.png` | 0.86 |
| 02 | Melina | Agent | MCP server: setup, find_candidates, git_context, find_cross_repo_links | `kinetic_melina_task02_mcp_core_summary.png` | 10.97 |
| 03 | Melina | Agent | simulate_change (before/after simulation in a temporary worktree) | `kinetic_melina_task03_simulation_summary.png` | 14.10 |
| 04 | Melina | Agent | save_impact_report + coverage_map | `kinetic_melina_task04_report_summary.png` | 2.97 |
| 05 | Melina | 🔎 RuleScope | First real run on T1, which exposed a simulation bug | `kinetic_melina_task05_rulescope_T1_summary.png` | 1.51 |
| 06 | Melina | 🔎 RuleScope | Impact Brief for T4 (UI-77) | `kinetic_melina_task06_rulescope_T4_summary.png` | … |
| 07 | Melina | 🔎 RuleScope | Impact Brief for T3 (TECH-219) | `kinetic_melina_task07_rulescope_T3_summary.png` | … |
| 08 | Melina | Agent | Report page redesign from our mockup | `kinetic_melina_task08_report_redesign_summary.png` | … |
| 01 | Lisa | Agent | NovaBank demo repositories generator | `kinetic_lisakhettab_task01_demo_repos_summary.png` | … |
| 02 | Lisa | Agent | Report web page (first version) | `kinetic_lisakhettab_task02_report_page_summary.png` | … |
| 03 | Lisa | Agent | Engine fixes: cross-repo detection, coverage, simulation | `kinetic_lisakhettab_task03_fixes_summary.png` | … |
| 04 | Lisa | 🔎 RuleScope | Impact Brief for T1 (PROD-482) | `kinetic_lisakhettab_task04_rulescope_T1_summary.png` | … |
| 05 | Lisa | 🔎 RuleScope | Impact Brief for T2 (LEGAL-31, PDF ticket) | `kinetic_lisakhettab_task05_rulescope_T2_summary.png` | … |

---

## Melina, task 01: Design (Plan mode)

**Prompt**
```
Project: "RuleScope" for the IBM Bob 2.0 hackathon. Workflow we improve: a developer receives a change request (plain text, GitHub issue, or PDF/DOCX spec) for an existing codebase — possibly spread across several connected repositories (e.g. a backend and a mobile app) — and doesn't know where to start. The request can be ANY kind of change: business logic (e.g. "free shipping from €50"), technical migration (e.g. "migrate from SQLite to PostgreSQL"), library replacement, API contract change, or refactoring. Scope of this prototype: TypeScript/JavaScript repositories.

Before coding, RuleScope produces an "Impact Brief" backed by tool evidence, not guesses:
1) request understanding + open questions to ask before coding,
2) affected entry points (web/mobile/API/jobs/scripts), across repositories,
3) files to CHANGE / to CHECK / NOT affected, per repository,
4) impacted items and how they interact: business rules and their evaluation order, or technical dependencies (database-specific SQL, driver calls, config, hardcoded hosts), plus contradictions, duplicates, hidden usages and cross-repository links,
5) current behavior measured by executing code with sample inputs, AND a simulation of the proposed change applied in a temporary copy of the repository, showing a before/after table of outputs (never touching the real code),
6) git history: why each impacted item exists and who last changed it,
7) test coverage gaps,
8) risk level and effort estimate,
9) step-by-step safe change plan that Bob can then apply in Agent mode.
Evidence rule: every finding is proven by a test run when executable; otherwise by exact file:line evidence from a tool result. Never by guessing. If consumers may exist outside the analyzed repositories, say so explicitly ("unknown external consumers — verify with other teams").

Outputs: the brief is shown in the Bob chat (so the developer can ask follow-up questions and apply the plan), AND saved as JSON rendered by a web page in report/.

Design a TypeScript MCP server "rulescope-mcp" (official MCP TypeScript SDK, Node 20, no external binaries; use `git grep` for search). Every tool accepts one or several repository paths. Tools, by priority:
MUST:
- find_candidates(repoPaths[], keywords[], patterns[]): keywords and regex patterns (e.g. SQL dialect functions), returns file:line:snippet per repository
- find_cross_repo_links(repoPaths[]): matches providers and consumers across repositories — HTTP routes vs client calls (e.g. "/api/shipping" defined in one repo, fetched in another), shared package names, shared database tables, event/queue topic names
- simulate_change(repoPath, patch, testCode): in a temporary git worktree, runs testCode before and after applying the patch with vitest, returns a before/after result table, always cleaned up (also usable with an empty patch as a simple proof test)
- git_context(repoPath, file, startLine, endLine): git blame/log — commits, authors, dates, messages
- save_impact_report(reportJson): validated by a JSON schema, written to report/data/<ticketId>.json
SHOULD:
- coverage_map(repoPath, files[]): vitest coverage per impacted file/function
The Bob skill will launch one subagent per repository in parallel and read the files returned by the tools to establish evaluation order.

Define TypeScript types ImpactItem (kind: business_rule | technical_dependency | config | entry_point | cross_repo_link | test, with evidence), SimulationResult and ImpactReport. Save the design to docs/DESIGN.md. Do not implement yet.
```

**Follow-up: our answers to Bob's 4 review questions**
```
Answers:
1) Yes, use os.tmpdir() — we are on Windows. Also link the original repo's node_modules into the worktree (fs.symlink type "junction") so vitest can run.
2) Yes, scope the DB/table scan to .ts, .js and .sql files, and only match SQL keywords inside string literals.
3) Yes, run full coverage and filter the output to the requested files.
4) Put it at .bob/skills/impact-brief/SKILL.md so Bob auto-discovers it. A custom mode "rulescope" and mode rules will also be created in .bob/ later.

Also apply these changes to DESIGN.md and rulescope-mcp-plan.md:
- report/data/ must NOT be git-ignored (reports are committed and served by the static page); remove that step from Sub-Task 5.
- Sub-Task 4 must include at least one REAL integration test on a small fixture repo, not only mocks.
- find_cross_repo_links detects router.get("/api/...") providers and fetch("/api/...") or fetch(`${host}/api/...`) consumers; it is called ONCE by the root agent, not by each subagent.
- Sanitize ticketId before using it as a file name.
- report/index.html is built by my teammate: remove it from Sub-Task 6 (Sub-Task 6 = Bob skill only).
Update both files, then stop.
```

**Result:** Bob wrote `docs/DESIGN.md` and a 6-step plan, `rulescope-mcp-plan.md`. Every later task follows this plan.

---

## Melina, task 02: MCP server core (Agent mode)

**Prompt**
```
Implement Sub-Tasks 1, 2 and 3 of @rulescope-mcp-plan.md in order, following @docs/DESIGN.md.

Important for all fixture repositories (here and in Sub-Task 4): do NOT commit nested git repositories. Instead, create a test helper (e.g. rulescope-mcp/test/helpers/makeFixtureRepo.ts) that, at test time, creates a fresh git repository in os.tmpdir() from plain template files stored in rulescope-mcp/test/fixtures/<name>/ (git init, set a local user.name/user.email, add, commit), and deletes it after the test. Update the plan to reflect this.

For Sub-Task 3, use two templates: one providing router.get("/api/shipping", ...), one calling fetch("/api/shipping").
Must work on Windows. Run tsc --noEmit and the tests after each sub-task and update the plan's status checkboxes.
```

**Correction 1.** Windows Application Control blocked Rollup's native binary, and Bob kept trying workarounds. We stopped it, fixed the setup ourselves, then sent:
```
Fixed: Windows application control was blocking rollup's native binary. package.json now uses "overrides": { "rollup": "npm:@rollup/wasm-node@^4" } with vitest ^3.2.4. All 13 tests pass (findCandidates + gitContext). Do NOT change the vitest or rollup setup. Mark Sub-Task 2 as done in the plan, then implement Sub-Task 3 (find_cross_repo_links) with its tests, and run all tests.
```

**Correction 2.** Bob started debugging an edge case that is out of scope:
```
Stop debugging the db_table cross-repo test. This edge case (two identical repos both defining and reading the same table) is out of scope for the prototype. Remove the debug trace, mark that single test as `it.skip` with a comment "known limitation: symmetric db_table pairing", keep all other tests green, mark Sub-Task 3 as done in the plan, and run all tests once.
```

**Result:** the task hit Bob's 100-action limit, which is why the screenshot shows a red status. We applied the `it.skip` by hand. Final state: 24 tests passing, 1 skipped as a known limitation.

**Lesson:** after this task, every prompt tells Bob to stop and report after the same error happens twice.

---

## Melina, task 03: Before/after simulation (Agent mode)

**Prompt**
```
Implement Sub-Task 4 (simulate_change) of @rulescope-mcp-plan.md, following @docs/DESIGN.md. Sub-Tasks 1-3 are done (24 tests passing).

Environment constraints — read carefully:
- We are on Windows with PowerShell. Never use bash syntax (no heredocs "<< EOF", no "rm -rf"). Put any diagnostic code in a temporary .ts file instead.
- Do NOT change the vitest/rollup setup in package.json ("overrides" rollup → @rollup/wasm-node is required by Windows application control).
- If the same error happens twice, STOP and report it to me instead of trying workarounds.

Implementation notes:
- For the integration test, create the fixture repo with the existing makeFixtureRepo helper, then create a junction from rulescope-mcp/node_modules into the fixture repo (fs.symlink type "junction") so vitest runs there; simulate_change itself links the analyzed repo's node_modules into its temporary worktree.
- Keep git worktree cleanup in try/finally and also run "git worktree prune" after removal.

Run tsc --noEmit and all tests, then mark Sub-Task 4 done in the plan.
```

**Correction 1: fixture layout**
```
Correction: sim-fixture must be plain template files in test/fixtures/sim-fixture/ with NO .git folder. The integration test creates the repo at runtime with the existing makeFixtureRepo helper. Never run "git init" inside our project folder.
```
We also added this item to Bob's to-do list: `Create test/fixtures/sim-fixture/ template files only (NO .git folder); the integration test turns it into a repo at runtime with makeFixtureRepo`

**Correction 2: read vitest's JSON output instead of its internals**
```
No need to inspect vitest internals. The vitest JSON reporter (--reporter=json) output is Jest-compatible:
{ "numTotalTests", "numPassedTests", "numFailedTests", "success",
  "testResults": [ { "name": "<file path>", "status": "passed"|"failed",
    "assertionResults": [ { "title": "<test name>", "fullName": "...", "status": "passed"|"failed"|"skipped", "failureMessages": ["..."] } ] } ] }
Map each assertionResult to a SimulationRow: input = title, before/after = status + first failureMessage line. Use --outputFile=<tmp json file> to avoid mixing with console output. Continue implementing runVitest.ts.
```

**Correction 3: Windows line endings and npx**
```
Tip for the patch errors (Windows): in makeFixtureRepo and in the simulate_change worktree, run "git config core.autocrlf false" before committing/applying, and always apply patches with "git apply --recount --ignore-whitespace" (--recount fixes wrong hunk line counts, which LLM-generated patches often have). Make sure the patch string ends with a newline. Apply this in simulateChange itself, not only in the test.
Also, to avoid npx/.cmd and shell quoting issues on Windows, run vitest directly with node: spawnSync(process.execPath, [join(repoPath, "node_modules", "vitest", "vitest.mjs"), "run", ...args]) instead of spawning "npx".
```

**Correction 4: a real bug we diagnosed together.** Cleaning up the worktree deleted files through the `node_modules` link.
```
Status: "node node_modules/typescript/bin/tsc --noEmit" passes with 0 errors — your code compiles. The tsc "failures" were NOT type errors: node_modules/.bin had been DELETED, most likely by the worktree cleanup deleting through the node_modules junction on Windows. I ran npm install to restore it.
Fix now: in cleanup, ALWAYS remove the node_modules junction first with fs.unlinkSync(junctionPath) (never rm/rmSync recursive on a junction), THEN run git worktree remove --force and git worktree prune. Same for the junction created inside the fixture repo in the integration test, before removing the fixture repo. Add a test asserting that the original node_modules/.bin still exists after simulateChange.
To run tools, use "node node_modules/typescript/bin/tsc --noEmit" and "node node_modules/vitest/vitest.mjs run" (no npx). Run both once and report.
```

**Correction 5: design change.** We replaced diff patches with search/replace edits.
```
Stop debugging git apply. Change of design, simpler and more robust for LLM-generated changes: simulate_change takes "edits": Array<{ file: string; search: string; replace: string }> instead of a unified diff patch. In the worktree, for each edit: read the file, require that "search" occurs exactly once (otherwise return a clear error listing the file), replace it, write the file. Remove git apply entirely. Update DESIGN.md §5.3 and the SimulationResult type accordingly (store the edits instead of the patch), update the integration test (edit: src/pricing.ts "price * 1.1" → "price * 1.2"), keep the junction-unlink cleanup and the node_modules/.bin survival assertion. Then run tsc and all tests once with node (no npx) and report.
```

**Result:** 38 tests passing, 1 skipped, and all 9 to-do items complete. Bob's model patches often had wrong line counts, which made `git apply` fail. Search/replace edits avoid that, which makes the simulation more reliable than diff patches.

---

## Melina, task 04: Saving reports and measuring coverage (Agent mode)

**Prompt**
```
Implement Sub-Task 5 of @rulescope-mcp-plan.md (save_impact_report + coverage_map), following @docs/DESIGN.md. Sub-Tasks 1-4 are done (38 tests passing).

Environment constraints: Windows + PowerShell, no bash syntax. Do NOT change the vitest/rollup setup. Run tools with node, not npx: "node node_modules/typescript/bin/tsc --noEmit" and "node node_modules/vitest/vitest.mjs run". For coverage_map, run vitest the same way (node <repo>/node_modules/vitest/vitest.mjs run --coverage ...), write coverage JSON to a temp folder, and never delete anything inside node_modules. If the same error happens twice, stop and report.

save_impact_report writes to report/data/ at the ROOT of our repository (resolve it from the MCP server location, not from the analyzed repo). Run tsc and all tests once, then mark Sub-Task 5 done.
```

**Result:** 55 tests passing and a clean type check. It took one prompt and no corrections, because the constraints were stated up front.

---

## Configuration we wrote by hand (no prompt)

The Bob files that turn the MCP server into RuleScope were written by hand and committed. They don't appear in the screenshots:
- **Custom mode 🔎 RuleScope**, created in Bob's Settings → Modes (slug `rulescope`). It is allowed to use subagents (Explore, General), MCP, skills and to-do lists.
- **Mode rules** in `.bob/rules-rulescope/evidence.md`. Every claim needs file:line evidence from a tool. The mode never edits application code without approval, always lists what is *not* affected, and masks personal data.
- **Skill** in `.bob/skills/impact-brief/SKILL.md`. It is a 6-step procedure: understand the request, find cross-repository links, run one subagent per repository in parallel, merge, prove with a simulation, then save and present.
- **`AGENTS.md`**, which describes the project and the Windows environment.
- **MCP server registration** in `.bob/mcp.json`. This file is git-ignored because it contains a local path.

---

## Lisa, task 01: NovaBank demo repositories (Agent mode)

**Prompt**
```
Create demo/build-demo.ps1 (PowerShell, Windows) that generates TWO separate git repositories under demo-workspace/ (already in .gitignore), each built through ~10 commits with realistic messages, dates spread over two years (GIT_AUTHOR_DATE / GIT_COMMITTER_DATE) and different author names (git -c user.name=... -c user.email=...), simulating "NovaBank", an online bank.

1) demo-workspace/novabank-api (TypeScript, Node 20, vitest):
- src/api/routes.ts: a tiny router (no Express) with router.post("/api/transfers", ...), router.get("/api/limits", ...), router.get("/api/accounts/:id", ...)
- src/customers/: customers with tier "STANDARD" | "PREMIUM", email, phone, IBAN
- src/transfers/limits.ts: DAILY_LIMIT = 1000 for everyone, computed per CALENDAR DAY (Europe/Paris)
- src/transfers/transferService.ts: executes a transfer: checks limits.ts, then fraud rules, then records it
- src/fraud/rules.ts: any transfer above 2000 is blocked with status "PENDING_REVIEW" (commit: "Block transfers above 2000 pending manual review - fraud incident FR-2024-17")
- src/compliance/amlReport.ts: nightly job reporting transfers >= 3000 over a ROLLING 24-hour window, with its own constant and SQLite-specific SQL using strftime (commit: "AML nightly report - regulatory requirement COMP-7")
- src/cards/cardLimits.ts: CARD_LIMIT = 1000 for card payments (unrelated to transfers)
- src/notifications/templates.ts: hardcoded text "Your daily transfer limit is €1,000"
- src/logging/logger.ts: logs customer email and IBAN on every transfer
- src/retention/policy.ts: "keep transaction history for 10 years - AML obligation COMP-3"
- src/db/: data layer behind a db.query(sql, params) interface with SQLite-specific SQL scattered in 3 files ("INSERT OR REPLACE", "datetime('now')", "AUTOINCREMENT"). Tests use an in-memory fake of db.query (no native modules).
- tests covering only part of the code (leave compliance/, logging/ and notifications/ untested)

2) demo-workspace/novabank-mobile (TypeScript, vitest):
- src/services/api.ts: fetch("/api/transfers", ...), fetch("/api/limits"), fetch("/api/accounts/" + id)
- src/transfers/validateTransfer.ts: the app re-checks the limit itself: amount > 1000 → error "Daily limit exceeded" before calling the API (commit: "Client-side limit check to save API calls")
- src/screens/TransferScreen.ts: hardcoded label "Daily limit: €1,000"
- src/analytics/events.ts: sends the user's email and IBAN in analytics events
- src/config.ts: hardcoded host "http://10.0.3.12:8080"
- validateTransfer.ts left untested

All tests must pass in both repos. Do not mention premium limits, GDPR, PostgreSQL or any ticket anywhere in the code or commit messages. Print "Demo repos ready" at the end.
```

**Result:** running `build-demo.ps1` rebuilds both repositories from scratch, including their git history. The API repository has 17 passing tests and the mobile repository has 7. All data is synthetic. The code contains no hint of the tickets, so RuleScope cannot "cheat".

---

## Lisa, task 02: Report web page, first version (Agent mode)

**Prompt**
```
Using @docs/DESIGN.md (ImpactReport type), create report/index.html: a single static HTML page (vanilla JavaScript, no build step, no framework) that loads report/data/<ticketId>.json via ?report=<ticketId>, with a ticket selector. Sections as collapsible panels: request + open questions; entry points across repositories; files to CHANGE / CHECK / NOT affected grouped by repository; cross-repository links (provider → consumer); impacted items with evidence (file:line); "Simulation" before/after table per sample input with ✅/❌ (show the search/replace edits that were simulated); git history (why/who); coverage gaps; risk & effort; safe change plan; metrics bar (manual vs RuleScope time, items found, false alarms). Include report/data/sample.json with a realistic NovaBank example (Premium transfer limit ticket) so it works in demo mode with no backend and no API keys. Professional, clean design suited to a banking context.
```

**Result:** a working `report/index.html` with 10 sections, driven by the JSON reports. Melina's task 08 later redesigned it.

---

## Lisa, task 03: Fixes found by running RuleScope on NovaBank (Agent mode)

The first real run (Melina, task 05) exposed three problems in the engine. Lisa fixed them in one task.

**Prompt (fixes 1 and 2)**
```
Two fixes.

FIX 1 — Improve HTTP route detection in rulescope-mcp/src/tools/findCrossRepoLinks.ts. It only detects router.get/post(...), but real projects use many styles, e.g. addRoute("POST", "/api/transfers", handler), app.post(...), server.route(...).
1) Providers: any string literal starting with "/api/" in .ts/.js files that is NOT part of a fetch/axios call is a provider route candidate (keep router.* detection too).
2) Consumers: fetch/axios calls whose URL contains "/api/", including template literals like `${API_HOST}/api/transfers` and concatenation like `${API_HOST}/api/accounts/` + id.
3) Normalize before matching: drop any host prefix; treat ":param" segments, "${...}" segments and a trailing " + variable" as a wildcard segment, so "/api/accounts/:id" matches "/api/accounts/" + id.
4) Add fixture templates and tests for: addRoute("POST", "/api/transfers") ↔ fetch(`${API_HOST}/api/transfers`), and "/api/accounts/:id" ↔ `${API_HOST}/api/accounts/` + id. Keep all existing tests green.

FIX 2 — In demo/build-demo.ps1, add "@vitest/coverage-v8" as a devDependency of BOTH demo repos, with the same version as their vitest (vitest 1.6.1 → @vitest/coverage-v8@1.6.1), so the coverage_map tool works on the NovaBank repos.

Environment: Windows + PowerShell, no bash syntax. Do NOT change the vitest/rollup setup of rulescope-mcp. Run tools with node, not npx: "node node_modules/typescript/bin/tsc --noEmit" and "node node_modules/vitest/vitest.mjs run". If the same error happens twice, stop and report. Finally rebuild rulescope-mcp with "node node_modules/typescript/bin/tsc", then regenerate the demo with "powershell -ExecutionPolicy Bypass -File .\demo\build-demo.ps1".
```
**Intermediate result:** while fixing these, Bob found and fixed a bug of its own. Windows line endings (`\r`) were breaking the parsing of `git grep` output, and 10 tests failed on Lisa's machine because of it. After the fix, 57 of 57 tests passed.

**Prompt (fix 3)**
```
FIX 3 — simulate_change: the simulation test file is ignored when the analyzed project's vitest config restricts "include" (e.g. NovaBank only includes tests/**/*.test.ts). In the temporary worktree, write an extra config file "vitest.rulescope.config.mjs" that, if the project has a vitest.config.(ts|mts|js|mjs), imports it and uses mergeConfig from "vitest/config" to override test.include with ["__rulescope_sim__.test.ts"] (otherwise export { test: { include: ["__rulescope_sim__.test.ts"] } }), and run vitest with "--config vitest.rulescope.config.mjs". Add an integration test with a fixture whose vitest config has include: ["tests/**/*.test.ts"]. Same environment constraints as before. Rebuild rulescope-mcp at the end.
```
**Result:** 59 tests passing, 1 skipped as a known limitation, with a clean type check and a clean build.

---

## RuleScope runs on the demo tickets (🔎 RuleScope mode)

Every analysis uses the same short prompt. Everything else comes from the custom mode, its rules and the `impact-brief` skill. Only the ticket file and the repository paths change.

### Melina, task 05: T1, the first real run, stopped on purpose
```
Change request: @demo/tickets/T1-premium-transfer-limit.md
Repositories to analyze:
- C:/Users/khett/rulescope/demo-workspace/novabank-api
- C:/Users/khett/rulescope/demo-workspace/novabank-mobile
Produce the Impact Brief.
```
Bob loaded the skill and launched **two subagents in parallel**, one per repository. The run then exposed three engine limitations: no cross-repository links found, no coverage tool installed in the demo repositories, and the simulation test file being ignored. Bob began working around the simulation problem with shell commands, so we stopped it with this message:
```
Stop working around simulate_change: it has a known bug (the simulation test file is not picked up when the project's vitest config restricts "include"), it is being fixed. Do NOT run vitest through commands. Skip Step 5 for now and complete Step 6: call save_impact_report with the full brief (leave "simulations" empty and mention in riskRationale that the simulation is pending), then present the Impact Brief in chat.
```
These findings became Lisa's task 03. Lisa re-ran T1 once the engine was fixed (her task 04).

### Melina, task 06: T4, "Change the transfer button color" (UI-77)
```
Change request: @demo/tickets/T4-transfer-button-color.md
Repositories to analyze:
- C:/Users/khett/rulescope/demo-workspace/novabank-api
- C:/Users/khett/rulescope/demo-workspace/novabank-mobile
Produce the Impact Brief.
```
**Result:** RuleScope reported that no button or colour code exists in the analyzed repositories. It flagged `TransferScreen.ts` as the only related entry point and asked which repository holds the UI, instead of inventing a file to change. This is the "honest negative" case. Report: `report/data/UI-77.json`.

### Melina, task 07: T3, "Migrate from SQLite to PostgreSQL" (TECH-219)
```
Change request: @demo/tickets/T3-migrate-postgres.md
Repositories to analyze:
- C:/Users/khett/rulescope/demo-workspace/novabank-api
- C:/Users/khett/rulescope/demo-workspace/novabank-mobile
Produce the Impact Brief.
```
**Result:**
- It found all 4 affected files. One of them is the hidden nightly AML report (`compliance/amlReport.ts`), which is a regulatory obligation, and its git history names the compliance owner who must sign off.
- It marked the mobile app as not affected.
- The simulation shows the naive change breaking 4 of 5 database calls.

Report: `report/data/TECH-219.json`.

After this run, we added one rule to the skill by hand. Bob had invented the report date, so the skill now tells it to run `Get-Date -Format o` and use the real date.

### Lisa, task 04: T1, "Premium daily transfer limit €5,000" (PROD-482)
```
Change request: @demo/tickets/T1-premium-transfer-limit.md
Repositories to analyze:
- C:/Users/lisak/rulescope/demo-workspace/novabank-api
- C:/Users/lisak/rulescope/demo-workspace/novabank-mobile
Produce the Impact Brief.
```


### Lisa, task 05: T2, a GDPR erasure request given as a PDF (LEGAL-31)
```
Change request: @demo/tickets/T2-gdpr-deletion.pdf
Repositories to analyze:
- C:/Users/lisak/rulescope/demo-workspace/novabank-api
- C:/Users/lisak/rulescope/demo-workspace/novabank-mobile
Produce the Impact Brief.
```


---

## Melina, task 08: Report page redesign (Agent mode)

We designed a static HTML mockup filled with the TECH-219 data (`docs/report-mockup.html`). Bob then implemented the real, data-driven page from it. **The report page was implemented by Bob from a static design mockup we provided as a visual reference.**

**Prompt**
```
Rewrite report/index.html so it looks EXACTLY like the mockup @docs/report-mockup.html (a static design mockup filled with the TECH-219 data). Copy its visual design faithfully: fonts (Fraunces for headings/numbers, Plus Jakarta Sans for text, JetBrains Mono for code), colors (#f5f2ea background, #fffdf7 paper, #14202e ink, #6b6557 muted, #ddd7c9 lines), severity colors (critical #c8272d, high #e8742a, medium #e0a817, low #2e9e6b, unaffected #d9d3c4, "to check" = dashed outline), spacing, square-ish corners, thin rules instead of cards. No emojis, no gradients, no shadows except the ticket's offset shadow, no pill badges.

Keep the same section order:
1. The request (ticket paper card) + "At a glance" (risk, effort, files to change/check, blocked by, scanned)
2. Verdict (one big serif sentence built from the simulation: e.g. "The naive change breaks N of M calls", underlining the most severe consequence in its severity color)
3. "Settle these before you write code" (openQuestions, the ones mentioning compliance/legal/regulatory/blocking flagged red)
4. "Where it lands": an SVG map with one lane per repository (files as blocks colored by severity, dashed = to check, grey = not affected) + the list of files to change with line ranges and what changes, then files to check
5. "The proof": the simulated edits (search → replace shown as a red/green diff on dark background) + before/after table with a colored severity bar per row and the consequence
6. "The safe way through": changePlan as a horizontal timeline; mark a step red "blocking" if it mentions sign-off/compliance/legal
7. Details: entry points, test coverage (say "Not measured" if coverage is empty — never invent numbers), files checked and left alone

It must be a real, data-driven page (vanilla JS, single file, no framework, no build): load report/data/<ticketId>.json via ?report=<ticketId>; top bar lists every report from report/data/index.json ([{ "ticketId", "title", "riskLevel" }]) with a colored dot per risk level, and opens the first one by default. Severity per item: use item.severity ("critical"|"high"|"medium"|"low") when present; otherwise derive it: issues of kind contradiction on regulatory/compliance → critical, files in filesToChange → high, filesToCheck → "to check", filesNotAffected → unaffected. Risk color from riskLevel. Handle missing or empty fields gracefully (hide the section instead of showing "undefined").

Also create report/data/index.json from the existing JSON reports in report/data/ (exclude sample.json and index.json), and delete report/data/sample.json from the ticket list (keep the file).
Windows + PowerShell, no bash syntax. When done, tell me the URL to test with: npx serve report
```

**Correction.** With real data, TECH-219's safe change plan has 8 long steps, and they overflowed the horizontal timeline:
```
Fix the "The safe way through" section in report/index.html: the horizontal timeline breaks with long or many steps (TECH-219 has 8 detailed steps, text overflows and overlaps).
- Render changePlan as a VERTICAL list: one row per step, full width. Left: a 24px circle on a vertical 2px line connecting the steps (red filled circle + "blocking" label for steps mentioning sign-off/compliance/legal). Middle: step number in mono, then the first sentence of "action" as a bold title (max ~90 chars, cut at the first "." or ";"), then the rest of the action as normal text below. Right column (280px): targetFiles as mono chips, and the rationale in muted text.
- Everywhere on the page, prevent overflow of long code/file names: add min-width: 0 on grid/flex children and overflow-wrap: anywhere on mono text.
Keep all other sections and the visual style unchanged. Windows + PowerShell, no bash syntax.
```

---

## What we learned about working with Bob

1. **Plan before Agent.** One cheap Plan task (under 1 Bobcoin) produced the design and a plan with checkboxes that guided every later task.
2. **State the environment in the prompt.** Our costliest tasks (02 and 03) were spent fighting Windows-specific problems. Once the prompts said "PowerShell, no bash, run tools with node, stop after the same error twice", tasks 04 and 03-fixes worked on the first prompt.
3. **Step in with a diagnosis, not "try again".** Our most useful corrections gave Bob the root cause: the deleted `.bin` folder, the vitest JSON format, the `include` restriction.
4. **Run your own product on realistic data.** RuleScope's first real run found three engine bugs that the unit tests had missed.