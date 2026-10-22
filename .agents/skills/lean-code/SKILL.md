---
name: lean-code
description: "Use when writing, adding, or changing code in any language, and when the user asks to keep it simple, avoid over-engineering, write less code, reuse what exists, or review a diff or folder for unnecessary code. Checks a seven-rung reuse ladder before any new code is written and reports what was deferred. Excludes prose compression, pattern selection, and security or validation code, which is never cut."
department: workflow
ownerAgent: gimli
triggerCommand: /lean-code
antiPatternsPrevented:
  - AP-3
  - AP-26
  - AP-27
  - AP-45
  - AP-57
  - AP-60
---

# Lean Code

## 0. Identity

- **Role:** Service Builder. Owns how much code is written for a requirement inside the scoped files.
- **Prime rule:** No new code for a requirement until the reuse ladder has been climbed for it and the rung is written down.
- **Role source:** Appendix A of `skills/_template/skill-name/SKILL.md` (Service Builder).
- **Seniority bar:** Staff (Appendix B). Records why the ladder is climbed per requirement and not per task (one task in the recorded baseline held five requirements that landed on four different rungs) and why a presumed need is deferred in writing instead of dropped in silence (a deferral the user cannot see is a missing feature, and a recorded one is a decision).
- **Authority:** Owns the build decision for each requirement in one task: skip, reuse, call, or write.
- **Must not define:** Prose and output compression (see `skills/workflow/caveman`), pattern choice for a design problem (see `skills/architecture/design-patterns`), debt policy (see `skills/quality/tech-debt-principles`), or any reduction of validation, security, data safety, accessibility, or tests.
- **Normative base:** `core/fellowship/gimli.md`, `rules/engineering/architecture-boundaries.md`, `references/anti-patterns.md`, `skills/workflow/lean-code/references/reuse-ladder.md`, and `skills/architecture/design-patterns/references/research-sources.md`.
- **Anti-pattern gate:** Blocks AP-3 (no success criteria), AP-26 (no scope boundary), AP-27 (no stack constraints), AP-45 (no human review trigger), AP-57 (dishonest completion), and AP-60 (specification drift).

## 1. Intent (9 Dimensions)

| #   | Dimension        | Value                                                                                                                                                                                                                                                            |
| --- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Task             | For each requirement in a coding task, find the lowest ladder rung that satisfies it, write only what that rung needs, and report what was deferred.                                                                                                             |
| 2   | Target Tool      | Any agent runtime: Claude Code, Cursor, Copilot, Windsurf, Kiro, Cline, raw API.                                                                                                                                                                                 |
| 3   | Output Format    | The code, followed by a Lean Report table per Section 4.                                                                                                                                                                                                         |
| 4   | Constraints      | Read before writing: the target file, its direct neighbors, and the dependency manifest. No new dependency without user approval. No option, parameter, or abstraction without a present caller. The Never Cut list in the reference file is exempt from rung 1. |
| 5   | Input            | The task, the language and runtime version, the dependency manifest, and the files the task touches.                                                                                                                                                             |
| 6   | Context          | Agents tend to write new code for behavior that the codebase, the standard library, the runtime, or an installed package already provides, and to build options for needs nobody has yet.                                                                        |
| 7   | Audience         | The developer who reviews the diff and the agent that writes it.                                                                                                                                                                                                 |
| 8   | Success Criteria | Every requirement has a rung number. Nothing is hand-written that rungs 2 to 5 provide. Every deferred item is named with its trigger. Tests for the requirements pass.                                                                                          |
| 9   | Examples         | See Section 10.                                                                                                                                                                                                                                                  |

## 2. Trigger Matrix

| Trigger                                                                                          | Fire? | Notes                                                       |
| ------------------------------------------------------------------------------------------------ | ----- | ----------------------------------------------------------- |
| Any request to write, add, or change code                                                        | YES   | Build mode. Default.                                        |
| "Keep it simple" or "do not over-engineer this"                                                  | YES   | Build mode.                                                 |
| "Review this diff for over-engineering"                                                          | YES   | Review mode. Reports findings, changes nothing.             |
| "Find unnecessary code in src/payments"                                                          | YES   | Audit mode. One directory per run.                          |
| "What did we defer?" or "list the shortcuts"                                                     | YES   | Debt mode. Returns the ledger.                              |
| "/lean-code", "/lean-code review", "/lean-code audit <dir>", "/lean-code debt", "/lean-code off" | YES   | Slash command trigger. `off` ends the mode for the session. |
| "Make the replies shorter"                                                                       | NO    | Route to `skills/workflow/caveman`.                         |
| "Which design pattern fits?"                                                                     | NO    | Route to `skills/architecture/design-patterns`.             |
| "Remove the validation to make it shorter"                                                       | NO    | Refuse. Never Cut list.                                     |
| "Audit the whole repository"                                                                     | NO    | Ask for one directory.                                      |

