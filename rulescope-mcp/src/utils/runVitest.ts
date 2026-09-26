import { spawnSync } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { SimulationRow } from "../types.js";

export interface VitestRunResult {
  rows: SimulationRow[];
  rawOutput: string;
}

// ─── Vitest JSON reporter shape (Jest-compatible) ─────────────────────────────

interface AssertionResult {
  title: string;
  fullName: string;
  status: "passed" | "failed" | "skipped";
  failureMessages: string[];
}

interface TestFileResult {
  name: string;
  status: "passed" | "failed";
  assertionResults: AssertionResult[];
}

interface VitestJsonOutput {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  success: boolean;
  testResults: TestFileResult[];
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Runs vitest directly via `node <worktree>/node_modules/vitest/vitest.mjs run
 * --reporter=json --outputFile=<tmp>` in the given directory and parses the
 * JSON output into SimulationRow[].
 *
 * We invoke the vitest binary through node explicitly to avoid npx/.cmd
 * resolution issues on Windows.
 *
 * @param cwd         Absolute path to the worktree directory to run vitest in.
 * @param nodeModules Absolute path to the node_modules directory that contains
 *                    vitest (typically the junction symlinked from the source repo).
 * @param testFile    Optional specific test file to pass to vitest.
 * @param label       "before" or "after" — used to populate the SimulationRow fields.
 */
export function runVitest(
  cwd: string,
  nodeModules: string,
  testFile?: string,
  label: "before" | "after" = "before",
): VitestRunResult {
  const outputFile = join(
    tmpdir(),
    `rulescope-vitest-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );

  const vitestBin = join(nodeModules, "vitest", "vitest.mjs");

  const args = [
    vitestBin,
    "run",
    "--reporter=json",
    `--outputFile=${outputFile}`,
  ];
  if (testFile) {
    args.push(testFile);
  }

  const r = spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    // vitest exits non-zero on test failures — that is expected
    env: { ...process.env, CI: "true" },
  });

  const rawOutput = [r.stdout ?? "", r.stderr ?? ""].join("\n").trim();

  // Read the JSON output file written by --outputFile
  let parsed: VitestJsonOutput;
  try {
    const content = readFileSync(outputFile, "utf8");
    parsed = JSON.parse(content) as VitestJsonOutput;
  } catch {
    // The file wasn't written — vitest crashed before producing output
    return { rows: [], rawOutput };
  } finally {
    try { unlinkSync(outputFile); } catch { /* best-effort cleanup */ }
  }

  const rows: SimulationRow[] = [];
  for (const fileResult of parsed.testResults ?? []) {
    for (const assertion of fileResult.assertionResults ?? []) {
      const statusStr = assertion.status === "passed" ? "passed" : "failed";
      const firstFailure =
        assertion.failureMessages.length > 0
          ? assertion.failureMessages[0].split("\n")[0]
          : "";
      const detail = statusStr + (firstFailure ? `: ${firstFailure}` : "");

      rows.push({
        input: assertion.title,
        before: label === "before" ? detail : "",
        after: label === "after" ? detail : "",
        passed: assertion.status === "passed",
      });
    }
  }

  return { rows, rawOutput };
}
