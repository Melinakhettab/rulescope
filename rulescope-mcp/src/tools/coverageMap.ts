import type { RepoCoverage } from "../types.js";

export interface CoverageMapInput {
  repoPath: string;
  files: string[];
}

/**
 * Runs full vitest coverage suite, filters results to the requested files,
 * and returns RepoCoverage for those files.
 */
export async function coverageMap(
  input: CoverageMapInput,
): Promise<RepoCoverage | { error: string }> {
  // TODO: implement
  void input;
  throw new Error("coverageMap: not yet implemented");
}
