# build-demo.ps1
# Generates two demo git repositories under demo-workspace/ simulating "NovaBank"
# Usage: pwsh -File demo/build-demo.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Join-Path (Join-Path $PSScriptRoot "..") "demo-workspace"
$root = (Resolve-Path (New-Item -ItemType Directory -Force -Path $root)).Path

function Commit {
    param(
        [string]$Msg,
        [string]$Date,
        [string]$AuthorName,
        [string]$AuthorEmail
    )
    $env:GIT_AUTHOR_DATE    = $Date
    $env:GIT_COMMITTER_DATE = $Date
    git -c "user.name=$AuthorName" -c "user.email=$AuthorEmail" commit -m $Msg | Out-Null
    $env:GIT_AUTHOR_DATE    = $null
    $env:GIT_COMMITTER_DATE = $null
}

function AddAndCommit {
    param(
        [string]$Msg,
        [string]$Date,
        [string]$AuthorName,
        [string]$AuthorEmail
    )
    git add -A | Out-Null
    Commit -Msg $Msg -Date $Date -AuthorName $AuthorName -AuthorEmail $AuthorEmail
}

# ─────────────────────────────────────────────────────────────────────────────
# REPO 1 — novabank-api
# ─────────────────────────────────────────────────────────────────────────────
$apiDir = Join-Path $root "novabank-api"
if (Test-Path $apiDir) { Remove-Item -Recurse -Force $apiDir }
New-Item -ItemType Directory -Force -Path $apiDir | Out-Null
Set-Location $apiDir
git init -b main | Out-Null
# Fixed date so the commit history (and every commit hash) is the same on every machine
$env:GIT_AUTHOR_DATE    = "2023-01-09T09:00:00+01:00"
$env:GIT_COMMITTER_DATE = "2023-01-09T09:00:00+01:00"
git -c "user.name=Alice Martin" -c "user.email=alice@novabank.io" commit --allow-empty -m "Initial empty commit" | Out-Null
$env:GIT_AUTHOR_DATE    = $null
$env:GIT_COMMITTER_DATE = $null

# ── Commit 1: project scaffold ──────────────────────────────────────────────
New-Item -ItemType Directory -Force -Path "src/api","src/customers","src/transfers","src/fraud","src/compliance","src/cards","src/notifications","src/logging","src/retention","src/db","tests" | Out-Null

Set-Content "package.json" @'
{
  "name": "novabank-api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^1.6.1",
    "vitest": "^1.6.1"
  }
}
'@

Set-Content "tsconfig.json" @'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src", "tests"]
}
'@

Set-Content ".gitignore" @'
node_modules/
dist/
'@

AddAndCommit "chore: scaffold novabank-api project" "2023-01-10T09:00:00+01:00" "Alice Martin" "alice@novabank.io"

# ── Commit 2: db layer ───────────────────────────────────────────────────────
Set-Content "src/db/db.ts" @'
// SQLite-backed query interface
// Uses better-sqlite3 at runtime; tests inject a fake

export interface DbRow {
  [col: string]: unknown;
}

let _query: (sql: string, params?: unknown[]) => DbRow[] = () => {
  throw new Error("db not initialised");
};

export function initDb(queryFn: (sql: string, params?: unknown[]) => DbRow[]) {
  _query = queryFn;
}

export function db_query(sql: string, params: unknown[] = []): DbRow[] {
  return _query(sql, params);
}
'@

Set-Content "src/db/accountsRepo.ts" @'
import { db_query, type DbRow } from "./db.js";

export interface AccountRow {
  id: string;
  iban: string;
  balance: number;
  customerId: string;
}

export function getAccount(id: string): AccountRow | undefined {
  const rows = db_query(
    "SELECT id, iban, balance, customerId FROM accounts WHERE id = ?",
    [id]
  );
  return rows[0] as AccountRow | undefined;
}

export function debitAccount(id: string, amount: number): void {
  db_query(
    "UPDATE accounts SET balance = balance - ? WHERE id = ?",
    [amount, id]
  );
}
'@

Set-Content "src/db/transfersRepo.ts" @'
import { db_query } from "./db.js";

