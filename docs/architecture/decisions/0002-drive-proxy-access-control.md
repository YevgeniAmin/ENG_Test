# ADR-0002: driveVersionsProxy — Origin-Header Access Control (Accepted Risk)

**Status:** Accepted
**Date:** 2026-07-25

## Context
`driveVersionsProxy` is a public Cloud Function (`invoker: "public"`) that
lists filenames/versions from one specific Google Drive folder (read-only
scope). Access control is an Origin-header check only (yevgeni.info,
localhost, or null).

## Risk
Origin headers are not a strict security boundary — non-browser callers
(curl, server-to-server) can set or omit them freely. A caller could bypass
the check.

## Accepted, Not Fixed, Because
The exposed data is limited to filenames, modification times, and a
generated version string for one non-sensitive folder — no file contents,
no credentials, no write access. The `driveServiceAccount` secret itself is
never exposed to the client.

## Owner Approval
Approved by Yevgeni Aminov, 2026-07-25.

## If This Changes
If the target Drive folder ever contains sensitive filenames, or the
function's scope grows beyond read-only listing, replace the Origin check
with Firebase App Check or a shared-secret header.
