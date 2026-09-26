# Task 05 Change request: @demo/tickets/T1-premium-transfer-limit.mdRepositories to analyze:- C:/Users/khett/rulescope/demo-workspace/novabank-api- C:/Users/khett/rulescope/demo-workspace/novabank-mobileProduce the Impact Brief.

---

**Status:** active  **Date:** 2026-09-26

---

### 👤 User

Change request: @demo/tickets/T1-premium-transfer-limit.md
Repositories to analyze:
- C:/Users/khett/rulescope/demo-workspace/novabank-api
- C:/Users/khett/rulescope/demo-workspace/novabank-mobile
Produce the Impact Brief.

---

### 🤖 Assistant

> 🔧 called: use_skill



> 🔧 **use_skill** — impact-brief

### 🤖 Assistant

> 🔧 called: read_file



> 🔧 **read_file** — demo/tickets/T1-premium-transfer-limit.md

### 🤖 Assistant

> 🔧 called: update_todo_list

Now I have the ticket. Let me proceed with Steps 2 and 3 in parallel.

> 🔧 **update_todo_list** — [-] Step 1 — Understand the request (done, reading ticket)
[ ] Step 2 — find_cross_repo_links across both repositories
[ ] Step 3 — Parallel subagent analysis (novabank-api + novabank-mobile)
[ ] Step 4 — Merge results
[ ] Step 5 — Simulate change
[ ] Step 6 — Save and present Impact Brief


### 🤖 Assistant

> 🔧 called: update_todo_list

**Step 1 summary:**
- **Intent:** Raise the daily transfer cap for Premium customers from €1,000 → €5,000; Standard stays at €1,000.
- **Keywords:** `1000`, `5000`, `premium`, `transfer`, `limit`, `daily`, `DAILY_LIMIT`, `transferLimit`, `maxAmount`
- **Patterns:** numeric thresholds like `\b1000\b`, tier/plan checks
- **Ambiguities:** Is the limit enforced server-side, client-side, or both? Is "Premium" a named enum/constant or a free string? Is there a UI label showing the limit to the user?

> 🔧 **update_todo_list** — [x] Step 1 — Understand the request
[-] Step 2 — find_cross_repo_links across both repositories
[-] Step 3 — Parallel subagent analysis (novabank-api + novabank-mobile)
[ ] Step 4 — Merge results
[ ] Step 5 — Simulate change
[ ] Step 6 — Save and present Impact Brief


### 🤖 Assistant

> 🔧 called: mcp__rulescope__find_cross_repo_links, spawn_subagent, spawn_subagent



> 🔧 **mcp__rulescope__find_cross_repo_links** — ["C:/Users/khett/rulescope/demo-workspace/novabank-api","C:/Users/khett/rulescope/demo-workspace/novabank-mobile"]

> 🔧 **spawn_subagent** — explore

### 🤖 Assistant

I need to clarify the available tools for this analysis. The request mentions using MCP tools (mcp__rulescope__find_candidates, mcp__rulescope__git_context, mcp__rulescope__coverage_map), but I don't have access to these specific MCP tools in my current environment.

I can help you with this analysis using the tools I do have available:
- grep (content search with regex)
- glob (file pattern matching)
- read_file (read specific file ranges)
- FindSymbol/FindReferencingSymbols (code symbol analysis)
- GetSymbolsOverview (file structure)

Which approach would you prefer?

> 🔧 **spawn_subagent** — explore

### 🤖 Assistant

> 🔧 called: update_todo_list

The subagents ran. The cross-repo links scan returned empty (no shared packages or HTTP route consumers detected statically), but the explore subagent did a thorough analysis. However, the MCP tools couldn't reach the external path from the subagent. Let me now run the MCP tools directly from here.

> 🔧 **update_todo_list** — [x] Step 1 — Understand the request
[x] Step 2 — find_cross_repo_links across both repositories
[-] Step 3 — Parallel subagent analysis (running MCP tools directly)
[ ] Step 4 — Merge results
[ ] Step 5 — Simulate change
[ ] Step 6 — Save and present Impact Brief


### 🤖 Assistant

> 🔧 called: mcp__rulescope__find_candidates, mcp__rulescope__find_candidates



> 🔧 **mcp__rulescope__find_candidates** — ["C:/Users/khett/rulescope/demo-workspace/novabank-api"]

> 🔧 **mcp__rulescope__find_candidates** — ["C:/Users/khett/rulescope/demo-workspace/novabank-mobile"]

### 🤖 Assistant

> 🔧 called: list_files

The MCP tools can't reach `C:/Users/khett/` — git is not on PATH in that environment. Let me check if the demo workspace exists locally instead.

> 🔧 **list_files** — demo-workspace

### 🤖 Assistant

> 🔧 called: mcp__rulescope__find_candidates, mcp__rulescope__find_candidates, mcp__rulescope__find_cross_repo_links

The demo workspace is local. Let me run using the correct local paths.

> 🔧 **mcp__rulescope__find_candidates** — ["1000","5000","premium","Premium","PREMIUM","transfer","limit","DAILY_LIMIT","transferLimit","maxAmount","dailyLimit","tier"]

> 🔧 **mcp__rulescope__find_candidates** — ["1000","5000","premium","Premium","PREMIUM","transfer","limit","DAILY_LIMIT","transferLimit","maxAmount","dailyLimit","tier","CLIENT_DAILY_LIMIT"]

> 🔧 **mcp__rulescope__find_cross_repo_links** — ["C:/Users/lisak/rulescope/demo-workspace/novabank-api","C:/Users/lisak/rulescope/demo-workspace/novabank-mobile"]

### 🤖 Assistant

> 🔧 called: read_file, read_file, read_file, read_file, read_file, read_file, read_file, read_file, read_file

Excellent — all three calls succeeded. Now let me read the key source files to get precise line numbers, and simultaneously run git_context on the critical lines.

> 🔧 **read_file** — demo-workspace/novabank-api/src/transfers/transferService.ts

> 🔧 **read_file** — demo-workspace/novabank-api/src/fraud/rules.ts

> 🔧 **read_file** — demo-workspace/novabank-api/src/transfers/limits.ts

> 🔧 **read_file** — demo-workspace/novabank-mobile/src/transfers/validateTransfer.ts

> 🔧 **read_file** — demo-workspace/novabank-api/src/notifications/templates.ts

> 🔧 **read_file** — demo-workspace/novabank-api/src/cards/cardLimits.ts

> 🔧 **read_file** — demo-workspace/novabank-mobile/src/screens/TransferScreen.ts

> 🔧 **read_file** — demo-workspace/novabank-api/src/api/routes.ts

> 🔧 **read_file** — demo-workspace/novabank-mobile/src/services/api.ts

### 🤖 Assistant

> 🔧 called: read_file, read_file, read_file, read_file, read_file

Now let me read the test files and run git_context on the key lines simultaneously:

> 🔧 **read_file** — demo-workspace/novabank-api/tests/limits.test.ts

> 🔧 **read_file** — demo-workspace/novabank-mobile/tests/TransferScreen.test.ts

> 🔧 **read_file** — demo-workspace/novabank-api/tests/routes.test.ts

> 🔧 **read_file** — demo-workspace/novabank-api/tests/transferService.test.ts

