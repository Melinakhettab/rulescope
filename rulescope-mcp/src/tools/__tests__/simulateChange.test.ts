/**
 * Unit tests for simulateChange.ts
 *
 * These tests mock createWorktree / removeWorktree / runVitest and the fs
 * readFile/writeFile so that no real git processes or filesystem operations
 * are needed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("../../utils/worktree.js", () => ({
  createWorktree: vi.fn(),
  removeWorktree: vi.fn(),
}));

vi.mock("../../utils/runVitest.js", () => ({
  runVitest: vi.fn(),
}));

// readFile returns file content; writeFile and access are no-ops
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
  // access resolves (file exists) by default so writeRulescopeConfig produces the mergeConfig branch
  access: vi.fn().mockResolvedValue(undefined),
}));

import { simulateChange } from "../simulateChange.js";
import * as worktreeModule from "../../utils/worktree.js";
import * as runVitestModule from "../../utils/runVitest.js";
import * as fsPromises from "node:fs/promises";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeVitestResult(title: string, status: "passed" | "failed", label: "before" | "after") {
  const detail = status === "passed" ? "passed" : "failed: AssertionError";
  return {
    rows: [
      {
        input: title,
        before: label === "before" ? detail : "",
        after: label === "after" ? detail : "",
        passed: status === "passed",
      },
    ],
    rawOutput: `vitest ${label} output`,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("simulateChange — unit (mocked)", () => {
  const FAKE_WORKTREE = "/tmp/rulescope-sim-test-uuid";
  const REPO_PATH = "/fake/repo";
  const TEST_CODE = 'import { expect, it } from "vitest"; it("x", () => expect(1).toBe(1));';
  const NO_EDITS: import("../../types.js").SimulationEdit[] = [];

  beforeEach(() => {
    (worktreeModule.createWorktree as Mock).mockResolvedValue(FAKE_WORKTREE);
    (worktreeModule.removeWorktree as Mock).mockResolvedValue(undefined);
    (fsPromises.readFile as unknown as Mock).mockResolvedValue("file content with search term");
    (runVitestModule.runVitest as Mock)
      .mockReturnValueOnce(makeVitestResult("my test", "passed", "before"))
      .mockReturnValueOnce(makeVitestResult("my test", "passed", "after"));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("happy path — creates worktree, runs before+after, removes worktree", async () => {
    const result = await simulateChange({
      repoPath: REPO_PATH,
      edits: NO_EDITS,
      testCode: TEST_CODE,
    });

    expect(worktreeModule.createWorktree).toHaveBeenCalledWith(REPO_PATH, expect.any(String));
    expect(runVitestModule.runVitest).toHaveBeenCalledTimes(2);
    expect(worktreeModule.removeWorktree).toHaveBeenCalledWith(REPO_PATH, FAKE_WORKTREE);

    expect(result.repoPath).toBe(REPO_PATH);
    expect(result.worktreePath).toBe(FAKE_WORKTREE);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].input).toBe("my test");
    expect(result.rows[0].before).toBe("passed");
    expect(result.rows[0].after).toBe("passed");
    expect(result.rows[0].passed).toBe(true);
  });

  it("applies edits when edits array is non-empty", async () => {
    const edits = [{ file: "src/foo.ts", search: "search term", replace: "replaced" }];
    await simulateChange({ repoPath: REPO_PATH, edits, testCode: TEST_CODE });

    // readFile should have been called for the edit's file (any path separator)
    expect(fsPromises.readFile).toHaveBeenCalledWith(
      expect.stringContaining("foo.ts"),
      "utf8",
    );
    // writeFile should have been called with the replaced content
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("foo.ts"),
      "file content with replaced",
      "utf8",
    );
  });

  it("does NOT call readFile/writeFile for an empty edits array (proof-only run)", async () => {
    await simulateChange({ repoPath: REPO_PATH, edits: [], testCode: TEST_CODE });

    // writeFile is called for the test file and the rulescope config, but NOT for any source edit
    const writeCalls = (fsPromises.writeFile as unknown as Mock).mock.calls;
    const editWrites = writeCalls.filter(
      (c) =>
        !(c[0] as string).includes("__rulescope_sim__") &&
        !(c[0] as string).includes("vitest.rulescope.config"),
    );
    expect(editWrites).toHaveLength(0);
  });

  it("before and after rows are identical for a proof-only run (empty edits)", async () => {
    const result = await simulateChange({ repoPath: REPO_PATH, edits: [], testCode: TEST_CODE });

    for (const row of result.rows) {
      expect(row.passed).toBe(true);
    }
  });

  it("cleanup guarantee — removeWorktree is called even when runVitest throws", async () => {
    (runVitestModule.runVitest as Mock).mockReset().mockImplementation(() => {
      throw new Error("vitest crashed");
    });

    await expect(
      simulateChange({ repoPath: REPO_PATH, edits: NO_EDITS, testCode: TEST_CODE }),
    ).rejects.toThrow("vitest crashed");

    expect(worktreeModule.removeWorktree).toHaveBeenCalledWith(REPO_PATH, FAKE_WORKTREE);
  });

  it("cleanup guarantee — removeWorktree is called even when applyEdits throws", async () => {
    // Make readFile return content that does NOT contain the search term
    (fsPromises.readFile as unknown as Mock).mockResolvedValue("no match here");

    const edits = [{ file: "src/foo.ts", search: "MISSING_TERM", replace: "x" }];

    await expect(
      simulateChange({ repoPath: REPO_PATH, edits, testCode: TEST_CODE }),
    ).rejects.toThrow("search string not found");

    expect(worktreeModule.removeWorktree).toHaveBeenCalledWith(REPO_PATH, FAKE_WORKTREE);
  });

  it("applyEdits throws when search string appears more than once", async () => {
    (fsPromises.readFile as unknown as Mock).mockResolvedValue("foo foo foo");

    const edits = [{ file: "src/foo.ts", search: "foo", replace: "bar" }];

    await expect(
      simulateChange({ repoPath: REPO_PATH, edits, testCode: TEST_CODE }),
    ).rejects.toThrow("found 3 times");

    expect(worktreeModule.removeWorktree).toHaveBeenCalledWith(REPO_PATH, FAKE_WORKTREE);
  });

  it("merges before/after rows by test title", async () => {
    (runVitestModule.runVitest as Mock)
      .mockReset()
      .mockReturnValueOnce({
        rows: [
          { input: "test A", before: "passed", after: "", passed: true },
          { input: "test B", before: "passed", after: "", passed: true },
        ],
        rawOutput: "before",
      })
      .mockReturnValueOnce({
        rows: [
          { input: "test A", before: "", after: "passed", passed: true },
          { input: "test B", before: "", after: "failed: AssertionError", passed: false },
        ],
        rawOutput: "after",
      });

    const edits = [{ file: "src/foo.ts", search: "search term", replace: "x" }];
    const result = await simulateChange({ repoPath: REPO_PATH, edits, testCode: TEST_CODE });

    expect(result.rows).toHaveLength(2);

    const rowA = result.rows.find((r) => r.input === "test A");
    expect(rowA?.before).toBe("passed");
    expect(rowA?.after).toBe("passed");
    expect(rowA?.passed).toBe(true);

    const rowB = result.rows.find((r) => r.input === "test B");
    expect(rowB?.before).toBe("passed");
    expect(rowB?.after).toBe("failed: AssertionError");
    expect(rowB?.passed).toBe(false);
  });

  it("result contains edits and testCode verbatim", async () => {
    const edits = [{ file: "src/foo.ts", search: "search term", replace: "x" }];
    const result = await simulateChange({ repoPath: REPO_PATH, edits, testCode: TEST_CODE });
    expect(result.edits).toEqual(edits);
    expect(result.testCode).toBe(TEST_CODE);
  });
});
