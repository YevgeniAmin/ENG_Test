# ADR-0001: Gemini Safety Settings — BLOCK_NONE Across All Categories

**Status:** Superseded
**Date:** 2026-07-25
**Location in code:** functions/index.js — SEMANTIC_SAFETY_SETTINGS

## Context
Gemini's default safety filters produced false-positive blocks when
analyzing engineering code and technical/mechanical drawings submitted
through this portal's AI features.

## Decision
All five Gemini harm categories (Harassment, Hate Speech, Sexually
Explicit, Dangerous Content, Civic Integrity) are set to `BLOCK_NONE` for
requests handled by this function.

## Scope & Risk Acknowledgment
This disables Gemini's built-in content moderation entirely for this
endpoint, not just the categories relevant to engineering-drawing
analysis (e.g. Dangerous Content). This is a broad exception, made for
convenience rather than narrowed to the specific failure mode observed.

## Owner Approval
Approved by Yevgeni Aminov, 2026-07-25.

## Review Trigger
Revisit if: this endpoint is ever exposed to untrusted/public input beyond
the portal owner's own use, or if abuse/misuse is observed.

## Correction — 2026-07-25

**Previous status:** Accepted

**Current status:** Superseded

The original decision reflected a misunderstanding of the Owner's intent.
The intended configuration was to retain active Gemini content filtering
while allowing additional tolerance for legitimate engineering analysis.

PR #8 documented the existing `BLOCK_NONE` configuration but did not modify
the corresponding runtime values. Consequently, the code on `main` retained
`BLOCK_NONE` for every configured category until this corrective change.

### Corrected decision

- `HARM_CATEGORY_HARASSMENT`: `BLOCK_MEDIUM_AND_ABOVE`
- `HARM_CATEGORY_HATE_SPEECH`: `BLOCK_MEDIUM_AND_ABOVE`
- `HARM_CATEGORY_SEXUALLY_EXPLICIT`: `BLOCK_MEDIUM_AND_ABOVE`
- `HARM_CATEGORY_DANGEROUS_CONTENT`: `BLOCK_ONLY_HIGH`
- The deprecated `HARM_CATEGORY_CIVIC_INTEGRITY` entry is removed.

Gemini safety settings are one layer only. They do not replace endpoint
authentication, Firebase App Check, server-side authorization, request
validation, rate limiting, quota controls, secret management, logging
controls, or monitoring.

**Owner re-approval:** Yevgeni Aminov, 2026-07-25.
