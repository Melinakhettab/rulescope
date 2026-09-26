import { writeFile, mkdir } from "node:fs/promises";
import { join, resolve, dirname, relative, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { ImpactReport, Severity } from "../types.js";

export interface SaveImpactReportInput {
  reportJson: ImpactReport;
}

// ─── Path resolution ──────────────────────────────────────────────────────────

// Compiled output lives at <repo-root>/rulescope-mcp/dist/src/tools/saveImpactReport.js
// (tsconfig includes src/ and test/, so tsc keeps the src/ folder under dist/).
// We walk up four levels to reach the repository root.
const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..", "..", "..", "..");
const REPORT_DATA_DIR = join(REPO_ROOT, "report", "data");

// ─── Validation ───────────────────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof ImpactReport)[] = [
  "ticketId",
  "createdAt",
  "items",
  "changePlan",
];

function validateReport(
  report: ImpactReport,
): string | null {
  if (report.$schema !== "https://rulescope/impact-report/v1") {
    return (
      `Invalid $schema: expected "https://rulescope/impact-report/v1", ` +
      `got ${JSON.stringify(report.$schema)}`
    );
  }

  for (const field of REQUIRED_FIELDS) {
    if (report[field] === undefined || report[field] === null) {
      return `Missing required field: ${field}`;
    }
  }

  // Validate that every ImpactItem has a non-empty evidence array
  if (!Array.isArray(report.items)) {
    return "Field 'items' must be an array";
  }
  for (const item of report.items) {
    if (!Array.isArray(item.evidence) || item.evidence.length === 0) {
      return `ImpactItem ${JSON.stringify(item.id)} has an empty evidence array — evidence rule violation`;
    }
  }

  // Every item needs an explicit severity — the report page never guesses it
  for (const item of report.items) {
    if (!SEVERITIES.includes(item.severity)) {
      return (
        `ImpactItem ${JSON.stringify(item.id)} has an invalid severity ` +
        `${JSON.stringify(item.severity)} (expected one of ${SEVERITIES.join(", ")})`
      );
    }
  }

  if (!Array.isArray(report.changePlan)) {
    return "Field 'changePlan' must be an array";
  }

  // The three file lists must not overlap within a repository
  const change = report.filesToChange ?? {};
  const check = report.filesToCheck ?? {};
  const safe = report.filesNotAffected ?? {};
  for (const repo of report.repoPaths ?? []) {
    const c = new Set(change[repo] ?? []);
    const k = new Set(check[repo] ?? []);
    for (const f of k) {
      if (c.has(f)) return `File ${JSON.stringify(f)} (${repo}) is both in filesToChange and filesToCheck`;
    }
    for (const f of safe[repo] ?? []) {
      if (c.has(f) || k.has(f)) {
        return `File ${JSON.stringify(f)} (${repo}) is in filesNotAffected but also in filesToChange/filesToCheck`;
      }
    }
  }

  // Every file the change plan touches must be classified
  for (const step of report.changePlan) {
    const c = change[step.repoPath] ?? [];
    const k = check[step.repoPath] ?? [];
    for (const f of step.targetFiles ?? []) {
      if (!c.includes(f) && !k.includes(f)) {
        return (
          `changePlan step ${step.order} targets ${JSON.stringify(f)} (${step.repoPath}), ` +
          `which is in neither filesToChange nor filesToCheck`
        );
      }
    }
  }

  return null;
}

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

// ─── Repository file counts ───────────────────────────────────────────────────

/**
 * Counts the tracked files of each repository with `git ls-files`, so the report
 * page can show how big the repositories really are (not just the files listed).
 * Repositories that cannot be read are skipped.
 */
function countRepoFiles(repoPaths: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const repo of repoPaths) {
    const cwd = isAbsolute(repo) ? repo : join(REPO_ROOT, repo);
    const res = spawnSync("git", ["ls-files"], { cwd, encoding: "utf8" });
    if (!res || res.status !== 0 || typeof res.stdout !== "string") continue;
    counts[repo] = res.stdout.split("\n").filter((l) => l.trim() !== "").length;
  }
  return counts;
}

// ─── Repository path normalisation ────────────────────────────────────────────

/**
 * Rewrites absolute repository paths that live inside this project
 * (e.g. C:/Users/<name>/rulescope/demo-workspace/novabank-api) as paths relative
 * to the project root, so reports look the same whichever machine produced them.
 */
function normalizeRepoPath(p: string): string {
  if (!isAbsolute(p)) return p;
  const rel = relative(REPO_ROOT, p);
  if (rel.startsWith("..") || isAbsolute(rel)) return p;
  return rel.split("\\").join("/");
}

function remapKeys<T>(obj: Record<string, T> | undefined): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(obj ?? {})) out[normalizeRepoPath(k)] = v;
  return out;
}

function normalizeReport(report: ImpactReport): ImpactReport {
  const n = normalizeRepoPath;
  return {
    ...report,
    repoPaths: (report.repoPaths ?? []).map(n),
    filesToChange: remapKeys(report.filesToChange),
    filesToCheck: remapKeys(report.filesToCheck),
    filesNotAffected: remapKeys(report.filesNotAffected),
    items: report.items.map((it) => ({ ...it, repoPath: n(it.repoPath) })),
    entryPoints: (report.entryPoints ?? []).map((it) => ({ ...it, repoPath: n(it.repoPath) })),
    changePlan: report.changePlan.map((s) => ({ ...s, repoPath: n(s.repoPath) })),
    simulations: (report.simulations ?? []).map((s) => ({ ...s, repoPath: n(s.repoPath) })),
    coverage: (report.coverage ?? []).map((c) => ({ ...c, repoPath: n(c.repoPath) })),
  };
}

// ─── ticketId sanitization ────────────────────────────────────────────────────

/**
 * Replaces any character that is not alphanumeric, '-', or '_' with '_'.
 * Returns null if the result is empty.
 */
function sanitizeTicketId(raw: string): string | null {
  const sanitized = raw.replace(/[^a-zA-Z0-9\-_]/g, "_");
  return sanitized.length > 0 ? sanitized : null;
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Validates and saves an ImpactReport JSON to report/data/<sanitizedTicketId>.json.
 * The output directory is resolved relative to the repository root (the parent
 * of the rulescope-mcp/ directory), not the analyzed repository.
 *
 * Returns { path } on success or { error } on failure.
 */
export async function saveImpactReport(
  input: SaveImpactReportInput,
): Promise<{ path: string } | { error: string }> {
  const validationError = validateReport(input.reportJson);
  if (validationError) {
    return { error: `save_impact_report validation failed: ${validationError}` };
  }

  const reportJson = normalizeReport(input.reportJson);
  const counts = countRepoFiles(reportJson.repoPaths);
  if (Object.keys(counts).length > 0) reportJson.repoFileCounts = counts;

  const sanitized = sanitizeTicketId(reportJson.ticketId);
  if (sanitized === null) {
    return { error: "save_impact_report: ticketId is empty after sanitization" };
  }

  const outputPath = join(REPORT_DATA_DIR, `${sanitized}.json`);

  await mkdir(REPORT_DATA_DIR, { recursive: true });
  await writeFile(outputPath, JSON.stringify(reportJson, null, 2), "utf8");

  const relativePath = `report/data/${sanitized}.json`;
  return { path: relativePath };
}
