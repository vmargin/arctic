# Executed application security review

Environment: TypeScript, Express 4, Prisma 6/PostgreSQL, bcryptjs/JWT HS256, React 19/Vite. User authorized verified improvements while preserving behavior. Boromir's native agent verified and patched the logging finding before its account usage limit interrupted the run. The parent completed the remaining review, fixes and verification. This is a scoped application review, not a penetration-test certification.

## Confirmed findings and fixes

| Finding | Severity and reference | Evidence and resolution |
| --- | --- | --- |
| Deeply nested failed payloads bypass credential redaction | Medium; CWE-532 | `backend/src/middleware/errorHandler.ts:24`, `redact`, cutoff at line 27: the previous depth cutoff returned the original object, including uninspected password/token properties. The cutoff now replaces the entire uninspected subtree. `backend/tests/errorHandler.test.ts:31` and `:38` cover deep objects/arrays and capture the actual error log to prove secret strings are absent. |
| Missing-account login skipped bcrypt work | Medium; CWE-208 | `backend/src/controllers/authController.ts:55`, `login`: the supposed dummy bcrypt hash was 66 characters; bcrypt requires 60 and returns early for malformed hashes. Replaced it with a valid cost-10 dummy hash. `backend/tests/authController.test.ts:12` performs the real missing-account comparison, validates the hash format/cost, and checks the unchanged unauthorized result. This addresses the malformed-hash timing shortcut; it does not claim the entire login pipeline has identical timing. |
| Known vulnerable dependencies | Severity follows npm advisories | Compatible lockfile updates: compression 1.8.2, proxy-addr 2.0.8, Handlebars 4.7.10, ip-address 10.7.4, Vite 6.4.5 and source-map-js 1.2.2. Existing package major versions, overrides and manifests remain compatible. No forced major upgrade or runtime dependency was added. |

## Review and executed evidence

- Inspected `routes/index.ts`, auth middleware/controller, tenancy helpers, app middleware/CSP/CORS/body limits, rate-limit configuration, error handling, report scoping, inspection-template authorization and inventory transaction guards. Authentication remains above protected routes; current persisted identity/organization/branch permission validation and HS256 restriction remain intact.
- Source search across `backend/src`, `frontend/src` and `api` found no `$queryRawUnsafe`, `$executeRawUnsafe`, `eval`, `new Function`, or `dangerouslySetInnerHTML` calls. This search is not proof that all injection paths are absent. Inspected inventory writes retain parameterized raw locks and transactional/idempotent guards.
- Ran the actual pinned `sauron slop-scan` against all 62 source files from the scoped graph. It reported zero sink findings. Its implementation uses a small line-oriented pattern set, so the log is supporting evidence rather than a substitute for manual authorization/data-flow review. Log: `artifacts/sauron-sinks-scan.txt`.
- `npm run test:integration`: all 50 tests passed, including cross-tenant/branch access, inactive/foreign technicians, simultaneous dispatch, ordered lifecycle, stock non-negativity and retry, exact/idempotent receipts, concurrent collections and overpayment, legacy unknown balances, branch-attributed units, and request/estimate/invoice/report journeys.
- `npm run verify`: passed, including both package typechecks, 36 database-independent backend tests, 9 workflow tests, 3 frontend contracts and both production builds. Fourteen database-specific tests are skipped by ordinary `npm test` and were actually exercised by the separate integration launcher.

## Supply-chain residual risk

The initial backend audit reported 39 affected package entries: 2 critical, 31 high and 6 moderate. After compatible remediation, its production-only audit reports zero vulnerabilities; its complete audit still reports 30 high entries in the development-tool dependency tree. The direct remaining advisory is `braces` stack-exhaustion through deeply nested patterns, CWE-674, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Jest/micromatch and nodemon/chokidar account for the dependent package entries. These are not 30 independently confirmed remote runtime vulnerabilities.

Do not expose development tools to untrusted repositories/pattern input. npm's suggested forced changes include incompatible Jest/tooling changes and even an old nodemon downgrade; those were not applied. A maintained upstream fix or a separately tested tooling migration is the trigger for further remediation. Residual overall supply-chain rating: **High for the affected development-tool scope**. No known advisory remains in the audited backend production or frontend dependency scopes at execution time; that is not a guarantee against undiscovered vulnerabilities.

Frontend audit: 2 high entries before, zero afterward. Root Sauron tooling audit: zero. Saved initial/final JSON reports are under ignored `artifacts/sauron-*-audit*.json`. `npm run audit:production` now gates backend runtime and frontend build dependencies in CI; it intentionally does not hide or claim to fix the recorded backend development-tool issue. Hosted CI itself has not been observed in this session.

The general limiter is currently mounted before authentication, so its normal effective key is IP rather than the per-user behavior described in its comment. This is a pre-existing availability/fairness concern, not a demonstrated authorization bypass; changing limiter placement needs its own budget/regression design. No production system, database credentials or live data was inspected or changed.
