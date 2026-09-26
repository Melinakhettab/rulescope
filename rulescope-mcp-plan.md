# RuleScope MCP — Implementation Plan

> Read `docs/DESIGN.md` for the full architecture, all TypeScript types, tool specs, and the evidence rule before starting any sub-task.

---

## Overview

Build the `rulescope-mcp` MCP server and surrounding assets for the RuleScope Impact Brief workflow. The server is written in TypeScript (Node 20, MCP TypeScript SDK, no external binaries). Search uses `git grep`. Simulation uses a temporary git worktree + vitest. Output: JSON saved to `report/data/` (committed, served by the static web page built by a teammate).

Six sub-tasks, designed to be worked in order. Each is self-contained and reviewable before the next begins.

---

## Sub-Task 1 — Project Scaffold

**Status**: [ ] pending

**Intent**  
Create the `rulescope-mcp/` Node 20 TypeScript project with the MCP server skeleton, the shared `types.ts`, and all utility modules stubbed out. No real logic yet — just the project compiles and the MCP server starts.

**Expected Outcomes**
- `rulescope-mcp/package.json` with `name: "rulescope-mcp"`, `type: "module"`, MCP SDK dependency, vitest dev dependency.
- `rulescope-mcp/tsconfig.json` targeting ES2022/Node 20.
- `rulescope-mcp/src/types.ts` — all types from `docs/DESIGN.md §4` exactly as specified.
- `rulescope-mcp/src/index.ts` — MCP server that registers all six tool names (stubs) and starts.
- `rulescope-mcp/src/utils/runGitGrep.ts`, `runVitest.ts`, `worktree.ts` — stub files with exported function signatures and TODO bodies.
- `rulescope-mcp/src/tools/` — six stub tool files, each exporting a typed function.
- `tsc --noEmit` passes with zero errors.

**Todo List**
- [ ] Create `rulescope-mcp/package.json` (MCP SDK + TypeScript + vitest deps)
- [ ] Create `rulescope-mcp/tsconfig.json`
- [ ] Create `rulescope-mcp/src/types.ts` from `docs/DESIGN.md §4`
- [ ] Create `rulescope-mcp/src/utils/runGitGrep.ts` (stub)
- [ ] Create `rulescope-mcp/src/utils/runVitest.ts` (stub)
- [ ] Create `rulescope-mcp/src/utils/worktree.ts` (stub)
- [ ] Create `rulescope-mcp/src/tools/findCandidates.ts` (stub)
- [ ] Create `rulescope-mcp/src/tools/findCrossRepoLinks.ts` (stub)
- [ ] Create `rulescope-mcp/src/tools/simulateChange.ts` (stub)
- [ ] Create `rulescope-mcp/src/tools/gitContext.ts` (stub)
- [ ] Create `rulescope-mcp/src/tools/saveImpactReport.ts` (stub)
- [ ] Create `rulescope-mcp/src/tools/coverageMap.ts` (stub)
- [ ] Create `rulescope-mcp/src/index.ts` registering all tools
- [ ] Verify `tsc --noEmit` passes

**Relevant Context**
- `docs/DESIGN.md §4` — all TypeScript types
- `docs/DESIGN.md §5` — tool signatures and return types
- `docs/DESIGN.md §8` — file layout

---

## Sub-Task 2 — Core Search Tools (`find_candidates` + `git_context`)

**Status**: [ ] pending

**Intent**  
Implement the two tools that produce all file:line evidence for the Impact Brief. These are the most frequently called tools — every other section depends on their output.

**Expected Outcomes**
- `runGitGrep.ts` correctly spawns `git grep -n -F` (keyword) and `git grep -n -E` (pattern), parses `file:line:snippet` output, de-duplicates overlapping hits, returns typed results.
- `findCandidates.ts` calls `runGitGrep` for all keywords and patterns across all repoPaths, returns `CandidateResult[]`.
- `gitContext.ts` correctly spawns `git blame -L --porcelain` and `git log -1 --format=...`, parses both outputs, returns `GitContextResult`.
- All tool errors (non-git dir, no hits) surface as clear error messages, not thrown exceptions.
- Unit tests in `rulescope-mcp/src/tools/__tests__/` covering happy path and error cases.

**Todo List**
- [ ] Implement `runGitGrep.ts` — spawn, parse, de-duplicate
- [ ] Implement `findCandidates.ts`
- [ ] Wire `find_candidates` tool in `index.ts` (replace stub)
- [ ] Implement `gitContext.ts` — git blame parse + git log parse
- [ ] Wire `git_context` tool in `index.ts`
- [ ] Write unit tests for `findCandidates` and `gitContext`
- [ ] `tsc --noEmit` and vitest tests pass