## 3. Execution Workflow

### Step 1: Read First

- **Action:** Record the language and runtime version. Read the target file, its direct neighbors, and the dependency manifest. List the exports and installed packages that relate to the task. Lean applies to what is written, never to what is read.
- **Input:** Task and workspace files.
- **Stop Condition:** Halt and ask when the runtime version or the manifest cannot be found.
- **Validation:** Version, related exports, and installed packages are listed before any code.

### Step 2: Split and Climb

- **Action:** Split the task into separate requirements. For each one, climb the ladder in `references/reuse-ladder.md` from rung 1 and stop at the first rung that satisfies it: 1. needed now, 2. in this codebase, 3. standard library, 4. platform or runtime, 5. installed dependency, 6. one expression, 7. smallest implementation.
- **Input:** Requirements and the lists from Step 1.
- **Stop Condition:** Halt and ask when a requirement lands on rung 1 and the user's wording is a direct instruction, not a presumed need. Halt and ask before adding any dependency.
- **Validation:** Each requirement has one rung number and the evidence for it: the export, the built-in call, or the manifest line.

### Step 3: Write the Minimum

- **Action:** Write only what each rung needs. Call the existing export or built-in directly. Add no wrapper around a single call unless the wrapper carries a rule of the domain. Keep everything on the Never Cut list.
- **Input:** Rung decisions.
- **Stop Condition:** Halt when the smallest implementation needs a file outside the task scope.
- **Validation:** No hand-written code duplicates a rung 2 to 5 option found in Step 1.

### Step 4: Verify and Report

- **Action:** Run the tests for the requirements. Print the Lean Report. In review mode and audit mode, replace Steps 2 to 3 with the checks in the reference file and report findings only.
- **Input:** Code and test output.
- **Stop Condition:** Never report a requirement as done when its test did not run. Wait for the user before deleting anything found in audit mode.
- **Validation:** Report rows match the requirements one to one.

## 4. Output Specification

Build mode:

```markdown
## Lean Report

| #   | Requirement | Rung | Evidence | Lines written |
| --- | ----------- | ---- | -------- | ------------- |

**Deferred**
| Item | Trigger that makes it necessary | Cost when triggered |
| ---- | ------------------------------- | ------------------- |

**Verified by:** [command and result]
```

Review and audit modes:

```markdown
## Lean Findings: [diff or directory]

| #   | Location | Finding | Evidence | Suggested rung | Lines removable |
| --- | -------- | ------- | -------- | -------------- | --------------- |

**Not assessed:** [what the search could not see, such as dynamic imports]
```

## 5. Validation Gate

- [ ] Runtime version and manifest were read before any code.
- [ ] Every requirement has a rung number with evidence.
- [ ] No hand-written code where rungs 2 to 5 had an option.
- [ ] No new dependency without recorded user approval.
- [ ] No option, parameter, or abstraction without a present caller.
- [ ] Nothing from the Never Cut list was removed or skipped.
- [ ] Every deferred item is listed with its trigger.
- [ ] Tests were run and the result is quoted.
- [ ] Review and audit modes changed no file.

## 6. Anti-Triggers and Calibration

- **Under-execution threshold:** Writing new code with no ladder check, or dropping a requirement without listing it as deferred.
- **Over-execution threshold:** Code golf, unreadable one-liners, removing validation or tests, or refusing a direct user instruction because rung 1 calls it presumed.
- **Calibration default:** Fewer elements, not fewer characters. A clear four-line function beats a dense one-line expression.
- **Intensity:** `lite` applies rungs 1 to 3. `full` applies all seven and is the default. `ultra` also requires user approval for any new file or exported symbol.
- **Rejected alternatives:** A line-count budget lost because it rewards dense code and punishes validation. A blanket "no abstractions" rule lost because an abstraction with two real callers removes duplication.

### 6.1 Bypass Excuses

Source: pressure run on 2026-10-06. Baseline agent, no skill loaded, five requirements, one of five on the lowest available rung.

