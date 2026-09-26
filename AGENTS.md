# RuleScope — project context for agents

RuleScope is an IBM Bob 2.0 hackathon project (team Kinetic). It helps developers understand the full impact of a change request BEFORE coding, with evidence instead of guesses.

## Structure
- rulescope-mcp/ — TypeScript MCP server (tools: find_candidates, find_cross_repo_links, simulate_change, git_context, coverage_map, save_impact_report). Design: docs/DESIGN.md.
- .bob/ — custom mode "rulescope", its rules (rules-rulescope/) and the "impact-brief" skill.
- report/ — static web page rendering Impact Briefs from report/data/<ticketId>.json.
- demo/ — NovaBank demo: build-demo.ps1 generates two connected repositories (novabank-api, novabank-mobile) in demo-workspace/; tickets in demo/tickets/.
- bob_sessions/ — IBM Bob task session screenshots (hackathon evidence).

## Environment
Windows + PowerShell. Run tools with node, not npx: node node_modules/typescript/bin/tsc, node node_modules/vitest/vitest.mjs run. Rollup uses @rollup/wasm-node (Windows application control blocks native binaries).