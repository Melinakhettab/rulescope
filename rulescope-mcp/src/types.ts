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

export type Severity = "critical" | "high" | "medium" | "low";

export interface ImpactItem {
  id: string;             // Stable slug, e.g. "business_rule:free-shipping-threshold"
  kind: ImpactItemKind;
  /**
   * critical = regulatory, legal, security or money-loss impact
   * high     = a core user flow breaks
   * medium   = a secondary flow breaks
   * low      = cosmetic or no functional impact
   * Required: the report page never guesses it.
   */
  severity: Severity;
  label: string;          // Human-readable title
  description: string;    // What it does and how it relates to the change request
  repoPath: string;       // Repository root; saved relative to the RuleScope root when inside it (e.g. "demo-workspace/novabank-api")
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
  before: string;   // Output / assertion result before the edit
  after: string;    // Output / assertion result after the edit
  passed: boolean;  // Whether the test passed after the edit
}

/** A single search-and-replace edit to apply inside the worktree. */
export interface SimulationEdit {
  /** Relative path to the file inside the repository */
  file: string;
  /** Exact string to find (must appear exactly once in the file) */
  search: string;
  /** String to replace the single occurrence with */
  replace: string;
}

export interface SimulationResult {
  repoPath: string;
  /** The edits that were applied, or empty array for a proof-only run */
  edits: SimulationEdit[];
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
  /**
   * filesToChange: every file that will be edited OR created, test files included.
   * filesToCheck:  files that are NOT edited but must be reviewed (callers, blockers, related rules).
   * filesNotAffected: files looked at and ruled out (may be a sample).
   * The three lists must not overlap, and every file in changePlan[].targetFiles
   * must appear in filesToChange or filesToCheck.
   */
  filesToChange: Record<string, string[]>;    // repoPath → file list
  filesToCheck: Record<string, string[]>;     // repoPath → file list
  filesNotAffected: Record<string, string[]>; // repoPath → file list (sampled)
  /**
   * repoPath → total number of tracked files in that repository.
   * Filled automatically by save_impact_report (git ls-files); used for the "Scanned" line.
   */
  repoFileCounts?: Record<string, number>;
  items: ImpactItem[];                        // All impacted items (all kinds)

  // Section 5 — Simulation
  simulations: SimulationResult[];

  // Section 6 — Git history (evidence already embedded in ImpactItem.evidence)
  // git_context output is stored inside the relevant ImpactItem evidence array

  // Section 7 — Test coverage
  coverage: RepoCoverage[];

  // Section 8 — Risk and effort
  riskLevel: RiskLevel;
  /**
   * Time and size only, e.g. "4–6 h backend + 2–3 h mobile, ~50 lines".
   * Never repeat file counts here: the page computes them from filesToChange / filesToCheck.
   */
  effortEstimate: string;
  riskRationale: string;

  // Section 9 — Change plan
  changePlan: ChangePlanStep[];

  /** The sign-off that blocks the work, if any. `owner` is who must sign off (e.g. "Risk/Fraud team"). */
  blockedBy?: { owner: string; reason: string } | null;
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
