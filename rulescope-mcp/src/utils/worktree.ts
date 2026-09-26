import { spawnSync } from "node:child_process";
import { symlink, rm } from "node:fs/promises";
import { join } from "node:path";

/**
 * Creates a temporary git worktree at `os.tmpdir()/rulescope-sim-<uuid>`,
 * symlinks `node_modules` from the original repo, optionally applies a patch,
 * and returns the worktree path.
 *
 * @param repoPath  Absolute path to the source git repository root.
 * @param uuid      Unique identifier for this worktree.
 * @returns Absolute path to the created worktree.
 */
export async function createWorktree(
  repoPath: string,
  uuid: string,
): Promise<string> {
  // TODO: implement
  void repoPath;
  void uuid;
  throw new Error("createWorktree: not yet implemented");
}

/**
 * Removes a git worktree unconditionally (`git worktree remove --force`).
 * Safe to call even if the worktree no longer exists.
 *
 * @param repoPath     Absolute path to the source git repository root.
 * @param worktreePath Absolute path to the worktree to remove.
 */
export async function removeWorktree(
  repoPath: string,
  worktreePath: string,
): Promise<void> {
  // TODO: implement
  void repoPath;
  void worktreePath;
  throw new Error("removeWorktree: not yet implemented");
}

// Re-export for convenience in other modules
export { symlink, rm, join };
