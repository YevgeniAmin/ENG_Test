# Known Architecture Risks

## Scope

This register captures risks observed during the Phase 0 static audit. It does not assert that every potential issue is reproducible at runtime. No corrective runtime or Firebase changes are included in Phase 0.

## Risk register

| ID | Area | Severity | Observation | Potential impact | Phase to address |
|---|---|---|---|---|---|
| R-04 | Accessibility | High | ATP contains 45 input/select controls and no `<label>` elements. | Controls may lack reliable accessible names for screen-reader users. | Phase 6 |
| R-05 | Responsive layout | High | Core Memory uses a fixed 300px sidebar in LTR and RTL without a small-screen breakpoint. | Content can overflow or become unusably compressed on narrow screens. | Phase 5 |
| R-06 | External dependencies | Medium | Lucide and Chart.js use unpinned CDN URLs; CDN scripts do not declare Subresource Integrity. | Upstream changes or CDN failures can alter or break pages without a repository change. | Phase 1 or approved dependency work |
| R-07 | Version synchronization | Medium | `version-sync.js` calls a hard-coded production endpoint and parses JSON without checking `response.ok`. | Preview/local pages depend on production and error responses may be handled inconsistently. | Phase 4; configuration aspects require approval |
| R-08 | Styling | Medium | `version-sync.css` is not loaded although `version-sync.js` generates matching component classes. | The active version widget may be unstyled or depend on accidental page styles. | Phase 1–3 |
| R-11 | Responsive layout | Medium | Tech DNA uses a 300px minimum card width without a narrow-screen override. | Cards can overflow on very narrow devices after page padding is included. | Phase 5 |
| R-12 | Inline implementation | Medium | ATP contains 49 inline style attributes and a large inline script; Core Memory and ESS use inline handlers. | Responsive maintenance and strict Content Security Policy adoption are harder. | Phase 3–4 |
| R-13 | Dynamic accessibility | Medium | Simulation status, terminal output, version state, and generated notebook content do not clearly expose live-region behavior. | Assistive-technology users may not be notified of content changes. | Phase 6 |
| R-14 | Navigation | Medium | ESS sidebar items use `href="#"` without real destinations. | Keyboard and pointer activation can jump the page without performing meaningful navigation. | Phase 6 |
| R-15 | Data ownership | Medium | Browser knowledge is embedded in `notebook-simulator.js`, while an English Markdown context source also exists. | Content can drift because the canonical authoring source is unclear. | Phase 1–2 |
| R-16 | CSS consistency | Medium | Global tokens coexist with separate token definitions in Index, ATP, and PowerShell stylesheets. | Colors, spacing, and component behavior can drift across pages. | Phase 3 |
| R-17 | CSS maintenance | Low | PowerShell CSS contains repeated breakpoint ranges and is large relative to its HTML. | Later changes may override earlier rules unexpectedly. | Phase 3–5 |
| R-18 | Semantic HTML | Low | Index branding uses the custom-looking markup `<V2 class="0">`. | The version label has unclear semantics and can confuse validators or maintainers. | Phase 6 or focused HTML cleanup |
| R-19 | Canvas accessibility | Medium | The ESS Chart.js canvas has no documented equivalent textual representation. | Users who cannot perceive the chart may miss information. | Phase 6 |
| R-20 | Information exposure | Low | PowerShell simulation data includes a private-address example endpoint. | Public users can see internal-looking addressing conventions even though no request is made. | Ownership/security review |
| R-21 | Fixed regions | Low | ESS, Core Memory, and PowerShell use fixed-height chart/log/terminal regions. | Text zoom or long content can be clipped or require nested scrolling. | Phase 5–6 |
| R-22 | Dependencies | Low | Root and Functions manifests overlap, while the root manifest has no scripts or declared entry point. | Dependency ownership and update scope are unclear. | Phase 1 or 7 |

## Positive baseline controls

- All eight HTML pages declare a viewport, title, language, and direction.
- All eight pages include a skip link and matching main-content target.
- All currently referenced local HTML assets resolve to existing files.
- All HTML images currently include `alt` attributes.
- `portal-quality.css` provides shared focus-visible, reduced-motion, and forced-colors handling.
- The audit found no uncommitted runtime changes before this documentation package.

## Risk-handling principles

- Confirm runtime failures before changing behavior.
- Treat Firebase route and security changes as separately approved work.
- Preserve public URLs unless an explicit redirect plan is approved.
- Reclassify files only after ownership and source-of-truth decisions are documented.
- Use the Phase 0 screenshots and interaction walkthroughs as regression evidence.