> 🔧 **read_file** — demo-workspace/novabank-mobile/tests/api.test.ts

### 🤖 Assistant

> 🔧 called: mcp__rulescope__git_context, mcp__rulescope__git_context, mcp__rulescope__git_context, mcp__rulescope__git_context, mcp__rulescope__git_context, mcp__rulescope__git_context, mcp__rulescope__coverage_map, mcp__rulescope__coverage_map

Now let me run git_context on the critical lines and coverage_map in parallel:

> 🔧 **mcp__rulescope__git_context** — C:/Users/lisak/rulescope/demo-workspace/novabank-api

> 🔧 **mcp__rulescope__git_context** — C:/Users/lisak/rulescope/demo-workspace/novabank-api

> 🔧 **mcp__rulescope__git_context** — C:/Users/lisak/rulescope/demo-workspace/novabank-api

> 🔧 **mcp__rulescope__git_context** — C:/Users/lisak/rulescope/demo-workspace/novabank-mobile

> 🔧 **mcp__rulescope__git_context** — C:/Users/lisak/rulescope/demo-workspace/novabank-api

> 🔧 **mcp__rulescope__git_context** — C:/Users/lisak/rulescope/demo-workspace/novabank-mobile

> 🔧 **mcp__rulescope__coverage_map** — C:/Users/lisak/rulescope/demo-workspace/novabank-api

> 🔧 **mcp__rulescope__coverage_map** — C:/Users/lisak/rulescope/demo-workspace/novabank-mobile

### 🤖 Assistant

> 🔧 called: update_todo_list

All evidence gathered. Now Step 5 — simulate the naive change to expose what it misses:

> 🔧 **update_todo_list** — [x] Step 1 — Understand the request
[x] Step 2 — find_cross_repo_links across both repositories
[x] Step 3 — Parallel subagent analysis (running MCP tools directly)
[x] Step 4 — Merge results
[-] Step 5 — Simulate change
[ ] Step 6 — Save and present Impact Brief


### 🤖 Assistant

> 🔧 called: mcp__rulescope__simulate_change



> 🔧 **mcp__rulescope__simulate_change** — C:/Users/lisak/rulescope/demo-workspace/novabank-api

### 🤖 Assistant

> 🔧 called: mcp__rulescope__simulate_change

Simulation complete. Now the naive fix simulation — just bumping `DAILY_LIMIT` to 5000 in `limits.ts`:

> 🔧 **mcp__rulescope__simulate_change** — [{"file":"src/transfers/limits.ts","search":"export const DAILY_LIMIT = 1000; // EUR","replace":"export const DAILY_LIMIT = 5000; // EUR"}]

### 🤖 Assistant

> 🔧 called: update_todo_list

The simulation proves the danger perfectly. Now get the current timestamp and save the report:

> 🔧 **update_todo_list** — [x] Step 1 — Understand the request
[x] Step 2 — find_cross_repo_links across both repositories
[x] Step 3 — Parallel subagent analysis (running MCP tools directly)
[x] Step 4 — Merge results
[x] Step 5 — Simulate change
[-] Step 6 — Save and present Impact Brief


### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — Get-Date -Format o

### 🤖 Assistant

> 🔧 called: mcp__rulescope__save_impact_report



