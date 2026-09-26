# RuleScope — Design Document

> IBM Bob 2.0 Hackathon · TypeScript/JavaScript prototype  
> Status: **Design** (not yet implemented)

---

## 1. Problem Statement

A developer receives a change request (plain text, GitHub issue, or PDF/DOCX spec) for a codebase that may span several connected repositories (e.g. a backend API and a mobile app). Before writing a single line of code they need to know:

- What does the request actually mean, and what is ambiguous?
- Which files across which repositories are affected?
- Which business rules, database calls, config values, or API contracts are impacted?
- What does the code currently do (measured, not guessed)?
- What would the code do after the change (simulated, not guessed)?
- Why does the current code exist (git history)?
- Where are the test gaps?
- How risky and large is the change?
- What is the step-by-step safe change plan?

RuleScope produces an **Impact Brief** that answers every one of those questions with tool evidence, never speculation.

---

## 2. Scope

- **Languages**: TypeScript / JavaScript repositories only (prototype).
- **MCP server name**: `rulescope-mcp`
- **Runtime**: Node 20, official MCP TypeScript SDK, no external binaries.
- **Search**: `git grep` (always available in a git repository).
- **Test runner**: vitest (invoked inside a temporary git worktree for simulations).
- **Output**: streamed to Bob chat AND saved as JSON rendered by `report/`.

---

## 3. Architecture Overview

```
Developer (Bob chat)
        │
        ▼
  Bob skill (orchestrator)
  ┌─────────────────────────────────────────────────────────┐
  │  Spawns one subagent per repository (parallel)          │
  │  Each subagent calls rulescope-mcp tools                │
  │  Merges results → assembles ImpactReport                │
  │  Calls save_impact_report → report/data/<ticketId>.json │
  └─────────────────────────────────────────────────────────┘
        │
        ▼
  rulescope-mcp (MCP server, Node 20)
  ┌─────────────────────────────────────────────────────────┐
  │  find_candidates          (git grep + AST hints)        │
  │  find_cross_repo_links    (route/client/table/event scan)│
  │  simulate_change          (git worktree + vitest)       │
  │  git_context              (git blame + git log)         │
  │  save_impact_report       (schema validation + write)   │
  │  coverage_map             (vitest coverage)             │
  └─────────────────────────────────────────────────────────┘
        │
        ▼
  report/
  ├── data/<ticketId>.json    (machine-readable Impact Brief)
  └── index.html              (static web renderer)
```

---

## 4. TypeScript Types

All types live in `rulescope-mcp/src/types.ts`.

