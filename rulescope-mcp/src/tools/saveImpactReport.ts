import type { ImpactReport } from "../types.js";

export interface SaveImpactReportInput {
  reportJson: ImpactReport;
}

/**
 * Validates and saves an ImpactReport JSON to report/data/<ticketId>.json.
 * Returns the path on success or an error description on failure.
 */
export async function saveImpactReport(
  input: SaveImpactReportInput,
): Promise<{ path: string } | { error: string }> {
  // TODO: implement
  void input;
  throw new Error("saveImpactReport: not yet implemented");
}
