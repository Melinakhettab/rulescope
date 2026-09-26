import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { SimulationResult, SimulationRow, SimulationEdit } from "../types.js";
import { createWorktree, removeWorktree } from "../utils/worktree.js";
import { runVitest } from "../utils/runVitest.js";

export interface SimulateChangeInput {
  repoPath: string;
  /** Edits to apply; empty array for a proof-only run */
  edits: SimulationEdit[];
  /** Vitest test file content to execute */
  testCode: string;
}

const TEST_FILE_NAME = "__rulescope_sim__.test.ts";
const RULESCOPE_CONFIG_NAME = "vitest.rulescope.config.mjs";

/** Known vitest config filenames, in priority order. */
const VITEST_CONFIG_CANDIDATES = [
  "vitest.config.ts",
  "vitest.config.mts",
  "vitest.config.js",
  "vitest.config.mjs",
];

/**
 * Detects the first existing vitest config file inside the given directory.
 * Returns its basename (e.g. "vitest.config.ts"), or null if none exists.
 */
async function detectVitestConfig(dir: string): Promise<string | null> {
  for (const candidate of VITEST_CONFIG_CANDIDATES) {
    try {
      await access(join(dir, candidate));
      return candidate;
    } catch {
      // not found — try next
    }
  }
  return null;
}

/**
 * Writes a `vitest.rulescope.config.mjs` file into the worktree.
 *
 * If the project already has a vitest config, the generated file imports it
 * and uses `mergeConfig` to override `test.include` so that only the
 * simulation test file is picked up (regardless of the project's own include
 * patterns).
 *
 * If there is no project vitest config, a minimal standalone config is written.
 */
async function writeRulescopeConfig(worktreePath: string): Promise<void> {
  const existing = await detectVitestConfig(worktreePath);

  let content: string;
  if (existing) {
    // Import the project config (vitest supports TS/MJS imports at runtime via
    // its own loader, so we can safely import the TS config from a .mjs file
    // using a dynamic import that vitest resolves through its own pipeline).
    content = `\
import { mergeConfig } from "vitest/config";
import projectConfig from "./${existing}";

export default mergeConfig(projectConfig, {
  test: {
    include: [${JSON.stringify(TEST_FILE_NAME)}],
  },
});
`;
  } else {
    content = `\
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [${JSON.stringify(TEST_FILE_NAME)}],
  },
});
`;
  }

  await writeFile(join(worktreePath, RULESCOPE_CONFIG_NAME), content, "utf8");
}

/**
 * Applies a list of search-replace edits inside a worktree.
 * Each edit's `search` string must appear exactly once in its target file.
 * Throws a descriptive error if a search string is not found or is ambiguous.
 */
async function applyEdits(worktreePath: string, edits: SimulationEdit[]): Promise<void> {
  for (const edit of edits) {
    const filePath = join(worktreePath, edit.file);
    const content = await readFile(filePath, "utf8");

    const occurrences = content.split(edit.search).length - 1;
    if (occurrences === 0) {
      throw new Error(
        `simulate_change edit: search string not found in ${edit.file}:\n  ${edit.search}`,
      );
    }
    if (occurrences > 1) {
      throw new Error(
        `simulate_change edit: search string found ${occurrences} times in ${edit.file} (must be exactly once):\n  ${edit.search}`,
      );
    }

    const updated = content.replace(edit.search, edit.replace);
    await writeFile(filePath, updated, "utf8");
  }
}

/**
 * Merges two ordered lists of SimulationRows (before + after) by test title.
 * Rows that appear only in one list get the missing side filled from the other.
 */
function mergeRows(
  before: SimulationRow[],
  after: SimulationRow[],
): SimulationRow[] {
  const merged = new Map<string, SimulationRow>();

  for (const row of before) {
    merged.set(row.input, {
      input: row.input,
      before: row.before,
      after: "",
      passed: row.passed,
    });
  }

  for (const row of after) {
    const existing = merged.get(row.input);
    if (existing) {
      existing.after = row.after;
      existing.passed = row.passed;
    } else {
      merged.set(row.input, {
        input: row.input,
        before: "",
        after: row.after,
        passed: row.passed,
      });
    }
  }

  return Array.from(merged.values());
}

/**
 * Runs vitest in a temporary git worktree before and after applying edits.
 * The real repository is never modified. The worktree is always cleaned up.
 */
export async function simulateChange(
  input: SimulateChangeInput,
): Promise<SimulationResult> {
  const { repoPath, edits, testCode } = input;
  const uuid = randomUUID();
  // node_modules is in the worktree via junction pointing to the source repo
  const nodeModules = join(repoPath, "node_modules");

  let resolvedWorktreePath = "";
  let rawBefore = "";
  let rawAfter = "";
  let rows: SimulationRow[] = [];

  // createWorktree must run before the try block so we have the path for finally
  resolvedWorktreePath = await createWorktree(repoPath, uuid);

  try {
    // Write the simulation test file into the worktree
    await writeFile(join(resolvedWorktreePath, TEST_FILE_NAME), testCode, "utf8");

    // Write the rulescope vitest config that forces include to only the sim file
    await writeRulescopeConfig(resolvedWorktreePath);

    // ── Before run ────────────────────────────────────────────────────────────
    const beforeResult = runVitest(resolvedWorktreePath, nodeModules, RULESCOPE_CONFIG_NAME, "before");
    rawBefore = beforeResult.rawOutput;

    // ── Apply edits (if any) ──────────────────────────────────────────────────
    if (edits.length > 0) {
      await applyEdits(resolvedWorktreePath, edits);
    }

    // ── After run ─────────────────────────────────────────────────────────────
    const afterResult = runVitest(resolvedWorktreePath, nodeModules, RULESCOPE_CONFIG_NAME, "after");
    rawAfter = afterResult.rawOutput;

    rows = mergeRows(beforeResult.rows, afterResult.rows);
  } finally {
    await removeWorktree(repoPath, resolvedWorktreePath);
  }

  return {
    repoPath,
    edits,
    testCode,
    rows,
    rawOutput: [rawBefore, rawAfter].filter(Boolean).join("\n\n--- after edits ---\n\n"),
    worktreePath: resolvedWorktreePath,
  };
}
