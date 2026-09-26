/**
 * Test helper: creates a fresh git repository in os.tmpdir() from plain
 * template files stored in rulescope-mcp/test/fixtures/<name>/.
 *
 * Usage:
 *   const repoPath = await makeFixtureRepo("my-fixture");
 *   // ... run tests ...
 *   await removeFixtureRepo(repoPath);
 *
 * Or use the convenience wrapper:
 *   await withFixtureRepo("my-fixture", async (repoPath) => { ... });
 */
import { mkdtemp, cp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Absolute path to rulescope-mcp/test/fixtures/ */
const FIXTURES_DIR = join(__dirname, "..", "fixtures");

function git(args: string[], cwd: string): void {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      // Ensure a clean git identity for tests regardless of global config
      GIT_AUTHOR_NAME: "Test User",
      GIT_AUTHOR_EMAIL: "test@example.com",
      GIT_COMMITTER_NAME: "Test User",
      GIT_COMMITTER_EMAIL: "test@example.com",
    },
  });
  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed (exit ${result.status}): ${result.stderr ?? ""}`,
    );
  }
}

/**
 * Creates a temporary git repository from the named fixture template.
 * The fixture directory at test/fixtures/<name>/ must already exist.
 *
 * @param fixtureName  Sub-directory name inside test/fixtures/
 * @returns Absolute path to the newly created temporary repository.
 */
export async function makeFixtureRepo(fixtureName: string): Promise<string> {
  // Create a temp dir
  const repoPath = await mkdtemp(join(tmpdir(), `rulescope-test-${fixtureName}-`));

  // Copy fixture files into the temp dir
  const src = join(FIXTURES_DIR, fixtureName);
  await cp(src, repoPath, { recursive: true });

  // Initialise git repo with a local identity
  git(["init", "-b", "main"], repoPath);
  git(["config", "user.name", "Test User"], repoPath);
  git(["config", "user.email", "test@example.com"], repoPath);
  git(["add", "."], repoPath);
  git(["commit", "-m", "initial commit"], repoPath);

  return repoPath;
}

/**
 * Removes a temporary repository created by makeFixtureRepo.
 * Safe to call even if the directory has already been removed.
 */
export async function removeFixtureRepo(repoPath: string): Promise<void> {
  try {
    await rm(repoPath, { recursive: true, force: true });
  } catch {
    // best-effort cleanup — don't fail the test run
  }
}

/**
 * Convenience wrapper: creates a fixture repo, runs `fn`, then removes it.
 */
export async function withFixtureRepo<T>(
  fixtureName: string,
  fn: (repoPath: string) => Promise<T>,
): Promise<T> {
  const repoPath = await makeFixtureRepo(fixtureName);
  try {
    return await fn(repoPath);
  } finally {
    await removeFixtureRepo(repoPath);
  }
}
