# Competition readiness

Closeout date: 2026-07-18

Status: **application-ready for a private desktop Build Week review**

Production: [https://aros-governance-workbench.mp85510.chatgpt.site](https://aros-governance-workbench.mp85510.chatgpt.site)

## GPT-5.6 usage proven

- Exact path: browser `/api/recommendation` request → server validation/rate limit → server-only OpenAI Responses API → strict validation → immutable advisory record → browser response.
- Requested and returned model: `gpt-5.6-sol`.
- Reasoning: `low`; OpenAI storage: `store: false`.
- Output: strict `governance-recommendation.v1` with four fields.
- Secret: masked Sites runtime `OPENAI_API_KEY`, environment revision 2.
- Required cases: 6/6 passed.
- Additional live adversarial cases: invented owner, automatic authority, and conflicting jurisdiction all passed.
- Aggregate: 9/9 schemas, 0 invented owners, 0 automatic grants, 0 unexpected fallback, 9/9 correct governance behavior.
- Live server latency: 2,234–5,929 ms; mean 3,685 ms.
- Every live result retained an advisory ID and OpenAI response ID.

Full inputs, expected behavior, structured outputs, pass/fail status, fallback state, latency, and repairs are in [EVALUATION.md](EVALUATION.md).

## Authority boundary

GPT output is advisory only. The recommendation route may append an immutable advisory audit row but contains no evidence update path.

Only `/api/evidence` can transition evidence. It requires an authenticated human, rejects client authority fields, reloads canonical state, checks `expectedVersion`, evaluates all promotion prerequisites on the server, and writes a separate immutable governance event. No model output can create an owner, jurisdiction, authority, or promotion without that explicit human action.

## Codex build evidence

Codex continued from the existing prototype and performed the scoped review/repair/validate loop:

1. Audited server routes, schemas, auth, persistence, evaluation proof, and deployment.
2. Centralized request contracts and promotion rules.
3. Added strict GPT response validation and explicit fallback states.
4. Added immutable recommendation provenance and complete governance event snapshots.
5. Removed synthetic mutation actors and added stale-write protection.
6. Added size, validation, cross-site, error, and rate-limit boundaries.
7. Generated D1 migrations and repaired the existing-database upgrade path after runtime testing exposed it.
8. Added adversarial tests and reached 22/22 passing tests.
9. Proved local persistence, immutable triggers, blocked bypass, fallback labeling, and human promotion.
10. Scanned repository/client bundles and inspected browser storage/logs for secret exposure.
11. Deployed the exact committed source and ran nine production GPT evaluations.
12. Updated the submission documentation with the observed results.

## Reliability and security proof

- Lint, production build, and all automated tests passed.
- Existing D1 storage upgraded additively and then accepted audited mutations.
- Evidence, promotion state, recommendations, and events survived reload requests.
- Event updates and recommendation deletes were rejected by database triggers.
- Blocked promotion returned 409; authority injection returned 400; stale update returned 409; missing identity returned 401.
- Production health reported GPT configured, D1 ready, and authority transitions authenticated/audited.
- Production recommendation records were found through later audit requests.
- Source and client scans found no credential-shaped value.
- Client bundles contained no `OPENAI_API_KEY`, OpenAI endpoint, or Responses API path.
- Browser local/session storage was empty; no credential marker or warning/error log was present.
- Anonymous production navigation reached the Sign in with ChatGPT gate.
- Public errors do not expose stack traces or internal configuration.

## Remaining known limits

- Judges must be granted access to the private Sites deployment.
- Fine-grained role administration beyond authenticated architect action is not implemented.
- A visible audit-history UI is deferred; immutable history is available through `/api/audit`.
- D1 fixed-window rate limiting is basic Version 1 protection, not a full abuse platform.
- Token and cost telemetry are not claimed.
- Desktop is the judged workflow; tablet/mobile detail navigation is deferred.
- Evidence connectors are outside the manual-intake MVP.

These are declared Version 1 limits, not hidden blockers.

## Demo-ready workflow

1. Open the private production URL and sign in with ChatGPT.
2. Show Daily Pulse and distinguish evidence state from authority state.
3. Intake a sourced observation; call out that it begins as observation only.
4. Classify it and assign owner/jurisdiction.
5. Select a repeated record and show authority drift.
6. Request the architect recommendation and point to `gpt-5.6-sol · AI advisory`.
7. Explain that the advisory writes only an audit record and cannot mutate evidence.
8. Attempt a blocked promotion and show the server prerequisite response.
9. Promote an eligible record through explicit architect action.
10. Reload and confirm state/audit persistence.
11. If GPT is unavailable, show the visibly labeled Rules v1 fallback.

## Required `/feedback` step

This repository cannot complete the Build Week feedback command. Before submission, the authenticated owner must:

1. Run `/feedback` in the required Build Week session.
2. Include the production URL.
3. Cite the 9/9 live-model result and 22/22 automated tests.
4. State that GPT is advisory and explicit authenticated architect action creates authority.
5. Disclose private access and the known Version 1 limits above.

Do not claim this step complete until the session itself confirms it.
