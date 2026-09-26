import { spawnSync } from "node:child_process";

export interface GitGrepHit {
  file: string;
  line: number;
  snippet: string;
}

/**
 * Runs `git grep` in the given repository directory.
 *
 * @param repoPath  Absolute path to the git repository root.
 * @param mode      "fixed" → `-F` (keyword search); "regex" → `-E` (extended regex).
 * @param pattern   The keyword or regex to search for.
 * @returns Array of parsed hits, or an error string on failure.
 */
export function runGitGrep(
  repoPath: string,
  mode: "fixed" | "regex",
  pattern: string,
): { hits: GitGrepHit[] } | { error: string } {
  const flag = mode === "fixed" ? "-F" : "-E";

  const result = spawnSync("git", ["grep", "-n", flag, "--", pattern], {
    cwd: repoPath,
    encoding: "utf8",
    // exit code 1 means no matches (not an error); 128+ means git error
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) {
    return { error: `git grep spawn error: ${result.error.message}` };
  }

  // Exit code 128+ → not a git repo or other fatal git error
  if (result.status !== null && result.status >= 128) {
    const stderr = (result.stderr ?? "").trim();
    return {
      error: `git grep failed (exit ${result.status}): ${stderr || "unknown error"}`,
    };
  }

  // Exit code 1 → no matches; that's fine, return empty hits
  if (result.status === 1) {
    return { hits: [] };
  }

  const hits: GitGrepHit[] = [];
  const lines = (result.stdout ?? "").split("\n");

  for (const raw of lines) {
    if (!raw) continue;
    // Strip trailing \r from Windows CRLF line endings
    const trimmed = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    // Format: <file>:<line>:<snippet>
    // File paths may contain colons on some systems; line number is always numeric
    const match = trimmed.match(/^([^:]+):(\d+):(.*)$/);
    if (!match) continue;
    const [, file, lineStr, snippet] = match;
    const line = parseInt(lineStr, 10);
    if (Number.isNaN(line)) continue;
    hits.push({ file, line, snippet });
  }

  return { hits };
}

/**
 * Runs multiple git grep calls (keywords + patterns) in a single repository,
 * de-duplicates overlapping hits at the same file:line, and returns the merged list.
 */
export function runGitGrepAll(
  repoPath: string,
  keywords: string[],
  patterns: string[],
): { hits: GitGrepHit[] } | { error: string } {
  const seen = new Map<string, GitGrepHit>();
  const errors: string[] = [];

  for (const kw of keywords) {
    const r = runGitGrep(repoPath, "fixed", kw);
    if ("error" in r) {
      errors.push(r.error);
    } else {
      for (const h of r.hits) {
        const key = `${h.file}:${h.line}`;
        if (!seen.has(key)) seen.set(key, h);
      }
    }
  }

  for (const pat of patterns) {
    const r = runGitGrep(repoPath, "regex", pat);
    if ("error" in r) {
      errors.push(r.error);
    } else {
      for (const h of r.hits) {
        const key = `${h.file}:${h.line}`;
        if (!seen.has(key)) seen.set(key, h);
      }
    }
  }

  // Only report errors if ALL searches failed; partial hits are still useful
  if (seen.size === 0 && errors.length > 0) {
    return { error: errors.join("; ") };
  }

  return { hits: Array.from(seen.values()) };
}
