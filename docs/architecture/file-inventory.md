# Portal File Inventory

## Classification rules

Every listed authored file uses exactly one of these classifications:

- **active** — referenced by the current runtime, required by current configuration/development workflows, or part of the Phase 0 documentation set.
- **duplicate candidate** — an exact or diverged copy, or a parallel implementation requiring comparison before any cleanup.
- **archival candidate** — currently unreferenced by runtime/configuration and plausibly retained for historical or superseded use.
- **ownership unclear** — purpose or authoritative consumer cannot be proven from current repository references.

Candidate classifications are not deletion instructions. Ignored/generated content (`node_modules/`, `functions/node_modules/`, `.firebase/`) is excluded.

## HTML pages

| File | Classification | Current role |
|---|---|---|
| `public/index.html` | active | Main portal entry point and notebook simulator UI. |
| `public/404.html` | active | Firebase Hosting error page. |
| `public/atp-ai-simulation.html` | active | ATP/ATR document simulator; contains the active inline ATP behavior. |
| `public/core-memory.html` | active | Core Memory dashboard and bilingual narrative. |
| `public/ess-lab.html` | active | ESS vibration simulation page. |
| `public/legal-terms.html` | active | Terms, privacy, and disclaimer page. |
| `public/my-tech-dna.html` | active | Technical profile page. |
| `public/powershell-sim.html` | active | PowerShell management-console simulator. |

## CSS files

| File | Classification | Current role |
|---|---|---|
| `public/assets/css/global-tokens.css` | active | Shared tokens loaded by 404, Core Memory, ESS, Legal, and Tech DNA. |
| `public/assets/css/portal-quality.css` | active | Shared quality/accessibility layer loaded by all eight HTML pages. |
| `public/assets/css/index.css` | active | Main portal layout and page-local tokens. |
| `public/assets/css/error-style.css` | active | 404 page styles. |
| `public/assets/css/atp-sim.css` | active | ATP screen and print styles. |
| `public/assets/css/core-memory.css` | active | Core Memory layout and component styles. |
| `public/assets/css/ess-sim.css` | active | ESS layout, controls, metrics, and chart styles. |
| `public/assets/css/legal-style.css` | active | Legal page styles. |
| `public/assets/css/my_tech_dna.css` | active | Tech DNA page styles. |
| `public/assets/css/powershell-sim.css` | active | PowerShell simulator layout and component styles. |
| `public/assets/css/version-sync.css` | ownership unclear | Defines styles matching the active version widget but is not loaded by any HTML page. |

## JavaScript and support scripts

| File | Classification | Current role |
|---|---|---|
| `public/assets/js/notebook-simulator.js` | active | Main-page notebook template and prompt simulation. |
| `public/assets/js/powershell-sim.js` | active | PowerShell cards, state, terminal, and execution simulation. |
| `public/assets/js/ess-sim.js` | active | Chart.js setup and vibration simulation. |
| `public/assets/js/core_memory.js` | active | Memory ledger and telemetry simulation. |
| `public/assets/js/core_memory_translator.js` | active | English/Hebrew translation and direction switching. |
| `public/assets/js/version-sync.js` | active | Shared version custom element used by six pages. |
| `functions/index.js` | active | Exports the deployed `driveVersionsProxy` HTTPS function. |

## Data files

| File | Classification | Current role |
|---|---|---|
| `public/assets/data/Project_Historical_Context.md` | ownership unclear | Referenced by embedded source labels/support scripts but not fetched by the active browser runtime. |

## Images

| File | Classification | Current role |
|---|---|---|
| `public/assets/images/atp_card_icon.webp` | active | ATP card image on the main portal. |
| `public/assets/images/powershell.webp` | active | PowerShell card image on the main portal. |
| `public/assets/images/secret_nexus.webp` | active | Card image for the "Architecture Memory" card on the main portal (filename predates the card's rename from "Secret Nexus Proxy"). |
| `public/assets/images/environmental_stress_screening.webp` | active | ESS card image on Core Memory. |
| `public/assets/images/artificial_hallucination.webp` | active | Core Memory narrative image. |
| `public/assets/images/favicon-16x16.png` | active | Site favicon, loaded by all eight HTML pages. |
| `public/assets/images/favicon-32x32.png` | active | Site favicon, loaded by all eight HTML pages. |
| `public/assets/images/favicon-64x64.png` | active | Site favicon, loaded by all eight HTML pages. |
| `public/assets/images/apple-touch-icon.png` | active | Apple touch icon, loaded by all eight HTML pages. |
| `public/assets/images/tech_dna.webp` | active | Tech DNA card image on the main portal. |
| `public/assets/images/tech_dna_preview.png` | active | Open Graph/Twitter preview image on index.html and my-tech-dna.html. |

## Runtime configuration and dependency manifests

| File | Classification | Current role |
|---|---|---|
| `firebase.json` | active | Defines Hosting root, rewrites, headers, and Functions source. |
| `.firebaserc` | active | Selects the Firebase project used by CLI workflows. |
| `functions/package.json` | active | Declares Cloud Functions runtime, scripts, and dependencies. |
| `functions/package-lock.json` | active | Locks Cloud Functions dependencies. |
| `functions/.gitignore` | active | Excludes Functions-local runtime files. |
| `functions/.env` | ownership unclear | Empty ignored local environment file; not tracked as a distributable configuration source. |
| `package.json` | ownership unclear | Root dependencies are declared, but no root scripts or application entry point identify ownership. |
| `package-lock.json` | ownership unclear | Locks the root dependency set whose runtime/development purpose is unclear. |
| `.gitignore` | active | Protects generated files, dependencies, local environments, and secrets from tracking. |

## Development and automation files

| File or group | Classification | Current role |
|---|---|---|
| `.github/workflows/firebase-hosting-merge.yml` | active | Firebase Hosting deployment workflow for merged changes. |
| `.github/workflows/firebase-hosting-pull-request.yml` | active | Firebase Hosting preview workflow for pull requests. |
| `.vscode/settings.json` | active | Repository editor settings. |
| `AGENTS.md` | active | Repository development and safety rules. |
| `skills-lock.json` | active | Locks repository agent-skill metadata. |
| `.agents/skills/**` | active | Repository-provided agent skills and references. |
| `.codex/**` | active | Repository-local Codex configuration/metadata where present. |
| `scripts/update-favicons.ps1` | active | Maintenance script used to (re)generate the favicon/apple-touch-icon set. |
| `scripts/BOM-LineEndings.ps1` | active | Maintenance script for normalizing file BOM/line-endings. |

## Phase 0 documentation

| File | Classification | Current role |
|---|---|---|
| `docs/architecture/portal-audit.md` | active | Original read-only audit captured before this baseline package. |
| `docs/architecture/current-structure.md` | active | Current repository, page, CSS, JavaScript, and dependency structure. |
| `docs/architecture/migration-plan.md` | active | Proposed phased migration sequence and exit criteria. |
| `docs/architecture/known-risks.md` | active | Phase 0 risk register. |
| `docs/architecture/file-inventory.md` | active | File classifications and current roles. |

## Classification summary

The active classification describes the current baseline, not a guarantee that a file is defect-free. Duplicate and archival candidates must remain in place until an explicitly approved cleanup phase. Ownership-unclear files require investigation before they can be retained, relocated, reclassified, or removed.