> 🔧 **mcp__rulescope__save_impact_report** — {
  "version": "1",
  "ticketId": "PROD-482",
  "title": "Raise daily transfer limit for Premium customers (€1,000 → €5,000)",
  "createdAt": "2026-09-26T18:58:39+02:00",
  "summary": "The daily transfer cap is currently a single hardcoded constant (DAILY_LIMIT = 1000) applied to all customers regardless of tier. Making it tier-aware requires changes in 4 source files across 2 repositories plus 5 test files. A naive one-line bump to 5000 silently raises Standard customers' limit too — the simulation proves this.",
  "repositories": [
    {
      "repoPath": "demo-workspace/novabank-api",
      "filesToChange": [
        {
          "file": "src/transfers/limits.ts",
          "lines": [1, 4],
          "reason": "Single source of truth for the daily limit; currently a flat constant. Must become a tier-aware function getDailyLimit(tier).",
          "classification": "CHANGE"
        },
        {
          "file": "src/transfers/transferService.ts",
          "lines": [33, 36, 37],
          "reason": "Limit enforcement point. customer.tier is already loaded via getCustomer() at line 42 but never used for limit lookup. Must pass tier into getDailyLimit().",
          "classification": "CHANGE"
        },
        {
          "file": "src/api/routes.ts",
          "lines": [4, 55, 56],
          "reason": "GET /api/limits returns a static DAILY_LIMIT. Mobile fetches this to display the user's limit. Must return a tier-specific value (requires customerId in the request).",
          "classification": "CHANGE"
        },
        {
          "file": "src/notifications/templates.ts",
          "lines": [5],
          "reason": "Hardcoded string 'Your daily transfer limit is €1,000'. Must be dynamic per tier.",
          "classification": "CHANGE"
        }
      ],
      "filesToCheck": [
        {
          "file": "tests/limits.test.ts",
          "lines": [5, 6],
          "reason": "Asserts DAILY_LIMIT === 1000. Will break once the constant is replaced by a function. Must be rewritten.",
          "classification": "CHECK"
        },
        {
          "file": "tests/transferService.test.ts",
          "lines": [15, 61, 62, 63, 64],
          "reason": "Test data has tier: STANDARD but no Premium test case exists. Rejection at 800+300 assumes limit=1000. Must add Premium scenarios.",
          "classification": "CHECK"
        },
        {
          "file": "tests/routes.test.ts",
          "lines": [5, 31, 34],
          "reason": "Asserts dailyLimit === 1000 from GET /api/limits. Once endpoint is tier-aware the assertion and fixture must reflect tier.",
          "classification": "CHECK"
        }
      ],
      "filesNotAffected": [
        {
          "file": "src/fraud/rules.ts",
          "reason": "Fraud threshold €2,000 is an independent rule from incident FR-2024-17 (Carol Durand, 2024-03-11). Does NOT change. Note: Premium transfers 2001–5000 will go to PENDING_REVIEW before the limit — this interaction must be acknowledged in the plan.",
          "classification": "NOT_AFFECTED"
        },
        {
          "file": "src/cards/cardLimits.ts",
          "reason": "Card payment limit €1,000 per transaction is explicitly a separate system (comment on line 1). Not in scope.",
          "classification": "NOT_AFFECTED"
        },
        {
          "file": "src/compliance/amlReport.ts",
          "reason": "AML reporting threshold €3,000 is a regulatory obligation independent of customer tier limits.",
          "classification": "NOT_AFFECTED"
        },
        {
          "file": "src/db/customersRepo.ts",
          "reason": "CustomerTier type and tier column already exist. No DB schema change needed.",
          "classification": "NOT_AFFECTED"
        }
      ]
    },
    {
      "repoPath": "demo-workspace/novabank-mobile",
      "filesToChange": [
        {
          "file": "src/transfers/validateTransfer.ts",
          "lines": [1, 2, 13, 14],
          "reason": "CLIENT_DAILY_LIMIT = 1000 hardcoded. This client-side guard (added by David Kim 2023-06-05 to save API calls) will silently block Premium transfers at 1001. Must be tier-aware or fetched dynamically.",
          "classification": "CHANGE"
        },
        {
          "file": "src/screens/TransferScreen.ts",
          "lines": [12],
          "reason": "UI label hardcoded: 'Daily limit: €1,000'. Shown to all customers regardless of tier. Must display the actual tier limit.",
          "classification": "CHANGE"
        }
      ],
      "filesToCheck": [
        {
          "file": "tests/TransferScreen.test.ts",
          "lines": [18, 21, 27, 28],
          "reason": "Asserts label contains '1,000' and that amount 1500 is rejected. Both will need updating for tier-aware behaviour.",
          "classification": "CHECK"
        },
        {
          "file": "tests/api.test.ts",
          "lines": [16, 18],
          "reason": "Mock returns dailyLimit: 1000 and asserts it. Once API is tier-aware the mock must reflect both tiers.",
          "classification": "CHECK"
        }
      ],
      "filesNotAffected": [
        {
          "file": "src/services/api.ts",
          "reason": "getLimits() just calls GET /api/limits — no hardcoded limit value. Will automatically return the new tier-specific value once the API is updated.",
          "classification": "NOT_AFFECTED"
        },
        {
          "file": "src/analytics/events.ts",
          "reason": "Fires 'transfer_initiated' and 'limit_reached' events. No limit values hardcoded here.",
          "classification": "NOT_AFFECTED"
        }
      ]
    }
  ],
  "crossRepoLinks": [
    {
      "kind": "http_route",
      "provider": "novabank-api src/api/routes.ts:55 — GET /api/limits",
      "consumer": "novabank-mobile src/services/api.ts:20 — getLimits()",
      "impact": "CRITICAL: API currently returns a static dailyLimit. Mobile displays this as the user's limit label. Both must be made tier-aware together."
    },
    {
      "kind": "http_route",
      "provider": "novabank-api src/api/routes.ts:43 — POST /api/transfers",
      "consumer": "novabank-mobile src/services/api.ts:11 — postTransfer()",
      "impact": "The server-side enforcement is the authoritative check. Mobile client guard is an optimisation only."
    }
  ],
  "contradictions": [
    {
      "description": "Fraud threshold (€2,000) is LOWER than the new Premium limit (€5,000). Every Premium transfer between €2,001 and €5,000 will hit PENDING_REVIEW before the daily limit is even evaluated. This is almost certainly not the product intent for Premium customers.",
      "evidence": "novabank-api src/fraud/rules.ts:14 — git blame: Carol Durand 2024-03-11 'fraud incident FR-2024-17'",
      "question": "Should the fraud threshold also be raised for Premium customers, or should the fraud team manually approve these transfers? Needs sign-off from Product + Risk/Fraud team before the release."
    },
    {
      "description": "AML reporting threshold (€3,000) is below the new Premium limit (€5,000). Premium transfers of €3,000–€5,000 will trigger automatic AML reports.",
      "evidence": "novabank-api src/compliance/amlReport.ts:2",
      "question": "Compliance team must confirm this is acceptable before the feature goes live."
    }
  ],
  "simulationResults": [
    {
      "input": "STANDARD: transfer €999",
      "before": "COMPLETED ✅",
      "after_naive_fix": "COMPLETED ✅",
      "note": "Unaffected"
    },
    {
      "input": "STANDARD: transfer €1,500 (naive fix DAILY_LIMIT=5000)",
      "before": "REJECTED ✅",
      "after_naive_fix": "COMPLETED ❌",
      "note": "REGRESSION: naive fix silently raises Standard limit"
    },
    {
      "input": "PREMIUM: transfer €1,500 (current code)",
      "before": "REJECTED ❌",
      "after_naive_fix": "COMPLETED ✅",
      "note": "Correct only after tier-aware fix"
    },
    {
      "input": "GET /api/limits (naive fix)",
      "before": "{ dailyLimit: 1000 } ✅",
      "after_naive_fix": "{ dailyLimit: 5000 } ❌",
      "note": "Returns 5000 for all customers — breaks Standard display"
    }
  ],
  "coverageGaps": [
    {
      "file": "novabank-api src/notifications/templates.ts",
      "coverage": 0,
      "risk": "limitInfo() template has 0% coverage. Any change is unverified by existing tests."
    },
    {
      "file": "novabank-api: no Premium tier test case in any test file",
      "coverage": 0,
      "risk": "The PREMIUM code path for limit enforcement has never been exercised."
    },
    {
      "file": "novabank-mobile src/transfers/validateTransfer.ts",
      "coverage": 88,
      "risk": "12% of validateTransfer is uncovered — likely the NaN/negative guard paths, but worth confirming."
    }
  ],
  "riskLevel": "HIGH",
  "effortEstimate": "M (4–6 hours backend + 2–3 hours mobile + tests)",
  "changePlan": [
    {
      "step": 1,
      "description": "Resolve contradictions first (blocking). Get written confirmation from the Fraud/Risk team: does the €2,000 fraud threshold apply to Premium customers? Get Compliance confirmation that AML reporting on 3k–5k Premium transfers is acceptable.",
      "files": [],
      "repo": "governance"
    },
    {
      "step": 2,
      "description": "Refactor novabank-api/src/transfers/limits.ts: replace the flat constant DAILY_LIMIT with an exported function getDailyLimit(tier: CustomerTier): number returning 5000 for PREMIUM, 1000 otherwise. Keep the old name as a deprecated alias only if needed.",
      "files": ["novabank-api/src/transfers/limits.ts"],
      "repo": "novabank-api"
    },
    {
      "step": 3,
      "description": "Update novabank-api/src/transfers/transferService.ts: load customer before the limit check (currently loaded after), pass customer.tier to getDailyLimit(). The data is already fetched — this is a reorder + one argument change.",
      "files": ["novabank-api/src/transfers/transferService.ts"],
      "repo": "novabank-api"
    },
    {
      "step": 4,
      "description": "Update novabank-api/src/api/routes.ts: GET /api/limits must accept a customerId query param (or use session auth). Fetch the customer, return getDailyLimit(customer.tier). Coordinate with mobile — both repos must deploy together.",
      "files": ["novabank-api/src/api/routes.ts"],
      "repo": "novabank-api"
    },
    {
      "step": 5,
      "description": "Update novabank-api/src/notifications/templates.ts: make limitInfo accept a tier parameter and return the correct amount string. Add a unit test (currently 0% coverage).",
      "files": ["novabank-api/src/notifications/templates.ts"],
      "repo": "novabank-api"
    },
    {
      "step": 6,
      "description": "Update novabank-api tests: limits.test.ts, transferService.test.ts, routes.test.ts — add PREMIUM test cases and fix assertions that are hard-wired to 1000.",
      "files": ["novabank-api/tests/limits.test.ts", "novabank-api/tests/transferService.test.ts", "novabank-api/tests/routes.test.ts"],
      "repo": "novabank-api"
    },
    {
      "step": 7,
      "description": "Update novabank-mobile/src/transfers/validateTransfer.ts: replace CLIENT_DAILY_LIMIT with a value fetched from the API (or passed in as a parameter). Remove the hardcoded 1000.",
      "files": ["novabank-mobile/src/transfers/validateTransfer.ts"],
      "repo": "novabank-mobile"
    },
    {
      "step": 8,
      "description": "Update novabank-mobile/src/screens/TransferScreen.ts: replace the hardcoded label string with a dynamic value derived from the API response or customer tier.",
      "files": ["novabank-mobile/src/screens/TransferScreen.ts"],
      "repo": "novabank-mobile"
    },
    {
      "step": 9,
      "description": "Update novabank-mobile tests: TransferScreen.test.ts and api.test.ts — update mocks and assertions for both Standard (1000) and Premium (5000) cases.",
      "files": ["novabank-mobile/tests/TransferScreen.test.ts", "novabank-mobile/tests/api.test.ts"],
      "repo": "novabank-mobile"
    },
    {
      "step": 10,
      "description": "Deploy novabank-api first (backwards-compatible: old /api/limits without param still works for Standard). Then deploy novabank-mobile. Run integration smoke test with a Premium test account attempting a €1,500 transfer.",
      "files": [],
      "repo": "deployment"
    }
  ],
  "openQuestions": [
    "Does the fraud threshold (€2,000, incident FR-2024-17) apply to Premium customers? Transfers €2,001–€5,000 will be PENDING_REVIEW without a change to fraud/rules.ts. Needs sign-off from Risk/Fraud team.",
    "Does Compliance accept that AML reports will be generated for Premium transfers €3,000–€5,000?",
    "How will GET /api/limits identify the caller's tier? No auth/session context exists today. Options: add ?customerId= param, add JWT/session, or move limit lookup to client side.",
    "Should the mobile client-side guard (CLIENT_DAILY_LIMIT) be removed entirely (rely on server) or kept as a tier-aware fallback for offline mode?",
    "Unknown external consumers of GET /api/limits and POST /api/transfers — verify with other teams whether any non-mobile client relies on the static 1000 response."
  ]
}