```typescript
// ─── Evidence ────────────────────────────────────────────────────────────────

/** A single piece of tool-produced evidence. Never inferred — always from a tool result. */
export interface Evidence {
  /** Relative file path inside the repository */
  file: string;
  /** 1-based line number */
  line: number;
  /** Short code snippet (the matched line or lines) */
  snippet: string;
  /** Tool that produced this evidence: "git_grep" | "git_blame" | "vitest" | "git_log" */
  tool: "git_grep" | "git_blame" | "vitest" | "git_log";
}

// ─── ImpactItem ──────────────────────────────────────────────────────────────

export type ImpactItemKind =
  | "business_rule"       // A conditional, threshold, or pricing rule
  | "technical_dependency"// A DB call, driver invocation, SQL dialect function
  | "config"              // Env var, hardcoded host, feature flag, connection string
  | "entry_point"         // HTTP route, CLI command, scheduled job, mobile screen
  | "cross_repo_link"     // Provider/consumer pair spanning repositories
  | "test";               // A test that exercises an affected item

export interface ImpactItem {
  id: string;             // Stable slug, e.g. "business_rule:free-shipping-threshold"
  kind: ImpactItemKind;
  label: string;          // Human-readable title
  description: string;    // What it does and how it relates to the change request
  repoPath: string;       // Absolute path to the repository root
  evidence: Evidence[];   // One or more tool-proven references — never empty

  /** For business_rule: evaluation order relative to sibling rules (1-based, null if unknown) */
  evaluationOrder?: number | null;

  /** For cross_repo_link: the paired item id in the other repository */
  linkedItemId?: string | null;

  /** Contradictions or duplicates found for this item */
  issues?: Array<{
    kind: "contradiction" | "duplicate" | "hidden_usage" | "unknown_external_consumer";
    description: string;
    evidence: Evidence[];
  }>;
}

// ─── SimulationResult ────────────────────────────────────────────────────────

export interface SimulationRow {
  input: string;    // Human-readable description of the test input
  before: string;   // Output / assertion result before the patch
  after: string;    // Output / assertion result after the patch
  passed: boolean;  // Whether the test passed after the patch
}

export interface SimulationResult {
  repoPath: string;
  /** The patch that was applied (unified diff), or empty string for a proof-only run */
  patch: string;
  /** The test code that was executed (vitest) */
  testCode: string;
  rows: SimulationRow[];
  /** Raw stdout/stderr from the vitest run, for debugging */
  rawOutput: string;
  /** Absolute path to the temporary worktree (already cleaned up) */
  worktreePath: string;
}

// ─── ImpactReport ────────────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface RepoCoverage {
  repoPath: string;
  /** Coverage percentage per impacted file (0–100) */
  fileCoverage: Record<string, number>;
  /** Coverage percentage per impacted function, keyed "file:functionName" */
  functionCoverage: Record<string, number>;
  /** Files with impacted items that have 0 % coverage */
  uncoveredFiles: string[];
}

export interface ChangePlanStep {
  order: number;
  action: string;         // Imperative sentence: "Replace the SHIPPING_THRESHOLD env var..."
  rationale: string;      // Why this step is needed
  targetFiles: string[];  // Files to modify
  repoPath: string;
}

export interface ImpactReport {
  /** JSON schema identifier — must equal "https://rulescope/impact-report/v1" */
  $schema: "https://rulescope/impact-report/v1";

  ticketId: string;
  title: string;
  /** ISO-8601 timestamp */
  createdAt: string;

  // Section 1 — Request understanding
  requestSummary: string;
  openQuestions: string[];

  // Section 2 — Entry points, per repository
  entryPoints: ImpactItem[];   // kind === "entry_point"

  // Sections 3 + 4 — File triage and impacted items
  repoPaths: string[];
  filesToChange: Record<string, string[]>;   // repoPath → file list
  filesToCheck: Record<string, string[]>;    // repoPath → file list
  filesNotAffected: Record<string, string[]>;// repoPath → file list (sampled)
  items: ImpactItem[];                       // All impacted items (all kinds)

  // Section 5 — Simulation
  simulations: SimulationResult[];

  // Section 6 — Git history (evidence already embedded in ImpactItem.evidence)
  // git_context output is stored inside the relevant ImpactItem evidence array

  // Section 7 — Test coverage
  coverage: RepoCoverage[];

  // Section 8 — Risk and effort
  riskLevel: RiskLevel;
  effortEstimate: string;       // Free text, e.g. "2–3 files, ~50 lines changed"
  riskRationale: string;

  // Section 9 — Change plan
  changePlan: ChangePlanStep[];
}
```

---

## 5. MCP Tool Specifications

All tools are registered with the official MCP TypeScript SDK via `server.registerTool(...)`.

### 5.1 `find_candidates`

```
find_candidates(
  repoPaths: string[],
  keywords: string[],
  patterns: string[]   // regex strings
) → CandidateResult[]
```

**Behaviour**

1. For each `repoPath`, run `git grep -n -E <pattern>` for every pattern and `git grep -n -F <keyword>` for every keyword.
2. De-duplicate overlapping hits at the same `file:line`.
3. Return `{ repoPath, file, line, snippet }` per hit.
4. If `git grep` exits non-zero (not a git repo, no hits), surface a clear error message, do not throw.

**Evidence rule**: every returned item carries `tool: "git_grep"`.

---

### 5.2 `find_cross_repo_links`

```
find_cross_repo_links(
  repoPaths: string[]
) → CrossRepoLink[]
```

**Behaviour**

Called **once by the root agent** (not per-repo subagents) after all per-repo work is done. Scans all repositories and finds matching provider/consumer pairs across three signal types:

