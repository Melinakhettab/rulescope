# Ground truth — what a complete Impact Brief must find

## T1 — Premium daily transfer limit €5,000
| # | Repo | File | Finding | Expected category |
|---|------|------|---------|-------------------|
| 1 | api | src/transfers/limits.ts | DAILY_LIMIT = 1000, calendar day | CHANGE |
| 2 | mobile | src/transfers/validateTransfer.ts | Duplicated client-side check > 1000 | CHANGE (hidden duplicate, cross-repo) |
| 3 | api | src/fraud/rules.ts | Transfers > 2000 blocked PENDING_REVIEW | CONTRADICTION → open question |
| 4 | api | src/compliance/amlReport.ts | AML report >= 3000, own constant | CHECK (regulatory) |
| 5 | api | limits.ts vs amlReport.ts | Calendar day vs rolling 24h window | CONTRADICTION → open question |
| 6 | api + mobile | src/notifications/templates.ts, src/screens/TransferScreen.ts | Hardcoded "€1,000" texts | CHANGE |
| 7 | api | src/cards/cardLimits.ts | CARD_LIMIT = 1000 (card payments) | NOT AFFECTED (no false alarm) |

Expected open questions: raise the fraud threshold for Premium? Calendar day or rolling 24h? Update terms & conditions?

## T2 — GDPR deletion (PDF)
- api: src/customers/ (email, phone, IBAN) — CHANGE
- api: src/logging/logger.ts logs email + IBAN — CHANGE
- mobile: src/analytics/events.ts sends email + IBAN — CHANGE (cross-repo)
- api: src/retention/policy.ts keeps transactions 10 years — CONTRADICTION → ask Legal (anonymize instead of delete?)

## T3 — SQLite → PostgreSQL
- api/src/db/db.ts — driver setup (better-sqlite3) — CHANGE
- api/src/db/transfersRepo.ts — datetime('now') and strftime(...) — CHANGE
- api/src/db/customersRepo.ts — INSERT OR REPLACE — CHANGE
- api/src/compliance/amlReport.ts — datetime('now', '-24 hours') — CHANGE (hidden, regulatory: needs compliance sign-off)
- "AUTOINCREMENT" only appears in a comment — no SQL to migrate (correctly not flagged)
- mobile: NOT AFFECTED (no direct database access)

## T4 — Transfer button color
- No business rule affected; all API files NOT AFFECTED.
- The analyzed repositories contain no UI styling code: the correct answer is to say so and ask which repository holds the button component (no invented file).