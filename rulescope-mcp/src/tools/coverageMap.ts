import { spawnSync } from "node:child_process";
import { readFileSync, unlinkSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { RepoCoverage } from "../types.js";

export interface CoverageMapInput {
  repoPath: string;
  files: string[];
}

// ─── Istanbul/v8 JSON output shape (subset) ───────────────────────────────────

interface FileCoverageData {
  /** statement/line coverage */
  s?: Record<string, number>;
  /** function coverage */
  f?: Record<string, number>;
  /** function names keyed by index */
  fnMap?: Record<string, { name: string; decl?: unknown }>;
  /** summary from @vitest/coverage-v8 JSON reporter */
  lines?: { pct: number };
  functions?: { pct: number };
}

interface IstanbulJson {
  /** Keyed by absolute file path */
  [filePath: string]: FileCoverageData;
}

interface V8CoverageSummary {
  total: {
    lines: { pct: number };
    functions: { pct: number };
  };
}

interface CoverageJsonReport {
  /** Istanbul format: each key is an absolute file path */
  [filePath: string]: FileCoverageData;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalises a path so that both forward- and back-slashes compare equally,
 * and resolves the relative file against the repoPath when needed.
 */
function normalisePath(p: string): string {
  return p.replace(/\\/g, "/").toLowerCase();
}

/**
 * Calculates the line-coverage percentage for a single file's coverage data.
 * We use the Istanbul statement map as a proxy for line coverage when a
 * dedicated lines summary is not present.
 */
function linePct(data: FileCoverageData): number {
  // @vitest/coverage-v8 may embed a "lines" summary object
  if (data.lines !== undefined) return data.lines.pct;

  // Fall back to statement coverage
  if (data.s) {
    const stmts = Object.values(data.s);
    if (stmts.length === 0) return 100;
    const covered = stmts.filter((v) => v > 0).length;
    return Math.round((covered / stmts.length) * 100);
  }

  return 0;
}

/**
 * Calculates the function-coverage percentage for a single file's coverage data.
 */
function functionPct(data: FileCoverageData): number {
  if (data.functions !== undefined) return data.functions.pct;

  if (data.f) {
    const fns = Object.values(data.f);
    if (fns.length === 0) return 100;
    const covered = fns.filter((v) => v > 0).length;
    return Math.round((covered / fns.length) * 100);
  }

  return 0;
}

/**
 * Returns the function coverage keyed "file:functionName" for a single file.
 */
function perFunctionCoverage(
  relFile: string,
  data: FileCoverageData,
): Record<string, number> {
  const result: Record<string, number> = {};
  if (!data.f || !data.fnMap) return result;

  for (const [idx, count] of Object.entries(data.f)) {
    const fnEntry: { name: string; decl?: unknown } | undefined = data.fnMap[idx];
    const fnName: string = fnEntry?.name ?? `fn${idx}`;
    const key = `${relFile}:${fnName}`;
    result[key] = count > 0 ? 100 : 0;
  }

  return result;
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Runs full vitest coverage suite, filters results to the requested files,
 * and returns RepoCoverage for those files.
 *
 * Uses `node <node_modules>/vitest/vitest.mjs run --coverage --reporter=json`
 * and writes the Istanbul/v8 JSON output to a temp file.
 */
export async function coverageMap(
  input: CoverageMapInput,
): Promise<RepoCoverage | { error: string }> {
  const { repoPath, files } = input;

  if (files.length === 0) {
    return {
      repoPath,
      fileCoverage: {},
      functionCoverage: {},
      uncoveredFiles: [],
    };
  }

  // Write coverage output to a temp directory (never inside node_modules)
  const tempDir = join(
    tmpdir(),
    `rulescope-cov-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(tempDir, { recursive: true });

  const coverageOutputDir = join(tempDir, "coverage");
  mkdirSync(coverageOutputDir, { recursive: true });

  const nodeModules = join(repoPath, "node_modules");
  const vitestBin = join(nodeModules, "vitest", "vitest.mjs");

  const args = [
    vitestBin,
    "run",
    "--coverage",
    "--coverage.enabled=true",
    "--coverage.reporter=json",
    `--coverage.reportsDirectory=${coverageOutputDir}`,
    "--reporter=json",
  ];

  const r = spawnSync(process.execPath, args, {
    cwd: repoPath,
    encoding: "utf8",
    env: { ...process.env, CI: "true" },
  });

  // Read the coverage JSON produced by Istanbul/v8
  const coverageJsonPath = join(coverageOutputDir, "coverage-final.json");

  let rawCoverage: CoverageJsonReport;
  try {
    const content = readFileSync(coverageJsonPath, "utf8");
    rawCoverage = JSON.parse(content) as CoverageJsonReport;
  } catch {
    const rawOutput = [r.stdout ?? "", r.stderr ?? ""].join("\n").trim();
    return {
      error:
        `coverage_map: failed to read coverage output from ${coverageJsonPath}. ` +
        `vitest exit code: ${r.status ?? "null"}. Output: ${rawOutput.slice(0, 500)}`,
    };
  } finally {
    // Best-effort cleanup of the temp dir
    try {
      unlinkSync(coverageJsonPath);
    } catch { /* ignore */ }
  }

  // Normalise requested files for comparison
  const normRepo = normalisePath(repoPath);
  const requestedNorm = new Set(files.map((f) => normalisePath(f)));

  const fileCoverage: Record<string, number> = {};
  const functionCoverage: Record<string, number> = {};

  for (const [absPath, data] of Object.entries(rawCoverage)) {
    const normAbs = normalisePath(absPath);

    // Derive the relative path by stripping the repo root prefix
    let relFile = normAbs;
    if (relFile.startsWith(normRepo + "/")) {
      relFile = relFile.slice(normRepo.length + 1);
    } else if (relFile.startsWith(normRepo + "\\")) {
      relFile = relFile.slice(normRepo.length + 1);
    }

    // Check whether this file is in the requested set (try both forms)
    const isRequested =
      requestedNorm.has(normalisePath(relFile)) ||
      requestedNorm.has(normAbs);

    if (!isRequested) continue;

    // Use the original relative form from the caller for the output keys
    const requestedForm =
      files.find(
        (f) =>
          normalisePath(f) === normalisePath(relFile) ||
          normalisePath(f) === normAbs,
      ) ?? relFile;

    fileCoverage[requestedForm] = linePct(data);

    const fnCov = perFunctionCoverage(requestedForm, data);
    for (const [key, val] of Object.entries(fnCov)) {
      functionCoverage[key] = val;
    }
  }

  // Files that were requested but not found in coverage data default to 0 %
  for (const f of files) {
    if (!(f in fileCoverage)) {
      fileCoverage[f] = 0;
    }
  }

  const uncoveredFiles = files.filter((f) => (fileCoverage[f] ?? 0) === 0);

  return {
    repoPath,
    fileCoverage,
    functionCoverage,
    uncoveredFiles,
  };
}
