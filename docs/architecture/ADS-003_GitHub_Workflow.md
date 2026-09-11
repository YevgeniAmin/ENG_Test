# ==============================================================================
# ATC Engineering Ecosystem
# Engineering Knowledge Management System
#
# ADS-003
# GitHub Workflow — Development & Release Process
# ==============================================================================

> **Purpose**
>
> ADS-003 defines the development workflow, branching policy, CI/CD pipeline,
> and validation/acceptance criteria for the ATC Engineering Portal
> (Application Layer, per ADS-001).
>
> This document SHALL comply with ADS-000.
>
> ⚠️ Per the "Truth over Memory" and "Evidence First" principles (ADS-000),
> sections below are marked **[Verified]** where sourced from a document or
> direct repository check, and **[Needs Verification]** where inferred or not
> yet confirmed. This document SHALL NOT move to Approved status until all
> [Needs Verification] items are resolved.

---

# Document Identification

| Property | Value |
|----------|-------|
| Document ID | ADS-003 |
| Filename | github_workflow.md |
| Document Title | GitHub Workflow |
| Document Type | Engineering |
| Status | **Review** |
| Framework | ATC Engineering Ecosystem |
| Knowledge Layer | Engineering Knowledge Management System |
| Documentation Standard | ATC Documentation Standard (ADS) |
| Owner | Yevgeni Aminov |
| Source of Truth | Google Drive |
| Version Management | Google Docs Revision History |
| Language | English |
| Classification | Internal |

---

# Source Basis

Repository: `YevgeniAmin/ENG_Test`. Grounded in direct repository work by
Claude Code across 2026-07-23 and 2026-07-24 (`gh pr view`, `gh run list`,
`git log`, direct JSON inspection, and live browser interaction against
Firebase preview deployments), plus
`NotebookLM_ATC_Project_Sync_2026-07-18.md` (the complete, 5-item original
cleanup list — confirmed no items beyond these five).

**Correction:** earlier drafts of this document stated that Lighthouse
evidence was reviewed from a Google Drive `lighthouse Reports` folder. That
is incorrect — no Google Drive access has occurred as part of this workflow.
All Lighthouse evidence is stored and reviewed directly in this repository
under `eng-portal/docs/Reports` (see Evidence Location below).

---

# Branching & Change Policy

**[Verified]** Documented in `AGENTS.md`: `<type>/<kebab-description>`
naming, PR-only-merge rule.

**[Verified, 2026-07-24, `gh pr list --state all`]** Current repository state:

| PR | Branch | Title | State |
|---|---|---|---|
| #1 | `ci/firebase-hosting` | Enable automatic Firebase Hosting deployment | Merged |
| #2 | `feature/portal-branding-pass` | Portal branding refresh and global favicon integration | Merged |
| #3 | `docs/portal-doc-sync` | Sync architecture docs with current main | Merged |
| #4 | `fix/portal-quality-lighthouse` | Portal quality/accessibility pass: cleanup, filename standardization, ARIA fixes | **Merged** (2026-07-23T18:10:47Z, commit `701c69f`) |
| #5 | `fix/global-tokens-contrast` | Fix duplicated-token contrast failures (global-tokens, powershell-sim, atp-sim) | **Merged** (2026-07-23T19:36:08Z, commit `b96ec84`) |
| #6 | `fix/global-tokens-contrast` (reused after #5) | Fix remaining contrast/heading-order failures (Legal Terms, ESS Lab, 404, Core Memory) | **Merged** (2026-07-24T18:04:54Z, merge commit `28f19076085f14b1ec4bbbdc779dab3f631f307b`, merge method: merge commit) |

**Note:** PR #4, #5, and #6 are all merged. Earlier drafts of this document
stated "PR #4 is now clean and mergeable" and instructed the Owner to "Merge
PR #4" — both statements were stale as of 2026-07-23 and have been removed.
There is no open PR as of this writing.

`main` had also received 3 direct commits after PR #5 unrelated to this
workflow (`a04cb3b`, `49e00f1`, `7543cc2` — a version-display component).
PR #6's branch was rebased onto latest `main` (including those 3 commits)
before pushing, cleanly, no conflicts. The branch was deleted after merge
confirmation.

---

# CI/CD Pipeline

**[Verified]** Two Firebase CLI workflows (PR preview deploy; main-branch
live deploy). Deploy-only — no lint/test/type-check/Lighthouse step exists
in CI itself; Lighthouse validation in this process is run manually against
preview and production URLs and the results committed as evidence.

