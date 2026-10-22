# ARCTIC repository instructions

If available locally, read the user's Agent-KB START-HERE.md at C:/Users/margi/Desktop/lockedIn/Obsidian Knowledge Base/Memory/Agent-KB/START-HERE.md. A missing personal vault must not block other contributors or CI. Follow the current user's delivery scope; historical push authorization does not authorize publishing future work.

Stack: TypeScript, Express, Prisma/PostgreSQL, React/Vite, TanStack Query, Tailwind and Lucide. Generated Sauron runtime examples are subordinate to this repository and its actual stack. Keep architecture/feature/design/verification records under projects/arctic/context/engineering-loop/.

Preserve tenant and branch access, ordered booking lifecycle, one invoice per booking, Decimal money, and data. Additive migrations only. Never seed or reset a live database. Local tools must use the isolated database configuration. Unknown historical partial-payment amounts remain unknown.

Use npm run typecheck, npm test, npm run build and Playwright for user-visible browser verification. Root coordinates shared UI and integration; parallel workers own explicitly assigned files. Do not revert another worker's edits.

## Automatic Sauron routing

For development tasks, read `.agents/skills/arctic-workflow/SKILL.md` first. It is the project-specific entrypoint for Sauron's ecosystem. Follow `projects/arctic/context/engineering-loop/sauron-workflow.md` and `.sauron/workflow.json`; run `npm run sauron:route -- --files <paths>` when the affected files are known, or `npm run sauron:route` for the current changes. Infer intent as well as paths: planning a new screen requires frontend routing before the file exists. Read only the selected skill and necessary references. A spelling fix or small CSS correction does not need a blueprint, graph, agent team, or new context document.

Use Fellowship agents when independent review or separate file ownership materially helps: Gandalf for complex planning, Aragorn for boundaries, Frodo for implementation, Boromir for auth/security, Legolas for diagnosis, Gimli for refactoring, Merry for acceptance tests, Pippin for concurrency/edge cases, Samwise for requested Git delivery. Delegate bounded independent work with explicit ownership; workers must know they are not alone and must preserve others' edits. Do not start all agents for every task. If native agents are unavailable, perform the applicable review in the current session and state that limitation.

Before meaningful implementation, record a brief plan against the existing blueprint. Existing user authorization covers routine reversible implementation choices; generic skill approval loops do not override it. Ask only about material missing requirements, changed scope, or actions requiring approval. Preserve existing controller architecture, React/Vite, Tailwind v4, Lucide, and source `index` entrypoints over incompatible generated examples. Use regression tests for behavior/risk changes; documentation and cosmetic edits need proportionate checks.

For frontend work, route through `design-engineering`, read `DESIGN.md`, and reuse `theme.css`, `index.css`, and shared UI components. Use only the relevant lifecycle stage; brand presets, landing-page styles, image generation, prototypes, new libraries and redesigns require matching task intent. Verify changed UI in both themes, mobile/desktop, keyboard and reduced motion. Record actual browser results separately from static review.

Run `npm run sauron:doctor` after workflow/skill changes. For an intentional skill update, review the files first, run `npm run sauron:lock`, and review both integrity manifests. Do not use `sauron init` or `sync` blindly: generated adapters can overwrite project instructions. Configuration flags and catalog/status banners are not proof of active security enforcement, agent execution, or successful verification. Never install hooks that reference absent scripts.