| Signal | Provider pattern | Consumer pattern |
|--------|-----------------|-----------------|
| HTTP route | `router.(get\|post\|put\|delete\|patch)\s*\(\s*['"\`]/api/...` in `.ts`/`.js` files | `fetch\(\s*['"\`]/api/...` or `fetch\(\s*\`\$\{[^}]+\}/api/...` in `.ts`/`.js` files in other repos |
| Shared package | `"name"` in `package.json` | `"dependencies"` / `"devDependencies"` in another repo's `package.json` |
| DB table / event topic | SQL keywords (`CREATE TABLE`, `FROM`, `JOIN`, `INSERT INTO`) or `topic:` inside **string literals** in `.ts`, `.js`, `.sql` files only | Same table/topic name in the same file-type scope in another repo |

Returns `CrossRepoLink[]`:
```typescript
interface CrossRepoLink {
  kind: "http_route" | "shared_package" | "db_table" | "event_topic";
  provider: Evidence & { repoPath: string };
  consumer: Evidence & { repoPath: string };
  matchedValue: string;   // e.g. "/api/shipping", "my-shared-lib", "orders"
}
```

If a provider exists but no consumer is found in the analyzed repositories, append a note: `"unknown external consumers — verify with other teams"`.

---

### 5.3 `simulate_change`

```
simulate_change(
  repoPath: string,
  patch: string,      // unified diff; may be empty string for a proof-only run
  testCode: string    // vitest test file content
) → SimulationResult
```

**Behaviour**

1. Create a temporary git worktree: `git worktree add <os.tmpdir()>/rulescope-sim-<uuid> HEAD`.
2. Symlink the original repository's `node_modules` into the worktree using `fs.symlink` with type `"junction"` (Windows-compatible) so that vitest and all project dependencies are immediately available without a separate `npm install`.
3. Write `testCode` to `__rulescope_sim__.test.ts` inside the worktree.
4. Run `npx vitest run __rulescope_sim__.test.ts --reporter=json` → capture `before` result.
5. Apply `patch` via `git apply` (if non-empty).
6. Run vitest again → capture `after` result.
7. Parse both vitest JSON outputs into `SimulationRow[]`.
8. **Always** remove the worktree: `git worktree remove --force <path>` (the junction is removed as part of the worktree directory).
9. Return `SimulationResult`.

Never modifies the real working tree. The real repository is untouched.

---

### 5.4 `git_context`

```
git_context(
  repoPath: string,
  file: string,
  startLine: number,
  endLine: number
) → GitContextResult
```

**Behaviour**

1. Run `git blame -L <startLine>,<endLine> --porcelain <file>` → parse per-line commit hash, author, date, summary.
2. Collect unique commit hashes; for each run `git log -1 --format="%H|%an|%ae|%ai|%s|%b" <hash>`.
3. Return:

```typescript
interface GitContextResult {
  repoPath: string;
  file: string;
  startLine: number;
  endLine: number;
  lines: Array<{
    line: number;
    commitHash: string;
    author: string;
    date: string;       // ISO-8601
    message: string;
  }>;
  commits: Array<{
    hash: string;
    author: string;
    email: string;
    date: string;
    subject: string;
    body: string;
  }>;
}
```

Evidence stored in `ImpactItem.evidence[]` with `tool: "git_blame"` and `tool: "git_log"`.

---

### 5.5 `save_impact_report`

```
save_impact_report(
  reportJson: ImpactReport
) → { path: string }
```

**Behaviour**

1. Validate `reportJson.$schema === "https://rulescope/impact-report/v1"`.
2. Validate required fields: `ticketId`, `createdAt`, `items`, `changePlan`.
3. Sanitize `ticketId` for use as a file name: replace any character that is not alphanumeric, `-`, or `_` with `_`. Reject (error) if the sanitized value is empty.
4. Write to `report/data/<sanitizedTicketId>.json` (create `report/data/` if absent).
5. Return `{ path: "report/data/<sanitizedTicketId>.json" }`.

`report/data/` is committed to the repository — reports are served by the static web page. Do **not** add it to `.gitignore`.

---

### 5.6 `coverage_map` (SHOULD)

```
coverage_map(
  repoPath: string,
  files: string[]
) → RepoCoverage
```

**Behaviour**

1. Run `npx vitest run --coverage --reporter=json` (full suite — vitest does not natively accept a per-file coverage allow-list).
2. Parse the Istanbul/v8 JSON coverage output.
3. Filter the results to only the files listed in the `files` parameter.
4. Extract per-file and per-function coverage percentages for those files.
5. Identify `uncoveredFiles` (0 % line coverage among the impacted set).
6. Return `RepoCoverage`.