export interface TransferRecord {
  id?: number;
  fromAccountId: string;
  toIban: string;
  amount: number;
  status: string;
  createdAt?: string;
}

export function insertTransfer(t: TransferRecord): void {
  // SQLite-specific: AUTOINCREMENT, datetime('now')
  db_query(
    `INSERT INTO transfers (fromAccountId, toIban, amount, status, createdAt)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [t.fromAccountId, t.toIban, t.amount, t.status]
  );
}

export function getDailyTotal(accountId: string, calendarDay: string): number {
  // calendarDay is YYYY-MM-DD in Europe/Paris, computed by caller
  const rows = db_query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM transfers
     WHERE fromAccountId = ?
       AND status = 'COMPLETED'
       AND strftime('%Y-%m-%d', createdAt) = ?`,
    [accountId, calendarDay]
  );
  return Number((rows[0] as { total: number }).total);
}
'@

Set-Content "src/db/customersRepo.ts" @'
import { db_query, type DbRow } from "./db.js";

export type CustomerTier = "STANDARD" | "PREMIUM";

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  iban: string;
  tier: CustomerTier;
}

export function getCustomer(id: string): CustomerRow | undefined {
  const rows = db_query(
    "SELECT id, name, email, phone, iban, tier FROM customers WHERE id = ?",
    [id]
  );
  return rows[0] as CustomerRow | undefined;
}