**Relevant Context**
- `docs/DESIGN.md §5.1` — `find_candidates` spec
- `docs/DESIGN.md §5.4` — `git_context` spec
- Evidence rule: every returned item must carry `tool: "git_grep"` / `tool: "git_blame"` / `tool: "git_log"`.

---

## Sub-Task 3 — Cross-Repo Link Detection (`find_cross_repo_links`)

**Status**: [ ] pending

**Intent**
Implement the tool that connects provider/consumer pairs across repositories: HTTP routes vs client calls, shared package names, and shared DB table / event topic names. This tool is called **once by the root agent** (not by per-repo subagents).

**Expected Outcomes**
- `findCrossRepoLinks.ts` scans all repoPaths and produces `CrossRepoLink[]`.
- HTTP route providers: `router.get|post|put|delete|patch` with `/api/...` path literals in `.ts`/`.js` files.
- HTTP consumers: `fetch("/api/...")` or `` fetch(`${host}/api/...`) `` template-literal form in `.ts`/`.js` files in other repos.
- Shared packages: `"name"` in `package.json` vs `dependencies`/`devDependencies` in other repos.
- DB table / event topic: SQL keywords and `topic:` inside string literals in `.ts`, `.js`, `.sql` files only.
- Providers with no matching consumer produce an `issues` entry with `kind: "unknown_external_consumer"`.
- Unit tests covering each signal type, including the missing-consumer case.

**Todo List**
- [ ] Implement HTTP route provider scan (`git grep` restricted to `.ts`/`.js`, matching `/api/` path literals)
- [ ] Implement HTTP consumer scan (`git grep` for `fetch` calls with `/api/...` or `${host}/api/...` in `.ts`/`.js`)
- [ ] Implement shared package scan (`package.json` name vs dependencies in other repos)
- [ ] Implement DB table / event topic scan (string literals only, `.ts`/`.js`/`.sql` files)
- [ ] Pair providers and consumers; flag unmatched providers
- [ ] Wire `find_cross_repo_links` tool in `index.ts`
- [ ] Write unit tests
- [ ] `tsc --noEmit` and vitest tests pass

**Relevant Context**
- `docs/DESIGN.md §5.2` — signal type table and `CrossRepoLink` type
- `docs/DESIGN.md §4` — `ImpactItem.issues` for unknown consumers

---

## Sub-Task 4 — Simulation Engine (`simulate_change`)

**Status**: [x] done

**Intent**
Implement the tool that runs vitest in a temporary git worktree before and after applying a patch, producing a `SimulationResult` with a before/after row table. The real repository is never touched.

**Expected Outcomes**
- `worktree.ts` correctly creates a temporary worktree at `os.tmpdir()/rulescope-sim-<uuid>` (`git worktree add`), symlinks `node_modules` from the original repo via `fs.symlink` type `"junction"`, applies a patch (`git apply`), and removes the worktree unconditionally (`git worktree remove --force`) — even on error.
- `runVitest.ts` runs `npx vitest run --reporter=json`, parses JSON output into `SimulationRow[]`.
- `simulateChange.ts` orchestrates the full flow: create worktree → symlink node_modules → run before → apply patch → run after → remove worktree → return `SimulationResult`.
- An empty patch (proof-only run) is supported: before and after rows are identical.
- The worktree is always cleaned up (try/finally), verified by tests.
- Wire `simulate_change` tool in `index.ts`.
- Unit tests (mocked subprocesses) for happy path, patch failure, and cleanup guarantee.
- At least one **real integration test** using a small fixture repository committed under `rulescope-mcp/fixtures/sim-fixture/` (a minimal git repo with a vitest test and a simple function), proving that the before/after table is correct on a real patch.

**Todo List**
- [x] Create `test/fixtures/sim-fixture/` — plain template files (no `.git`): `package.json`, `vitest.config.ts`, `src/pricing.ts`, `pricing.test.ts`
- [x] Implement `worktree.ts` — create at `os.tmpdir()`, junction `node_modules`, `unlinkSync` junction before removal, `git worktree remove --force` + `git worktree prune`
- [x] Implement `runVitest.ts` — `node <node_modules>/vitest/vitest.mjs run --reporter=json --outputFile=<tmp>`, parse rows
- [x] Implement `simulateChange.ts` — `edits[]` search-replace (exactly-once guard), `try/finally` cleanup
- [x] Wire `simulate_change` tool in `index.ts` (edits schema)
- [x] Write unit tests (mock subprocess) — happy path, proof-only, edits applied, search-not-found, ambiguous-search, merge rows, cleanup guarantee ×2
- [x] Write integration test — real worktree + vitest, before passes/after fails, proof-only, bad-edit cleanup, `node_modules/.bin` survival ×2
- [x] `tsc --noEmit` and all vitest tests pass (38 passed, 1 pre-existing skip)

