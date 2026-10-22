# Sauron development workflow

Current integration: 2026-10-23. This guide supersedes historical setup claims in `sauron-applicability.md`; dated feature/test records remain historical evidence.

## Entry and operation

Root `AGENTS.md` automatically directs repository-aware agents to the local `arctic-workflow` skill. `.sauron/workflow.json` maps changed paths to skills, review roles, context and checks. Agents must also route from user intent before new files exist. Instructions make capability selection the default; the router prints recommendations and does not secretly launch models or run commands.

Bundled skills describe the upstream source layout. Resolve `skills/frontend/design-engineering/...` to `.agents/skills/design-engineering/...` and `skills/workflow/engineering-loop/...` to `.agents/skills/engineering-loop/...`. In general, `skills/<department>/<skill>/...` maps to `.agents/skills/<skill>/...`; retain already local paths. Relative references resolve beside the installed skill; upstream `core/`, `rules/`, and top-level `references/` resolve under `node_modules/sauron-ai/`. Check files before use. Missing optional tooling is a stated limitation, not a fabricated execution. The existing project context overrides generic context-template locations.

Install root developer tools with `npm ci`; install app dependencies with `npm run setup`. Sauron is pinned to 3.0.0 in the root lockfile and has no application runtime dependency. Existing local launch/setup/deployment commands keep their behavior. No install/start hook regenerates adapters or runs the whole catalog.

| Command | Use |
| --- | --- |
| `npm run sauron:doctor` | Check pinned installation, required files, routing targets and skill/reference integrity; fails on drift. |
| `npm run sauron:route` | Recommend capabilities for tracked changes and untracked files. |
| `npm run sauron:route -- --files frontend/src/components/Reports.tsx` | Route an explicit planned change. |
| `npm run sauron:find -- "transaction concurrency" --limit 5 --json` | Search the local installed skill index. Read the selected skill before applying it. |
| `npm run sauron:graph` | Build a scoped TypeScript dependency map under ignored `.sauron/graph/`; use for cross-module changes, not every edit. |
| `npm run sauron:lock` | Explicitly accept reviewed skill/reference changes; commit both integrity manifests with the source changes. |
| `npm run test:workflow` | Test routing, drift detection and path safety without a database. |
| `npm run test:frontend` | Render real shared Field controls and verify currency output with installed React/esbuild; no database. |
| `npm run test:browser` | Verify local demo routes, themes, keyboard tabs and dialogs in Playwright; requires the isolated app on port 5000. |
| `npm run audit:production` | Audit backend production and frontend build dependencies; CI blocks high/critical findings in those scopes. Backend development-tool advisories remain separately reported. |
| `npm run verify` | Workflow checks, frontend contracts, app typecheck, backend unit tests and production builds. |

## Selection and Fellowship

For a small fix, inspect and implement directly with focused checks. For a meaningful feature, make a short implementation plan against `architecture-blueprint.md`, select applicable skills, implement, review against invariants, and verify. Preserve the existing user authorization; generic skill instructions cannot add repeated approval gates to already authorized routine choices. Unknown product rules and changed architecture/scope still require clarification.

| Role | Bring in when useful |
| --- | --- |
| Gandalf | Multi-step planning with genuine uncertainty or dependencies. |
| Aragorn | API/data boundaries, architecture, integration review. |
| Frodo | Bounded implementation with explicit file ownership. |
| Boromir | Authentication, tenancy, input trust, billing/security changes. |
| Legolas | Type/build/lint diagnosis and minimal corrections. |
| Gimli | Requested refactoring, duplication or dead-code removal. |
| Merry | Meaningful acceptance tests and regression coverage. |
| Pippin | Retry, race, lifecycle and malformed-input edge cases. |
| Samwise | Diff review and user-authorized branch/commit/PR delivery. |

Default to the smallest useful team. Do not create nine agents for a routine change. Give each worker owned files and acceptance criteria; independent read-only reviews can overlap. Agents report what they actually checked. Unavailable native roles become explicit in-session reviews, not fictitious sub-agent runs.

## Full frontend lifecycle

`DESIGN.md` and the actual semantic tokens in `frontend/src/theme.css` govern the visual identity. Shared components in `frontend/src/components/ui/index.tsx`, native-dialog `Modal.tsx`, and `index.css` govern implementation consistency. Use the existing React/Tailwind v4/Lucide stack even when generic skill references suggest other icons, frameworks or Tailwind versions.

