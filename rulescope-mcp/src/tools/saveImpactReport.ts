import { writeFile, mkdir } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ImpactReport } from "../types.js";

export interface SaveImpactReportInput {
  reportJson: ImpactReport;
}

// ─── Path resolution ──────────────────────────────────────────────────────────

// This file lives at <repo-root>/rulescope-mcp/src/tools/saveImpactReport.ts
// We walk up three levels to reach the repository root.
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

  if (!Array.isArray(report.changePlan)) {
    return "Field 'changePlan' must be an array";
  }

  return null;
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
  const { reportJson } = input;

  const validationError = validateReport(reportJson);
  if (validationError) {
    return { error: `save_impact_report validation failed: ${validationError}` };
  }

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