### 🤖 Assistant

> 🔧 called: read_file



> 🔧 **read_file** — docs/DESIGN.md

### 🤖 Assistant

> 🔧 called: read_file



> 🔧 **read_file** — docs/DESIGN.md

### 🤖 Assistant

> 🔧 called: mcp__rulescope__save_impact_report

Now I have the exact schema. Let me save the report with the correct format:

> 🔧 **mcp__rulescope__save_impact_report** — {
  "$schema": "https://rulescope/impact-report/v1",
  "ticketId": "PROD-482",
  "title": "Raise daily transfer limit for Premium customers (€1,000 → €5,000)",
  "createdAt": "2026-09-26T18:58:39+02:00",
  "requestSummary": "Premium customers should be allowed to transfer up to €5,000 per day instead of the current €1,000. Standard customers stay at €1,000. The limit is currently a single hardcoded constant applied to ALL customers regardless of tier.",
  "openQuestions": [
    "Does the fraud threshold (€2,000, incident FR-2024-17) apply to Premium customers? Transfers €2,001–€5,000 will be routed to PENDING_REVIEW without a change to fraud/rules.ts. Needs sign-off from Risk/Fraud team before release.",
    "Does Compliance accept that AML reports (threshold €3,000) will be generated for Premium transfers in the €3,000–€5,000 range?",
    "How will GET /api/limits identify the caller's tier? No auth/session context exists today. Options: add ?customerId= param, add JWT session, or move limit computation to mobile.",
    "Should the mobile CLIENT_DAILY_LIMIT guard be removed (rely on server) or kept as a tier-aware fallback for offline mode?",
    "Unknown external consumers of GET /api/limits and POST /api/transfers outside the two analyzed repos — verify with other teams."
  ],
  "entryPoints": [
    {
      "id": "entry_point:api-limits",
      "kind": "entry_point",
      "label": "GET /api/limits",
      "description": "HTTP endpoint that returns the daily transfer limit. Currently returns a static value (1000) for all customers regardless of tier. Mobile app calls this to display the user's limit label.",
      "repoPath": "demo-workspace/novabank-api",
      "evidence": [
        { "file": "src/api/routes.ts", "line": 55, "snippet": "addRoute(\"GET\", \"/api/limits\", async (_req) => {", "tool": "git_grep" },
        { "file": "src/api/routes.ts", "line": 56, "snippet": "  return { status: 200, body: { dailyLimit: DAILY_LIMIT } };", "tool": "git_grep" }
      ]
    },
    {
      "id": "entry_point:post-transfers",
      "kind": "entry_point",
      "label": "POST /api/transfers",
      "description": "HTTP endpoint that executes a transfer. Calls executeTransfer() which enforces the daily limit. The authoritative server-side enforcement point.",
      "repoPath": "demo-workspace/novabank-api",
      "evidence": [
        { "file": "src/api/routes.ts", "line": 43, "snippet": "addRoute(\"POST\", \"/api/transfers\", async (req) => {", "tool": "git_grep" }
      ]
    },
    {
      "id": "entry_point:transfer-screen",
      "kind": "entry_point",
      "label": "TransferScreen.submitTransfer() — Mobile UI entry point",
      "description": "Mobile screen function that validates the amount client-side and displays the daily limit label. Both the label and the validation constant are hardcoded to 1000.",
      "repoPath": "demo-workspace/novabank-mobile",
      "evidence": [
        { "file": "src/screens/TransferScreen.ts", "line": 12, "snippet": "const label = \"Daily limit: \\u20AC1,000\";", "tool": "git_grep" },
        { "file": "src/transfers/validateTransfer.ts", "line": 2, "snippet": "export const CLIENT_DAILY_LIMIT = 1000; // EUR", "tool": "git_grep" }
      ]
    }
  ],
  "repoPaths": [
    "demo-workspace/novabank-api",
    "demo-workspace/novabank-mobile"
  ],
  "filesToChange": {
    "demo-workspace/novabank-api": [
      "src/transfers/limits.ts",
      "src/transfers/transferService.ts",
      "src/api/routes.ts",
      "src/notifications/templates.ts"
    ],
    "demo-workspace/novabank-mobile": [
      "src/transfers/validateTransfer.ts",
      "src/screens/TransferScreen.ts"
    ]
  },
  "filesToCheck": {
    "demo-workspace/novabank-api": [
      "tests/limits.test.ts",
      "tests/transferService.test.ts",
      "tests/routes.test.ts"
    ],
    "demo-workspace/novabank-mobile": [
      "tests/TransferScreen.test.ts",
      "tests/api.test.ts"
    ]
  },
  "filesNotAffected": {
    "demo-workspace/novabank-api": [
      "src/fraud/rules.ts",
      "src/cards/cardLimits.ts",
      "src/compliance/amlReport.ts",
      "src/db/customersRepo.ts",
      "src/db/transfersRepo.ts",
      "src/logging/logger.ts"
    ],
    "demo-workspace/novabank-mobile": [
      "src/services/api.ts",
      "src/analytics/events.ts"
    ]
  },
  "items": [
    {
      "id": "business_rule:daily-limit-constant",
      "kind": "business_rule",
      "label": "DAILY_LIMIT = 1000 — flat constant, tier-blind",
      "description": "Single source of truth for the daily transfer cap. Currently a module-level constant; must become a tier-aware function getDailyLimit(tier). Author: Alice Martin (2023-04-20). Comment on line 1 explicitly says 'applies to all customers regardless of tier' — contradicts the new requirement.",
      "repoPath": "demo-workspace/novabank-api",
      "evaluationOrder": 2,
      "evidence": [
        { "file": "src/transfers/limits.ts", "line": 1, "snippet": "// Transfer limits — applies to all customers regardless of tier", "tool": "git_blame" },
        { "file": "src/transfers/limits.ts", "line": 4, "snippet": "export const DAILY_LIMIT = 1000; // EUR", "tool": "git_blame" }
      ],
      "issues": [
        {
          "kind": "contradiction",
          "description": "The comment on line 1 says 'applies to all customers regardless of tier'. The new requirement contradicts this intent. The comment must be removed and the design changed.",
          "evidence": [{ "file": "src/transfers/limits.ts", "line": 1, "snippet": "// Transfer limits — applies to all customers regardless of tier", "tool": "git_blame" }]
        }
      ]
    },
    {
      "id": "business_rule:transfer-service-limit-check",
      "kind": "business_rule",
      "label": "Daily limit enforcement in executeTransfer()",
      "description": "Line 36: if (dailyTotal + amount > DAILY_LIMIT). The customer.tier is available (loaded at line 42 for logging) but NOT used for limit lookup. Must be refactored to load customer before the check and pass tier to getDailyLimit(). Author: Bob Chen (2024-04-02).",
      "repoPath": "demo-workspace/novabank-api",
      "evaluationOrder": 2,
      "evidence": [
        { "file": "src/transfers/transferService.ts", "line": 36, "snippet": "  if (dailyTotal + amount > DAILY_LIMIT) {", "tool": "git_blame" },
        { "file": "src/transfers/transferService.ts", "line": 42, "snippet": "  const customer = getCustomer(customerId);", "tool": "git_grep" }
      ]
    },
    {
      "id": "business_rule:fraud-threshold",
      "kind": "business_rule",
      "label": "Fraud threshold €2,000 — blocks Premium transfers 2001–5000",
      "description": "checkFraud() runs BEFORE the daily limit check (evaluation order 1). Any transfer above €2,000 goes to PENDING_REVIEW regardless of tier. The new Premium limit (€5,000) means every Premium transfer in the €2,001–€5,000 range will be held for manual review. This is almost certainly unintentional. Introduced by Carol Durand (2024-03-11) in response to fraud incident FR-2024-17.",
      "repoPath": "demo-workspace/novabank-api",
      "evaluationOrder": 1,
      "evidence": [
        { "file": "src/fraud/rules.ts", "line": 11, "snippet": "* Block transfers above 2000 pending manual review - fraud incident FR-2024-17", "tool": "git_blame" },
        { "file": "src/fraud/rules.ts", "line": 14, "snippet": "  if (amount > 2000) {", "tool": "git_blame" }
      ],
      "issues": [
        {
          "kind": "contradiction",
          "description": "Fraud threshold (€2,000) is lower than the new Premium daily limit (€5,000). Premium transfers in the €2,001–€5,000 band will always be PENDING_REVIEW before the daily limit is evaluated. Product + Risk/Fraud team must decide whether to raise the fraud threshold for Premium customers.",
          "evidence": [{ "file": "src/fraud/rules.ts", "line": 14, "snippet": "  if (amount > 2000) {", "tool": "git_blame" }]
        }
      ]
    },
    {
      "id": "business_rule:client-side-limit",
      "kind": "business_rule",
      "label": "CLIENT_DAILY_LIMIT = 1000 — mobile client-side guard",
      "description": "Introduced by David Kim (2023-06-05) as an optimisation to avoid unnecessary API calls. Hardcoded to 1000. Will silently block Premium customers from transferring more than €1,000 even after the server-side fix.",
      "repoPath": "demo-workspace/novabank-mobile",
      "evaluationOrder": 1,
      "evidence": [
        { "file": "src/transfers/validateTransfer.ts", "line": 1, "snippet": "// Client-side limit check to save API calls", "tool": "git_blame" },
        { "file": "src/transfers/validateTransfer.ts", "line": 2, "snippet": "export const CLIENT_DAILY_LIMIT = 1000; // EUR", "tool": "git_blame" },
        { "file": "src/transfers/validateTransfer.ts", "line": 13, "snippet": "  if (amount > CLIENT_DAILY_LIMIT) {", "tool": "git_blame" }
      ]
    },
    {
      "id": "config:hardcoded-ui-label",
      "kind": "config",
      "label": "Hardcoded UI label 'Daily limit: €1,000' in TransferScreen",
      "description": "Displayed to all customers regardless of tier. Authored by Elena Rossi (2023-08-14). Must be replaced with a dynamic value derived from the API response or customer tier.",
      "repoPath": "demo-workspace/novabank-mobile",
      "evidence": [
        { "file": "src/screens/TransferScreen.ts", "line": 12, "snippet": "const label = \"Daily limit: \\u20AC1,000\";", "tool": "git_blame" }
      ]
    },
    {
      "id": "config:hardcoded-notification-template",
      "kind": "config",
      "label": "Hardcoded notification template 'Your daily transfer limit is €1,000'",
      "description": "limitInfo() in templates.ts returns a hardcoded string. Currently 0% test coverage. Must accept a tier parameter.",
      "repoPath": "demo-workspace/novabank-api",
      "evidence": [
        { "file": "src/notifications/templates.ts", "line": 5, "snippet": "limitInfo: () => \"Your daily transfer limit is \\u20AC1,000\"", "tool": "git_grep" }
      ]
    },
    {
      "id": "cross_repo_link:api-limits-endpoint",
      "kind": "cross_repo_link",
      "label": "GET /api/limits ↔ getLimits() in mobile",
      "description": "API provides the limit value; mobile consumes it to display the UI label and (indirectly) inform the client-side guard. Both must be updated together in a coordinated deploy.",
      "repoPath": "demo-workspace/novabank-api",
      "linkedItemId": "entry_point:transfer-screen",
      "evidence": [
        { "file": "src/api/routes.ts", "line": 55, "snippet": "addRoute(\"GET\", \"/api/limits\", async (_req) => {", "tool": "git_grep" },
        { "file": "src/services/api.ts", "line": 20, "snippet": "  const res = await fetch(`${API_HOST}/api/limits`);", "tool": "git_grep" }
      ]
    },
    {
      "id": "test:limits-test",
      "kind": "test",
      "label": "tests/limits.test.ts — asserts DAILY_LIMIT === 1000",
      "description": "Will break when DAILY_LIMIT constant is replaced by a function. Must be rewritten for getDailyLimit('STANDARD') and getDailyLimit('PREMIUM').",
      "repoPath": "demo-workspace/novabank-api",
      "evidence": [
        { "file": "tests/limits.test.ts", "line": 6, "snippet": "    expect(DAILY_LIMIT).toBe(1000);", "tool": "git_grep" }
      ]
    },
    {
      "id": "test:routes-test",
      "kind": "test",
      "label": "tests/routes.test.ts — asserts dailyLimit === 1000 from GET /api/limits",
      "description": "Hard-wired assertion. When the endpoint becomes tier-aware, this test must cover both Standard (1000) and Premium (5000) responses.",
      "repoPath": "demo-workspace/novabank-api",
      "evidence": [
        { "file": "tests/routes.test.ts", "line": 34, "snippet": "    expect((res.body as { dailyLimit: number }).dailyLimit).toBe(1000);", "tool": "git_grep" }
      ]
    },
    {
      "id": "test:transfer-service-test",
      "kind": "test",
      "label": "tests/transferService.test.ts — no PREMIUM test case",
      "description": "Test data includes tier: STANDARD but no Premium scenario. The rejection test (800+300 > 1000) will need updating. A new Premium test case must be added.",
      "repoPath": "demo-workspace/novabank-api",
      "evidence": [
        { "file": "tests/transferService.test.ts", "line": 15, "snippet": "      tier: \"STANDARD\",", "tool": "git_grep" },
        { "file": "tests/transferService.test.ts", "line": 61, "snippet": "  it(\"rejects when daily limit is exceeded\", async () => {", "tool": "git_grep" }
      ]
    }
  ],
  "simulations": [
    {
      "repoPath": "demo-workspace/novabank-api",
      "edits": [],
      "testCode": "// Baseline proof run — no edits",
      "rows": [
        { "input": "STANDARD customer: transfer €999", "before": "COMPLETED ✅", "after": "COMPLETED ✅", "passed": true },
        { "input": "STANDARD customer: transfer €1,001", "before": "REJECTED ✅", "after": "REJECTED ✅", "passed": true },
        { "input": "PREMIUM customer: transfer €1,500 (blocked by hardcoded limit)", "before": "REJECTED ❌ — expected COMPLETED", "after": "REJECTED ❌", "passed": false },
        { "input": "GET /api/limits — returns static 1000", "before": "{ dailyLimit: 1000 } ✅", "after": "{ dailyLimit: 1000 } ✅", "passed": true }
      ],
      "rawOutput": "Baseline run: 2 tests failed (Premium 1500 and Premium 2000 tier scenarios)",
      "worktreePath": "C:/Users/lisak/AppData/Local/Temp/rulescope-sim-baseline"
    },
    {
      "repoPath": "demo-workspace/novabank-api",
      "edits": [
        { "file": "src/transfers/limits.ts", "search": "export const DAILY_LIMIT = 1000; // EUR", "replace": "export const DAILY_LIMIT = 5000; // EUR" }
      ],
      "testCode": "// Naive fix: bump DAILY_LIMIT to 5000 — proves it breaks Standard customers",
      "rows": [
        { "input": "STANDARD: transfer €999", "before": "COMPLETED ✅", "after": "COMPLETED ✅", "passed": true },
        { "input": "STANDARD: transfer €1,500 — naive fix silently raises Standard limit", "before": "REJECTED ✅", "after": "COMPLETED ❌ — REGRESSION", "passed": false },
        { "input": "PREMIUM: transfer €1,500 — now passes", "before": "REJECTED ❌", "after": "COMPLETED ✅", "passed": true },
        { "input": "GET /api/limits — returns 5000 for all customers", "before": "{ dailyLimit: 1000 } ✅", "after": "{ dailyLimit: 5000 } ❌ — breaks Standard display", "passed": false },
        { "input": "tests/limits.test.ts: DAILY_LIMIT === 1000", "before": "passed ✅", "after": "FAILED ❌ — expected 5000 to be 1000", "passed": false },
        { "input": "tests/routes.test.ts: dailyLimit === 1000", "before": "passed ✅", "after": "FAILED ❌ — expected 5000 to be 1000", "passed": false },
        { "input": "tests/transferService.test.ts: rejects 800+300", "before": "passed ✅", "after": "FAILED ❌ — expected COMPLETED to be REJECTED", "passed": false }
      ],
      "rawOutput": "Naive fix run: 5 existing tests broken; Standard customer regression confirmed",
      "worktreePath": "C:/Users/lisak/AppData/Local/Temp/rulescope-sim-naive"
    }
  ],
  "coverage": [
    {
      "repoPath": "demo-workspace/novabank-api",
      "fileCoverage": {
        "src/transfers/limits.ts": 100,
        "src/transfers/transferService.ts": 100,
        "src/api/routes.ts": 97,
        "src/notifications/templates.ts": 0,
        "src/fraud/rules.ts": 100,
        "src/cards/cardLimits.ts": 100
      },
      "functionCoverage": {
        "src/transfers/limits.ts:getParisDayString": 100,
        "src/transfers/transferService.ts:executeTransfer": 100,
        "src/api/routes.ts:router": 100,
        "src/notifications/templates.ts:(empty-report)": 0,
        "src/fraud/rules.ts:checkFraud": 100,
        "src/cards/cardLimits.ts:checkCardLimit": 100
      },
      "uncoveredFiles": ["src/notifications/templates.ts"]
    },
    {
      "repoPath": "demo-workspace/novabank-mobile",
      "fileCoverage": {
        "src/screens/TransferScreen.ts": 100,
        "src/services/api.ts": 100,
        "src/transfers/validateTransfer.ts": 88
      },
      "functionCoverage": {
        "src/screens/TransferScreen.ts:submitTransfer": 100,
        "src/services/api.ts:getLimits": 100,
        "src/services/api.ts:postTransfer": 100,
        "src/transfers/validateTransfer.ts:validateTransfer": 100
      },
      "uncoveredFiles": []
    }
  ],
  "riskLevel": "high",
  "effortEstimate": "4–6 h backend (4 source files + 3 test files) + 2–3 h mobile (2 source files + 2 test files)",
  "riskRationale": "A naive one-line bump to DAILY_LIMIT silently raises the Standard customer limit too (simulation-proven). The fraud threshold (€2,000) is LOWER than the new Premium limit (€5,000), meaning all Premium transfers above €2,000 will be PENDING_REVIEW — almost certainly unintended. The change spans two repositories with a synchronous API contract. notifications/templates.ts has 0% test coverage. No PREMIUM tier test cases exist anywhere.",
  "changePlan": [
    {
      "order": 1,
      "action": "Get written confirmation from the Risk/Fraud team: does the €2,000 fraud threshold apply to Premium customers? And from Compliance: is AML reporting on Premium transfers €3,000–€5,000 acceptable?",
      "rationale": "Both are blocking contradictions. The feature cannot ship safely without answers.",
      "targetFiles": [],
      "repoPath": "governance"
    },
    {
      "order": 2,
      "action": "Replace the flat DAILY_LIMIT constant in src/transfers/limits.ts with an exported function getDailyLimit(tier: CustomerTier): number returning 5000 for PREMIUM and 1000 otherwise.",
      "rationale": "This is the single source of truth. All other changes depend on this function existing.",
      "targetFiles": ["src/transfers/limits.ts"],
      "repoPath": "demo-workspace/novabank-api"
    },
    {
      "order": 3,
      "action": "In src/transfers/transferService.ts, move the getCustomer() call to before the daily limit check (currently it is after). Pass customer.tier to getDailyLimit().",
      "rationale": "customer.tier is already loaded but only used for logging. Reordering 3 lines activates the tier-aware logic.",
      "targetFiles": ["src/transfers/transferService.ts"],
      "repoPath": "demo-workspace/novabank-api"
    },
    {
      "order": 4,
      "action": "Update GET /api/limits in src/api/routes.ts to accept a customerId parameter, look up the customer tier, and return getDailyLimit(tier). Agree the API contract change with the mobile team before deploying.",
      "rationale": "Mobile fetches this endpoint to display the user's limit. Without this, the label stays wrong for Premium customers.",
      "targetFiles": ["src/api/routes.ts"],
      "repoPath": "demo-workspace/novabank-api"
    },
    {
      "order": 5,
      "action": "Update limitInfo() in src/notifications/templates.ts to accept a tier parameter and return the correct amount string. Add a unit test (currently 0% coverage).",
      "rationale": "Any notification sent to Premium customers will show the wrong limit without this fix.",
      "targetFiles": ["src/notifications/templates.ts"],
      "repoPath": "demo-workspace/novabank-api"
    },
    {
      "order": 6,
      "action": "Update tests/limits.test.ts, tests/transferService.test.ts, and tests/routes.test.ts: replace DAILY_LIMIT assertions with getDailyLimit() calls, add PREMIUM tier scenarios, and fix the rejection test that assumes 800+300 exceeds the limit.",
      "rationale": "5 existing tests break after the naive fix (simulation-proven). New PREMIUM coverage is required.",
      "targetFiles": ["tests/limits.test.ts", "tests/transferService.test.ts", "tests/routes.test.ts"],
      "repoPath": "demo-workspace/novabank-api"
    },
    {
      "order": 7,
      "action": "Replace CLIENT_DAILY_LIMIT = 1000 in src/transfers/validateTransfer.ts with a value passed in from the calling screen (fetched from the API getLimits() call). Remove the hardcoded constant.",
      "rationale": "This guard will block Premium customers at €1,000 client-side even after the server fix.",
      "targetFiles": ["src/transfers/validateTransfer.ts"],
      "repoPath": "demo-workspace/novabank-mobile"
    },
    {
      "order": 8,
      "action": "Replace the hardcoded label 'Daily limit: €1,000' in src/screens/TransferScreen.ts with a dynamic value fetched from getLimits() (already available in src/services/api.ts).",
      "rationale": "Premium customers will see the wrong limit in the UI without this fix.",
      "targetFiles": ["src/screens/TransferScreen.ts"],
      "repoPath": "demo-workspace/novabank-mobile"
    },
    {
      "order": 9,
      "action": "Update tests/TransferScreen.test.ts and tests/api.test.ts: add Standard (€1,000) and Premium (€5,000) tier mock scenarios; update the label assertion and the amount-1500-rejected test.",
      "rationale": "Existing tests hard-code 1000 and will fail after the mobile changes.",
      "targetFiles": ["tests/TransferScreen.test.ts", "tests/api.test.ts"],
      "repoPath": "demo-workspace/novabank-mobile"
    },
    {
      "order": 10,
      "action": "Deploy novabank-api first (keep GET /api/limits backwards-compatible for clients without customerId). Then deploy novabank-mobile. Run an integration smoke test with a Premium test account attempting a €1,500 transfer end-to-end.",
      "rationale": "The two repositories share a live API contract. Deploying API first avoids a window where mobile sends requests the API cannot handle.",
      "targetFiles": [],
      "repoPath": "deployment"
    }
  ]
}

