# Gemini Production Controls

**Status:** NOT PRODUCTION READY

**Reviewed:** 2026-07-25

**Scope:** Engineering Portal Gemini integration

## Current implementation

The repository does not currently implement a Gemini execution endpoint or
frontend Gemini caller. `functions/index.js` contains an SDK import, a Secret
Manager declaration, and the corrected safety-settings constant only. Because
the intended endpoint contract, approved model, Firebase Authentication flow,
and Firebase App Check provider are not defined, this corrective change does
not invent or deploy a Gemini endpoint.

Any future Gemini endpoint must remain disabled until every prerequisite and
console control below has been implemented and verified in a controlled
non-production environment.

## Required application prerequisites

- [ ] Establish Firebase Authentication for the portal.
- [ ] Define a server-managed owner UID authorization source.
- [ ] Initialize Firebase App Check in the web client with the approved
  production provider.
- [ ] Implement a Firebase callable endpoint with enforced Authentication and
  App Check, including replay protection when supported.
- [ ] Define and test an exact request schema and server-controlled model,
  system instruction, safety settings, and output-token limit.
- [ ] Implement fail-closed Firestore transaction-based minute, hour, day, and
  concurrent usage limits.
- [ ] Add a server-side kill switch that defaults to disabled.
- [ ] Add sanitized structured logging and response handling.
- [ ] Add automated tests using the project's selected test framework.
- [ ] Validate the complete frontend contract and safe text rendering.

## Google Cloud and Firebase console controls

These controls require direct console or CLI inspection. None were inspected
or changed by this source-only corrective change.

```text
API restriction: NOT VERIFIED
Application restriction: NOT VERIFIED
App Check enforcement: NOT VERIFIED
Quota limits: NOT VERIFIED
Billing budget: NOT VERIFIED
Monitoring alerts: NOT VERIFIED
Secret rotation status: NOT VERIFIED
```

### Dedicated API key record

Do not record the key value in this repository.

```text
Key display name: NOT VERIFIED
Google Cloud project: NOT VERIFIED
Allowed API: NOT VERIFIED
Application restriction: NOT VERIFIED
Created date: NOT VERIFIED
Last rotation date: NOT VERIFIED
Next review date: NOT VERIFIED
```

The dedicated production credential must allow only the
Gemini/Generative Language API, must not be shared with development or other
Google APIs, and must remain in Secret Manager. If an application restriction
cannot safely match the serverless runtime, record that limitation and retain
the compensating controls: Secret Manager, Authentication, App Check, strict
quotas, low instance limits, monitoring, and the server-side kill switch.

### Quotas and billing protection

Before enabling the feature, inspect the available Gemini quota dimensions and
set the lowest practical production values without requesting an increase.
Configure a Google Cloud budget with Owner notifications at 50%, 80%, and
100%. Budget alerts are monitoring and are not a hard spending cap.

### Monitoring

Create alerts for request-count spikes, high function error rate, repeated
unauthenticated or permission-denied requests, invalid App Check requests,
rate-limit rejections, unexpected instance scaling, elevated latency, and
billing anomalies.

## Emergency disable procedure

The current repository has no Gemini execution endpoint, so there is no paid
Gemini path to disable. A future implementation must document its exact
server-side configuration command here. The switch must default to `false`,
must not be client-controlled, and must be tested before production enablement.

## Secret rotation procedure

1. Create the replacement key.
2. Apply the Gemini/Generative Language API restriction and the strongest
   compatible application restriction.
3. Store the replacement in Secret Manager without printing it.
4. Deploy only the reviewed Gemini function revision to a controlled
   environment.
5. Run an authorized smoke test.
6. Confirm the old key is no longer used.
7. Delete or disable the old key.
8. Record the rotation date here without recording the key.

## Rollback prerequisites

Before any future deployment, record the previous production commit SHA,
previous function revision, current secret version identifier (not its value),
and current feature-switch state.

Rollback triggers include an Authentication or App Check bypass, secret
exposure, cost spike, rate-limiter failure, excessive server errors, broken
portal workflow, or incorrect safety configuration. Disable the server-side
feature switch first. Never roll back to the five-category `BLOCK_NONE`
configuration. Rotate the API key if exposure is suspected and preserve logs
and evidence for an incident record.
