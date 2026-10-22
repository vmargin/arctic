# Reuse Ladder Reference

> **Purpose:** Detail for each rung of the ladder in `skills/workflow/lean-code/SKILL.md`, the list of code that is never cut, and the checks for review and audit modes.
> **Sources:** Principles cite the verified index in `skills/architecture/design-patterns/references/research-sources.md` (S04, S05, S06, S08). Platform features named below are standard, documented APIs. Confirm the version in the target project before use.

---

## 1. The ladder

Climb from rung 1. Stop at the first rung that satisfies the requirement. Write the rung number beside each requirement.

| Rung | Question                                           | How to check                                                                                                                              | Result when the answer is yes                                                                                                                     |
| :--- | :------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | Does this need to exist now?                       | Is there a present caller, a ticket, or a dated need? Phrases such as "in case", "later", "for flexibility" signal a presumed need (S05). | Write nothing. Name the item as deferred and say what would trigger it.                                                                           |
| 2    | Is it already in this codebase?                    | Search exports for the behavior, not the name you would give it. Read the direct neighbors of the target file.                            | Import and call it. Extend it only when the caller's need differs.                                                                                |
| 3    | Is it in the standard library of the language?     | Check the language reference for the project's version.                                                                                   | Call it.                                                                                                                                          |
| 4    | Is it a native feature of the platform or runtime? | Check the runtime, browser, database, or framework the project already runs on.                                                           | Call it.                                                                                                                                          |
| 5    | Is it in a dependency already installed?           | Read the manifest file. Never add a dependency at this rung.                                                                              | Import it.                                                                                                                                        |
| 6    | Is it one expression?                              | Write it inline. If it needs a name to be understood, it is not one expression.                                                           | Inline it. Extract only on the third use.                                                                                                         |
| 7    | None of the above                                  |                                                                                                                                           | Write the smallest implementation that satisfies the stated requirement and its tests. No options, hooks, or parameters without a present caller. |

A new dependency is not a rung. Adding one needs user approval, because it adds supply-chain and maintenance cost that the diff does not show.

## 2. Never cut

Rung 1 never removes these. They are requirements, not extras.

| Area             | Keep                                                                                                                      |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------ |
| Trust boundaries | Validation of every input that crosses from a user, a network, a file, or another service                                 |
| Security         | Authentication, authorization, output encoding, parameterized queries, secret handling                                    |
| Data safety      | Transactions, idempotency on retried writes, backups before destructive changes                                           |
| Error handling   | Handling at the point where the program can recover or must report                                                        |
| Accessibility    | Labels, roles, focus order, and contrast in any user interface                                                            |
| Tests            | The test that proves the requirement. Lean applies to production code and to test count, never to the existence of a test |
| Reading          | Lean applies to what is written. It never applies to how much of the surrounding code is read first                       |

## 3. Examples of rungs 3 and 4

Common hand-written code that a platform already provides. Verify against the project's versions.

| Need                           | Often written by hand                | Provided by                                                                                                     |
| :----------------------------- | :----------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| Unique identifier              | Random string builder                | `crypto.randomUUID()` in Node.js and browsers, `uuid` module in Python, `UUID.randomUUID()` in Java             |
| Deep copy of plain data        | Recursive clone function             | `structuredClone()` in Node.js and browsers, `copy.deepcopy` in Python                                          |
| Relative time text             | Manual arithmetic on milliseconds    | `Intl.RelativeTimeFormat` in JavaScript                                                                         |
| Number and currency formatting | String concatenation                 | `Intl.NumberFormat` in JavaScript, `locale` and format specs in Python                                          |
| Group items by key             | Reduce loop                          | `Object.groupBy` in current JavaScript runtimes, `itertools.groupby` in Python, `Collectors.groupingBy` in Java |
| Retry with delay on HTTP       | Custom loop                          | The HTTP client's own retry option, when the installed client has one                                           |
| Debounce in a UI framework     | Custom timer code                    | The framework's or installed utility library's function                                                         |
| Uniqueness of a column         | Application-side check before insert | A unique constraint in the database                                                                             |
| Scheduled cleanup              | Application timer                    | The platform scheduler or the database's own expiry feature                                                     |

## 4. Review mode checks

Apply to a diff. Report only what the diff shows.

| Finding                                            | Evidence to quote                                                         | Suggested rung      |
| :------------------------------------------------- | :------------------------------------------------------------------------ | :------------------ |
| Presumed feature                                   | A parameter, option, or branch with no caller in the diff or the codebase | 1                   |
| Duplicate of existing code                         | The new function and the existing export, side by side                    | 2                   |
| Reimplemented standard or platform feature         | The new function and the built-in call that replaces it                   | 3 or 4              |
| New dependency for something an installed one does | The manifest line and the installed alternative                           | 5                   |
| Wrapper that forwards unchanged (Middle Man, S08)  | The wrapper body                                                          | 6                   |
| Abstraction with one implementation                | The interface and its single implementer                                  | 6                   |
| Configuration with one value in use                | The option and its only call site                                         | 1                   |
| Shared helper with a flag per caller (S04)         | The flag parameter and the branches                                       | Inline into callers |

## 5. Audit mode limits

- Scope: one directory per run, named by the user. Never the whole repository in one pass.
- Read exports and their callers. An export with no caller is a candidate, not a verdict. Dynamic imports, reflection, public package entry points, and framework conventions create callers that a text search misses.
- Report candidates with the search that found zero callers. Delete nothing.
- Cap the report at 15 candidates, ranked by lines removed.

## 6. Debt ledger format

When a requirement is deferred at rung 1, or a shortcut is taken on purpose, record it so the saving is not silent debt.

| Field               | Content                                           |
| :------------------ | :------------------------------------------------ |
| Item                | What was not built, or what shortcut was taken    |
| Where               | File and line, or "not in code"                   |
| Trigger             | The observable event that makes it necessary      |
| Cost when triggered | Rough size: one function, one module, a migration |
| Recorded            | Date                                              |

The ledger is returned in chat. It is written to a file only when the user names the file.