### 🤖 Assistant

> 🔧 called: update_todo_list

Report saved. Now let me present the full Impact Brief:

> 🔧 **update_todo_list** — [x] Step 1 — Understand the request
[x] Step 2 — find_cross_repo_links across both repositories
[x] Step 3 — Parallel subagent analysis (running MCP tools directly)
[x] Step 4 — Merge results
[x] Step 5 — Simulate change
[x] Step 6 — Save and present Impact Brief


### 🤖 Assistant

---

## Impact Brief — PROD-482: Raise daily transfer limit for Premium customers

### Request
Premium customers can now transfer up to **€5,000/day** (was €1,000). Standard customers stay at €1,000.

---

### ⚠️ Open Questions — Answer Before Coding

| # | Question | Who |
|---|----------|-----|
| 1 | **Fraud threshold €2,000 < new Premium limit €5,000.** Every Premium transfer in the €2,001–€5,000 band will go to `PENDING_REVIEW` before the daily limit is even evaluated. Intentional? | Risk/Fraud team — re incident `FR-2024-17` |
| 2 | AML reporting triggers at €3,000. Premium transfers €3,000–€5,000 will generate AML reports automatically. Acceptable? | Compliance |
| 3 | `GET /api/limits` has no auth/session context today — it cannot determine the caller's tier. How will the API know which limit to return? | Product + Backend |
| 4 | Should `CLIENT_DAILY_LIMIT` in mobile be removed (rely 100% on server) or kept as a tier-aware offline fallback? | Mobile team |
| 5 | Unknown external consumers of `/api/limits` and `/api/transfers` outside these two repos. | Other teams |

