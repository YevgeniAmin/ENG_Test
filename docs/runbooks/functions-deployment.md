# Cloud Functions Deployment Runbook

**Status:** Manual deployment only. No workflow deploys Functions automatically.

## What GitHub Actions actually deploys

`.github/workflows/firebase-hosting-merge.yml` and
`.github/workflows/firebase-hosting-pull-request.yml` both run
`FirebaseExtended/action-hosting-deploy`, which deploys **Firebase Hosting
only**. Neither workflow calls `firebase deploy --only functions` or touches
Cloud Functions in any way.

Merging a PR that changes anything under `functions/` updates `main` and
redeploys the static site, but the Cloud Functions themselves keep running
whatever was last deployed manually — potentially a much older revision.

## Why this matters (2026-07-26 incident)

PR #16 fixed `journalInsightProxy`'s Gemini model identifier and merged to
`main`, but nobody ran `firebase deploy --only functions` afterward. The
deployed function kept serving the pre-fix code, which called a model
Google's Gemini API was already rejecting, and every real request 500'd —
while `main`, the merge workflow, and the mocked test suite all looked
healthy. See PR `fix/journal-gemini-production-500` for the full incident
report.

## Manual deployment procedure

1. Confirm `main` is up to date and contains the intended commit:
   ```bash
   git fetch origin
   git log --oneline -1 origin/main
   ```
2. Run the full local validation pass first (see `functions/package.json`):
   ```bash
   cd functions
   npm ci
   npm test
   npm run lint
   ```
3. Deploy only the affected function(s) — never deploy all functions
   speculatively:
   ```bash
   firebase deploy --only functions:journalInsightProxy --project eng-web-portal
   ```
4. Verify immediately after deploy:
   ```bash
   firebase functions:log --only journalInsightProxy --project eng-web-portal
   ```
   and run the CORS preflight + live POST checks documented in the
   corrective PR's "Post-deployment validation plan" section.

## Recommended follow-up

A `workflow_dispatch`-only GitHub Actions workflow, gated behind a protected
GitHub Environment with required reviewers, would let Functions deploys stay
explicit and auditable without becoming automatic-on-merge. That requires an
approved production Environment and scoped service-account permissions that
do not currently exist in this repository, so it is not implemented here —
tracked as a follow-up, not part of this fix.
