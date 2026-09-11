# ENG Portal Development Rules

## Project purpose

This repository contains Yevgeni's engineering portal.

## General rules

- Preserve the current visual identity.
- Do not rewrite entire files for small changes.
- Prefer focused and reversible modifications.
- Do not change JavaScript behavior unless explicitly requested.
- Do not remove existing features.
- Keep HTML semantic and accessible.
- Keep CSS responsive.
- Reuse existing variables and components before creating new ones.
- Explain affected files before major edits.
- Review the diff after every task.

## Styling rules

- Use CSS variables for repeated colors and spacing.
- Avoid inline styles.
- Use consistent border radius, spacing and typography.
- Prefer subtle professional shadows.
- Preserve mobile layouts.
- Avoid unnecessary animations.
- Maintain fast page loading.

## Safety

- Never expose API keys, passwords or tokens.
- Never modify deployment or security configuration without explicit approval.
- Create or recommend a Git checkpoint before broad refactoring.
- Before uploading any local project folder to Google Drive for review,
  exclude every file matching the repo's `.gitignore` secret patterns
  (`.env`, `.env.*`, `.runtimeconfig.json`, `serviceAccount*.json`,
  `*-firebase-adminsdk-*.json`) — Google Drive uploads do NOT respect
  `.gitignore` automatically; this must be checked manually every time.

## Multi-agent governance

This repository is worked on by multiple agents in parallel. This section
defines role boundaries, safeguards against runaway automated loops, and
where authoritative data lives.

### Workstack & role boundaries

- **Owner (Yevgeni):** Ultimate system authority. Final approval gate for
  code merges, architecture decisions, and scope changes. All other roles
  are advisory or executory relative to the Owner.
- **Gemini (System Architect & Governance Agent):** Responsible for system
  architecture, ADS-standards enforcement, system-prompt design, and
  read-only reviews. Does not modify source code directly.
- **Claude (Dev Agent):** Primary code-execution agent. Responsible for
  file creation, refactoring, test-suite execution, and Git branch/PR
  management, within the boundaries defined in this document.
- **VS Code + GitHub Copilot:** Micro-level inline assistance, syntax
  completion, and quick utility tasks during manual editing.

### Circuit breakers & loop prevention

- **Read-only reviewers:** Independent review agents (including Gemini in
  its reviewer capacity) MUST operate in read-only mode and shall not
  modify source code directly during a review phase.
- **Iteration cap (max 2):** Automated review-and-fix cycles are strictly
  capped at a maximum of 2 iterations.
- **Escalation trigger:** If an issue or disagreement is not resolved
  after 2 iterations, execution MUST halt immediately, the issue MUST be
  tagged `[Needs Owner Decision]`, and it MUST be escalated to the Owner
  rather than retried further.

### Single Source of Truth (SSOT) boundaries

- **Code & system logic SSOT:** The local Git repository (`c:\eng-portal`)
  and its GitHub remote. Source code and configuration are authoritative
  only there.
- **Evidence & documentation SSOT:** Google Drive (`00_ATC_Engineering`)
  for immutable test reports, signed ATRs, and final PDFs. This is
  authoritative for evidentiary/compliance artifacts, not for source code.
- **Immutable configuration:** Secrets, API keys, and environment
  variables (`.env` / Secret Manager) are read-only to execution agents
  and MUST NOT be altered via automated scripts.

## Git workflow

- Branch names follow `<type>/<kebab-description>`, e.g. `feature/portal-branding-pass`, `ci/firebase-hosting`, `refactor/portal-architecture`, `fix/portal-quality-lighthouse`. Common types: `feature`, `fix`, `ci`, `refactor`.
- All changes land on `main` through a GitHub pull request — no direct pushes to `main`.
- This is a single-owner repository, so PRs are self-reviewed and self-merged; the PR still exists to keep a reviewable diff and CI/preview-deploy signal before merge.