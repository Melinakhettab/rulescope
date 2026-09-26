import type { SimulationResult } from "../types.js";

export interface SimulateChangeInput {
  repoPath: string;
  /** Unified diff to apply; may be empty string for a proof-only run */
  patch: string;
  /** Vitest test file content to execute */
  testCode: string;
}

/**
 * Runs vitest in a temporary git worktree before and after applying a patch.
 * The real repository is never modified. The worktree is always cleaned up.
 */
export async function simulateChange(
  input: SimulateChangeInput,
): Promise<SimulationResult> {
  // TODO: implement
  void input;
  throw new Error("simulateChange: not yet implemented");
}
