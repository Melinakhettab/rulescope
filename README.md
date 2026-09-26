# RuleScope

**Know everything a change request touches before you write a line of code, with proof.**

RuleScope is an IBM Bob 2.0 extension, built by team **Kinetic** (Melina & Lisa) for the IBM Bob hackathon. A developer gets a ticket, maybe plain text, a GitHub issue or a PDF spec, for a codebase spread across several repositories. RuleScope turns it into an **Impact Brief**:

- what the request means, and the questions to settle before coding (with who must sign off);
- every file to **change**, to **check** and **not affected**, per repository;
- the business rules, technical dependencies and cross-repository links involved, including contradictions and hidden duplicates;
- a **simulation** of the naive change in a temporary copy of the code, with a before/after table (the real code is never touched);
- why the current code exists (git history), test-coverage gaps, risk, effort and a step-by-step safe change plan.

The evidence rule: every finding comes from a tool result (`git grep`, `git blame`, a vitest run), never from a guess.

**Live demo:** [rulescope-mu.vercel.app](https://rulescope-mu.vercel.app/?report=PROD-482), the four Impact Briefs from the NovaBank demo. **How we used IBM Bob:** every prompt, task export and screenshot is in [`bob_sessions/`](bob_sessions/PROMPTS.md).

## How it works

```
Change request ──► Bob, in the RuleScope custom mode
                     │  skill "impact-brief": one subagent per repository, in parallel
                     ▼
                   rulescope-mcp (MCP server, TypeScript, Node 20)
                     find_candidates · find_cross_repo_links · git_context
                     simulate_change · coverage_map · save_impact_report
                     ▼
                   report/data/<ticketId>.json  ──►  report/index.html
```

`save_impact_report` refuses inconsistent reports. Every item needs evidence and a severity, the three file lists cannot overlap, and every file in the change plan must be classified. It also records the real size of each repository (`git ls-files`) and stores repository paths relative to the project, so a report reads the same on any machine.

## Repository layout

| Path | What it is |
|---|---|
| `rulescope-mcp/` | The MCP server (6 tools) and its tests |
| `.bob/` | The RuleScope custom mode, its rules (`rules-rulescope/`) and the `impact-brief` skill |
| `report/` | Static report page; one JSON file per analysed ticket in `report/data/` |
| `demo/` | NovaBank demo: `build-demo.ps1` builds two linked repositories, `tickets/` holds 4 change requests, `GROUND_TRUTH.md` lists what a complete brief must find |
| `docs/` | Design document and the report mockup |
| `bob_sessions/` | Every prompt we sent to Bob (`PROMPTS.md`) and the task screenshots |

## Quick start (Windows, PowerShell)

Prerequisites: Node 20+, git, IBM Bob.

```powershell
# 1. Build the demo repositories (novabank-api + novabank-mobile) in demo-workspace/
pwsh -File demo/build-demo.ps1        # or: powershell -File demo/build-demo.ps1

# 2. Build and test the MCP server
cd rulescope-mcp
npm install
npm run build
npm test          # 62 tests pass, 1 skipped (known limitation)
cd ..
```

3. Register the server in `.bob/mcp.json` (git-ignored because it holds a local path):

```json
{
  "mcpServers": {
    "rulescope": {
      "command": "node",
      "args": ["C:/path/to/rulescope/rulescope-mcp/dist/src/index.js"]
    }
  }
}
```

4. In Bob, switch to the **RuleScope** mode and send:

```
Change request: @demo/tickets/T1-premium-transfer-limit.md
Repositories to analyze:
- C:/path/to/rulescope/demo-workspace/novabank-api
- C:/path/to/rulescope/demo-workspace/novabank-mobile
Produce the Impact Brief.
```

5. Open the reports:

```powershell
npx serve report      # then http://localhost:3000/?report=PROD-482
```

## The demo tickets

| Ticket | Request | What RuleScope shows |
|---|---|---|
| **PROD-482** | Raise the Premium daily transfer limit to €5,000 | The limit is duplicated in the mobile app, a fraud rule silently blocks €2,001–5,000, and the naive one-line fix breaks Standard customers and 3 existing tests |
| **LEGAL-31** (PDF) | GDPR right to erasure | PII leaks into logs and an external analytics endpoint; GDPR 30-day erasure collides with 10-year AML retention, so Legal must decide first |
| **TECH-219** | Migrate from SQLite to PostgreSQL | 4 source files depend on SQLite (driver or SQL dialect), including a hidden regulatory AML report whose owner must sign off; the naive fix leaves 4 of 5 database calls broken; the mobile app is correctly marked not affected |
| **UI-77** | Make the Transfer button blue | The honest negative: the analysed repositories contain no UI styling, so RuleScope says so and asks where the button lives instead of inventing a file |

## Reading a report

| Field | Meaning |
|---|---|
| **Files: to change** | Every file that will be edited or created, tests included |
| **Files: to check** | Files that are not edited but must be reviewed (callers, blocking rules) |
| **Scanned** | Total files in the analysed repositories, then how many the analysis classified |
| **Effort** | Time and size only; the page computes the file counts |
| **Risk** | Overall level, then the count of impacted items per severity (critical, high, medium, low) |
| **Blocked by** | The sign-off needed before release, and from whom |

## Security

The repository keeps the hackathon security setup: `.gitignore` and `.bobignore` exclude credentials and live Bob sessions, and `.env.example` is the only env file committed. See [SECURITY.MD](SECURITY.MD).
