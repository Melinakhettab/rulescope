import { describe, it, expect, afterEach } from "vitest";
import { findCandidates } from "../findCandidates.js";
import {
  makeFixtureRepo,
  removeFixtureRepo,
  withFixtureRepo,
} from "../../../test/helpers/makeFixtureRepo.js";

describe("findCandidates", () => {
  let repoPath: string | undefined;

  afterEach(async () => {
    if (repoPath) {
      await removeFixtureRepo(repoPath);
      repoPath = undefined;
    }
  });

  it("finds keyword hits in a real git repo", async () => {
    repoPath = await makeFixtureRepo("search-fixture");
    const result = await findCandidates({
      repoPaths: [repoPath],
      keywords: ["SHIPPING_THRESHOLD"],
      patterns: [],
    });

    expect("results" in result).toBe(true);
    if (!("results" in result)) return;

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].repoPath).toBe(repoPath);
    expect(result.results[0].file).toMatch(/shipping\.ts$/);
    expect(result.results[0].line).toBeGreaterThan(0);
    expect(result.results[0].snippet).toContain("SHIPPING_THRESHOLD");
  });

  it("finds regex pattern hits", async () => {
    repoPath = await makeFixtureRepo("search-fixture");
    const result = await findCandidates({
      repoPaths: [repoPath],
      keywords: [],
      patterns: ["SELECT.*FROM"],
    });

    expect("results" in result).toBe(true);
    if (!("results" in result)) return;

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].snippet).toMatch(/SELECT.*FROM/);
  });

  it("de-duplicates overlapping keyword and pattern hits", async () => {
    repoPath = await makeFixtureRepo("search-fixture");
    // Both keyword and pattern target the same line
    const result = await findCandidates({
      repoPaths: [repoPath],
      keywords: ["SHIPPING_THRESHOLD"],
      patterns: ["SHIPPING_THRESHOLD"],
    });

    expect("results" in result).toBe(true);
    if (!("results" in result)) return;

    // Count occurrences of the same file:line — must appear exactly once each
    const keys = result.results.map((r) => `${r.file}:${r.line}`);
    const unique = new Set(keys);
    expect(keys.length).toBe(unique.size);
  });

  it("returns error for a non-git directory", async () => {
    const result = await findCandidates({
      repoPaths: [process.env.TEMP ?? "C:\\Windows\\Temp"],
      keywords: ["anything"],
      patterns: [],
    });
    expect("error" in result).toBe(true);
  });

  it("returns error when repoPaths is empty", async () => {
    const result = await findCandidates({
      repoPaths: [],
      keywords: ["anything"],
      patterns: [],
    });
    expect("error" in result).toBe(true);
  });

  it("returns error when both keywords and patterns are empty", async () => {
    await withFixtureRepo("search-fixture", async (rp) => {
      const result = await findCandidates({
        repoPaths: [rp],
        keywords: [],
        patterns: [],
      });
      expect("error" in result).toBe(true);
    });
  });

  it("returns empty results (not error) when search hits nothing", async () => {
    repoPath = await makeFixtureRepo("search-fixture");
    const result = await findCandidates({
      repoPaths: [repoPath],
      keywords: ["XYZZY_NONEXISTENT_42"],
      patterns: [],
    });

    expect("results" in result).toBe(true);
    if (!("results" in result)) return;
    expect(result.results).toHaveLength(0);
  });

  it("searches across multiple repos", async () => {
    const repoA = await makeFixtureRepo("search-fixture");
    const repoB = await makeFixtureRepo("search-fixture");
    try {
      const result = await findCandidates({
        repoPaths: [repoA, repoB],
        keywords: ["SHIPPING_THRESHOLD"],
        patterns: [],
      });

      expect("results" in result).toBe(true);
      if (!("results" in result)) return;

      const repoAHits = result.results.filter((r) => r.repoPath === repoA);
      const repoBHits = result.results.filter((r) => r.repoPath === repoB);
      expect(repoAHits.length).toBeGreaterThan(0);
      expect(repoBHits.length).toBeGreaterThan(0);
    } finally {
      await removeFixtureRepo(repoA);
      await removeFixtureRepo(repoB);
    }
  });
});
