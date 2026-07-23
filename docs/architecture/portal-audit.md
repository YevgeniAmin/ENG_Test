Technical Architecture Audit
Executive summary
The portal is a small Firebase-hosted, multi-page static site with eight HTML entry points, page-oriented CSS and JavaScript, plus one deployed Cloud Function. The working tree was clean when this audit was captured on the refactor/portal-architecture branch; that branch has since been merged into main, which is now the active branch.
The architecture is understandable but has accumulated copied files, unused assets, duplicated design tokens, inline ATP implementation code, and inconsistent responsive coverage.
Update: as of the current `main` branch, the stale Firebase routing described below has been resolved — `firebase.json` now ships an empty `rewrites` array, and no HTML/JS/JSON file references `/ai-fairy` or `secretNexusProxy` anymore. `version-sync.js` itself has also been deleted from the repo (see Known Risks R-07); the pages that used it now render a static `.version-sync` placeholder instead. The findings below are preserved as the original Phase 0 record.
No files were changed at the time of this audit.
1. Current folder structure
C:\eng-portal
├── public/                     Firebase Hosting document root
│   ├── index.html              Main portal
│   ├── 404.html
│   ├── atp-ai-simulation.html
│   ├── core-memory.html
│   ├── ess-lab.html
│   ├── legal-terms.html
│   ├── my-tech-dna.html
│   ├── powershell-sim.html
│   └── assets/
│       ├── css/                12 stylesheets
│       ├── js/                 11 JS/Python files
│       ├── images/             7 WebP images
│       └── data/               3 Markdown files and 1 JSON file
├── functions/
│   ├── index.js                Firebase Cloud Function
│   ├── package.json
│   └── package-lock.json
├── .github/workflows/          Firebase preview and production workflows
├── .agents/                    Agent skills and reference material
├── .codex/                     Local Codex metadata
├── .firebase/                  Ignored Firebase-generated cache
├── .vscode/
├── node_modules/               Ignored root dependencies
├── firebase.json
├── .firebaserc
├── package.json
├── package-lock.json
└── skills-lock.json
Architecture observations:
public/ is a flat multi-page application rather than a component-based frontend.
Page filenames mix underscores and hyphens.

There are two separate Node dependency manifests. Root dependencies substantially overlap the Functions dependencies, but there are no root scripts showing how the root packages are used.
.agents/ is tracked development tooling, not portal runtime code.
Both root and Functions dependency trees are installed locally and ignored by Git.
2. HTML entry points
Entry point	Purpose	CSS	JavaScript
[index.html](C:/eng-portal/public/index.html)	Main portal/dashboard	index.css, portal-quality.css	notebook-simulator.js
[404.html](C:/eng-portal/public/404.html)	Firebase error page	Global tokens, error, quality	Lucide CDN, version sync, inline icon setup
[atp-ai-simulation.html](C:/eng-portal/public/atp-ai-simulation.html)	ATP document simulator	ATP, quality	Lucide, html2pdf, large inline implementation
[core-memory.html](C:/eng-portal/public/core-memory.html)	Core-memory dashboard	Global tokens, core memory, quality	Lucide, translator, core memory, version sync
[ess-lab.html](C:/eng-portal/public/ess-lab.html)	ESS vibration simulation	Global tokens, ESS, quality	Chart.js, Lucide, ESS simulation, version sync
[legal-terms.html](C:/eng-portal/public/legal-terms.html)	Legal terms	Global tokens, legal, quality	Lucide, version sync, inline icon setup
[my-tech-dna.html](C:/eng-portal/public/my-tech-dna.html)	Technical profile page	Global tokens, page CSS, quality	Lucide, version sync, inline icon setup
[powershell-sim.html](C:/eng-portal/public/powershell-sim.html)	PowerShell simulator	PowerShell, quality	Lucide, PowerShell simulation, version sync

Positive findings:
Every page has a title, viewport declaration, language/direction attributes, main landmark, and skip link.
All statically referenced local stylesheets, scripts, images, and internal page links currently resolve to existing files.
Images used in HTML all have alt text.
The primary portal links point to existing HTML files.
Structural concerns:
ATP contains its behavior inline.
Shared headers, footers, home buttons, version widgets, and CDN initialization are manually repeated.
index.html contains unusual markup: <V2 class="0">. Browsers tolerate custom elements, but this is not meaningful semantic markup and appears accidental.
ESS sidebar links use href="#", creating non-functional navigation and unexpected page jumps.
There is no automated HTML validation or internal-link test.
3. CSS architecture
Shared CSS
[global-tokens.css](C:/eng-portal/public/assets/css/global-tokens.css)Shared design variables used by 404, Core Memory, ESS, Legal, and Tech DNA.
Not loaded by Index, ATP, or PowerShell.