**[Verified, 2026-07-24, `gh run list`]** Last successful production deploy:
commit `28f1907` (PR #6's merge commit), run
[30115527966](https://github.com/YevgeniAmin/ENG_Test/actions/runs/30115527966),
triggered from `main` by the merge push, started 2026-07-24T18:04:56Z,
completed 2026-07-24T18:05:38Z, conclusion: success, no failed or cancelled
steps. This is the current live commit as of this writing.

---

# Documentation Sync — 6/7 RESOLVED (PR #3, merged)

**[Verified]** 6 of 7 items from the 2026-07-18 list closed, including a
follow-up fix for R-11 (Tech DNA card width, already resolved by an earlier
commit predating the audit docs).

**[Verified]** Lighthouse baseline recorded in
`docs/architecture/lighthouse-baseline.md`, with the full run-by-run history
of the contrast work below.

## R-16 remediation history

1. **`0caead2` (PR #5, merged):** duplicated `#0284c7` primary/status-badge
   tokens in `global-tokens.css`/`powershell-sim.css`/`atp-sim.css` fixed.
   Core Memory A11y 96→100, PowerShell Sim 95→100 (confirmed via production
   Lighthouse run against commit `7543cc2`).
2. **Correction found in production evidence (not committed/deployed until
   PR #6):** the same run against `7543cc2` showed Legal Terms still at
   A11y 89, ESS Lab at 95, and 404 at 91 — a second shared token,
   `--md-sys-color-text-muted`, and an unrelated `--md-sys-color-error`
   pairing, plus a `heading-order` failure on Legal Terms.
3. **First fix draft (superseded before commit):** darkening
   `--md-sys-color-text-muted` globally to `#475569` would have fixed the
   light-background failures (Legal Terms, 404) but broken ESS Lab, which
   uses the same token on a **dark** background (`#0f172a`) — caught by
   inspecting ESS Lab's actual JSON rather than assuming one root cause
   applied everywhere.
4. **Final fix (PR #6, commit `0119b7e`):** split into
   `--md-sys-color-text-muted-on-light` (`#475569`) and
   `--md-sys-color-text-muted-on-dark` (`#94a3b8`), applied only where each
   context needs it; base token left at its original `#64748b`. Added
   `--md-sys-color-error-on-light` (`#b91c1c`) for `.badge-error` (404) and
   `.alert-danger` (Core Memory); fixed Legal Terms' `heading-order`
   (`<h4>`→`<h3>`).
5. **Second correction found during dynamic-state validation (PR #6, commit
   `8ebc2d3`):** this document's own earlier draft claimed PowerShell Sim's
   `--md-sys-color-error` token was protected from the light-surface fix
   because `.log-error` used it against a dark terminal background. Live
   Puppeteer interaction against the PR #6 preview found `.log-error` is
   dead code (never applied by any script), and the actually-reachable
   error-colored state — `#terminal-status` during command execution — sits
   on a **light** `.badge-surface` background and measured 3.44:1, failing.
   Fixed by routing that inline style through
   `--md-sys-color-error-on-light` instead.

**All 8 routes scored `categories.accessibility.score == 1.00` on the PR #6
preview** (validated head SHA `8ebc2d3`, preview workflow run `30114308449`),
**and this has since been reconfirmed live against production** after merge
and deploy (commit `28f1907`, all 8 routes, 2026-07-24) — see Evidence
Location below for both.

---

# Remaining Cleanup — List A: CLOSED, List B: CLOSED

**List A (complete, 5-item original list — confirmed no items beyond these)**
**[Verified — all 5 resolved]**

| Item | Resolution |
|---|---|
| Improve contrast on homepage | Fixed — all 4 `.status-badge` variants darkened to meet WCAG AA 4.5:1 (worst case had been ~1.8:1); backgrounds/shape untouched |
| Fix invalid list structure | Fixed — `<ul class="insights-list">` (which had `<div>` children injected by `notebook-simulator.js`) retagged to `<div>`; confirmed nothing depended on the `<ul>` tag |
| Optimize responsive images | Covered — R-11 (Tech DNA card width) closed |
| General repository cleanup | Covered — List B below |
| Synchronize documentation | Covered — PR #3 |

**List B (migration-plan.md Phase 7)**
**[Verified — all 5 resolved via PR #4]**
Duplicate/archival files removed · maintenance scripts relocated ·
`version-sync.css` removed · orphaned root `package.json`/`package-lock.json`
removed (tracked as **R-22** in `known-risks.md`) · 5 filenames standardized
to hyphenated form with redirects.

---

# Deferred / Follow-up Scope

**[Verified — intentionally scoped out, not silently dropped]**

- **R-14** (ESS `href="#"` nav — needs a real behavior change) and **full
  R-13 coverage** (ATP/notebook-simulator — no single status container to
  hook) are out of scope for PR #4 and PR #6 alike.
- Branch `fix/portal-nav-and-live-regions` exists off `main` (no commits
  yet) — ready to scope when the Owner wants to proceed. No timing decision
  has been made; both items are Medium severity and already grouped at
  Phase 6 in `known-risks.md`, so there is no indication they need to move
  ahead of that schedule.
- **Two new non-scoring (`weight: 0`) accessibility findings**, informational
  only, not blocking, not introduced by this work: ATP's `table-fake-caption`
  and My Tech DNA's `label-content-name-mismatch` (`a.brand`'s visible text
  doesn't match its `aria-label`). Worth a future ticket, not a blocker here.

---

# Evidence Location

**[Verified]** Lighthouse evidence is maintained in the project workspace
under `eng-portal/docs/Reports`, not Google Drive. Reports are classified by
tested environment and stored without overwriting historical evidence:

```text
docs/Reports/
├── historical/
│   ├── 2026-07-23-pr4-baseline/     (first real run, pre-PR #5, commit 701c69f)
│   └── 2026-07-24-superseded/       (earlier same-day reruns, plus one run that hit a wrong URL)
├── preview/
│   └── pr-6-8ebc2d3/                (PR #6 preview, all 8 routes, manifest.md)
└── production/
    ├── 2026-07-24-7543cc2/          (live production BEFORE PR #6 — pre-fix state, 3 of 8 routes failing)
    └── 2026-07-24-28f1907/          (live production AFTER PR #6 merged and deployed — all 8 routes passing, manifest.md)
```

**Final validation (production, post-merge):**
- Production report directory: `docs/Reports/production/2026-07-24-28f1907/`
- Production manifest: `docs/Reports/production/2026-07-24-28f1907/manifest.md`
- Validated deployment: `https://yevgeni.info`, commit
  `28f19076085f14b1ec4bbbdc779dab3f631f307b` (PR #6's merge commit)
- Production workflow run: [30115527966](https://github.com/YevgeniAmin/ENG_Test/actions/runs/30115527966)
- Execution date: 2026-07-24
- Lighthouse version: 13.4.1
- Accessibility scores: 8/8 routes at exactly `1.00` (`categories.accessibility.score`,
  read directly from JSON — see manifest for per-route audit-level detail,
  including the two non-scoring informational findings and live dynamic-state
  validation)

Preview evidence (`preview/pr-6-8ebc2d3/`) is retained as the pre-merge
validation record but is superseded by the production manifest above as the
basis for this document's status.

---

# Next Steps — for the Owner

1. Review the production evidence above (PR #6 merged and deployed; all 8
   routes confirmed at accessibility 1.00 live).
2. Record a docs-only evidence PR against `main` capturing the production
   manifest and this update (see `docs/pr6-production-evidence` branch).
3. Separately: decide timing/priority for the R-14 / full-R-13 follow-up
   branch (`fix/portal-nav-and-live-regions`). No urgency identified; both
   items are already correctly scheduled at Phase 6 and remain deferred,
   non-blocking scope.
4. Separately: `table-fake-caption` (ATP) and `label-content-name-mismatch`
   (My Tech DNA) are real, non-scoring findings, deferred as follow-up —
   not required for this document's Review status, but worth a ticket.

---

# Approval

Current Status: **Review**

All four gating conditions for advancing out of Draft are met:
1. **PR #6 merged** — 2026-07-24T18:04:54Z, merge commit `28f1907`.
2. **Production deploy confirmed** — workflow run `30115527966`, completed
   2026-07-24T18:05:38Z, conclusion: success, no failed/cancelled steps.
3. **Fresh production Lighthouse pass across all 8 routes**, each confirmed
   at `categories.accessibility.score == 1.00` by direct JSON inspection
   (not a rounded UI score) — Home, Core Memory, PowerShell Sim, ATP AI
   Simulation, My Tech DNA, ESS Lab, Legal Terms, 404.
4. **Production evidence recorded** under
   `docs/Reports/production/2026-07-24-28f1907/`, including a manifest and
   live (not just static-crawl) validation of the ATP accepted/rejected and
   PowerShell executing dynamic states. Core Memory's `.alert-danger` was
   confirmed as unreachable dead code via source inspection (no live trigger
   exists), documented as static CSS verification rather than a live-state
   result.

**Remaining deferred, non-blocking follow-up scope** (does not block Review):
R-13 (full ATP/notebook-simulator live-region coverage), R-14 (ESS sidebar
real navigation destinations), `table-fake-caption` (ATP), and
`label-content-name-mismatch` (My Tech DNA).

This document is not moved to Approved — that remains a separate,
explicit Owner decision.

---

**End of Document**
