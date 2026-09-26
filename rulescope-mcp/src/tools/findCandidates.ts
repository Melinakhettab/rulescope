import type { CandidateResult } from "../types.js";
import { runGitGrepAll } from "../utils/runGitGrep.js";

export interface FindCandidatesInput {
  repoPaths: string[];
  keywords: string[];
  patterns: string[];
}

/**
 * Searches all repoPaths using git grep for all keywords (fixed) and patterns
 * (regex). De-duplicates overlapping hits and returns CandidateResult[].
 *
 * Each returned item carries an implicit tool: "git_grep" (via CandidateResult).
 * Errors per-repo are surfaced in the error array; partial results are still returned.
 */
export async function findCandidates(
  input: FindCandidatesInput,
): Promise<{ results: CandidateResult[]; errors?: string[] } | { error: string }> {
  const { repoPaths, keywords, patterns } = input;

  if (repoPaths.length === 0) {
    return { error: "find_candidates: repoPaths must not be empty" };
  }
  if (keywords.length === 0 && patterns.length === 0) {
    return { error: "find_candidates: at least one keyword or pattern is required" };
  }

  const results: CandidateResult[] = [];
  const errors: string[] = [];

  for (const repoPath of repoPaths) {
    const r = runGitGrepAll(repoPath, keywords, patterns);
    if ("error" in r) {
      errors.push(`${repoPath}: ${r.error}`);
    } else {
      for (const hit of r.hits) {
        results.push({
          repoPath,
          file: hit.file,
          line: hit.line,
          snippet: hit.snippet,
        });
      }
    }
  }

  if (results.length === 0 && errors.length > 0) {
    return { error: errors.join("\n") };
  }

  return errors.length > 0 ? { results, errors } : { results };
}
