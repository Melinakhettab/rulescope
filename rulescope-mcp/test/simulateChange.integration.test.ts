/**
 * Integration test for simulateChange.
 *
 * Uses the real git worktree + real vitest run against the sim-fixture template
 * in test/fixtures/sim-fixture/.  The fixture repo is created in os.tmpdir()
 * at runtime using makeFixtureRepo (no .git in the project tree).
 *
 * A junction from rulescope-mcp/node_modules is linked into the fixture repo
 * before calling simulateChange, so vitest is available without a separate
 * npm install inside the worktree.
 *
 * IMPORTANT: the junction must be removed with unlinkSync BEFORE removeFixtureRepo,
 * otherwise fs.rm({ recursive: true }) follows the junction and deletes the real
 * node_modules directory.
 */
import { describe, it, expect } from "vitest";
import { symlink } from "node:fs/promises";
import { unlinkSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { makeFixtureRepo, removeFixtureRepo } from "./helpers/makeFixtureRepo.js";
import { simulateChange } from "../src/tools/simulateChange.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Absolute path to rulescope-mcp/ */
const RULESCOPE_MCP_ROOT = resolve(__dirname, "..");

/** Absolute path to rulescope-mcp/node_modules */
const RULESCOPE_NODE_MODULES = join(RULESCOPE_MCP_ROOT, "node_modules");

// ─── Edit that changes 1.1 → 1.2 in src/pricing.ts ──────────────────────────
//
// toBeCloseTo(110, 5) passes for 1.1×100 ≈ 110 but fails for 1.2×100 = 120.

const EDITS_CHANGE_MULTIPLIER = [
  { file: "src/pricing.ts", search: "price * 1.1", replace: "price * 1.2" },
];

// Test code that imports the fixture function and asserts the original value
const TEST_CODE = `\
import { describe, it, expect } from "vitest";
import { applyMarkup } from "./src/pricing.js";

describe("applyMarkup", () => {
  it("applies 10% markup to 100", () => {
    expect(applyMarkup(100)).toBeCloseTo(110, 5);
  });
});
`;

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Creates a fixture repo, junctions rulescope-mcp/node_modules into it,
 * runs `fn`, then removes the junction and the fixture repo in the correct order.
 *
 * The junction MUST be removed (unlinkSync) before removeFixtureRepo so that
 * fs.rm({ recursive: true }) does not follow it into the real node_modules.
 */
async function withSimFixture<T>(
  fn: (repoPath: string) => Promise<T>,
): Promise<T> {
  const repoPath = await makeFixtureRepo("sim-fixture");
  const junctionDest = join(repoPath, "node_modules");

  try {
    await symlink(RULESCOPE_NODE_MODULES, junctionDest, "junction");
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
  }

  try {
    return await fn(repoPath);
  } finally {
    // Unlink junction FIRST — before removeFixtureRepo does recursive rm
    try { unlinkSync(junctionDest); } catch { /* already gone */ }
    await removeFixtureRepo(repoPath);
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("simulateChange — integration", () => {
  it(
    "before row passes, after row fails when multiplier patch is applied",
    async () => {
      await withSimFixture(async (repoPath) => {
        const result = await simulateChange({
          repoPath,
          edits: EDITS_CHANGE_MULTIPLIER,
          testCode: TEST_CODE,
        });

        // Exactly one test row
        expect(result.rows).toHaveLength(1);

        const row = result.rows[0];
        expect(row.input).toBe("applies 10% markup to 100");

        // Before the patch (1.1×100 ≈ 110) the test must pass
        expect(row.before).toBe("passed");

        // After the patch (1.2×100 = 120 ≠ 110) the test must fail
        expect(row.after).toMatch(/failed/);
        expect(row.passed).toBe(false);

        // Worktree path is reported (already cleaned up)
        expect(result.worktreePath).toBeTruthy();
      });
    },
    60_000,
  );

  it(
    "proof-only run (empty patch) — before and after are both passing",
    async () => {
      await withSimFixture(async (repoPath) => {
        const result = await simulateChange({
          repoPath,
          edits: [],   // proof-only — no edits applied
          testCode: TEST_CODE,
        });

        expect(result.rows).toHaveLength(1);
        const row = result.rows[0];
        expect(row.before).toBe("passed");
        expect(row.after).toBe("passed");
        expect(row.passed).toBe(true);
      });
    },
    60_000,
  );

  it(
    "worktree is cleaned up and node_modules/.bin survives after an invalid patch",
    async () => {
      const nodeModulesBin = join(RULESCOPE_NODE_MODULES, ".bin");

      await withSimFixture(async (repoPath) => {
        const BAD_EDITS = [{ file: "src/pricing.ts", search: "NONEXISTENT_STRING_XYZ", replace: "x" }];

        await expect(
          simulateChange({ repoPath, edits: BAD_EDITS, testCode: TEST_CODE }),
        ).rejects.toThrow("search string not found");

        // The source repo must be completely intact — git status exits 0
        const { spawnSync } = await import("node:child_process");
        const r = spawnSync("git", ["status"], { cwd: repoPath, encoding: "utf8" });
        expect(r.status).toBe(0);
      });

      // CRITICAL: rulescope-mcp/node_modules/.bin must still exist
      // (proves the junction cleanup did not delete the real node_modules)
      expect(existsSync(nodeModulesBin)).toBe(true);
    },
    60_000,
  );

  it(
    "node_modules/.bin survives a successful simulate_change run",
    async () => {
      const nodeModulesBin = join(RULESCOPE_NODE_MODULES, ".bin");

      await withSimFixture(async (repoPath) => {
        await simulateChange({
          repoPath,
          edits: EDITS_CHANGE_MULTIPLIER,
          testCode: TEST_CODE,
        });
      });

      expect(existsSync(nodeModulesBin)).toBe(true);
    },
    60_000,
  );
});
