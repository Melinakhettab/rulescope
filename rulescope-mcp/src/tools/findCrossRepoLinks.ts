import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CrossRepoLink, Evidence } from "../types.js";

export interface FindCrossRepoLinksInput {
  repoPaths: string[];
}

export interface FindCrossRepoLinksOutput {
  links: CrossRepoLink[];
  issues: string[];
}

// ─── HTTP route helpers ───────────────────────────────────────────────────────

/**
 * Extracts the `/api/...` path literal from a router.METHOD(...) line.
 * Matches:  router.get("/api/foo",  router.post(`/api/bar`,  etc.
 */
function extractRoutePath(snippet: string): string | null {
  const m = snippet.match(
    /router\s*\.\s*(?:get|post|put|delete|patch)\s*\(\s*['"`](\/api\/[^'"`\s)]+)/i,
  );
  return m ? m[1] : null;
}

/**
 * Extracts the `/api/...` path literal from a fetch(...) call line.
 * Handles:
 *   fetch("/api/foo")
 *   fetch(`${host}/api/foo`)
 *   fetch(`${BASE}/api/foo`)
 */
function extractFetchPath(snippet: string): string | null {
  // Plain string: fetch("/api/...")  or  fetch('/api/...')
  const plain = snippet.match(/fetch\s*\(\s*['"`](\/api\/[^'"`\s)]+)/i);
  if (plain) return plain[1];

  // Template literal: fetch(`${...}/api/...`)
  const tmpl = snippet.match(/fetch\s*\(\s*`\$\{[^}]+\}(\/api\/[^'"`\s)]+)/i);
  if (tmpl) return tmpl[1];

  return null;
}

// ─── DB / event-topic helpers ─────────────────────────────────────────────────

const SQL_PROVIDER_PATTERN =
  /(?:CREATE\s+TABLE|INSERT\s+INTO)\s+["'`]?(\w+)["'`]?/i;
const SQL_CONSUMER_PATTERN =
  /(?:FROM|JOIN)\s+["'`]?(\w+)["'`]?/i;
const TOPIC_PATTERN = /topic:\s*["'`]?([A-Za-z0-9_.:-]+)["'`]?/;

function extractSqlTableProvider(snippet: string): string | null {
  const m = snippet.match(SQL_PROVIDER_PATTERN);
  return m ? m[1].toLowerCase() : null;
}

function extractSqlTableConsumer(snippet: string): string | null {
  const m = snippet.match(SQL_CONSUMER_PATTERN);
  return m ? m[1].toLowerCase() : null;
}

function extractTopicName(snippet: string): string | null {
  const m = snippet.match(TOPIC_PATTERN);
  return m ? m[1] : null;
}

// ─── Shared-package helpers ───────────────────────────────────────────────────

function readPackageName(repoPath: string): string | null {
  try {
    const raw = readFileSync(join(repoPath, "package.json"), "utf8");
    const pkg = JSON.parse(raw) as Record<string, unknown>;
    return typeof pkg.name === "string" ? pkg.name : null;
  } catch {
    return null;
  }
}

function readPackageDeps(repoPath: string): Set<string> {
  try {
    const raw = readFileSync(join(repoPath, "package.json"), "utf8");
    const pkg = JSON.parse(raw) as Record<string, unknown>;
    const deps = {
      ...(pkg.dependencies as Record<string, string> | undefined),
      ...(pkg.devDependencies as Record<string, string> | undefined),
    };
    return new Set(Object.keys(deps));
  } catch {
    return new Set();
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Scans all repoPaths and finds matching provider/consumer pairs across three
 * signal types: HTTP routes, shared packages, and DB tables / event topics.
 *
 * Must be called once by the root agent (not per-repo subagents) after all
 * per-repo work is done.
 */
export async function findCrossRepoLinks(
  input: FindCrossRepoLinksInput,
): Promise<FindCrossRepoLinksOutput> {
  const { repoPaths } = input;
  const links: CrossRepoLink[] = [];
  const issues: string[] = [];

  // ── 1. HTTP routes ──────────────────────────────────────────────────────────

  // Pattern matches: router.get("/api/...  router.post(`/api/...  etc.
  const HTTP_PROVIDER_PATTERN =
    "router\\.(get|post|put|delete|patch)\\s*\\(\\s*['\"`]/api/";
  // Pattern matches: fetch("/api/...  or  fetch(`${...}/api/...
  const HTTP_CONSUMER_PATTERN =
    "fetch\\s*\\(\\s*['\"`](/api/|\\$\\{[^}]+\\}/api/)";

  /** repoPath → list of { path, evidence } */
  const httpProviders = new Map<
    string,
    Array<{ path: string; evidence: Evidence & { repoPath: string } }>
  >();
  const httpConsumers = new Map<
    string,
    Array<{ path: string; evidence: Evidence & { repoPath: string } }>
  >();

  for (const repoPath of repoPaths) {
    // Use -- *.ts *.js pathspec to restrict git grep to JS/TS files
    const provR = runGitGrepPathspec(repoPath, "regex", HTTP_PROVIDER_PATTERN, ["*.ts", "*.js"]);
    const provList: Array<{ path: string; evidence: Evidence & { repoPath: string } }> = [];
    if (!("error" in provR)) {
      for (const hit of provR.hits) {
        const path = extractRoutePath(hit.snippet);
        if (path) {
          provList.push({
            path,
            evidence: { repoPath, file: hit.file, line: hit.line, snippet: hit.snippet, tool: "git_grep" },
          });
        }
      }
    }
    if (provList.length) httpProviders.set(repoPath, provList);

    // Consumers
    const consR = runGitGrepPathspec(repoPath, "regex", HTTP_CONSUMER_PATTERN, ["*.ts", "*.js"]);
    const consList: Array<{ path: string; evidence: Evidence & { repoPath: string } }> = [];
    if (!("error" in consR)) {
      for (const hit of consR.hits) {
        const path = extractFetchPath(hit.snippet);
        if (path) {
          consList.push({
            path,
            evidence: { repoPath, file: hit.file, line: hit.line, snippet: hit.snippet, tool: "git_grep" },
          });
        }
      }
    }
    if (consList.length) httpConsumers.set(repoPath, consList);
  }

  // Pair providers with consumers across repos
  for (const [provRepo, providers] of httpProviders) {
    for (const prov of providers) {
      let matched = false;
      for (const [consRepo, consumers] of httpConsumers) {
        if (consRepo === provRepo) continue; // must be a different repo
        for (const cons of consumers) {
          if (cons.path === prov.path) {
            links.push({
              kind: "http_route",
              provider: prov.evidence,
              consumer: cons.evidence,
              matchedValue: prov.path,
            });
            matched = true;
          }
        }
      }
      if (!matched) {
        issues.push(
          `HTTP route ${prov.path} in ${provRepo} (${prov.evidence.file}:${prov.evidence.line}): ` +
            "unknown external consumers — verify with other teams",
        );
      }
    }
  }

  // ── 2. Shared packages ──────────────────────────────────────────────────────

  /** repoPath → package name */
  const pkgNames = new Map<string, string>();
  for (const repoPath of repoPaths) {
    const name = readPackageName(repoPath);
    if (name) pkgNames.set(repoPath, name);
  }

  for (const [provRepo, pkgName] of pkgNames) {
    let matched = false;
    for (const consRepo of repoPaths) {
      if (consRepo === provRepo) continue;
      const deps = readPackageDeps(consRepo);
      if (deps.has(pkgName)) {
        // Evidence is the package.json itself — line 1 is the "name" field (close enough)
        const provEvidence: Evidence & { repoPath: string } = {
          repoPath: provRepo,
          file: "package.json",
          line: 1,
          snippet: `"name": "${pkgName}"`,
          tool: "git_grep",
        };
        const consEvidence: Evidence & { repoPath: string } = {
          repoPath: consRepo,
          file: "package.json",
          line: 1,
          snippet: `"${pkgName}"`,
          tool: "git_grep",
        };
        links.push({
          kind: "shared_package",
          provider: provEvidence,
          consumer: consEvidence,
          matchedValue: pkgName,
        });
        matched = true;
      }
    }
    if (!matched) {
      issues.push(
        `Package ${pkgName} (${provRepo}): ` +
          "unknown external consumers — verify with other teams",
      );
    }
  }

  // ── 3. DB tables & event topics ─────────────────────────────────────────────

  const DB_PROVIDER_PATTERN = "(?:CREATE TABLE|INSERT INTO)";
  const DB_CONSUMER_PATTERN = "(?:FROM|JOIN)\\s+\\w+";
  const TOPIC_GREP_PATTERN = "topic:";

  /** name → list of provider evidence */
  const tableProviders = new Map<
    string,
    Array<Evidence & { repoPath: string }>
  >();
  const tableConsumers = new Map<
    string,
    Array<Evidence & { repoPath: string }>
  >();
  const topicProviders = new Map<
    string,
    Array<Evidence & { repoPath: string }>
  >();

  for (const repoPath of repoPaths) {
    // DB table providers (CREATE TABLE / INSERT INTO)
    const dbProvR = runGitGrepPathspec(repoPath, "regex", DB_PROVIDER_PATTERN, ["*.ts", "*.js", "*.sql"]);
    if (!("error" in dbProvR)) {
      for (const hit of dbProvR.hits) {
        const tbl = extractSqlTableProvider(hit.snippet);
        if (tbl) {
          const ev: Evidence & { repoPath: string } = {
            repoPath, file: hit.file, line: hit.line, snippet: hit.snippet, tool: "git_grep",
          };
          const arr = tableProviders.get(tbl) ?? [];
          arr.push(ev);
          tableProviders.set(tbl, arr);
        }
      }
    }

    // DB table consumers (FROM / JOIN)
    const dbConsR = runGitGrepPathspec(repoPath, "regex", DB_CONSUMER_PATTERN, ["*.ts", "*.js", "*.sql"]);
    if (!("error" in dbConsR)) {
      for (const hit of dbConsR.hits) {
        const tbl = extractSqlTableConsumer(hit.snippet);
        if (tbl) {
          const ev: Evidence & { repoPath: string } = {
            repoPath, file: hit.file, line: hit.line, snippet: hit.snippet, tool: "git_grep",
          };
          const arr = tableConsumers.get(tbl) ?? [];
          arr.push(ev);
          tableConsumers.set(tbl, arr);
        }
      }
    }

    // Event topics (topic:...)
    const topicR = runGitGrepPathspec(repoPath, "fixed", TOPIC_GREP_PATTERN, ["*.ts", "*.js", "*.sql"]);
    if (!("error" in topicR)) {
      for (const hit of topicR.hits) {
        const topicName = extractTopicName(hit.snippet);
        if (topicName) {
          const ev: Evidence & { repoPath: string } = {
            repoPath, file: hit.file, line: hit.line, snippet: hit.snippet, tool: "git_grep",
          };
          const arr = topicProviders.get(topicName) ?? [];
          arr.push(ev);
          topicProviders.set(topicName, arr);
        }
      }
    }
  }

  // Pair DB table providers with consumers (different repos).
  // Collect all repos that mention each table name (as provider or as consumer).
  // Any pair of different repos sharing the same name → cross-repo db_table link.
  for (const [tableName, provEvList] of tableProviders) {
    const consEvList = tableConsumers.get(tableName) ?? [];

    // Best representative evidence per repo (provider side)
    const provByRepo = new Map<string, Evidence & { repoPath: string }>();
    for (const ev of provEvList) {
      if (!provByRepo.has(ev.repoPath)) provByRepo.set(ev.repoPath, ev);
    }

    // Best representative evidence per repo (consumer side) — distinct from providers
    const consOnlyByRepo = new Map<string, Evidence & { repoPath: string }>();
    for (const ev of consEvList) {
      if (!consOnlyByRepo.has(ev.repoPath)) consOnlyByRepo.set(ev.repoPath, ev);
    }

    const provRepos = [...provByRepo.keys()];
    const consRepos = [...consOnlyByRepo.keys()];

    let anyMatch = false;

    // Pair each provider repo with each consumer repo (different repos)
    for (const pr of provRepos) {
      for (const cr of consRepos) {
        if (pr === cr) continue;
        links.push({
          kind: "db_table",
          provider: provByRepo.get(pr)!,
          consumer: consOnlyByRepo.get(cr)!,
          matchedValue: tableName,
        });
        anyMatch = true;
      }
    }

    // If multiple repos are both providers (no separate consumer repos), pair them
    if (!anyMatch && provRepos.length >= 2) {
      for (let i = 0; i < provRepos.length; i++) {
        for (let j = i + 1; j < provRepos.length; j++) {
          links.push({
            kind: "db_table",
            provider: provByRepo.get(provRepos[i])!,
            consumer: provByRepo.get(provRepos[j])!,
            matchedValue: tableName,
          });
          anyMatch = true;
        }
      }
    }

    if (!anyMatch) {
      const reported = new Set<string>();
      for (const prov of provEvList) {
        if (!reported.has(prov.repoPath)) {
          issues.push(
            `DB table "${tableName}" in ${prov.repoPath} (${prov.file}:${prov.line}): ` +
              "unknown external consumers — verify with other teams",
          );
          reported.add(prov.repoPath);
        }
      }
    }
  }

  // Pair event topics across repos (same topic name in different repos)
  const topicRepoMap = new Map<string, Array<Evidence & { repoPath: string }>>();
  for (const [topicName, evList] of topicProviders) {
    topicRepoMap.set(topicName, evList);
  }

  for (const [topicName, evList] of topicRepoMap) {
    // Group by repo
    const byRepo = new Map<string, Array<Evidence & { repoPath: string }>>();
    for (const ev of evList) {
      const arr = byRepo.get(ev.repoPath) ?? [];
      arr.push(ev);
      byRepo.set(ev.repoPath, arr);
    }

    const repos = [...byRepo.keys()];
    if (repos.length >= 2) {
      // Every pair of repos sharing the same topic name → link
      for (let i = 0; i < repos.length; i++) {
        for (let j = i + 1; j < repos.length; j++) {
          const provEv = byRepo.get(repos[i])![0];
          const consEv = byRepo.get(repos[j])![0];
          links.push({
            kind: "event_topic",
            provider: provEv,
            consumer: consEv,
            matchedValue: topicName,
          });
        }
      }
    } else {
      // Only in one repo — unknown external consumers
      for (const ev of evList) {
        issues.push(
          `Event topic "${topicName}" in ${ev.repoPath} (${ev.file}:${ev.line}): ` +
            "unknown external consumers — verify with other teams",
        );
      }
    }
  }

  return { links, issues };
}

// ─── Pathspec-aware git grep ───────────────────────────────────────────────────

import { spawnSync } from "node:child_process";
import type { GitGrepHit } from "../utils/runGitGrep.js";

/**
 * Runs git grep restricted to specific file globs via pathspec (`-- *.ts *.js`).
 * This is the correct way to filter git grep by extension.
 */
function runGitGrepPathspec(
  repoPath: string,
  mode: "fixed" | "regex",
  pattern: string,
  pathspecs: string[],
): { hits: GitGrepHit[] } | { error: string } {
  const flag = mode === "fixed" ? "-F" : "-E";
  const args = ["grep", "-n", flag, "--", pattern, ...pathspecs];

  const result = spawnSync("git", args, {
    cwd: repoPath,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) {
    return { error: `git grep spawn error: ${result.error.message}` };
  }
  if (result.status !== null && result.status >= 128) {
    const stderr = (result.stderr ?? "").trim();
    return { error: `git grep failed (exit ${result.status}): ${stderr || "unknown error"}` };
  }
  if (result.status === 1) {
    return { hits: [] };
  }

  const hits: GitGrepHit[] = [];
  for (const raw of (result.stdout ?? "").split("\n")) {
    if (!raw) continue;
    const match = raw.match(/^([^:]+):(\d+):(.*)$/);
    if (!match) continue;
    const [, file, lineStr, snippet] = match;
    const line = parseInt(lineStr, 10);
    if (Number.isNaN(line)) continue;
    hits.push({ file, line, snippet });
  }
  return { hits };
}