export function upsertCustomer(c: CustomerRow): void {
  // SQLite-specific: INSERT OR REPLACE
  db_query(
    `INSERT OR REPLACE INTO customers (id, name, email, phone, iban, tier)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [c.id, c.name, c.email, c.phone, c.iban, c.tier]
  );
}
'@

AddAndCommit "feat: add SQLite data layer (accounts, transfers, customers)" "2023-02-14T11:30:00+01:00" "Alice Martin" "alice@novabank.io"

# ── Commit 3: customers module ───────────────────────────────────────────────
Set-Content "src/customers/index.ts" @'
export { getCustomer, upsertCustomer, type CustomerRow, type CustomerTier } from "../db/customersRepo.js";
'@

AddAndCommit "feat: expose customers module" "2023-03-05T10:00:00+01:00" "Bob Chen" "bob@novabank.io"

# ── Commit 4: transfer limits ────────────────────────────────────────────────
Set-Content "src/transfers/limits.ts" @'
// Transfer limits — applies to all customers regardless of tier
// Calendar-day window anchored to Europe/Paris timezone

export const DAILY_LIMIT = 1000; // EUR

/**
 * Returns the current calendar day in Europe/Paris as YYYY-MM-DD.
 * Used to bucket transfers per day (not rolling 24 h).
 */
export function getParisDayString(now: Date = new Date()): string {
  return now.toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .split("/")
    .reverse()
    .join("-");
}
'@

AddAndCommit "feat: daily transfer limit EUR 1000 per calendar day (Europe/Paris)" "2023-04-20T14:00:00+02:00" "Alice Martin" "alice@novabank.io"

# ── Commit 5: fraud rules ────────────────────────────────────────────────────
Set-Content "src/fraud/rules.ts" @'
// Fraud detection rules

export type FraudDecision = "ALLOW" | "PENDING_REVIEW";

export interface FraudCheckResult {
  decision: FraudDecision;
  reason?: string;
}

/**
 * Block transfers above 2000 pending manual review - fraud incident FR-2024-17
 */
export function checkFraud(amount: number): FraudCheckResult {
  if (amount > 2000) {
    return {
      decision: "PENDING_REVIEW",
      reason: "Amount exceeds fraud threshold (FR-2024-17)",
    };
  }
  return { decision: "ALLOW" };
}
'@

AddAndCommit "Block transfers above 2000 pending manual review - fraud incident FR-2024-17" "2024-03-11T09:45:00+01:00" "Carol Durand" "carol@novabank.io"

# ── Commit 6: transfer service ───────────────────────────────────────────────
Set-Content "src/transfers/transferService.ts" @'
import { DAILY_LIMIT, getParisDayString } from "./limits.js";
import { checkFraud } from "../fraud/rules.js";
import { getDailyTotal, insertTransfer } from "../db/transfersRepo.js";
import { logTransferEvent } from "../logging/logger.js";
import { getCustomer } from "../db/customersRepo.js";

export type TransferStatus = "COMPLETED" | "REJECTED" | "PENDING_REVIEW";

export interface TransferRequest {
  fromAccountId: string;
  customerId: string;
  toIban: string;
  amount: number;
}

export interface TransferResult {
  status: TransferStatus;
  reason?: string;
}

export async function executeTransfer(req: TransferRequest): Promise<TransferResult> {
  const { fromAccountId, customerId, toIban, amount } = req;

  // 1. Fraud check — takes priority over all other checks
  const fraud = checkFraud(amount);
  if (fraud.decision !== "ALLOW") {
    insertTransfer({ fromAccountId, toIban, amount, status: "PENDING_REVIEW" });
    const customer = getCustomer(customerId);
    if (customer) logTransferEvent(customer, amount, "PENDING_REVIEW");
    return { status: "PENDING_REVIEW", reason: fraud.reason };
  }

  // 2. Check daily limit (calendar day, Europe/Paris)
  const today = getParisDayString();
  const dailyTotal = getDailyTotal(fromAccountId, today);
  if (dailyTotal + amount > DAILY_LIMIT) {
    return { status: "REJECTED", reason: "Daily limit exceeded" };
  }

  // 3. Record transfer
  insertTransfer({ fromAccountId, toIban, amount, status: "COMPLETED" });
  const customer = getCustomer(customerId);
  if (customer) logTransferEvent(customer, amount, "COMPLETED");

  return { status: "COMPLETED" };
}
'@

AddAndCommit "feat: transfer service (limit check, fraud check, record)" "2024-04-02T16:20:00+02:00" "Bob Chen" "bob@novabank.io"

# ── Commit 7: logging ────────────────────────────────────────────────────────
Set-Content "src/logging/logger.ts" @'
import type { CustomerRow } from "../db/customersRepo.js";

// Logs customer PII on every transfer event
export function logTransferEvent(
  customer: CustomerRow,
  amount: number,
  status: string
): void {
  console.log(
    `[TRANSFER] customerId=${customer.id} email=${customer.email} iban=${customer.iban} amount=${amount} status=${status}`
  );
}
'@

AddAndCommit "feat: logging for transfer events" "2024-04-05T09:00:00+02:00" "Alice Martin" "alice@novabank.io"

# ── Commit 8: AML compliance report ─────────────────────────────────────────
Set-Content "src/compliance/amlReport.ts" @'
// AML nightly report - regulatory requirement COMP-7
// Reports transfers >= 3000 over a ROLLING 24-hour window

import { db_query } from "../db/db.js";

export const AML_REPORTING_THRESHOLD = 3000; // EUR

export interface AmlReportEntry {
  fromAccountId: string;
  toIban: string;
  amount: number;
  createdAt: string;
}

/**
 * Returns all transfers >= AML_REPORTING_THRESHOLD in the last 24 hours.
 * Uses SQLite strftime for time arithmetic.
 */
export function getAmlCandidates(): AmlReportEntry[] {
  // SQLite-specific: datetime('now', '-24 hours')
  const rows = db_query(
    `SELECT fromAccountId, toIban, amount, createdAt
     FROM transfers
     WHERE amount >= ?
       AND status = 'COMPLETED'
       AND createdAt >= datetime('now', '-24 hours')`,
    [AML_REPORTING_THRESHOLD]
  );
  return rows as AmlReportEntry[];
}
'@

AddAndCommit "AML nightly report - regulatory requirement COMP-7" "2024-05-18T08:30:00+02:00" "Carol Durand" "carol@novabank.io"

# ── Commit 9: cards, notifications, retention ────────────────────────────────
Set-Content "src/cards/cardLimits.ts" @'
// Card payment limits — separate from transfer limits
export const CARD_LIMIT = 1000; // EUR per transaction

export function checkCardLimit(amount: number): boolean {
  return amount <= CARD_LIMIT;
}
'@

Set-Content "src/notifications/templates.ts" @'
export const TEMPLATES = {
  transferConfirmed: (amount: number, toIban: string) =>
    `Your transfer of €${amount} to ${toIban} has been confirmed.`,

  limitInfo: () => "Your daily transfer limit is \u20AC1,000",

  pendingReview: (amount: number) =>
    `Your transfer of €${amount} is under review. We will notify you shortly.`,
};
'@

Set-Content "src/retention/policy.ts" @'
// Data retention policy
// keep transaction history for 10 years - AML obligation COMP-3
export const RETENTION_YEARS = 10;

export function isEligibleForDeletion(createdAt: Date): boolean {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - RETENTION_YEARS);
  return createdAt < cutoff;
}
'@

AddAndCommit "feat: card limits, notification templates, retention policy" "2024-06-10T11:00:00+02:00" "Bob Chen" "bob@novabank.io"

# ── Commit 10: API router + tests ────────────────────────────────────────────
Set-Content "src/api/routes.ts" @'
// Minimal router — no Express dependency
import { executeTransfer } from "../transfers/transferService.js";
import { getAccount } from "../db/accountsRepo.js";
import { DAILY_LIMIT } from "../transfers/limits.js";

export interface RouteRequest {
  method: string;
  path: string;
  params?: Record<string, string>;
  body?: unknown;
}

export interface RouteResponse {
  status: number;
  body: unknown;
}

type Handler = (req: RouteRequest) => Promise<RouteResponse>;

const routes: Array<{ method: string; pattern: RegExp; paramNames: string[]; handler: Handler }> = [];

function addRoute(method: string, path: string, handler: Handler) {
  const paramNames: string[] = [];
  const pattern = new RegExp(
    "^" + path.replace(/:([a-z]+)/g, (_, n) => { paramNames.push(n); return "([^/]+)"; }) + "$"
  );
  routes.push({ method, pattern, paramNames, handler });
}

export function router(req: RouteRequest): Promise<RouteResponse> {
  for (const route of routes) {
    if (route.method !== req.method) continue;
    const m = route.pattern.exec(req.path);
    if (!m) continue;
    const params: Record<string, string> = {};
    route.paramNames.forEach((n, i) => { params[n] = m[i + 1]; });
    return route.handler({ ...req, params });
  }
  return Promise.resolve({ status: 404, body: { error: "Not found" } });
}

// POST /api/transfers
addRoute("POST", "/api/transfers", async (req) => {
  const { fromAccountId, customerId, toIban, amount } = req.body as {
    fromAccountId: string;
    customerId: string;
    toIban: string;
    amount: number;
  };
  const result = await executeTransfer({ fromAccountId, customerId, toIban, amount });
  return { status: result.status === "COMPLETED" ? 200 : 422, body: result };
});

// GET /api/limits
addRoute("GET", "/api/limits", async (_req) => {
  return { status: 200, body: { dailyLimit: DAILY_LIMIT } };
});

// GET /api/accounts/:id
addRoute("GET", "/api/accounts/:id", async (req) => {
  const account = getAccount(req.params!.id);
  if (!account) return { status: 404, body: { error: "Account not found" } };
  return { status: 200, body: account };
});
'@

# Tests
Set-Content "tests/limits.test.ts" @'
import { describe, it, expect } from "vitest";
import { DAILY_LIMIT, getParisDayString } from "../src/transfers/limits.js";

describe("DAILY_LIMIT", () => {
  it("is 1000", () => {
    expect(DAILY_LIMIT).toBe(1000);
  });
});

describe("getParisDayString", () => {
  it("returns YYYY-MM-DD format", () => {
    const s = getParisDayString(new Date("2024-06-15T12:00:00Z"));
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
'@

Set-Content "tests/fraud.test.ts" @'
import { describe, it, expect } from "vitest";
import { checkFraud } from "../src/fraud/rules.js";

describe("checkFraud", () => {
  it("allows transfers at or below 2000", () => {
    expect(checkFraud(2000).decision).toBe("ALLOW");
    expect(checkFraud(500).decision).toBe("ALLOW");
  });

  it("flags transfers above 2000 as PENDING_REVIEW", () => {
    const result = checkFraud(2001);
    expect(result.decision).toBe("PENDING_REVIEW");
    expect(result.reason).toContain("FR-2024-17");
  });
});
'@

Set-Content "tests/transferService.test.ts" @'
import { describe, it, expect, beforeEach } from "vitest";
import { initDb } from "../src/db/db.js";
import { executeTransfer } from "../src/transfers/transferService.js";

// In-memory fake — no native modules
const store: Record<string, unknown[]> = {
  transfers: [],
  customers: [
    {
      id: "c1",
      name: "Jean Dupont",
      email: "jean@example.com",
      phone: "+33600000001",
      iban: "FR7630006000011234567890189",
      tier: "STANDARD",
    },
  ],
};

function fakeQuery(sql: string, params: unknown[] = []): unknown[] {
  if (/INSERT INTO transfers/.test(sql)) {
    const [fromAccountId, toIban, amount, status] = params as [string, string, number, string];
    (store.transfers as object[]).push({ fromAccountId, toIban, amount, status, createdAt: new Date().toISOString() });
    return [];
  }
  if (/SUM\(amount\)/.test(sql)) {
    const [accountId, day] = params as [string, string];
    const total = (store.transfers as Array<{ fromAccountId: string; status: string; createdAt: string; amount: number }>)
      .filter(
        (t) =>
          t.fromAccountId === accountId &&
          t.status === "COMPLETED" &&
          t.createdAt.startsWith(day)
      )
      .reduce((s, t) => s + t.amount, 0);
    return [{ total }];
  }
  if (/SELECT.*customers/.test(sql)) {
    const [id] = params as [string];
    return (store.customers as Array<{ id: string }>).filter((c) => c.id === id);
  }
  return [];
}

beforeEach(() => {
  store.transfers = [];
  initDb(fakeQuery as never);
});

describe("executeTransfer", () => {
  it("completes a transfer within the daily limit", async () => {
    const r = await executeTransfer({
      fromAccountId: "a1",
      customerId: "c1",
      toIban: "DE89370400440532013000",
      amount: 500,
    });
    expect(r.status).toBe("COMPLETED");
  });

  it("rejects when daily limit is exceeded", async () => {
    await executeTransfer({ fromAccountId: "a1", customerId: "c1", toIban: "DE89370400440532013000", amount: 800 });
    const r = await executeTransfer({ fromAccountId: "a1", customerId: "c1", toIban: "DE89370400440532013000", amount: 300 });
    expect(r.status).toBe("REJECTED");
    expect(r.reason).toMatch(/limit/i);
  });

  it("returns PENDING_REVIEW for amount above fraud threshold", async () => {
    const r = await executeTransfer({
      fromAccountId: "a1",
      customerId: "c1",
      toIban: "DE89370400440532013000",
      amount: 2500,
    });
    expect(r.status).toBe("PENDING_REVIEW");
  });
});
'@

Set-Content "tests/routes.test.ts" @'
import { describe, it, expect, beforeEach } from "vitest";
import { initDb } from "../src/db/db.js";
import { router } from "../src/api/routes.js";

const store = { transfers: [] as object[], accounts: [{ id: "acc1", iban: "FR76300060000112345678", balance: 5000, customerId: "c1" }], customers: [{ id: "c1", name: "Jean Dupont", email: "jean@example.com", phone: "+33600000001", iban: "FR76300060000112345678", tier: "STANDARD" }] };

function fakeQuery(sql: string, params: unknown[] = []): unknown[] {
  if (/INSERT INTO transfers/.test(sql)) {
    const [fromAccountId, toIban, amount, status] = params as [string, string, number, string];
    (store.transfers as Array<Record<string, unknown>>).push({ fromAccountId, toIban, amount, status, createdAt: new Date().toISOString() });
    return [];
  }
  if (/SUM\(amount\)/.test(sql)) return [{ total: 0 }];
  if (/SELECT.*accounts/.test(sql)) {
    const [id] = params as [string];
    return store.accounts.filter((a) => a.id === id);
  }
  if (/SELECT.*customers/.test(sql)) {
    const [id] = params as [string];
    return store.customers.filter((c) => c.id === id);
  }
  return [];
}

beforeEach(() => {
  store.transfers = [];
  initDb(fakeQuery as never);
});

describe("GET /api/limits", () => {
  it("returns dailyLimit 1000", async () => {
    const res = await router({ method: "GET", path: "/api/limits" });
    expect(res.status).toBe(200);
    expect((res.body as { dailyLimit: number }).dailyLimit).toBe(1000);
  });
});

describe("GET /api/accounts/:id", () => {
  it("returns account for known id", async () => {
    const res = await router({ method: "GET", path: "/api/accounts/acc1" });
    expect(res.status).toBe(200);
    expect((res.body as { id: string }).id).toBe("acc1");
  });

  it("returns 404 for unknown id", async () => {
    const res = await router({ method: "GET", path: "/api/accounts/unknown" });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/transfers", () => {
  it("processes a valid transfer", async () => {
    const res = await router({
      method: "POST",
      path: "/api/transfers",
      body: { fromAccountId: "acc1", customerId: "c1", toIban: "DE89370400440532013000", amount: 200 },
    });
    expect(res.status).toBe(200);
  });
});
'@

Set-Content "tests/cards.test.ts" @'
import { describe, it, expect } from "vitest";
import { checkCardLimit, CARD_LIMIT } from "../src/cards/cardLimits.js";

describe("checkCardLimit", () => {
  it("CARD_LIMIT is 1000", () => {
    expect(CARD_LIMIT).toBe(1000);
  });

  it("allows payments at or below the card limit", () => {
    expect(checkCardLimit(1000)).toBe(true);
    expect(checkCardLimit(500)).toBe(true);
  });

  it("blocks payments above the card limit", () => {
    expect(checkCardLimit(1001)).toBe(false);
  });
});
'@

Set-Content "tests/retention.test.ts" @'
import { describe, it, expect } from "vitest";
import { isEligibleForDeletion, RETENTION_YEARS } from "../src/retention/policy.js";

describe("retention policy", () => {
  it("RETENTION_YEARS is 10", () => {
    expect(RETENTION_YEARS).toBe(10);
  });

  it("marks old records as eligible for deletion", () => {
    const old = new Date("2010-01-01");
    expect(isEligibleForDeletion(old)).toBe(true);
  });

  it("keeps recent records", () => {
    expect(isEligibleForDeletion(new Date())).toBe(false);
  });
});
'@

AddAndCommit "feat: API router, all routes, and tests" "2024-07-22T15:00:00+02:00" "Alice Martin" "alice@novabank.io"

# ── Commit 11: vitest config ─────────────────────────────────────────────────
Set-Content "vitest.config.ts" @'
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
'@

AddAndCommit "chore: add vitest config" "2024-08-01T10:00:00+02:00" "Bob Chen" "bob@novabank.io"

# ─────────────────────────────────────────────────────────────────────────────
# Install & test novabank-api
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "Installing novabank-api dependencies..."
npm install --silent
Write-Host "Running novabank-api tests..."
npm test

# ─────────────────────────────────────────────────────────────────────────────
# REPO 2 — novabank-mobile
# ─────────────────────────────────────────────────────────────────────────────
$mobileDir = Join-Path $root "novabank-mobile"
if (Test-Path $mobileDir) { Remove-Item -Recurse -Force $mobileDir }
New-Item -ItemType Directory -Force -Path $mobileDir | Out-Null
Set-Location $mobileDir
git init -b main | Out-Null
# Fixed date so the commit history (and every commit hash) is the same on every machine
$env:GIT_AUTHOR_DATE    = "2023-01-14T09:00:00+01:00"
$env:GIT_COMMITTER_DATE = "2023-01-14T09:00:00+01:00"
git -c "user.name=David Kim" -c "user.email=david@novabank.io" commit --allow-empty -m "Initial empty commit" | Out-Null
$env:GIT_AUTHOR_DATE    = $null
$env:GIT_COMMITTER_DATE = $null

# ── Commit 1: scaffold ────────────────────────────────────────────────────────
New-Item -ItemType Directory -Force -Path "src/services","src/transfers","src/screens","src/analytics","tests" | Out-Null

Set-Content "package.json" @'
{
  "name": "novabank-mobile",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^1.6.1",
    "vitest": "^1.6.1"
  }
}
'@

Set-Content "tsconfig.json" @'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true
  },
  "include": ["src", "tests"]
}
'@

Set-Content ".gitignore" @'
node_modules/
dist/
'@

AddAndCommit "chore: scaffold novabank-mobile project" "2023-01-15T10:00:00+01:00" "David Kim" "david@novabank.io"

# ── Commit 2: config ──────────────────────────────────────────────────────────
Set-Content "src/config.ts" @'
// API host configuration
export const API_HOST = "http://10.0.3.12:8080";
'@

AddAndCommit "chore: add API host config" "2023-02-20T11:00:00+01:00" "David Kim" "david@novabank.io"

# ── Commit 3: api service ─────────────────────────────────────────────────────
Set-Content "src/services/api.ts" @'
import { API_HOST } from "../config.js";

export interface TransferPayload {
  fromAccountId: string;
  customerId: string;
  toIban: string;
  amount: number;
}

export async function postTransfer(payload: TransferPayload): Promise<unknown> {
  const res = await fetch(`${API_HOST}/api/transfers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getLimits(): Promise<{ dailyLimit: number }> {
  const res = await fetch(`${API_HOST}/api/limits`);
  return res.json();
}

export async function getAccount(id: string): Promise<unknown> {
  const res = await fetch(`${API_HOST}/api/accounts/` + id);
  return res.json();
}
'@

AddAndCommit "feat: API service layer (transfers, limits, accounts)" "2023-04-10T14:30:00+02:00" "Elena Rossi" "elena@novabank.io"

# ── Commit 4: transfer validation with client-side limit check ────────────────
Set-Content "src/transfers/validateTransfer.ts" @'
// Client-side limit check to save API calls
export const CLIENT_DAILY_LIMIT = 1000; // EUR

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateTransfer(amount: number): ValidationResult {
  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    return { valid: false, error: "Amount must be a positive number" };
  }
  if (amount > CLIENT_DAILY_LIMIT) {
    return { valid: false, error: "Daily limit exceeded" };
  }
  return { valid: true };
}
'@

AddAndCommit "Client-side limit check to save API calls" "2023-06-05T09:15:00+02:00" "David Kim" "david@novabank.io"

# ── Commit 5: transfer screen ─────────────────────────────────────────────────
Set-Content "src/screens/TransferScreen.ts" @'
import { validateTransfer } from "../transfers/validateTransfer.js";
import { postTransfer, type TransferPayload } from "../services/api.js";

export interface TransferScreenState {
  label: string;
  error?: string;
  result?: unknown;
}

export async function submitTransfer(payload: TransferPayload): Promise<TransferScreenState> {
  // Hardcoded label shown in the UI
  const label = "Daily limit: \u20AC1,000";

  const validation = validateTransfer(payload.amount);
  if (!validation.valid) {
    return { label, error: validation.error };
  }

  const result = await postTransfer(payload);
  return { label, result };
}
'@

AddAndCommit "feat: TransferScreen with limit label and client-side validation" "2023-08-14T16:00:00+02:00" "Elena Rossi" "elena@novabank.io"

# ── Commit 6: analytics ───────────────────────────────────────────────────────
Set-Content "src/analytics/events.ts" @'
// Analytics event tracking

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
}

