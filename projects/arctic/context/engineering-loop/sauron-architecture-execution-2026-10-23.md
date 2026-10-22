# Executed architecture and optimization review

Applied architecture-documentation, engineering-loop inspection and lean-code reuse against actual entrypoints, the source dependency graph and package manifests. Native Aragorn identified eager page imports and per-call currency formatter construction before its account usage limit. The parent inspected and implemented both small optimizations and completed verification.

## Boundary analysis

The existing topology remains server/process entrypoint -> Express app composition -> routes -> controllers -> shared domain/tenancy helpers and Prisma. Same-origin SPA serving, `/api/v1` and `/api` compatibility remain unchanged. No repository/service abstraction, frontend database call, public endpoint, schema, migration, or domain lifecycle was added.

Frontend topology remains main -> ErrorBoundary -> QueryClient/router/auth providers -> AppLayout -> page. React lazy boundaries affect only page code loading; providers and shared shell/dialog state stay outside Suspense. Existing error-boundary handling remains available for failed code loading. The real production build generates separate page chunks for Calendar, Settings, Inspection Templates, Bookings, Technicians, Customers, Units, Financials, Inventory, Dashboard, Reports and Service Desk.

The scoped TypeScript AST map analyzes 62 source files and 238 relative import edges, with zero detected circular components and zero unresolved relative imports. The map includes literal dynamic imports after splitting. It excludes package internals, aliases, nonliteral runtime dependencies and whole-program type resolution. Raw output remains ignored under `.sauron/graph/`. Upstream `sauron graph` is not claimed to work; this is the documented project fallback.

## Measured optimization

| Metric | Before | After | Interpretation |
| --- | --- | --- | --- |
| Main JavaScript file | 543,631 bytes | Approximately 399,627 bytes | About 26.5% smaller main entry; other pages load when required. |
| Main gzip from Vite | 159.95 KB | Approximately 127.80 KB | About 20% smaller compressed main entry. |
| All JavaScript chunks combined | 543,631 bytes | Approximately 549,813 bytes | Small total overhead from splitting and improvements; this is not a reduction in all application code. |
| CSS | `index-BDTAmycK.css`, 64.77 KB | Same hash and size | Visual styles preserved. |
| Currency formatting, 10,000 calls | Approximately 371ms | Approximately 5ms | Local microbenchmark using the real formatter; not an end-to-end user latency measurement. |

Baseline and final asset inventories live in `artifacts/sauron-assets-before.json` and `sauron-assets-after.json`. Browser navigation covers all lazy pages, authentication and legacy aliases. Full integration tests preserve tenancy, immutable final records, exact Decimal money, one invoice per booking, unknown partial balances and transactional mutation/audit behavior.

## Lean decisions and deferred work

The execution plan records reuse rungs per requirement. React's existing lazy/Suspense, the existing Spinner, native Intl, current error redactor and shared UI controls satisfy the changes. The only new production helper is the small keyboard handler with two real callers. No application package dependency was added. New Node contract tests reuse the already installed esbuild and React renderer.

No speculative memoization, caching layer, service/repository rewrite, indiscriminate file split, worktree creation, brand replacement or new platform integration was justified. The global search intentionally fetches full authorized job/customer lists; switching it to server-side search could help larger datasets, but requires measured scale and a scoped API/UX contract before implementation. The database dashboard already uses scoped aggregate queries rather than computing statistics from one arbitrary page.