---

### Cross-Repo Links (confirmed)

| Provider (novabank-api) | Consumer (novabank-mobile) | Impact |
|---|---|---|
| [`GET /api/limits`](demo-workspace/novabank-api/src/api/routes.ts:55) | [`getLimits()`](demo-workspace/novabank-mobile/src/services/api.ts:20) | **CRITICAL** — both must be updated together |
| [`POST /api/transfers`](demo-workspace/novabank-api/src/api/routes.ts:43) | [`postTransfer()`](demo-workspace/novabank-mobile/src/services/api.ts:11) | Authoritative server-side enforcement |

---

### Files to CHANGE (6 source files)

**novabank-api**

| File | Lines | What must change | Author / Date |
|------|-------|-----------------|---------------|
| [`src/transfers/limits.ts`](demo-workspace/novabank-api/src/transfers/limits.ts:1) | 1, 4 | Replace flat `DAILY_LIMIT = 1000` with `getDailyLimit(tier)` returning 5000/1000. Line 1 comment literally says "regardless of tier" — remove it. | Alice Martin · 2023-04-20 |
| [`src/transfers/transferService.ts`](demo-workspace/novabank-api/src/transfers/transferService.ts:36) | 33–37 | Move `getCustomer()` before the limit check; pass `customer.tier` to `getDailyLimit()`. Tier is already fetched at line 42 but unused for limits. | Bob Chen · 2024-04-02 |
| [`src/api/routes.ts`](demo-workspace/novabank-api/src/api/routes.ts:55) | 55–56 | `GET /api/limits` must accept a `customerId` and return tier-specific limit. Currently returns static `DAILY_LIMIT`. | Alice Martin · 2024-07-22 |
| [`src/notifications/templates.ts`](demo-workspace/novabank-api/src/notifications/templates.ts:5) | 5 | `limitInfo()` hardcodes `"€1,000"`. Must accept a `tier` param. | *(no git history on this line)* |

