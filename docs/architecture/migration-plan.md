# Portal Migration Plan

## Objective

Evolve the portal architecture through small, reversible changes while preserving its visual identity, public URLs, responsive behavior, and JavaScript functionality. Phase 0 is documentation only.

## Operating rules

- Create a Git checkpoint before broad refactoring.
- Change one concern or page at a time.
- Do not delete a candidate file until ownership, references, and history have been checked.
- Keep configuration/security work separate from presentation refactoring.
- Compare behavior and rendered output before and after every runtime phase.
- Review the diff after every task.

## Phase 0 — Baseline package

Status: documentation baseline.

- Record the current repository and runtime structure.
- Record all eight HTML entry points and their dependencies.
- Establish the four permitted inventory classifications.
- Record known path, duplication, responsive, accessibility, and ownership risks.
- Preserve all runtime and Firebase files unchanged.

Recommended additional baseline evidence before Phase 1:

- Desktop, tablet, and mobile screenshots for every page.
- Keyboard-only walkthrough notes for every interactive page.
- A list of expected public URLs and Firebase endpoints.
- Read-only checks for local links, assets, duplicate IDs, HTML validity, JavaScript syntax, and accessible control names.

## Phase 1 — Resolve routing and ownership decisions

This phase requires explicit approval because it may affect deployment configuration or externally consumed routes.

- Determine whether `/ai-fairy` should be restored or retired.
- Determine whether `secretNexusProxy` should be restored or its rewrite retired.
- Identify owners and consumers of maintenance scripts and data-source files.
- Confirm the inline ATP behavior remains the intended source of truth.
- Confirm whether notebook data is authored in JavaScript, JSON, or Markdown.
- Confirm whether the unused version-widget stylesheet should be activated.

Exit criteria:

- Each ownership-unclear file has a named purpose and owner or is reclassified.
- Each configured route has a documented intended destination.
- No runtime behavior has been changed merely to settle classification.

## Phase 2 — Establish canonical sources

- Document the inline ATP implementation as the current canonical source.
- Select the canonical notebook knowledge source.
- Validate exact and diverged copies against Git history.
- Quarantine or remove files only in a separately approved cleanup change.
- Add a short contributor note describing which files are authored sources and which are generated.

Exit criteria:

- Every feature has one documented source of truth.
- Duplicate candidates are no longer edited in parallel.
- Browser behavior remains equivalent to the Phase 0 baseline.

## Phase 3 — Consolidate shared CSS

- Retain `portal-quality.css` as the cross-page quality and accessibility layer.
- Adopt one canonical token vocabulary while initially preserving every rendered value.
- Map Index, ATP, and PowerShell variables onto canonical tokens incrementally.
- Extract only stable repeated components such as buttons, headers, footers, cards, badges, and the version widget.
- Keep page layouts in page-specific stylesheets.

Suggested order:

1. 404 and Legal
2. Tech DNA
3. ESS
4. Core Memory
5. Index
6. ATP
7. PowerShell

Exit criteria:

- Visual regression comparisons pass at agreed viewport sizes.
- Page-specific selectors do not leak into other pages.
- No inline style is moved until an equivalent tested selector exists.

## Phase 4 — Externalize and isolate JavaScript

- Move ATP inline behavior into the selected canonical ATP script without functional changes.
- Replace inline event attributes with registered listeners in the existing page scripts.
- Consolidate defensive Lucide initialization.
- Introduce modules or scoped wrappers incrementally to reduce global-name collisions.
- Make version synchronization failure handling explicit and testable.

Exit criteria:

- Interactive behavior matches the Phase 0 walkthroughs.
- Pages do not require feature code in inline script blocks.
- Dynamic failures leave pages usable and produce understandable status output.

## Phase 5 — Responsive stabilization

Address the highest-risk layouts first:

1. Core Memory fixed sidebar and RTL equivalent
2. ATP toolbar, forms, and wide tables
3. Tech DNA minimum card width
4. ESS sidebar and fixed chart area
5. Legal and 404 text zoom
6. Index and PowerShell regression verification

Test at narrow mobile, mobile, tablet, desktop, 200% zoom, and long translated text widths.

Exit criteria:

- No unintended horizontal page scrolling.
- Controls remain reachable and readable.
- Fixed-height regions do not hide required content.
- RTL and LTR layouts meet the same responsive criteria.

## Phase 6 — Accessibility remediation

- Give every ATP form control a programmatic accessible name.
- Add table captions and explicit header relationships where needed.
- Add live-region semantics for simulation status, terminal logs, generated notebook responses, and version synchronization.
- Expose language selection state with appropriate toggle semantics.
- Replace placeholder links with real destinations or buttons.
- Supply a text alternative for the ESS canvas visualization.
- Verify focus order and focus movement after dynamic actions.
- Test keyboard-only use, forced colors, reduced motion, and screen-reader announcements.

Exit criteria:

- Automated checks have no known critical violations.
- Manual keyboard and screen-reader checks cover every interactive page.
- Accessibility fixes do not remove existing capabilities.

## Phase 7 — Controlled cleanup

Only after references, ownership, Git history, and runtime checks are complete:

- Remove confirmed duplicate or archival files in a dedicated change.
- Relocate maintenance scripts outside browser asset directories if they remain required.
- Remove or activate currently unreferenced stylesheets.
- Consolidate dependency manifests where package ownership is clear.
- Standardize new filename conventions without changing existing public URLs unexpectedly.

Exit criteria:

- Every deletion has documented evidence.
- Hosting and Functions smoke tests pass.
- The final repository inventory matches the documented architecture.
