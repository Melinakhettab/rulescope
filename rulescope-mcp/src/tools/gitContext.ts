import { spawnSync } from "node:child_process";
import type { GitContextResult } from "../types.js";

export interface GitContextInput {
  repoPath: string;
  file: string;
  startLine: number;
  endLine: number;
}

/**
 * Returns git blame and git log context for a range of lines in a file.
 * Evidence items carry tool: "git_blame" and tool: "git_log".
 */
export async function gitContext(
  input: GitContextInput,
): Promise<GitContextResult | { error: string }> {
  const { repoPath, file, startLine, endLine } = input;

  // ─── git blame ────────────────────────────────────────────────────────────
  const blameResult = spawnSync(
    "git",
    ["blame", `-L${startLine},${endLine}`, "--porcelain", "--", file],
    { cwd: repoPath, encoding: "utf8", maxBuffer: 5 * 1024 * 1024 },
  );

  if (blameResult.error) {
    return { error: `git blame spawn error: ${blameResult.error.message}` };
  }
  if (blameResult.status !== 0) {
    const stderr = (blameResult.stderr ?? "").trim();
    return {
      error: `git blame failed (exit ${blameResult.status}): ${stderr || "unknown error"}`,
    };
  }

  const { lines, commitHashByLine } = parseBlame(
    blameResult.stdout ?? "",
    startLine,
  );

  // ─── git log per unique commit ────────────────────────────────────────────
  const uniqueHashes = [...new Set(lines.map((l) => l.commitHash))].filter(
    (h) => h && h !== "0000000000000000000000000000000000000000",
  );

  const commits: GitContextResult["commits"] = [];

  for (const hash of uniqueHashes) {
    const logResult = spawnSync(
      "git",
      ["log", "-1", "--format=%H|%an|%ae|%ai|%s|%b", hash],
      { cwd: repoPath, encoding: "utf8", maxBuffer: 1 * 1024 * 1024 },
    );

    if (logResult.status !== 0) continue;

    const raw = (logResult.stdout ?? "").trim();
    const parts = raw.split("|");
    if (parts.length < 5) continue;

    const [logHash, author, email, date, subject, ...bodyParts] = parts;
    commits.push({
      hash: logHash,
      author,
      email,
      date,
      subject,
      body: bodyParts.join("|").trim(),
    });
  }

  // Populate line.message from the commit data
  const commitMap = new Map(commits.map((c) => [c.hash, c]));
  const linesWithMessage = lines.map((l) => {
    const c = commitMap.get(l.commitHash);
    return { ...l, message: c?.subject ?? l.message };
  });

  void commitHashByLine; // used only internally during parse

  return {
    repoPath,
    file,
    startLine,
    endLine,
    lines: linesWithMessage,
    commits,
  };
}

// ─── Parser ───────────────────────────────────────────────────────────────────

interface ParsedLine {
  line: number;
  commitHash: string;
  author: string;
  date: string;
  message: string;
}

/**
 * Parses `git blame --porcelain` output.
 *
 * Porcelain format per-line block:
 *   <40-hex> <orig-line> <result-line> [<num-lines>]
 *   author <name>
 *   author-time <unix-timestamp>
 *   summary <subject>
 *   ... (other headers)
 *   \t<line content>   ← TAB-prefixed source line
 */
function parseBlame(
  stdout: string,
  startLine: number,
): { lines: ParsedLine[]; commitHashByLine: Map<number, string> } {
  const rawLines = stdout.split("\n");
  const commitMeta = new Map<
    string,
    { author: string; date: string; summary: string }
  >();
  const lines: ParsedLine[] = [];
  const commitHashByLine = new Map<number, string>();

  let currentHash = "";
  let currentAuthor = "";
  let currentDate = "";
  let currentSummary = "";
  let resultLineNum = startLine;

  for (const raw of rawLines) {
    // Header line: 40-hex + 3 or 4 numbers
    const headerMatch = raw.match(/^([0-9a-f]{40})\s+\d+\s+(\d+)/);
    if (headerMatch) {
      currentHash = headerMatch[1];
      resultLineNum = parseInt(headerMatch[2], 10);

      // Pull cached metadata if we've seen this commit before
      const cached = commitMeta.get(currentHash);
      if (cached) {
        currentAuthor = cached.author;
        currentDate = cached.date;
        currentSummary = cached.summary;
      } else {
        currentAuthor = "";
        currentDate = "";
        currentSummary = "";
      }
      continue;
    }

    if (raw.startsWith("author ")) {
      currentAuthor = raw.slice(7);
      continue;
    }
    if (raw.startsWith("author-time ")) {
      const ts = parseInt(raw.slice(12), 10);
      currentDate = new Date(ts * 1000).toISOString();
      continue;
    }
    if (raw.startsWith("summary ")) {
      currentSummary = raw.slice(8);
      commitMeta.set(currentHash, {
        author: currentAuthor,
        date: currentDate,
        summary: currentSummary,
      });
      continue;
    }

    // Source line (TAB prefix)
    if (raw.startsWith("\t")) {
      commitHashByLine.set(resultLineNum, currentHash);
      lines.push({
        line: resultLineNum,
        commitHash: currentHash,
        author: currentAuthor,
        date: currentDate,
        message: currentSummary,
      });
      continue;
    }
  }

  return { lines, commitHashByLine };
}
