#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { findCandidates } from "./tools/findCandidates.js";
import { findCrossRepoLinks } from "./tools/findCrossRepoLinks.js";
import { simulateChange } from "./tools/simulateChange.js";
import { gitContext } from "./tools/gitContext.js";
import { saveImpactReport } from "./tools/saveImpactReport.js";
import { coverageMap } from "./tools/coverageMap.js";
import type { ImpactReport } from "./types.js";

const server = new McpServer({ name: "rulescope-mcp", version: "0.1.0" });

// ─── find_candidates ─────────────────────────────────────────────────────────

server.registerTool(
  "find_candidates",
  {
    description:
      "Search all specified repositories for impact candidates using git grep. " +
      "Returns file:line hits for all keywords (fixed string) and patterns (regex).",
    inputSchema: z.object({
      repoPaths: z
        .array(z.string())
        .describe("Absolute paths to the git repository roots to search"),
      keywords: z
        .array(z.string())
        .describe("Fixed-string keywords to search for"),
      patterns: z
        .array(z.string())
        .describe("Extended-regex patterns to search for"),
    }),
  },
  async ({ repoPaths, keywords, patterns }) => {
    const result = await findCandidates({ repoPaths, keywords, patterns });
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      ...("error" in result ? { isError: true } : {}),
    };
  },
);

// ─── find_cross_repo_links ───────────────────────────────────────────────────

server.registerTool(
  "find_cross_repo_links",
  {
    description:
      "Scans all repositories and finds provider/consumer pairs across three signal " +
      "types: HTTP routes, shared packages, and DB tables / event topics. " +
      "Must be called once by the root agent after all per-repo subagents complete.",
    inputSchema: z.object({
      repoPaths: z
        .array(z.string())
        .describe("Absolute paths to all git repository roots to scan"),
    }),
  },
  async ({ repoPaths }) => {
    const result = await findCrossRepoLinks({ repoPaths });
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
);

// ─── simulate_change ─────────────────────────────────────────────────────────

server.registerTool(
  "simulate_change",
  {
    description:
      "Runs vitest in a temporary git worktree before and after applying search-replace edits. " +
      "The real repository is never modified. The worktree is always cleaned up.",
    inputSchema: z.object({
      repoPath: z
        .string()
        .describe("Absolute path to the git repository root"),
      edits: z
        .array(
          z.object({
            file: z.string().describe("Relative file path inside the repository"),
            search: z.string().describe("Exact string to find (must appear exactly once)"),
            replace: z.string().describe("String to replace the single occurrence with"),
          }),
        )
        .describe("Edits to apply. Pass an empty array for a proof-only run."),
      testCode: z
        .string()
        .describe("Vitest test file content to execute in the worktree"),
    }),
  },
  async ({ repoPath, edits, testCode }) => {
    try {
      const result = await simulateChange({ repoPath, edits, testCode });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `simulate_change failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// ─── git_context ─────────────────────────────────────────────────────────────

server.registerTool(
  "git_context",
  {
    description:
      "Returns git blame and git log context for a range of lines in a file. " +
      "Evidence items carry tool: 'git_blame' and tool: 'git_log'.",
    inputSchema: z.object({
      repoPath: z
        .string()
        .describe("Absolute path to the git repository root"),
      file: z
        .string()
        .describe("Relative file path inside the repository"),
      startLine: z.number().int().positive().describe("1-based start line"),
      endLine: z.number().int().positive().describe("1-based end line"),
    }),
  },
  async ({ repoPath, file, startLine, endLine }) => {
    const result = await gitContext({ repoPath, file, startLine, endLine });
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      ...("error" in result ? { isError: true } : {}),
    };
  },
);

// ─── save_impact_report ──────────────────────────────────────────────────────

server.registerTool(
  "save_impact_report",
  {
    description:
      "Validates and saves an ImpactReport JSON to report/data/<ticketId>.json. " +
      "Returns the written path on success.",
    inputSchema: z.object({
      reportJson: z
        .string()
        .describe(
          "The ImpactReport JSON string (must match the v1 schema). " +
          "Stringify the ImpactReport object before passing.",
        ),
    }),
  },
  async ({ reportJson }) => {
    let parsed: ImpactReport;
    try {
      parsed = JSON.parse(reportJson) as ImpactReport;
    } catch {
      return {
        content: [{ type: "text", text: "save_impact_report: invalid JSON" }],
        isError: true,
      };
    }
    const result = await saveImpactReport({
      reportJson: parsed,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      ...("error" in result ? { isError: true } : {}),
    };
  },
);

// ─── coverage_map ─────────────────────────────────────────────────────────────

server.registerTool(
  "coverage_map",
  {
    description:
      "Runs the full vitest coverage suite for a repository and returns per-file " +
      "and per-function coverage percentages filtered to the requested files.",
    inputSchema: z.object({
      repoPath: z
        .string()
        .describe("Absolute path to the git repository root"),
      files: z
        .array(z.string())
        .describe("Relative file paths inside the repository to report coverage for"),
    }),
  },
  async ({ repoPath, files }) => {
    const result = await coverageMap({ repoPath, files });
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      ...("error" in result ? { isError: true } : {}),
    };
  },
);

// ─── Start ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("rulescope-mcp running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