// Sends user identity including email and IBAN in analytics events
export function trackTransferInitiated(
  userId: string,
  email: string,
  iban: string,
  amount: number
): AnalyticsEvent {
  const event: AnalyticsEvent = {
    event: "transfer_initiated",
    properties: {
      userId,
      email,
      iban,
      amount,
    },
  };
  // In production this calls the analytics endpoint
  return event;
}

export function trackLimitReached(
  userId: string,
  email: string,
  iban: string
): AnalyticsEvent {
  return {
    event: "limit_reached",
    properties: { userId, email, iban },
  };
}
'@

AddAndCommit "feat: analytics event tracking for transfers" "2023-10-02T10:45:00+02:00" "David Kim" "david@novabank.io"

# ── Commit 7: tests ───────────────────────────────────────────────────────────
Set-Content "tests/api.test.ts" @'
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock global fetch
const mockFetch = vi.fn();
(global as unknown as { fetch: typeof mockFetch }).fetch = mockFetch;

// Re-import after mock is set up
const { postTransfer, getLimits, getAccount } = await import("../src/services/api.js");

beforeEach(() => {
  mockFetch.mockReset();
});

describe("getLimits", () => {
  it("calls /api/limits and returns dailyLimit", async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ dailyLimit: 1000 }) });
    const result = await getLimits();
    expect(result.dailyLimit).toBe(1000);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/limits"));
  });
});

