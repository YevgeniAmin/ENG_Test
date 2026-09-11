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
| Status | Draft |
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

Repository: `YevgeniAmin/ENG_Test`. Grounded in four rounds of direct
repository work by Claude Code (2026-07-23), plus
`NotebookLM_ATC_Project_Sync_2026-07-18.md` (the complete, 5-item original
cleanup list — confirmed no items beyond these five).

---

# Branching & Change Policy

**[Verified]** Documented in `AGENTS.md`: `<type>/<kebab-description>`
naming, PR-only-merge rule. **PR #3 merged into `main`**, remote branch
deleted. `fix/portal-quality-lighthouse` (PR #4) rebased onto updated
`main` — one real conflict in `portal-audit.md` resolved (PR #3's prose kept,
PR #4's filename update folded in); two additional stale references caught
and fixed during the rebase. **PR #4 is now clean and mergeable.**

---

# CI/CD Pipeline

**[Verified]** Two Firebase CLI workflows (PR preview deploy; main-branch
live deploy). Deploy-only — no lint/test/type-check/Lighthouse step exists.

---

# Documentation Sync — 6/7 RESOLVED (PR #3, merged)

**[Verified]** 6 of 7 items from the 2026-07-18 list closed, including a
follow-up fix for R-11 (Tech DNA card width, already resolved by an earlier
commit predating the audit docs).

**[Verified]** Lighthouse baseline recorded in
`docs/architecture/lighthouse-baseline.md`. Follow-up findings from the
first real run:

- **R-16 confirmed and fixed** (commit `0caead2`): duplicated `#0284c7`
  primary/status-badge tokens were the diagnosed cause. Core Memory A11y
  96→100, PowerShell Sim 95→100.
- **New finding — Legal Terms only half-fixed:** `.contact-box p` still
  failed contrast (4.34:1, `#64748b` on `#f1f5f9`) via a *different* token
  (`--md-sys-color-text-muted`) that R-16's fix didn't touch. Fixed by
  darkening that token to `#475569` (reusing the existing
  `--md-sys-color-secondary` value) in `global-tokens.css` and its duplicate
  in `powershell-sim.css`, and replacing a hardcoded `#64748b` with the
  token. New contrast: 6.9–7.6:1 across all light backgrounds using it.

**[Verified — real Lighthouse JSON reports decoded and checked directly,
2026-07-24, reports at Drive `lighthouse Reports` folder]**

| Page | A11y | Status |
|---|---|---|
| Index (homepage) | 100 | ✅ |
| Core Memory | 100 | ✅ |
| PowerShell Sim | 100 | ✅ |
| ATP AI Simulation | 100 | ✅ |
| My Tech DNA | 100 | ✅ |
| ESS Lab | 95 | ❌ color-contrast — same shared token, unfixed |
| Legal Terms | 89 | ❌ color-contrast (identical 4.34:1 / `#64748b`/`#f1f5f9` as the original bug — the `--md-sys-color-text-muted` fix is NOT deployed to production, not just uncommitted) + **new finding**: `heading-order` fail — an `<h4>` inside `.contact-box` breaks heading hierarchy, unrelated to the contrast issue |

**404 page — re-run with correct URL, confirmed.**
`https://yevgeni.info/404`, A11y 91, two distinct `color-contrast` failures:
- Footer `#version-container`: `#64748b`/`#f1f5f9` — the same shared token
  issue as Legal Terms/ESS Lab (confirms the fix isn't deployed).
- **New, unrelated finding:** `.badge` inside `.error-visual-node`:
  `#ef4444` (red) on `#fef2f2`, 3.44:1 — a different color pair specific to
  the 404 page's error-state styling, not the muted-text token.

**This directly confirms**: the text-muted contrast fix must be committed,
merged, and deployed before this item can close — description alone was not
sufficient evidence. The heading-order issue on Legal Terms is new work, not
previously scoped.

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

**PR #4 — now 5 commits:** cleanup removal → filenames/redirects/ATP
labels → live regions/ESS chart text alternative → contrast/list-structure
fixes → image optimization (OG image 1.07MB → 110KB JPEG, zero transparency
loss; missing `loading="lazy"` fixed).

---

# Deferred / Follow-up Scope

**[Verified — intentionally scoped out, not silently dropped]**

- **R-14** (ESS `href="#"` nav — needs a real behavior change) and **full
  R-13 coverage** (ATP/notebook-simulator — no single status container to
  hook) are out of scope for PR #4.
- Branch `fix/portal-nav-and-live-regions` created off `main` (no commits
  yet) — ready to scope when the Owner wants to proceed.

---

# Next Steps — for the Owner

1. Merge PR #4 (`fix/portal-quality-lighthouse`) — clean, no conflicts.
2. Decide timing/priority for the R-14 / full-R-13 follow-up branch.
3. Once PR #4 is merged, ADS-003 has no remaining [Needs Verification] items
   and can move to Review.

---

# Approval

Current Status:

Draft — four items remain, all confirmed by direct production Lighthouse
data: (1) commit, merge, and deploy the `--md-sys-color-text-muted` contrast
fix, then re-verify Legal Terms, ESS Lab, and the 404 page all hit A11y 100;
(2) fix the `heading-order` issue on Legal Terms; (3) fix the separate
`.badge` contrast issue on the 404 page (`#ef4444`/`#fef2f2`, unrelated
token); (4) confirm all pages via a fresh full Lighthouse pass. Once
confirmed, this document has no outstanding [Needs Verification] items and
can move to Review.

---

**End of Document**
