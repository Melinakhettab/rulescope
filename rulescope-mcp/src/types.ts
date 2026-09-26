// ─── Evidence ────────────────────────────────────────────────────────────────

/** A single piece of tool-produced evidence. Never inferred — always from a tool result. */
export interface Evidence {
  /** Relative file path inside the repository */
  file: string;
  /** 1-based line number */
  line: number;
  /** Short code snippet (the matched line or lines) */
  snippet: string;
  /** Tool that produced this evidence: "git_grep" | "git_blame" | "vitest" | "git_log" */
  tool: "git_grep" | "git_blame" | "vitest" | "git_log";
}

// ─── ImpactItem ──────────────────────────────────────────────────────────────

export type ImpactItemKind =
  | "business_rule"        // A conditional, threshold, or pricing rule
  | "technical_dependency" // A DB call, driver invocation, SQL dialect function
  | "config"               // Env var, hardcoded host, feature flag, connection string
  | "entry_point"          // HTTP route, CLI command, scheduled job, mobile screen
  | "cross_repo_link"      // Provider/consumer pair spanning repositories
  | "test";                // A test that exercises an affected item

export interface ImpactItem {
  id: string;             // Stable slug, e.g. "business_rule:free-shipping-threshold"
  kind: ImpactItemKind;
  label: string;          // Human-readable title
  description: string;    // What it does and how it relates to the change request
  repoPath: string;       // Absolute path to the repository root
  evidence: Evidence[];   // One or more tool-proven references — never empty

  /** For business_rule: evaluation order relative to sibling rules (1-based, null if unknown) */
  evaluationOrder?: number | null;

  /** For cross_repo_link: the paired item id in the other repository */
  linkedItemId?: string | null;

  /** Contradictions or duplicates found for this item */
  issues?: Array<{
    kind: "contradiction" | "duplicate" | "hidden_usage" | "unknown_external_consumer";
    description: string;
    evidence: Evidence[];
  }>;
}

// ─── SimulationResult ────────────────────────────────────────────────────────

export interface SimulationRow {
  input: string;    // Human-readable description of the test input
  before: string;   // Output / assertion result before the patch
  after: string;    // Output / assertion result after the patch
  passed: boolean;  // Whether the test passed after the patch
}

export interface SimulationResult {
  repoPath: string;
  /** The patch that was applied (unified diff), or empty string for a proof-only run */
  patch: string;
  /** The test code that was executed (vitest) */
  testCode: string;
  rows: SimulationRow[];
  /** Raw stdout/stderr from the vitest run, for debugging */
  rawOutput: string;
  /** Absolute path to the temporary worktree (already cleaned up) */
  worktreePath: string;
}

// ─── ImpactReport ────────────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface RepoCoverage {
  repoPath: string;
  /** Coverage percentage per impacted file (0–100) */
  fileCoverage: Record<string, number>;
  /** Coverage percentage per impacted function, keyed "file:functionName" */
  functionCoverage: Record<string, number>;
  /** Files with impacted items that have 0 % coverage */
  uncoveredFiles: string[];
}

export interface ChangePlanStep {
  order: number;
  action: string;         // Imperative sentence: "Replace the SHIPPING_THRESHOLD env var..."
  rationale: string;      // Why this step is needed
  targetFiles: string[];  // Files to modify
  repoPath: string;
}

export interface ImpactReport {
  /** JSON schema identifier — must equal "https://rulescope/impact-report/v1" */
  $schema: "https://rulescope/impact-report/v1";

  ticketId: string;
  title: string;
  /** ISO-8601 timestamp */
  createdAt: string;

  // Section 1 — Request understanding
  requestSummary: string;
  openQuestions: string[];

  // Section 2 — Entry points, per repository
  entryPoints: ImpactItem[];   // kind === "entry_point"

  // Sections 3 + 4 — File triage and impacted items
  repoPaths: string[];
  filesToChange: Record<string, string[]>;    // repoPath → file list
  filesToCheck: Record<string, string[]>;     // repoPath → file list
  filesNotAffected: Record<string, string[]>; // repoPath → file list (sampled)
  items: ImpactItem[];                        // All impacted items (all kinds)

  // Section 5 — Simulation
  simulations: SimulationResult[];

  // Section 6 — Git history (evidence already embedded in ImpactItem.evidence)
  // git_context output is stored inside the relevant ImpactItem evidence array

  // Section 7 — Test coverage
  coverage: RepoCoverage[];

  // Section 8 — Risk and effort
  riskLevel: RiskLevel;
  effortEstimate: string;       // Free text, e.g. "2–3 files, ~50 lines changed"
  riskRationale: string;

  // Section 9 — Change plan
  changePlan: ChangePlanStep[];
}

// ─── Tool result types ───────────────────────────────────────────────────────

export interface CandidateResult {
  repoPath: string;
  file: string;
  line: number;
  snippet: string;
}

export interface CrossRepoLink {
  kind: "http_route" | "shared_package" | "db_table" | "event_topic";
  provider: Evidence & { repoPath: string };
  consumer: Evidence & { repoPath: string };
  matchedValue: string; // e.g. "/api/shipping", "my-shared-lib", "orders"
}

export interface GitContextResult {
  repoPath: string;
  file: string;
  startLine: number;
  endLine: number;
  lines: Array<{
    line: number;
    commitHash: string;
    author: string;
    date: string;       // ISO-8601
    message: string;
  }>;
  commits: Array<{
    hash: string;
    author: string;
    email: string;
    date: string;
    subject: string;
    body: string;
  }>;
}