---

## 6. Report Web Renderer

`report/index.html` — a single static HTML file (no build step, no framework), **built by the front-end teammate** (not part of the MCP server sub-tasks):

- Reads `report/data/<ticketId>.json` via a URL parameter: `?report=<ticketId>`.
- Renders all nine Impact Brief sections as collapsible panels.
- Highlights the before/after simulation table with pass/fail colours.
- Shows file-change triage (CHANGE / CHECK / NOT AFFECTED) per repository.
- Links every evidence item to `file:line` (displayed as `file:line` text).

---

## 7. Bob Skill Orchestration

The Bob skill (`.bob/skills/impact-brief/SKILL.md`) orchestrates the full workflow:

1. Parse the change request (plain text / issue / PDF / DOCX).
2. Extract keywords and regex patterns from the request.
3. Spawn one Bob subagent **per repository** (parallel) — each subagent calls:
   - `find_candidates` with extracted keywords/patterns
   - `git_context` for each impacted file range returned
   - `coverage_map` for impacted files
4. Root agent (not subagents) calls `find_cross_repo_links` **once** with all repoPaths, after all per-repo subagents complete.
5. Root agent collects all results, assembles `ImpactReport`.
6. Calls `simulate_change` with a proposed patch and test code.
7. Calls `save_impact_report` with the assembled report.
8. Renders the Impact Brief in Bob chat with Markdown.

---

## 8. File Layout

```
rulescope-mcp/
├── package.json          (name: "rulescope-mcp", type: "module", Node 20)
├── tsconfig.json
├── src/
│   ├── index.ts          (MCP server entry point, registers all tools)
│   ├── types.ts          (ImpactItem, SimulationResult, ImpactReport, all subtypes)
│   ├── tools/
│   │   ├── findCandidates.ts
│   │   ├── findCrossRepoLinks.ts
│   │   ├── simulateChange.ts
│   │   ├── gitContext.ts
│   │   ├── saveImpactReport.ts
│   │   └── coverageMap.ts
│   └── utils/
│       ├── runGitGrep.ts     (spawns git grep, parses output)
│       ├── runVitest.ts      (spawns vitest, parses JSON output)
│       └── worktree.ts       (create / remove git worktrees)
report/
├── index.html            (static web renderer — built by front-end teammate)
└── data/                 (generated JSON reports — committed, served by index.html)
docs/
└── DESIGN.md             (this file)
.bob/
└── skills/
    └── impact-brief/
        └── SKILL.md      (Bob skill — orchestration instructions)
```

---

## 9. JSON Schema (abbreviated)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://rulescope/impact-report/v1",
  "type": "object",
  "required": ["$schema", "ticketId", "title", "createdAt", "requestSummary",
               "openQuestions", "entryPoints", "repoPaths",
               "filesToChange", "filesToCheck", "filesNotAffected",
               "items", "simulations", "coverage",
               "riskLevel", "effortEstimate", "riskRationale", "changePlan"],
  "properties": {
    "$schema": { "type": "string", "const": "https://rulescope/impact-report/v1" },
    "ticketId": { "type": "string" },
    "riskLevel": { "type": "string", "enum": ["low", "medium", "high", "critical"] },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "kind", "label", "repoPath", "evidence"],
        "properties": {
          "kind": {
            "type": "string",
            "enum": ["business_rule", "technical_dependency", "config",
                     "entry_point", "cross_repo_link", "test"]
          },
          "evidence": {
            "type": "array",
            "minItems": 1,
            "items": {
              "required": ["file", "line", "snippet", "tool"]
            }
          }
        }
      }
    }
  }
}
```

---

## 10. Evidence Rule (non-negotiable)

Every finding in an `ImpactReport` must satisfy at least one of:

1. **Executable proof**: a vitest run produced the result (cite `SimulationResult`).
2. **Tool citation**: a `git grep`, `git blame`, or `git log` result contains the exact `file:line:snippet`.

If neither is possible (e.g. consumers live outside the analyzed repositories), the item must include an `issues` entry with `kind: "unknown_external_consumer"` and the description `"unknown external consumers — verify with other teams"`.

Guessing or inferring without tool evidence is forbidden.