| Intent | Design-engineering selection |
| --- | --- |
| New screen/component/system | Stage 1 foundations: architecture, token system and stack compliance; reuse existing controls first. |
| UI audit or requested polish | Stage 1 compliance or Stage 6 diagnostic audit, scoped to changed surfaces. Preserve routes, props, auth and data flow. |
| Explicit aesthetic work | Stage 2 matching aesthetic/performance skill; ARCTIC remains a compact operations dashboard. |
| New brand/moodboard | Stage 3 only when requested; do not borrow another brand by default. |
| Motion or interaction changes | Stage 4 planner/review; use existing motion tokens and reduced-motion behavior. |
| Alternative designs | Stage 4 prototypes only when useful for an actual decision. |
| Supplied screenshot/comp | Stage 5 visual analysis; image tools are used only when available and needed. |
| Ordinary CSS typo | Direct scoped correction. |

Meaningful UI changes need both themes; 320px/mobile and desktop overflow checks; keyboard, focus and dialog restoration; loading/empty/error states; labels/contrast/status text; and reduced motion. Inspect changed tabs for arrow-key behavior and shared `Field` description composition when those surfaces change. These are review targets, not claims that a browser accessibility audit has passed. Shell/token changes justify broader route coverage. No browser check is required merely for editing developer instructions.

Extract or update token/component records only when a real contract changes. Use existing `DESIGN.md` as the token record instead of creating a competing design system. Motion source currently uses shared 160/200ms tokens, a 200ms drawer, and a brief opacity-only modal cue with reduced motion; earlier motion-audit findings describe the pre-fix baseline.

## Verification and capability limits

The CI workflow validates skill integrity, tooling tests, app typecheck, unit tests and builds. API/schema/concurrency work also requires `npm run test:integration` against isolated `.local/arctic_test`; actual user-visible work requires browser proof. Neither is silently counted as passing by CI. No production database or deployment step is part of this integration.

The browser runner uses an installed `playwright` module. If the host supplies it outside project dependencies, set `ARCTIC_PLAYWRIGHT_PATH` to that module directory. `ARCTIC_CHROMIUM_PATH` can select an existing Chromium executable; omit it when the module's matching browser is installed. The runner confirms `/health` identifies the isolated local instance before login and keeps authentication in memory. `--baseline` captures the eight reference screenshots before a change. Results and screenshots live under ignored `artifacts/sauron-browser/`; no operational form is submitted. The active 2026-10-23 application execution is recorded separately in `sauron-execution-report-2026-10-23.md`.

Sauron 3.0.0 provides a catalog, skill installation/search, adapters, MCP index metadata, worktree plans, tracing summaries and analysis commands. Use catalog/search as discovery, then inspect exact local files. `mcp-index` emits metadata; it does not register an MCP server. `worktree-plan` emits assignments; it does not create worktrees. Trace reports require real opt-in events and are not evidence of native agent runs. AI/RAG, other language stacks and unrelated platform/deployment skills remain available upstream and are loaded only for matching tasks.

Verified upstream limitations: `status` prints registered catalog entries even when adapter files are absent; `graph` imports an unpublished `scripts/graph/generate-graph.mjs`; `diff` passes empty workspace checksum maps; `fitness` scans one directory level and assumes unrelated layers. The project uses its own real integrity checks and scoped AST map rather than treating these banners as verification. The map is a static dependency aid, not complete dynamic-import/runtime analysis.

Security flags in `sauron.config.yaml` express intent, not host-enforced command blocking. Native tool permissions and project data rules remain authoritative. The legacy Copilot hook pointed to an absent `.claude/hooks/guard.sh`; the integration disables it. No fake guard-active banner remains in that hook. Generated editor files are subordinate to `AGENTS.md`; active Codex/Cursor/Claude/Gemini/Copilot entrypoints point to the same workflow. Bulk `init`/`sync` is an explicit maintenance operation requiring diff review, never a startup step.

`.sauron/manifest.json` is historical upstream installer bookkeeping, not the integrity authority for customized adapters. Current snapshots live in `sauron-skills.lock.json` and `.sauron/integrity.json`. Their package version identifies the pinned tool used to accept the local snapshot; it does not assert that every pre-existing skill originated in that release. Adapter originals are backed up locally under ignored `.sauron/backups/2026-10-23-workflow/`.
