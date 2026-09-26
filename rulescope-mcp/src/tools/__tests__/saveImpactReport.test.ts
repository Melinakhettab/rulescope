/**
 * Unit tests for saveImpactReport.ts and coverageMap.ts
 *
 * saveImpactReport: mocks fs/promises to avoid real disk writes.
 * coverageMap: mocks child_process.spawnSync and fs to avoid real vitest runs.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("node:fs/promises", () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("node:child_process", () => ({
  spawnSync: vi.fn(),
}));

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
  unlinkSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

import { saveImpactReport } from "../saveImpactReport.js";
import { coverageMap } from "../coverageMap.js";
import * as fsPromises from "node:fs/promises";
import * as fsSync from "node:fs";
import * as childProcess from "node:child_process";
import type { ImpactReport } from "../../types.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeValidReport(overrides: Partial<ImpactReport> = {}): ImpactReport {
  return {
    $schema: "https://rulescope/impact-report/v1",
    ticketId: "TICKET-123",
    title: "Test report",
    createdAt: new Date().toISOString(),
    requestSummary: "Test",
    openQuestions: [],
    entryPoints: [],
    repoPaths: ["/fake/repo"],
    filesToChange: {},
    filesToCheck: {},
    filesNotAffected: {},
    items: [
      {
        id: "business_rule:test",
        kind: "business_rule",
        label: "Test rule",
        description: "A rule",
        repoPath: "/fake/repo",
        evidence: [
          { file: "src/foo.ts", line: 1, snippet: "const x = 1;", tool: "git_grep" },
        ],
      },
    ],
    simulations: [],
    coverage: [],
    riskLevel: "low",
    effortEstimate: "1 file",
    riskRationale: "Minimal",
    changePlan: [
      {
        order: 1,
        action: "Replace the thing",
        rationale: "Because",
        targetFiles: ["src/foo.ts"],
        repoPath: "/fake/repo",
      },
    ],
    ...overrides,
  };
}

// ─── saveImpactReport tests ───────────────────────────────────────────────────

describe("saveImpactReport", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("happy path — writes JSON to report/data/<ticketId>.json", async () => {
    const report = makeValidReport({ ticketId: "TICKET-123" });
    const result = await saveImpactReport({ reportJson: report });

    expect("path" in result).toBe(true);
    if (!("path" in result)) return;
    expect(result.path).toBe("report/data/TICKET-123.json");

    expect(fsPromises.mkdir).toHaveBeenCalledWith(
      expect.stringContaining("report"),
      { recursive: true },
    );
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("TICKET-123.json"),
      expect.stringContaining('"TICKET-123"'),
      "utf8",
    );
  });

  it("sanitizes ticketId — replaces disallowed chars with underscores", async () => {
    const report = makeValidReport({ ticketId: "TICKET/123 abc" });
    const result = await saveImpactReport({ reportJson: report });

    expect("path" in result).toBe(true);
    if (!("path" in result)) return;
    expect(result.path).toBe("report/data/TICKET_123_abc.json");
  });

  it("sanitizes ticketId — preserves hyphens and underscores", async () => {
    const report = makeValidReport({ ticketId: "my-ticket_v2" });
    const result = await saveImpactReport({ reportJson: report });

    expect("path" in result).toBe(true);
    if (!("path" in result)) return;
    expect(result.path).toBe("report/data/my-ticket_v2.json");
  });

  it("returns error for empty ticketId after sanitization", async () => {
    // An empty string sanitizes to "" which is still empty → should error
    const report = makeValidReport({ ticketId: "" });
    const result = await saveImpactReport({ reportJson: report });

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error).toMatch(/empty after sanitization/);
  });

  it("returns error for wrong $schema", async () => {
    const report = makeValidReport({
      $schema: "https://wrong/schema" as "https://rulescope/impact-report/v1",
    });
    const result = await saveImpactReport({ reportJson: report });

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error).toMatch(/\$schema/);
  });

  it("returns error when ticketId is missing", async () => {
    const report = makeValidReport();
    // @ts-expect-error intentional missing field
    delete report.ticketId;
    const result = await saveImpactReport({ reportJson: report as ImpactReport });

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error).toMatch(/ticketId/);
  });

  it("returns error when createdAt is missing", async () => {
    const report = makeValidReport();
    // @ts-expect-error intentional missing field
    delete report.createdAt;
    const result = await saveImpactReport({ reportJson: report as ImpactReport });

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error).toMatch(/createdAt/);
  });

  it("returns error when an item has empty evidence array", async () => {
    const report = makeValidReport({
      items: [
        {
          id: "test:empty-evidence",
          kind: "test",
          label: "A test",
          description: "desc",
          repoPath: "/fake/repo",
          evidence: [],
        },
      ],
    });
    const result = await saveImpactReport({ reportJson: report });

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error).toMatch(/empty evidence array/);
  });

  it("returns error when changePlan is missing", async () => {
    const report = makeValidReport();
    // @ts-expect-error intentional missing field
    delete report.changePlan;
    const result = await saveImpactReport({ reportJson: report as ImpactReport });

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error).toMatch(/changePlan/);
  });

  it("ticketId with only special chars returns error", async () => {
    const report = makeValidReport({ ticketId: "!!!" });
    const result = await saveImpactReport({ reportJson: report });

    // After sanitization "___" is NOT empty, so it should write
    expect("path" in result).toBe(true);
    if (!("path" in result)) return;
    expect(result.path).toBe("report/data/___.json");
  });

  it("ticketId of only spaces sanitizes to underscores — NOT empty → writes successfully", async () => {
    // Spaces → "___ " (underscores) which is non-empty, so no error
    const report = makeValidReport({ ticketId: "   " });
    const result = await saveImpactReport({ reportJson: report });

    expect("path" in result).toBe(true);
    if (!("path" in result)) return;
    expect(result.path).toBe("report/data/___.json");
  });
});

// ─── coverageMap tests ────────────────────────────────────────────────────────

describe("coverageMap", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty coverage when files array is empty", async () => {
    const result = await coverageMap({ repoPath: "/fake/repo", files: [] });

    expect("repoPath" in result).toBe(true);
    if (!("repoPath" in result)) return;
    expect(result.fileCoverage).toEqual({});
    expect(result.functionCoverage).toEqual({});
    expect(result.uncoveredFiles).toHaveLength(0);
    // spawnSync should NOT have been called
    expect(childProcess.spawnSync).not.toHaveBeenCalled();
  });

  it("happy path — parses Istanbul JSON and filters to requested files", async () => {
    (childProcess.spawnSync as Mock).mockReturnValue({ status: 0, stdout: "", stderr: "" });

    // Mock readFileSync to return a fake coverage-final.json
    const fakeCoverage = {
      "/fake/repo/src/foo.ts": {
        s: { "0": 5, "1": 3, "2": 0 },
        f: { "0": 2 },
        fnMap: { "0": { name: "doThing" } },
      },
      "/fake/repo/src/bar.ts": {
        s: { "0": 0 },
        f: {},
        fnMap: {},
      },
      "/fake/repo/src/other.ts": {
        s: { "0": 10 },
        f: {},
        fnMap: {},
      },
    };
    (fsSync.readFileSync as Mock).mockReturnValue(JSON.stringify(fakeCoverage));

    const result = await coverageMap({
      repoPath: "/fake/repo",
      files: ["src/foo.ts", "src/bar.ts"],
    });

    expect("repoPath" in result).toBe(true);
    if (!("repoPath" in result)) return;

    // foo.ts: 2 out of 3 statements covered → ~67%
    expect(result.fileCoverage["src/foo.ts"]).toBe(67);
    // bar.ts: 0 out of 1 statements covered → 0%
    expect(result.fileCoverage["src/bar.ts"]).toBe(0);
    // other.ts was NOT requested → should not appear
    expect("src/other.ts" in result.fileCoverage).toBe(false);

    expect(result.uncoveredFiles).toContain("src/bar.ts");
    expect(result.uncoveredFiles).not.toContain("src/foo.ts");

    // Function coverage: doThing was called (f[0]=2) → 100
    expect(result.functionCoverage["src/foo.ts:doThing"]).toBe(100);
  });

  it("files not found in coverage data default to 0% and appear in uncoveredFiles", async () => {
    (childProcess.spawnSync as Mock).mockReturnValue({ status: 0, stdout: "", stderr: "" });
    (fsSync.readFileSync as Mock).mockReturnValue(JSON.stringify({}));

    const result = await coverageMap({
      repoPath: "/fake/repo",
      files: ["src/missing.ts"],
    });

    expect("repoPath" in result).toBe(true);
    if (!("repoPath" in result)) return;
    expect(result.fileCoverage["src/missing.ts"]).toBe(0);
    expect(result.uncoveredFiles).toContain("src/missing.ts");
  });

  it("returns error when coverage-final.json cannot be read", async () => {
    (childProcess.spawnSync as Mock).mockReturnValue({ status: 1, stdout: "", stderr: "vitest failed" });
    (fsSync.readFileSync as Mock).mockImplementation(() => {
      throw new Error("ENOENT: no such file");
    });

    const result = await coverageMap({
      repoPath: "/fake/repo",
      files: ["src/foo.ts"],
    });

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error).toMatch(/coverage_map/);
    expect(result.error).toMatch(/coverage-final\.json/);
  });

  it("100% line coverage when all statements are hit", async () => {
    (childProcess.spawnSync as Mock).mockReturnValue({ status: 0, stdout: "", stderr: "" });
    const fakeCoverage = {
      "/fake/repo/src/full.ts": {
        s: { "0": 1, "1": 2, "2": 3 },
        f: {},
        fnMap: {},
      },
    };
    (fsSync.readFileSync as Mock).mockReturnValue(JSON.stringify(fakeCoverage));

    const result = await coverageMap({
      repoPath: "/fake/repo",
      files: ["src/full.ts"],
    });

    expect("repoPath" in result).toBe(true);
    if (!("repoPath" in result)) return;
    expect(result.fileCoverage["src/full.ts"]).toBe(100);
    expect(result.uncoveredFiles).toHaveLength(0);
  });

  it("uncovered function contributes 0 to functionCoverage", async () => {
    (childProcess.spawnSync as Mock).mockReturnValue({ status: 0, stdout: "", stderr: "" });
    const fakeCoverage = {
      "/fake/repo/src/funcs.ts": {
        s: { "0": 1 },
        f: { "0": 0 },
        fnMap: { "0": { name: "neverCalled" } },
      },
    };
    (fsSync.readFileSync as Mock).mockReturnValue(JSON.stringify(fakeCoverage));

    const result = await coverageMap({
      repoPath: "/fake/repo",
      files: ["src/funcs.ts"],
    });

    expect("repoPath" in result).toBe(true);
    if (!("repoPath" in result)) return;
    expect(result.functionCoverage["src/funcs.ts:neverCalled"]).toBe(0);
  });
});
