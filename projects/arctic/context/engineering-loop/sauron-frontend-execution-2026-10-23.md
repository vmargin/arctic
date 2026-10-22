# Executed frontend design-engineering review

Applied the local design-engineering router, Stage 1 UI/UX stack-compliance audit, React/accessibility/form guidance, and motion review references against the actual app. Read ARCTIC's `DESIGN.md`, shared CSS/tokens and controls, the React/UX/color references, and animation standards. The native Frodo agent confirmed the tab and Field defects before the account limit interrupted its implementation. The parent implemented and verified the changes.

## Findings and implemented corrections

| Finding | Change | Verification |
| --- | --- | --- |
| Reports and Service Desk declare tabs without arrow navigation or roving focus | Added one shared horizontal-keyboard handler used by both lists; ArrowLeft/Right wrap and Home/End activate through existing native clicks. Only the selected tab participates in normal tab order. Added tab IDs and active-panel naming/focus relationships. | Playwright exercised both tablists, selection, focus, wrap, Home/End, Tab exit and active panel relationships. Service Desk retains existing search/error reset behavior through its click handler. |
| Field drops a child's existing accessible error description when adding a hint | Compose the existing `aria-describedby` IDs with the hint ID rather than overwrite them. | Three frontend contract tests render the real shared control and verify description composition, no-hint behavior, and currency behavior. Playwright also verifies real form label/hint ID targets. |
| All operational pages are eagerly included in the main bundle | Native React lazy pages and an existing shared Spinner/Suspense boundary at the Outlet; authentication/providers/sidebar/shared dialogs remain intact. | All 12 routes and both legacy aliases load in both themes at 1440px and 320px. No browser runtime error or failed API response was observed. |
| Currency tables construct an Intl formatter for every call | Reuse a module-level native en-PH/PHP formatter with the same options, finite-value fallback and output. | Real-module contract tests cover exact output for strings, rounding, negative/zero, invalid, null and non-finite values. A local 10,000-call benchmark measured approximately 371ms before versus 5ms cached; this is a microbenchmark, not a measured page-speed claim. |

## Design preservation and browser evidence

The original deep teal/light palettes, Lucide icons, typography, spacing, card/button styling, motion tokens, layout, routes, forms and domain data flow are preserved. The produced CSS asset hash remains `index-BDTAmycK.css`.

Captured Reports and Service Desk before and after in dark/light mode at 1440px/320px, with identical local data and reduced motion. All eight pairs of complete PNG files were byte-identical. This establishes visual preservation for those reference states, not every possible application state. Screenshots: `artifacts/sauron-browser/before/` and `after/`.

The production-build Playwright runner uses a real local demo login and server-revalidated session. It runs 56 route/theme/viewport combinations (12 routes plus 2 aliases, 2 themes, 2 widths), the focused keyboard checks, form dialog Escape/focus restoration, and a 390px native mobile drawer check. It does not submit any operational form. Browser failures and HTTP failures are recorded separately in `after/results.json` and must be empty for success. The runner checks `/health` identifies the isolated local instance before logging in.

Motion review: no new animation or CSS was introduced. Existing keyboard tab activation remains immediate; the reduced-motion browser context exercised dialogs/drawer and retained the project's established behavior. This was not a new global WCAG contrast certification or an automated screen-reader audit. Branding, image generation, marketing aesthetics, alternative prototypes, a new animation framework and a visual redesign have no matching need and were not invoked.
