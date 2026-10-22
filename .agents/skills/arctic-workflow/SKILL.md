---
name: arctic-workflow
description: Project-specific Sauron routing for ARCTIC development, architecture, security, verification, and frontend design engineering. Load relevant capabilities automatically while preserving the existing application.
---

# ARCTIC development dispatcher

1. Read root `AGENTS.md` and classify the request against `.sauron/workflow.json`. The durable operating guide is `projects/arctic/context/engineering-loop/sauron-workflow.md`.
2. Inspect affected source and the existing architecture/coding/design records. Route by intent before implementation, then use `npm run sauron:route -- --files <paths>` to confirm coverage. The command recommends capabilities; the agent actually reads and applies them.
3. For meaningful features, use the engineering-loop planning stage, then implementation, inspection and verification. User-authorized routine work proceeds without repeated terminology/blueprint approvals. Record unresolved consequential decisions before dependent work. Directly handle trivial edits with proportionate verification.
4. Load only task-relevant Sauron skills. Use native Fellowship agents for independent, bounded work where useful, with explicit file ownership and no overlapping edits. Do not claim simulated role checks as delegated execution.

   Resolve bundled source-layout paths to this installation: `skills/frontend/design-engineering/...` means `.agents/skills/design-engineering/...`; `skills/workflow/engineering-loop/...` means `.agents/skills/engineering-loop/...`; other `skills/<department>/<skill>/...` paths mean `.agents/skills/<skill>/...`. Preserve paths already beginning `.agents/`. Resolve relative references against the selected local skill directory. Upstream `core/`, `rules/`, and top-level `references/` material lives in `node_modules/sauron-ai/`. Check existence before reading and report a missing capability accurately rather than invoking a nonexistent slash command or file. Repository context always remains under the configured engineering-loop directory.
5. UI work uses the design-engineering router and the existing ARCTIC design authority. Select the appropriate foundation, aesthetic, brand, motion, vision or audit stage; never run all stages simply because they exist. Existing app behavior, React/Vite, Tailwind v4 and Lucide override generic recipes.
6. Run checks appropriate to the change and report results and limits. Update existing canonical context records when architecture, tokens, component contracts or verification materially change. Checkpoint only long-running/interrupted tasks; triage only failures. No automatic deployment, production migration, seed, credential read, external messaging, or Git push follows from routing.

The manifest is a recommendation index, not a command firewall or an executing agent scheduler. Native host permissions remain authoritative. The CLI is a development dependency only and never runs in the application request path.