[portal-quality.css](C:/eng-portal/public/assets/css/portal-quality.css)Loaded by all eight pages.
Provides shared box sizing, image safety, keyboard focus, skip-link styling, reduced-motion handling, and forced-colors support.

Page-specific CSS
index.css — self-contained theme and dashboard layout.
atp-sim.css — ATP document/editor and print layout.
core-memory.css — fixed sidebar dashboard.
ess-sim.css — lab controls and chart layout.
powershell-sim.css — simulator workspace and terminal.
legal-style.css — legal document presentation.
my_tech_dna.css — profile/card presentation.
error-style.css — 404 page.
CSS concerns
Three token systems exist.
global-tokens.css, index.css, and powershell-sim.css each define their own root variables. ATP also defines page-level root variables. This allows design values to drift.

Shared component styles remain duplicated.
Buttons, headers, footers, cards, badges, sidebars, and page containers are redefined across page stylesheets.

Unused stylesheets:
version-sync.css
version-sync.css is especially notable because the active <portal-version> component generates classes defined there, but no HTML page loads the file. The version widget may therefore be unstyled or depend accidentally on similarly named page selectors.

Uneven responsive coverage:
Stronger coverage: Index, PowerShell, ATP.
Basic coverage: ESS and Legal.
No page-specific media queries: Core Memory, 404.
Update: this originally also listed Tech DNA, but `my_tech_dna.css` was rewritten for "Tech DNA V2" (commit `cc4a809`, predating this audit's Phase 0 baseline commit) and now has its own `@media (max-width: 900px)` and `@media (max-width: 680px)` breakpoints. See `known-risks.md` R-11 (closed).

Core Memory is a significant mobile risk.
It uses a fixed 300px 1fr application grid and switches to 1fr 300px for RTL, but has no small-screen breakpoint.

Tech DNA uses minmax(300px, 1fr) without a narrow-screen override.
With outer padding, this can overflow on devices narrower than approximately 348px.

ATP has 49 inline style attributes.
These override stylesheet behavior and make responsive changes harder to reason about.

PowerShell CSS is disproportionately large.
At 785 lines for a 115-line HTML page, it appears to contain multiple layout generations or repeated responsive rules. It has duplicated breakpoint sections at 1024px and 720px and should be audited before consolidation.

4. JavaScript architecture
Shared JavaScript
[version-sync.js](C:/eng-portal/public/assets/js/version-sync.js)Used on six pages.
Defines a <portal-version> custom element.
Calls the deployed driveVersionsProxy Cloud Function.
Index and ATP do not use it.

There is no general shared application shell or utility module. Scripts use global scope rather than ES modules.
Page-specific JavaScript
notebook-simulator.jsIndex-only template selection and prompt simulation.
Embeds its knowledge base directly in JavaScript.

powershell-sim.jsPowerShell command data, card rendering, terminal simulation, and progress UI.

ess-sim.jsGlobal Chart.js setup, timers, vibration data, and start/stop functions.

core_memory.jsLedger rendering, telemetry simulation, and language-button synchronization.

core_memory_translator.jsEnglish/Hebrew translation table and document direction changes.

ATP behaviorImplemented in the inline script in atp-ai-simulation.html.

Backend JavaScript
[functions/index.js](C:/eng-portal/functions/index.js) exports only:
driveVersionsProxy
It reads Drive metadata using a service account secret and supplies page-version information.
JavaScript risks
Scripts share global names and functions; future composition could cause collisions.
Inline onclick handlers couple Core Memory and ESS markup directly to global functions.
ATP has a large inline script, limiting CSP hardening and maintainability.
version-sync.js uses a hard-coded production URL rather than a same-origin route or environment-aware configuration.
version-sync.js parses response JSON without first verifying response.ok.
Lucide, Chart.js, and html2pdf are loaded from CDNs without Subresource Integrity.
Lucide and Chart.js use unpinned “latest/default” URLs, so upstream releases can change behavior without a repository change.
ATP pins html2pdf to the older 0.9.3 release.
PowerShell sample data includes a private-looking 10.50.2.14 endpoint. It is displayed simulation data, but it may expose internal infrastructure conventions publicly.
There is no linting, unit test, or browser smoke-test configuration.
5. Duplicate and copied files
Exact duplicate
public/assets/js/core_memory.js
These files have identical SHA-256 hashes.
Diverged copy
notebook-simulator.js
The copy is older or different: the files differ by 26 added and 50 removed lines. Only the non-copy version is loaded by the portal.
Parallel ATP implementations
Inline script in atp-ai-simulation.html
These are not exact copies, but they implement the same feature with different IDs and behavior. This is a source-of-truth risk.
Similar image variants
Potential copied or superseded image pairs:
artificial_hallucination.webp
environmental_stress_screening.webp
Only the first image in each pair is referenced by HTML.
6. Inline CSS and JavaScript
Page	Inline styles	Inline handlers	Inline script blocks
ATP	49	0	1 large block
Core Memory	1	2	0
ESS	0	2	1 one-line block
404	0	0	1 small block
Legal	0	0	1 small block
Tech DNA	0	0	1 small block
Index	0	0	0
PowerShell	0	0	0

Findings:
ATP is the main consolidation target.
Core Memory’s image presentation belongs in core-memory.css.
Core Memory and ESS event handlers should eventually become registered listeners in their existing scripts.
Repeated Lucide initialization could become a small shared initializer.
Inline scripts currently prevent a strict Content Security Policy without allowing 'unsafe-inline' or supplying hashes/nonces.
7. Broken or potentially broken asset paths
Confirmed configuration failures
Resolved as of current main: [firebase.json](C:/eng-portal/firebase.json) now ships an empty `rewrites` array — the /ai-fairy and /api/secret-nexus-proxy rewrites described below no longer exist. The home-page card was also relabeled from "Secret Nexus Proxy" to "Architecture Memory" (now linking to core-memory.html after the filename standardization pass), so the label/destination mismatch is resolved; the underlying image filename (`secret_nexus.webp`) is unchanged but is an internal asset name, not user-facing text. Original findings preserved below.
firebase.json previously mapped /ai-fairy to /ai-fairy.html, but that file did not exist.
The /api/secret-nexus-proxy rewrite previously targeted secretNexusProxy, which [functions/index.js](C:/eng-portal/functions/index.js) did not export.
Potential failures
External CDN availability or incompatible future releases can break Lucide and Chart.js.
version-sync.js always contacts the production us-central1-eng-web-portal project, including local or preview environments.
Clean URLs may make page-key detection inconsistent:/legal_terms produces legal_terms. (This referred to version-sync.js's page-key logic, which no longer exists; the page itself is now at /legal-terms, with a redirect from the old /legal_terms path.)
A trailing slash produces index.
Direct .html paths happen to work.

version-sync.js assumes a successful response contains portalRegistry.items.
version-sync.css is not loaded, so the active version widget lacks its intended CSS.
No broken local HTML asset path was found in the current static scan.
CSS contains no local url(...) asset dependencies.
8. Obsolete or unused files
These are candidates for quarantine and later removal, not safe deletion conclusions yet:
Strong candidates
public/assets/css/version-sync.css is currently unused, but likely should be activated rather than deleted
Support files with unclear ownership
These may support manual content generation even though the browser does not load them.
Dependency/configuration questions
Root package.json has dependencies but no scripts or application entry point.
functions/package.json repeats several root dependencies.
The stale Firebase rewrites suggest removed features were not fully retired.
Generated .firebase cache exists locally but is correctly ignored.
Before removing any candidate, check Git history, deployment artifacts, documentation, and external automation.
9. Responsive and accessibility risks
Positive baseline
All pages include viewport metadata.
All pages have skip links and main targets.
Shared CSS provides visible focus treatment and reduced-motion support.
All HTML images include alternate text.
Most interactive controls are native buttons, inputs, or links.
High-priority risks
ATP form labeling
ATP contains 45 input/select controls and zero <label> elements. Most controls rely on adjacent table cells or placeholders, which do not reliably create accessible names.

Core Memory mobile layout
Fixed 300px sidebar with no responsive breakpoint is likely to overflow or compress content severely.

ATP table usability
Wide five-column tables depend on horizontal scrolling. The table structure lacks captions and explicit header associations.

Dynamic status announcements
ATP simulation, ESS status changes, PowerShell logs, version synchronization, and notebook responses do not clearly use aria-live regions. Screen-reader users may not learn that content changed.

Icon accessibility
Decorative Lucide icons are not consistently marked aria-hidden="true". Buttons generally include visible text, which mitigates this, but decorative SVGs may still enter the accessibility tree.

ESS placeholder navigation
href="#" items are presented as links despite having no destination or implemented navigation behavior.

Language toggles
Core Memory language buttons visually track an active state, but do not expose selection through aria-pressed.

Canvas fallback
The ESS Chart.js canvas should have an accessible description or equivalent textual data.

Malformed/non-semantic branding markup
The <V2 class="0"> element in the index heading should be ordinary semantic markup.

Focus after dynamic actions
ATP clear/fill, PowerShell terminal opening, and injected notebook results do not explicitly manage focus.

Secondary responsive risks
Tech DNA card minimum width can overflow very narrow viewports.
ATP inline widths compete with its responsive stylesheet.
Fixed-height chart, terminal, and log areas may crop content under text zoom.
Core Memory’s RTL layout repeats the same fixed-width issue in reverse.
No evidence of testing at 200% zoom, high contrast, or keyboard-only operation.
10. Safe phased migration plan
Phase 0 — Establish a verified baseline
Create a Git checkpoint before structural work.
Capture screenshots at desktop, tablet, and mobile widths for all eight pages.
Record keyboard flows and current interactive behavior.
Add read-only checks for:Broken internal links and assets
HTML validity
Duplicate IDs
Missing accessible names
JavaScript syntax

Confirm whether stale routes and unused support files have external consumers.
Phase 1 — Correct confirmed broken configuration
Keep this separate from visual refactoring.
Decide whether /ai-fairy should be restored or removed.
Decide whether secretNexusProxy should be restored or its rewrite retired.
Make version sync environment-aware and validate HTTP responses.
Pin external CDN package versions.
Add SRI or self-host dependencies where practical.
Deployment/security configuration should only be changed with explicit approval.
Phase 2 — Resolve sources of truth
Mark copy files as archival candidates.
Confirm the ATP inline implementation as the canonical version.
Determine whether the JSON knowledge base or embedded JS data is canonical.
Document whether Markdown and Python files are source inputs or obsolete artifacts.
Remove nothing until behavior and ownership are verified.
Phase 3 — Consolidate shared styling safely
Keep portal-quality.css as the accessibility/resilience layer.
Extend global-tokens.css into the canonical token layer.
Map Index, ATP, and PowerShell variables onto shared tokens without changing rendered values.
Extract only genuinely repeated components:Buttons
Page headers
Footers
Cards
Badges
Version widget

Preserve page-specific layout files.
Migrate one page at a time and compare screenshots after each change.
Phase 4 — Externalize inline implementation
Move ATP’s inline script into the canonical ATP JS file without changing behavior.
Move ATP’s 49 style declarations into named stylesheet classes.
Replace Core Memory and ESS inline handlers with registered event listeners.
Move repeated Lucide initialization into a shared, defensive initializer.
Load or integrate the intended version-widget CSS.
Phase 5 — Responsive stabilization
Recommended order:
Core Memory fixed sidebar
ATP tables and toolbars
Tech DNA narrow card grid
ESS sidebar and chart
Legal and 404 text zoom
Regression-check Index and PowerShell
Use content-driven breakpoints and preserve the existing visual identity.
Phase 6 — Accessibility remediation
Add labels or aria-label/aria-labelledby relationships to every ATP control.
Add table captions and valid header associations.
Add live regions for dynamic statuses and logs.
Expose toggle state with aria-pressed.
Replace non-functional links with buttons or real destinations.
Add canvas descriptions and textual equivalents.
Verify keyboard order, focus visibility, 200% zoom, reduced motion, and forced colors.
Phase 7 — Controlled cleanup
Only after reference searches, browser tests, and deployment verification:
Remove confirmed copied files.
Retire unused image variants.
Relocate maintenance Python scripts outside runtime asset directories.
Remove or activate unused CSS.
Consolidate dependency manifests where ownership is clear.
Standardize filename conventions without breaking published URLs; use redirects if public URLs change.
Overall assessment
The portal does not require a framework rewrite. A focused multi-page architecture remains suitable at its current size. The safest direction is to preserve each page’s behavior and identity while progressively introducing:
One canonical token layer
One shared quality/accessibility layer
Explicit page-specific styles and scripts
A small shared runtime utility layer
Automated link, HTML, accessibility, and responsive regression checks
The repository remained unchanged, and git status was clean at the end of the audit.