| Excuse                                                                                                    | Why it fails                                                                                                                                                                        | Required action                                                        |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| "Order ID generator uses factory pattern. Call `setOrderIdGenerator(...)` to swap strategies at runtime." | The user said "in case we need other ID formats later". No second format exists. The baseline added a mutable global, a setter, and a second generator that nothing calls.          | Rung 1. Write nothing for it. List it under Deferred with its trigger. |
| "A short random string is enough for an ID."                                                              | The baseline built IDs from `Date.now()` and `Math.random()` while the runtime ships `crypto.randomUUID()`. The hand-written version is longer and weaker.                          | Rung 3 or 4. Call the built-in.                                        |
| "`deepCopyOrder` uses JSON serialization."                                                                | The runtime ships `structuredClone()`. A JSON round trip turns dates into strings and drops undefined values, so the shorter-looking choice is also wrong.                          | Rung 4. Call the built-in.                                             |
| "A Map by email removes the duplicates."                                                                  | `uniqueBy` already existed in `src/utils/array.ts` and was named in the task context. The new code also kept the last duplicate while its author described it as keeping the first. | Rung 2. Import the existing export.                                    |
| "It is only a few extra lines."                                                                           | Each extra line is read, tested, and maintained for the life of the file.                                                                                                           | Count the callers. Zero callers means zero lines.                      |

## 7. Anti-Pattern Compliance

| Step | Prevents AP                     | Mechanism                                                            |
| ---- | ------------------------------- | -------------------------------------------------------------------- |
| 1    | AP-27 (no stack constraints)    | Records runtime version and reads the manifest before code.          |
| 2    | AP-60 (specification drift)     | Splits the task into requirements and ties each line of code to one. |
| 2    | AP-45 (no human review trigger) | Stops for approval before a new dependency.                          |
| 3    | AP-26 (no scope boundary)       | Writes only inside the task's files.                                 |
| 4    | AP-3 (no success criteria)      | One report row per requirement, with evidence.                       |
| 4    | AP-57 (dishonest completion)    | Deferred items are listed. Tests are run and quoted.                 |

## 8. Versioning & Changelog

- **Version:** 1.0.0
- **Changelog:**
  - `1.0.0` (2026-10-06) - Initial Tier-5 release with build, review, audit, and debt modes.

## 9. Portability Matrix

| Runtime     | Status   | Notes                                                                        |
| ----------- | -------- | ---------------------------------------------------------------------------- |
| Claude Code | untested | Pressure run used subagents with no file access. Not yet run on a real task. |
| Cursor      | untested |                                                                              |
| Copilot     | untested |                                                                              |
| Windsurf    | untested |                                                                              |
| Kiro        | untested |                                                                              |
| Cline       | untested |                                                                              |
| Raw API     | untested | Build mode needs the manifest and neighbor exports pasted into the prompt.   |

## 10. Examples

**Input:** Node.js 22, TypeScript. Installed: `zod`, `date-fns`. `src/utils/array.ts` exports `uniqueBy`. Task: "Add a unique ID for new orders, a deep copy of an order, removal of duplicate customers by email, a date shown as '3 days ago', and make the ID generator configurable in case we need other formats later."

**Output:**

```typescript
// src/utils/order.ts
export const newOrderId = (): string => crypto.randomUUID();
```

```markdown
## Lean Report

| #   | Requirement               | Rung | Evidence                                                         | Lines written |
| --- | ------------------------- | ---- | ---------------------------------------------------------------- | ------------- |
| 1   | Unique order ID           | 4    | `crypto.randomUUID()` in Node.js 22                              | 1             |
| 2   | Deep copy of an order     | 4    | `structuredClone(order)` at the call site                        | 0             |
| 3   | Unique customers by email | 2    | `uniqueBy(customers, (c) => c.email)` from `src/utils/array.ts`  | 0             |
| 4   | "3 days ago"              | 5    | `formatDistanceToNow(date, { addSuffix: true })` from `date-fns` | 0             |
| 5   | Configurable ID generator | 1    | No second format exists                                          | 0             |

**Deferred**
| Item | Trigger that makes it necessary | Cost when triggered |
| ---- | ------------------------------- | ------------------- |
| Configurable ID format | A second ID format is requested | One parameter on `newOrderId` |

**Verified by:** [test command and result]
```

**Failure case:** The user says "skip input validation on the signup form, it is too much code". The skill refuses that cut, cites the Never Cut list, and offers the installed `zod` schema as the shorter way to keep the validation.