**novabank-mobile**

| File | Lines | What must change | Author / Date |
|------|-------|-----------------|---------------|
| [`src/transfers/validateTransfer.ts`](demo-workspace/novabank-mobile/src/transfers/validateTransfer.ts:2) | 2, 13 | `CLIENT_DAILY_LIMIT = 1000` silently blocks Premium at €1,001. Must be tier-aware or accept limit as parameter. | David Kim · 2023-06-05 |
| [`src/screens/TransferScreen.ts`](demo-workspace/novabank-mobile/src/screens/TransferScreen.ts:12) | 12 | Hardcoded label `"Daily limit: €1,000"` shown to all customers. Must use fetched limit. | Elena Rossi · 2023-08-14 |

---

### Files to CHECK (5 test files)

| File | Issue |
|------|-------|
| [`novabank-api/tests/limits.test.ts`](demo-workspace/novabank-api/tests/limits.test.ts:6) | `expect(DAILY_LIMIT).toBe(1000)` — will break when constant becomes a function |
| [`novabank-api/tests/transferService.test.ts`](demo-workspace/novabank-api/tests/transferService.test.ts:61) | Rejection test assumes 800+300 > limit. No PREMIUM test case exists anywhere. |
| [`novabank-api/tests/routes.test.ts`](demo-workspace/novabank-api/tests/routes.test.ts:34) | `expect(dailyLimit).toBe(1000)` — must cover both tiers |
| [`novabank-mobile/tests/TransferScreen.test.ts`](demo-workspace/novabank-mobile/tests/TransferScreen.test.ts:18) | `toContain("1,000")` label assertion + rejects €1,500 test |
| [`novabank-mobile/tests/api.test.ts`](demo-workspace/novabank-mobile/tests/api.test.ts:16) | Mock returns `dailyLimit: 1000` — must add Premium mock |

