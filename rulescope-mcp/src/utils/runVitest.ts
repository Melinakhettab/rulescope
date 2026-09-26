import { spawnSync } from "node:child_process";
import type { SimulationRow } from "../types.js";

export interface VitestRunResult {
  rows: SimulationRow[];
  rawOutput: string;
}

/**
 * Runs `npx vitest run --reporter=json` in the given directory and parses
 * the JSON output into SimulationRow[].
 *
 * @param cwd       Absolute path to the directory to run vitest in.
 * @param testFile  Optional specific test file to run.
 */
export function runVitest(
  cwd: string,
  testFile?: string,
): VitestRunResult {
  // TODO: implement
  void cwd;
  void testFile;
  throw new Error("runVitest: not yet implemented");
}
