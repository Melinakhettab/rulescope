import { describe, it, expect } from "vitest";
import { gitContext } from "../gitContext.js";
import { withFixtureRepo, makeFixtureRepo, removeFixtureRepo } from "../../../test/helpers/makeFixtureRepo.js";

describe("gitContext", () => {
  it("returns blame and log data for a known file range", async () => {
    await withFixtureRepo("search-fixture", async (repoPath) => {
      // shipping.ts has at least 3 lines — request lines 1-3
      const result = await gitContext({
        repoPath,
        file: "src/shipping.ts",
        startLine: 1,
        endLine: 3,
      });

      expect("error" in result).toBe(false);
      if ("error" in result) return;

      expect(result.repoPath).toBe(repoPath);
      expect(result.file).toBe("src/shipping.ts");
      expect(result.startLine).toBe(1);
      expect(result.endLine).toBe(3);

      expect(result.lines.length).toBe(3);
      for (const line of result.lines) {
        expect(line.commitHash).toHaveLength(40);
        expect(line.author).toBeTruthy();
        expect(line.date).toMatch(/^\d{4}-\d{2}-\d{2}/); // ISO-like date
      }

      expect(result.commits.length).toBeGreaterThan(0);
      expect(result.commits[0].hash).toHaveLength(40);
      expect(result.commits[0].author).toBeTruthy();
      expect(result.commits[0].subject).toBeTruthy();
    });
  });

  it("line numbers in result match the requested range", async () => {
    await withFixtureRepo("search-fixture", async (repoPath) => {
      const result = await gitContext({
        repoPath,
        file: "src/shipping.ts",
        startLine: 2,
        endLine: 4,
      });

      expect("error" in result).toBe(false);
      if ("error" in result) return;

      const lineNumbers = result.lines.map((l) => l.line);
      expect(lineNumbers).toContain(2);
      expect(lineNumbers).toContain(3);
      expect(lineNumbers).toContain(4);
    });
  });

  it("returns error for a non-git directory", async () => {
    const result = await gitContext({
      repoPath: process.env.TEMP ?? "C:\\Windows\\Temp",
      file: "nonexistent.ts",
      startLine: 1,
      endLine: 1,
    });
    expect("error" in result).toBe(true);
  });

  it("returns error for a non-existent file", async () => {
    let repoPath: string | undefined;
    try {
      repoPath = await makeFixtureRepo("search-fixture");
      const result = await gitContext({
        repoPath,
        file: "src/does-not-exist.ts",
        startLine: 1,
        endLine: 1,
      });
      expect("error" in result).toBe(true);
    } finally {
      if (repoPath) await removeFixtureRepo(repoPath);
    }
  });

  it("commits array contains unique hashes only", async () => {
    await withFixtureRepo("search-fixture", async (repoPath) => {
      const result = await gitContext({
        repoPath,
        file: "src/shipping.ts",
        startLine: 1,
        endLine: 5,
      });

      expect("error" in result).toBe(false);
      if ("error" in result) return;

      const hashes = result.commits.map((c) => c.hash);
      const unique = new Set(hashes);
      expect(hashes.length).toBe(unique.size);
    });
  });
});