describe("getAccount", () => {
  it("calls /api/accounts/:id", async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ id: "acc1" }) });
    await getAccount("acc1");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/accounts/acc1"));
  });
});

describe("postTransfer", () => {
  it("posts to /api/transfers", async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ status: "COMPLETED" }) });
    const result = await postTransfer({ fromAccountId: "acc1", customerId: "c1", toIban: "DE89370400440532013000", amount: 100 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/transfers"),
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toMatchObject({ status: "COMPLETED" });
  });
});
'@

Set-Content "tests/TransferScreen.test.ts" @'
import { describe, it, expect, vi } from "vitest";

// Mock postTransfer so no real fetch is made
vi.mock("../src/services/api.js", () => ({
  postTransfer: vi.fn().mockResolvedValue({ status: "COMPLETED" }),
}));

const { submitTransfer } = await import("../src/screens/TransferScreen.js");

describe("submitTransfer", () => {
  it("includes the hardcoded daily limit label", async () => {
    const state = await submitTransfer({
      fromAccountId: "acc1",
      customerId: "c1",
      toIban: "DE89370400440532013000",
      amount: 100,
    });
    expect(state.label).toContain("1,000");
  });

  it("rejects when amount exceeds the limit", async () => {
    const state = await submitTransfer({
      fromAccountId: "acc1",
      customerId: "c1",
      toIban: "DE89370400440532013000",
      amount: 1500,
    });
    expect(state.error).toMatch(/limit/i);
  });
});
'@

