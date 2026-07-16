# Current Portal Structure

## Purpose

This document records the Phase 0 architecture baseline for the ENG Portal. It describes the repository as observed on the `refactor/portal-architecture` branch before any runtime refactoring.

## Repository layout

```text
eng-portal/
|-- public/                         Firebase Hosting document root
|   |-- index.html                  Main portal page
|   |-- 404.html                    Hosting error page
|   |-- atp_ai_simulation.html      ATP document simulator
|   |-- core_memory.html            Core Memory dashboard
|   |-- ess_lab.html                ESS vibration simulator
|   |-- legal_terms.html            Legal terms page
|   |-- my_tech_dna.html            Technical profile page
|   |-- powershell-sim.html         PowerShell simulator
|   `-- assets/
|       |-- css/                    Shared and page-specific stylesheets
|       |-- js/                     Browser scripts and maintenance scripts
|       |-- images/                 WebP page and card images
|       `-- data/                   Markdown and JSON content sources
|-- functions/                      Firebase Cloud Functions package
|   |-- index.js                    driveVersionsProxy implementation
|   |-- package.json
|   `-- package-lock.json
|-- docs/architecture/              Architecture baseline documentation
|-- .github/workflows/              Firebase deployment workflows
|-- .agents/                         Local agent skills and references
|-- .codex/                          Local Codex metadata
|-- .vscode/                         Editor settings
|-- firebase.json                    Hosting and Functions configuration
|-- .firebaserc                      Firebase project selection
|-- package.json                     Root Node dependencies
|-- package-lock.json
`-- skills-lock.json                 Agent skill lock data
```

Ignored/generated directories such as `node_modules/`, `functions/node_modules/`, and `.firebase/` are not part of the authored portal architecture.

## Runtime architecture

The browser application is a Firebase-hosted, static, multi-page site. Each HTML page owns most of its layout and behavior. Shared behavior is limited primarily to `portal-quality.css`, `global-tokens.css`, and `version-sync.js`.

The backend consists of one exported HTTPS Cloud Function, `driveVersionsProxy`, which reads version metadata from Google Drive. Six HTML pages use the `portal-version` custom element supplied by `version-sync.js`.

## HTML entry points and dependencies

External CDN dependencies are listed separately from repository-local files.

| HTML page | Purpose | Local CSS | Local JavaScript | External JavaScript | Inline behavior |
|---|---|---|---|---|---|
| `public/index.html` | Main portal and notebook simulator | `assets/css/index.css`; `assets/css/portal-quality.css` | `assets/js/notebook-simulator.js` | None | None |
| `public/404.html` | Hosting error page | `assets/css/global-tokens.css`; `assets/css/error-style.css`; `assets/css/portal-quality.css` | `assets/js/version-sync.js` | Lucide | Lucide initialization |
| `public/atp_ai_simulation.html` | ATP/ATR document simulator | `assets/css/atp-sim.css`; `assets/css/portal-quality.css` | None | Lucide; html2pdf 0.9.3 | ATP simulation, clearing, PDF/print actions, and status styling |
| `public/core_memory.html` | Core Memory dashboard and bilingual narrative | `assets/css/global-tokens.css`; `assets/css/core-memory.css`; `assets/css/portal-quality.css` | `assets/js/core_memory_translator.js`; `assets/js/core_memory.js`; `assets/js/version-sync.js` | Lucide | Language button handlers and one inline image style |
| `public/ess_lab.html` | Environmental Stress Screening simulator | `assets/css/global-tokens.css`; `assets/css/ess-sim.css`; `assets/css/portal-quality.css` | `assets/js/ess-sim.js`; `assets/js/version-sync.js` | Chart.js; Lucide | Start/stop handlers and Lucide initialization |
| `public/legal_terms.html` | Terms, privacy, and disclaimer content | `assets/css/global-tokens.css`; `assets/css/legal-style.css`; `assets/css/portal-quality.css` | `assets/js/version-sync.js` | Lucide | Lucide initialization |
| `public/my_tech_dna.html` | Technical profile and portal history | `assets/css/global-tokens.css`; `assets/css/my_tech_dna.css`; `assets/css/portal-quality.css` | `assets/js/version-sync.js` | Lucide | Lucide initialization |
| `public/powershell-sim.html` | PowerShell management-console simulator | `assets/css/powershell-sim.css`; `assets/css/portal-quality.css` | `assets/js/powershell-sim.js`; `assets/js/version-sync.js` | Lucide | None |

## CSS organization

### Shared styles

- `global-tokens.css` supplies the shared Material-style colors, spacing, typography, borders, radii, transitions, and elevations used by five pages.
- `portal-quality.css` is loaded by all eight pages and supplies cross-page resilience and accessibility rules, including focus visibility, skip links, reduced motion, and forced-colors support.

### Page styles

- `index.css`, `atp-sim.css`, and `powershell-sim.css` contain page-local token definitions in addition to page layouts.
- `error-style.css`, `core-memory.css`, `ess-sim.css`, `legal-style.css`, and `my_tech_dna.css` depend on `global-tokens.css`.
- `version-sync.css` is not referenced by an HTML entry point in the current baseline but is retained for the active version widget.

## JavaScript organization

### Shared script

- `version-sync.js` defines the `portal-version` custom element and retrieves version metadata from the deployed `driveVersionsProxy` endpoint.

### Page scripts

- `notebook-simulator.js` controls the main-page template selector, simulated prompts, and generated insight blocks.
- `powershell-sim.js` contains command data, command-card rendering, terminal simulation, and progress state.
- `ess-sim.js` creates the Chart.js visualization and controls vibration simulation timers.
- `core_memory.js` renders the memory ledger and runs telemetry simulation.
- `core_memory_translator.js` owns English/Hebrew translations and document direction changes.
- ATP runtime behavior currently resides in the HTML page's inline script.

## Data and service flow

```text
HTML page
  |-- local page CSS
  |-- shared quality/tokens CSS where declared
  |-- local page JavaScript where declared
  |-- CDN libraries where declared
  `-- version-sync.js (six pages)
        `-- deployed driveVersionsProxy HTTPS function
              `-- Google Drive read-only metadata request
```

The notebook simulator currently embeds its runtime knowledge records in JavaScript. The JSON and Markdown files under `public/assets/data/` are not fetched by the active browser scripts.

## Baseline constraints

- This package documents the current state; it does not select replacement implementations.
- File classifications are recorded in `file-inventory.md`.
- Risks are recorded in `known-risks.md`.
- Proposed work is sequenced in `migration-plan.md`.
