# Existing ARCTIC application improvement blueprint

Improve the existing ARCTIC application while preserving its Git history, PostgreSQL data, tenancy, authentication, routes and deployment. The separate remake workspace is not the deliverable.

## Scope and invariants

Extend customer → registered aircon unit → scheduled booking → field work order → inspection/diagnosis → parts → invoice → payment receipts → next service date.

Preserve PENDING → CONFIRMED → ON_SITE → COMPLETED and cancellation from open states, one invoice per booking, organization and branch access, Decimal money, and forward-only billing semantics. Field work may be completed before the office issues its invoice; billing state must not hold the technician's work history open. Close dispatch overlap/inactive-technician gaps, lock terminal jobs, record immutable payment receipts, guard stock atomically, and audit mutations. New unit must belong to the booking customer. Never infer an amount for a historical status-only PARTIAL invoice: surface review required. Legacy paid invoice amounts are known paid baselines.

## Architecture and migration

### Source topology (verified 2026-10-23)

`backend/src/server.ts` owns process startup/shutdown; `app.ts` composes HTTP middleware and same-origin SPA serving; `routes/index.ts` exposes `/api/v1` and the `/api` compatibility alias. Existing controllers own Zod validation, orchestration and Prisma transactions. Shared domain guards and money serializers live in `lib/`; `db/prisma.ts` owns the database client. Do not impose generated repository/service layers on this controller-based application.

`frontend/src/main.tsx` mounts `App.tsx`, which composes the router, QueryClient and providers. `auth/AuthContext.tsx` owns identity state; typed clients in `api/` own HTTP access; components use shared `components/ui/index.tsx`, `Modal.tsx`, `index.css` and `theme.css`. Keep API contracts, frontend types and serializers aligned. Existing `index` entrypoints are intentional. `api/index.ts` adapts the same Express application for the existing serverless deployment.

The 2026-10-23 execution adds native React lazy page imports with Suspense around the existing Outlet. Authentication, QueryClient, layout and shared dialogs remain outside that page-loading boundary. See `sauron-architecture-execution-2026-10-23.md` for measured bundle changes and static-analysis limits.

Service sites, unscheduled requests, estimate revisions/approval, invoice line snapshots, inspection templates, and maintenance/parts reports are implemented. The initial coverage table in `applicability-matrix.md` describes an earlier baseline. Consult current routes, Prisma models and source before treating an old gap as work to add.

Reuse Express/Prisma/PostgreSQL, React/Vite/TanStack Query/Lucide. Domain guards remain with existing API owners and transactions; shared UI tokens and controls own appearance. Additive PostgreSQL migrations preserve original rows. No reset, destructive schema replacement, original environment-secret disclosure, live seed, or cloud data mutation during development.

Use installed native PostgreSQL for an isolated local development database and test database. The local launcher serves the API and built frontend on one URL, prepares only missing configuration and keeps local records across restarts. Existing cloud deployment settings remain compatible. Applying a new production migration is a separate necessary deployment operation and must be verified explicitly, not inferred from a push.

## Implementation and proof

1. Live source and public vendor research; verified original commit e34d30b, clean master aligned with origin/master.
2. Reference-derived Operate design specification; deep teal, ice blue, compact panels, accessible responsive navigation.
3. Additive backend features and guarded migration, deterministic demo seed only for isolated database.
4. Existing shell/pages redesigned and new unit, calendar, work order and parts views integrated into existing routes.
5. Typecheck, original/new tests, build, isolated database migration, browser full workflow and mobile/keyboard checks.
6. Review the resulting implementation, record evidence, and push a reviewable branch to the existing repository. Treat production schema migration as a separate deployment operation that must be verified explicitly.
