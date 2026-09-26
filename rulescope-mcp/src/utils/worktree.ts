import { spawnSync } from "node:child_process";
import { unlinkSync } from "node:fs";
import { symlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

function gitSync(args: string[], cwd: string): { status: number | null; stderr: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  return { status: r.status, stderr: r.stderr ?? "" };
}

/**
 * Creates a temporary git worktree at `os.tmpdir()/rulescope-sim-<uuid>`,
 * symlinks `node_modules` from the original repo into the worktree via a
 * junction (Windows-compatible, no npm install required).
 *
 * @param repoPath  Absolute path to the source git repository root.
 * @param uuid      Unique identifier for this worktree instance.
 * @returns Absolute path to the created worktree.
 */
export async function createWorktree(
  repoPath: string,
  uuid: string,
): Promise<string> {
  const worktreePath = join(tmpdir(), `rulescope-sim-${uuid}`);

  const addResult = gitSync(
    ["worktree", "add", worktreePath, "HEAD"],
    repoPath,
  );
  if (addResult.status !== 0) {
    throw new Error(
      `git worktree add failed (exit ${addResult.status}): ${addResult.stderr}`,
    );
  }

  // Disable CRLF auto-conversion so file content is consistent across platforms.
  gitSync(["config", "core.autocrlf", "false"], worktreePath);

  // Symlink node_modules from the source repo into the worktree.
  // Type "junction" works on Windows without elevated privileges.
  const src = join(repoPath, "node_modules");
  const dest = join(worktreePath, "node_modules");
  await symlink(src, dest, "junction");

  return worktreePath;
}

/**
 * Removes a git worktree unconditionally (`git worktree remove --force`),
 * then runs `git worktree prune` to tidy the metadata.
 * Safe to call even if the worktree no longer exists.
 *
 * @param repoPath     Absolute path to the source git repository root.
 * @param worktreePath Absolute path to the worktree to remove.
 */
export async function removeWorktree(
  repoPath: string,
  worktreePath: string,
): Promise<void> {
  // Remove the node_modules junction FIRST, before git worktree remove.
  // On Windows, git worktree remove --force would otherwise follow the
  // junction and recursively delete the real node_modules directory.
  const junctionPath = join(worktreePath, "node_modules");
  try {
    unlinkSync(junctionPath);
  } catch {
    // Junction may not exist (worktree creation failed before symlinking)
  }

  // --force handles the case where the directory is already gone
  gitSync(["worktree", "remove", "--force", worktreePath], repoPath);
  // Prune stale metadata regardless of whether remove succeeded
  gitSync(["worktree", "prune"], repoPath);
}