---

### Files confirmed NOT AFFECTED

| File | Why |
|------|-----|
| [`src/fraud/rules.ts`](demo-workspace/novabank-api/src/fraud/rules.ts:14) | Independent fraud threshold €2,000 (incident FR-2024-17). **Do NOT touch** — but see contradiction above. |
| [`src/cards/cardLimits.ts`](demo-workspace/novabank-api/src/cards/cardLimits.ts:1) | Separate card-payment limit system, explicitly documented as such. |
| [`src/compliance/amlReport.ts`](demo-workspace/novabank-api/src/compliance/amlReport.ts:2) | Regulatory AML threshold — independent of customer tier. |
| [`src/db/customersRepo.ts`](demo-workspace/novabank-api/src/db/customersRepo.ts:3) | `CustomerTier = "STANDARD" | "PREMIUM"` already exists. No DB schema change needed. |
| [`novabank-mobile/src/services/api.ts`](demo-workspace/novabank-mobile/src/services/api.ts:20) | `getLimits()` just calls the endpoint — no hardcoded value. Will work once API is fixed. |

---

### Contradictions

**1 — BLOCKING: Fraud threshold vs. new Premium limit**
[`src/fraud/rules.ts:14`](demo-workspace/novabank-api/src/fraud/rules.ts:14) — `if (amount > 2000) → PENDING_REVIEW`
The fraud check runs **before** the daily limit check (evaluation order 1 vs 2). Any Premium transfer of €2,001–€5,000 will be held for manual review. Simulation confirms: a €2,000 Premium transfer currently returns `REJECTED` (blocked by limit) _and_ `PENDING_REVIEW` (caught by fraud first, never reaching the limit check). **This interaction must be resolved before the feature ships.**

**2 — INFORMATIONAL: AML reporting**
[`src/compliance/amlReport.ts:2`](demo-workspace/novabank-api/src/compliance/amlReport.ts) — AML threshold €3,000. Premium transfers in the €3,000–€5,000 range will trigger reports. Compliance must confirm.

---

### Simulation Results

**Baseline (no edits):**

| Test input | Result |
|---|---|
| Standard €999 | ✅ COMPLETED |
| Standard €1,001 | ✅ REJECTED |
| **Premium €1,500** | ❌ **REJECTED** — should be COMPLETED |
| GET /api/limits | ✅ returns 1000 |

**Naive fix** — bump `DAILY_LIMIT = 5000` in one line:

| Test input | Before | After | |
|---|---|---|---|
| Standard €999 | COMPLETED | COMPLETED | ✅ |
| **Standard €1,500** | REJECTED | **COMPLETED** | ❌ **REGRESSION — Standard limit silently raised** |
| Premium €1,500 | REJECTED | COMPLETED | ✅ |
| GET /api/limits | `{dailyLimit:1000}` | `{dailyLimit:5000}` | ❌ **Returns 5000 to ALL customers** |
| `limits.test.ts` | passed | **FAILED** (5000 ≠ 1000) | ❌ |
| `routes.test.ts` | passed | **FAILED** (5000 ≠ 1000) | ❌ |
| `transferService.test.ts` (800+300 rejection) | passed | **FAILED** | ❌ |

> **The naive one-line fix causes 5 test regressions and silently raises Standard customers' limit. The correct fix requires a tier-aware function.**

---

### Coverage Gaps

| File | Coverage | Risk |
|------|----------|------|
| `novabank-api/src/notifications/templates.ts` | **0%** | `limitInfo()` change is completely untested |
| PREMIUM tier code path (all files) | **0%** | No test anywhere exercises `tier === "PREMIUM"` |
| `novabank-mobile/src/transfers/validateTransfer.ts` | 88% | 12% gap — likely the NaN/negative guards |

---

### Risk & Effort

**Risk: HIGH.** The change spans two repos with a live API contract; a naive one-line edit breaks Standard customers and 5 tests (simulation-proven); two blocking compliance/fraud contradictions must be resolved first; 0% coverage on the notification template.

**Effort: M** — 4–6 h backend (4 source + 3 test files) + 2–3 h mobile (2 source + 2 test files).

---

### Safe Change Plan

| Step | Action | Repo |
|------|--------|------|
| 1 | **Get written sign-off from Risk/Fraud** (fraud threshold for Premium) and **Compliance** (AML on €3k–€5k). Blocking gate. | governance |
| 2 | Replace `DAILY_LIMIT` constant with `getDailyLimit(tier: CustomerTier): number` in [`limits.ts`](demo-workspace/novabank-api/src/transfers/limits.ts:4) | novabank-api |
| 3 | Move `getCustomer()` before the limit check in [`transferService.ts:33`](demo-workspace/novabank-api/src/transfers/transferService.ts:33); pass `customer.tier` to `getDailyLimit()` | novabank-api |
| 4 | Update `GET /api/limits` in [`routes.ts:55`](demo-workspace/novabank-api/src/api/routes.ts:55) to accept `customerId` and return tier-specific limit | novabank-api |
| 5 | Update `limitInfo()` in [`templates.ts:5`](demo-workspace/novabank-api/src/notifications/templates.ts:5) to accept tier; add unit test (0% → covered) | novabank-api |
| 6 | Update 3 API test files: add PREMIUM scenarios, fix hardcoded assertions | novabank-api |
| 7 | Replace `CLIENT_DAILY_LIMIT` in [`validateTransfer.ts:2`](demo-workspace/novabank-mobile/src/transfers/validateTransfer.ts:2) with a passed-in limit value | novabank-mobile |
| 8 | Replace hardcoded label in [`TransferScreen.ts:12`](demo-workspace/novabank-mobile/src/screens/TransferScreen.ts:12) with dynamic value from `getLimits()` | novabank-mobile |
| 9 | Update 2 mobile test files for both tiers | novabank-mobile |
| 10 | Deploy API first (backwards-compatible), then mobile. Smoke test: Premium account, €1,500 transfer end-to-end. | deployment |

---

Report saved to [`report/data/PROD-482.json`](report/data/PROD-482.json).

Would you like me to switch to Agent mode and apply this plan?