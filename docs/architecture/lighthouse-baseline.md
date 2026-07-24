# Lighthouse Baseline

## Purpose

Tracks Lighthouse audit results per page against the production site (`https://yevgeni.info`), so quality/accessibility work has a measurable before/after. Complements `known-risks.md` (why an issue exists) with what an automated audit actually measures.

## How to reproduce

Run Lighthouse (Chrome DevTools > Lighthouse panel, or `npx lighthouse <url> --output json`) against each production URL, ideally in an incognito window — installed Chrome extensions can skew results (Lighthouse flags this as a run warning when present). Audit `main` as deployed, not a feature branch.

## Results

### Home (`/`)

| Run date | Lighthouse ver. | Performance | Accessibility | Best Practices | SEO | Notes |
|---|---|---|---|---|---|---|
| 2026-07-18 | — | 99 | 92 | 100 | 100 | Baseline from `NotebookLM_ATC_Project_Sync_2026-07-18.md`, predates the contrast/list-structure/image-optimization fixes below. |
| 2026-07-23 | 13.3.0 | 98 | **100** | 100 | 100 | Post `fix/portal-quality-lighthouse` (PR #4, merged `701c69f`). Run warning noted: a Chrome extension was active during the test, which can affect Performance timing — the 1-point Performance delta is within that noise margin, not a known regression. |

Confirmed via this run's individual audits (all now passing on Home):
- `color-contrast`: **pass** — validates the status-badge contrast fix (was the likely driver of the Accessibility 92 -> 100 jump).
- `list`: `notApplicable` — no list-structure violations (validates the `<ul>` -> `<div>` fix on `.insights-list`).
- `image-size-responsive`: **pass**.

Performance sub-metrics (Home, 2026-07-23): FCP 1.9s (score 0.86), LCP 1.9s (score 0.97), Speed Index 1.9s (score 1.0), TBT/CLS/max-potential-FID all scoring 1.0.

Non-scoring (weight 0) insights worth a future look, not currently affecting the Performance score:
- `lcp-discovery-insight`: 0 — the LCP element isn't immediately discoverable from the initial HTML response.
- `network-dependency-tree-insight`: 0 — a request chain exists that could be shortened.

### ATP / AI Simulation (`/atp-ai-simulation`)

| Run date | Lighthouse ver. | Performance | Accessibility | Best Practices | SEO | Notes |
|---|---|---|---|---|---|---|
| 2026-07-23 | 13.3.0 | 87 | **100** | 100 | 100 | Post PR #4. First run against the standardized `/atp-ai-simulation` URL — confirms the redirect/rename is live. |

Confirmed via this run's individual audits:
- `aria-input-field-name`: `notApplicable` (no missing accessible names found) — validates the ~44 `aria-label` additions to ATP's form controls (R-04).
- `form-field-multiple-labels`, `label-content-name-mismatch`: both `notApplicable` — no side effects from the labeling pass.
- `color-contrast`: **pass**.

Performance is notably weaker here than Home: FCP scored 0.45 (3.2s, vs. Home's 1.9s) and LCP scored 0.74 (also 3.2s) with TBT/CLS both perfect. This tracks with `known-risks.md` R-06 (unpinned CDN libraries — this page loads both Lucide and html2pdf.js) and R-12 (ATP's large inline script) — not something this baseline pass fixes, just flagging it as the likely next Performance-focused target if that becomes a priority.

### Core Memory (`/core-memory`)

| Run date | Lighthouse ver. | Performance | Accessibility | Best Practices | SEO | Notes |
|---|---|---|---|---|---|---|
| 2026-07-23 | 13.3.0 | 93 | 96 | 100 | 100 | Post PR #4. Confirms the `/core-memory` redirect/rename is live. |

**New confirmed `color-contrast` failure (4 elements) — not fixed by PR #4, and not page-specific:**
- `#lang-en` toggle button and `#btn-simulate-telemetry`: white text on `#0284c7` background, 4.09:1 (needs 4.5:1)
- `a.btn.btn-secondary` ("Central Hub" home link): `#0284c7` text on white, 4.09:1
- `.status-badge.status-active` ("ACTIVE"): `#1e8e3e` on `#e6f4ea`, 3.7:1

Root cause: **`global-tokens.css` has its own independent copy of the exact same badge-color and primary-color values** that were fixed in `index.css` for PR #4 — `--md-sys-color-primary: #0284c7` (used for buttons/links/toggles) and a second `--color-active`/`--bg-active`/etc. token set identical to index.css's pre-fix values. `global-tokens.css` is shared by **404, Core Memory, ESS, Legal, and Tech DNA** (`current-structure.md`), so this almost certainly affects some of those pages too, not just this one — the PR #4 contrast fix only ever touched `index.css` and didn't know this second copy existed. This is `known-risks.md` R-16 (duplicated token systems) made concrete.

Performance sub-metrics: FCP/LCP both 2.6s (scores 0.64/0.88), TBT 0ms (1.0), CLS 0 (1.0), Speed Index 0.97.

### Post `global-tokens.css`/`powershell-sim.css`/`atp-sim.css` contrast fix (`0caead2`, run 2026-07-24)

| Page | A11y (07-23) | A11y (07-24) | Contrast violations |
|---|---|---|---|
| Home | 100 | 100 | 0 → 0 |
| ATP / AI Simulation | 100 | 100 | 0 → 0 |
| Core Memory | 96 | **100** | 4 → 0 |
| PowerShell Sim | 95 | **100** | 1 → 0 |
| My Tech DNA | 100 | 100 | 0 → 0 |
| Legal Terms | 89 | 89 (at run time) | 2 → 1 |

Core Memory and PowerShell Sim fully resolved — confirms the R-16 duplicated-token diagnosis above (`#0284c7` primary / status-badge pair).

Legal Terms was only half-fixed by `0caead2`: the `a.email-link code` violation (old `#0284c7` primary) cleared, but a second, unrelated violation remained — `.contact-box p` (`legal-style.css`) at `color: var(--md-sys-color-text-muted)` (`#64748b`) on `--md-sys-color-surface-variant` (`#f1f5f9`), 4.34:1 (needs 4.5:1). `.contact-box` is legal-terms-only so no other page hit this, but `--md-sys-color-text-muted` itself is shared broadly (core-memory, ess-sim, error-style, powershell-sim).

**First fix attempt (superseded, see correction below)**: darkened `--md-sys-color-text-muted` from `#64748b` to `#475569` globally in `global-tokens.css` and its duplicate in `powershell-sim.css`. This cleared the light-background failures but was never verified against every consumer of the token before being proposed.

**Correction #1 (ADS-003 cross-check, production reports checked directly from `eng-portal/docs/Reports`, not Google Drive):** the fix above was made in the working tree but never committed/merged/deployed — production still showed the original failure. This check also surfaced two pages not yet in this doc, both tested at the currently-deployed commit `7543cc2`:

| Page | A11y | Status |
|---|---|---|
| ESS Lab | 95 | `color-contrast` fail (6 elements) — but a **different** pairing than Legal Terms, see correction #2 |
| 404 | 91 | Two distinct `color-contrast` fails: (1) footer `.version-tag`/`#version-container`, `text-muted`/`#f1f5f9` pair; (2) **new, unrelated** — `.badge` in `.error-visual-node`, `#ef4444` on `#fef2f2`, 3.44:1 |

Also new on Legal Terms: a `heading-order` failure — `.contact-box` used `<h4>` directly after the page's `<h2>` sections, skipping `<h3>`.

**Correction #2 (caught before committing, by inspecting ESS Lab's actual JSON instead of assuming the same root cause applied):** ESS Lab's `color-contrast` failure is `#64748b` (the *original*, pre-fix value) on `#0f172a` — a **dark** panel background (`.vibration-module`), 3.75:1. The global-darkening fix above would have made this *worse* (`#475569` on `#0f172a` computes to 2.36:1), not better, because `--md-sys-color-text-muted` is consumed on both light and dark surfaces and one value can't satisfy both. Same failure mode already correctly avoided for `--md-sys-color-error` (PowerShell Sim's dark-terminal `.log-error`) — missed the first time for `text-muted`.

**Final fixes applied** (still uncommitted as of this write-up):
- Reverted `--md-sys-color-text-muted` to its original `#64748b` in `global-tokens.css` and `powershell-sim.css` — it already passes against the plain page background (`#ffffff` 4.76:1, `#f8fafc` 4.55:1), so most of its usages needed no change.
- Added two new scoped tokens in `global-tokens.css`: `--md-sys-color-text-muted-on-light: #475569` (6.92:1 vs `#f1f5f9`) and `--md-sys-color-text-muted-on-dark: #94a3b8` (6.96:1 vs `#0f172a`, matches the shade ESS's own `.status-idle` already used on the same dark surface).
- `text-muted-on-light` applied to: `.contact-box p` and `.version-tag` (`legal-style.css`), `.version-tag` (`error-style.css` — duplicated between the two files, same as R-16).
- `text-muted-on-dark` applied to: `.vib-title`, `.vib-clock`, `.metric-label`, `.vib-footer` (`ess-sim.css`) — all four live inside `.vibration-module`'s dark background; only three were actually caught by the crawl, the fourth (`.vib-clock`) got the identical fix proactively.
- `legal-terms.html` / `legal-style.css`: `.contact-box` heading changed from `<h4>` to `<h3>` to restore heading order.
- New `--md-sys-color-error-on-light: #b91c1c` token (5.91:1 vs `#fef2f2`), applied to `error-style.css`'s `.badge-error` and `core-memory.css`'s `.alert-danger` (identical `#ef4444`-on-`#fef2f2` pair; the latter wasn't caught by the crawl since it's not in Core Memory's default DOM, but it's the same bug).

**Correction #3 (caught during dynamic-state validation on the PR #6 preview, live Puppeteer interaction, commit `54286c6`):** the claim above — that the shared `--md-sys-color-error` token had to stay untouched because PowerShell Sim's `.log-error` used it at 4.74:1 against a dark terminal background — was never actually verified and turned out to be wrong. Grepping `powershell-sim.js` shows `.log-error` is dead code: no script path ever applies that class. The real reachable dynamic error-colored state is `#terminal-status`, set inline to `var(--md-sys-color-error)` by `executeSimulation()` while a command runs — and it sits on `.badge-surface`'s **light** background (`#f1f5f9`), not a dark one. Live-measured on the PR #6 preview: `rgb(239,68,68)` on `rgb(241,245,249)` = 3.44:1, failing. Fixed in commit `8ebc2d3` by routing that inline style through `--md-sys-color-error-on-light` instead (`powershell-sim.css` got its own copy of the token since this page doesn't link `global-tokens.css`). Re-verified live post-fix: `rgb(185,28,28)` on the same background = 5.91:1, passing.

## PR #6 preview validation (2026-07-24)

All 8 routes score `categories.accessibility.score == 1.00` against the PR #6 preview at validated head SHA `8ebc2d3` (preview workflow run [30114308449](https://github.com/YevgeniAmin/ENG_Test/actions/runs/30114308449)). Full detail, including the two pre-existing non-scoring findings (`table-fake-caption` on ATP, `label-content-name-mismatch` on My Tech DNA) and the live dynamic-state validation table (ATP pass/fail, PowerShell executing, and confirmation that Core Memory's `.alert-danger` is unreachable dead code), is in `docs/Reports/preview/pr-6-8ebc2d3/manifest.md`.

**Not yet done: merge PR #6, deploy, and a fresh Lighthouse pass against production** to confirm Legal Terms/ESS Lab/404/Core Memory/PowerShell Sim all reach A11y 100 live.

## Evidence location

Lighthouse evidence lives in this repo under `docs/Reports`, not Google Drive:

```text
docs/Reports/
├── historical/
│   ├── 2026-07-23-pr4-baseline/     (first real run, pre-PR #5, commit 701c69f)
│   └── 2026-07-24-superseded/       (earlier reruns replaced by a later same-day run, plus one run that hit a wrong URL)
└── production/
    └── 2026-07-24-7543cc2/          (current: all 8 routes, commit 7543cc2 — the "before" state for the fixes above)
```

`7543cc2` is confirmed (via `gh run list`) as the last successful "Deploy to Firebase Hosting on merge" run, 2026-07-23T21:10:52Z, with no newer deploy since — so every report in `production/2026-07-24-7543cc2/` was tested against that exact commit.

### Other pages

All 8 routes (Home, ATP/AI Simulation, Core Memory, PowerShell Sim, My Tech DNA, ESS Lab, Legal Terms, 404) now have production evidence — see `production/2026-07-24-7543cc2/`. No page is outstanding for a first pass; three (ESS Lab, Legal Terms, 404) need a re-run after the fixes above ship.
