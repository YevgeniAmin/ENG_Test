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

## Git workflow

- Branch names follow `<type>/<kebab-description>`, e.g. `feature/portal-branding-pass`, `ci/firebase-hosting`, `refactor/portal-architecture`, `fix/portal-quality-lighthouse`. Common types: `feature`, `fix`, `ci`, `refactor`.
- All changes land on `main` through a GitHub pull request — no direct pushes to `main`.
- This is a single-owner repository, so PRs are self-reviewed and self-merged; the PR still exists to keep a reviewable diff and CI/preview-deploy signal before merge.