Set-Content "tests/analytics.test.ts" @'
import { describe, it, expect } from "vitest";
import { trackTransferInitiated, trackLimitReached } from "../src/analytics/events.js";

describe("trackTransferInitiated", () => {
  it("includes email and IBAN in event properties", () => {
    const ev = trackTransferInitiated("u1", "user@example.com", "FR7630006000011234567890189", 200);
    expect(ev.event).toBe("transfer_initiated");
    expect(ev.properties.email).toBe("user@example.com");
    expect(ev.properties.iban).toBe("FR7630006000011234567890189");
  });
});

describe("trackLimitReached", () => {
  it("includes email and IBAN", () => {
    const ev = trackLimitReached("u1", "user@example.com", "FR7630006000011234567890189");
    expect(ev.properties.email).toBe("user@example.com");
    expect(ev.properties.iban).toBe("FR7630006000011234567890189");
  });
});
'@

AddAndCommit "test: add tests for api service, TransferScreen, analytics" "2023-12-01T09:30:00+01:00" "Elena Rossi" "elena@novabank.io"

# ── Commit 8: vitest config ────────────────────────────────────────────────────
Set-Content "vitest.config.ts" @'
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
'@

AddAndCommit "chore: add vitest config" "2024-01-15T11:00:00+01:00" "David Kim" "david@novabank.io"

# ─────────────────────────────────────────────────────────────────────────────
# Install & test novabank-mobile
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "Installing novabank-mobile dependencies..."
npm install --silent
Write-Host "Running novabank-mobile tests..."
npm test

Write-Host ""
Write-Host "Demo repos ready"