**Relevant Context**
- `docs/DESIGN.md §5.3` — `simulate_change` spec
- `docs/DESIGN.md §4` — `SimulationResult`, `SimulationRow` types
- Cleanup guarantee is non-negotiable: the tool must always remove the worktree.
- Windows path: use `os.tmpdir()` not `/tmp`.
- Junction symlink avoids a full `npm install` inside the worktree.

---

## Sub-Task 5 — Report Persistence + Coverage (`save_impact_report` + `coverage_map`)

**Status**: [ ] pending

**Intent**  
Implement the tool that validates and saves the `ImpactReport` JSON to disk, and the SHOULD-priority `coverage_map` tool.

**Expected Outcomes**
- `saveImpactReport.ts` validates `$schema`, required fields, and non-empty `evidence` arrays; sanitizes `ticketId` (replace non-alphanumeric/`-`/`_` chars with `_`, reject if empty after sanitizing); writes to `report/data/<sanitizedTicketId>.json` (creates directory if absent); returns `{ path }`.
- `coverageMap.ts` runs full `npx vitest run --coverage --reporter=json`, parses Istanbul/v8 JSON, filters to the requested `files`, returns `RepoCoverage`.
- Both tools wired in `index.ts`.
- Unit tests for validation errors (bad schema, missing fields, unsafe ticketId), sanitization edge cases, and happy-path write.
- `report/data/` is **committed** — do NOT add it to `.gitignore`.

**Todo List**
- [ ] Implement `saveImpactReport.ts` — validate schema + sanitize ticketId + write JSON
- [ ] Implement `coverageMap.ts` — run full vitest coverage, filter output to requested files, return
- [ ] Wire both tools in `index.ts`
- [ ] Write unit tests (including ticketId sanitization edge cases)
- [ ] `tsc --noEmit` and vitest tests pass

**Relevant Context**
- `docs/DESIGN.md §5.5` — `save_impact_report` spec
- `docs/DESIGN.md §5.6` — `coverage_map` spec
- `docs/DESIGN.md §9` — JSON schema (abbreviated) — implement inline validation, no external schema library needed

---

## Sub-Task 6 — Bob Skill

**Status**: [ ] pending

**Intent**
Create the `.bob/skills/impact-brief/SKILL.md` Bob skill that orchestrates the full Impact Brief workflow. `report/index.html` is built by a teammate and is not part of this sub-task.

**Expected Outcomes**
- `.bob/skills/impact-brief/SKILL.md` — Bob skill with correct frontmatter; orchestration steps:
  1. Parse change request → extract keywords/patterns.
  2. Spawn one subagent per repository in parallel; each calls `find_candidates`, `git_context`, `coverage_map`.
  3. Root agent calls `find_cross_repo_links` once with all repoPaths after subagents complete.
  4. Root agent assembles `ImpactReport` from all results.
  5. Calls `simulate_change`.
  6. Calls `save_impact_report`.
  7. Renders the Impact Brief in Bob chat as Markdown.
- Skill enforces the evidence rule: every finding must cite tool output (file:line or vitest result).

**Todo List**
- [ ] Create `.bob/skills/impact-brief/SKILL.md` with correct frontmatter
- [ ] Write skill orchestration steps following `docs/DESIGN.md §7`
- [ ] Ensure `find_cross_repo_links` is called by root agent only, not by subagents
- [ ] Validate skill enforces the evidence rule

**Relevant Context**
- `docs/DESIGN.md §7` — Bob skill orchestration spec
- `docs/DESIGN.md §10` — evidence rule
- Bob skill frontmatter schema: use `create-skill` skill for reference

---

## Implementation Notes

- Work sub-tasks in order; each depends on the previous.
- After each sub-task, run `tsc --noEmit` (and vitest tests where applicable) and confirm passing before marking done and updating this file.
- `simulate_change` is the highest-risk tool: always verify the cleanup guarantee and the integration test on the fixture repo before marking Sub-Task 4 done.
- Use `os.tmpdir()` for all temporary paths — never hard-code `/tmp`.
- `report/data/` is committed to the repository; do not add it to `.gitignore`.
- The evidence rule (`docs/DESIGN.md §10`) must be respected in every tool: no guessing.
