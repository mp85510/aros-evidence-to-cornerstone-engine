# Build Week judge audit

Audit date: 2026-07-18

Scoring: severity (`Critical`, `High`, `Medium`, `Low`) and leverage (`5` improves the most judging dimensions).

## Ranked weaknesses and disposition

| Rank | Weakness | Dimensions affected | Severity | Leverage | Disposition |
|---:|---|---|---|---:|---|
| 1 | The inherited prototype simulated actions and did not persist governance state. | Technical, completeness, usefulness, reliability, demo, deployment | Critical | 5 | **Closed.** D1-backed evidence, promotion state, recommendations, and immutable governance events are live. |
| 2 | The architect recommendation had no proven GPT-5.6 implementation. | Originality, GPT usage, demo, proof | Critical | 5 | **Closed.** The production server calls Responses with `gpt-5.6-sol`; nine live cases retained response IDs and advisory records. |
| 3 | Evidence could become authority without an enforceable lifecycle. | Completeness, originality, usefulness, reliability, UX | Critical | 5 | **Closed.** Promotion is a separate authenticated, version-matched server action with centralized prerequisites. |
| 4 | Model output and human authority were not structurally separated. | Reliability, usefulness, originality, proof | Critical | 5 | **Closed.** Recommendations are immutable advisory records; human transitions are separate actor-attributed governance events. |
| 5 | An existing D1 database could keep the prototype schema and fail new writes. | Technical, reliability, deployment | Critical | 5 | **Closed.** Startup validation now performs additive, idempotent column convergence; the real pre-hardening local database upgraded successfully. |
| 6 | Starter tests were stale and did not prove product behavior. | Technical, reliability, deployment, proof | Critical | 4 | **Closed.** Twenty-two tests cover model, server, security, governance, build, and bundle invariants. |
| 7 | Client manipulation could attempt authority or stale-state bypass. | Technical, reliability, security, proof | High | 5 | **Closed.** Server-controlled fields are rejected, canonical state is reloaded, and `expectedVersion` conflicts return 409. |
| 8 | Authentication used a synthetic reviewer when identity was absent. | Security, reliability, usefulness | High | 5 | **Closed.** Production mutations require the trusted Sites user header; no-header production writes return 401. |
| 9 | Governance events lacked complete before/after evidence. | Reliability, usefulness, proof | High | 5 | **Closed.** Events record actor, action, timestamp, prior/resulting state, reason, source record, and optional advisory reference. |
| 10 | Model outputs were not explicitly validated after parsing. | GPT usage, reliability, security | High | 5 | **Closed.** Strict Structured Outputs plus exact-key, type, enum, and length validation reject malformed or authority-shaped output. |
| 11 | Fallback and API failures could be mistaken for GPT success. | Reliability, UX, GPT usage | High | 4 | **Closed.** Rules v1 is explicitly labeled with distinct unavailable, timeout, invalid-schema, and rate-limit states. |
| 12 | Storage failure could be acknowledged as a successful mutation. | Reliability, deployment, proof | High | 5 | **Closed.** Governance writes require D1 and fail closed; GPT is not called when its advisory cannot be audited. |
| 13 | Input and abuse boundaries were incomplete. | Security, reliability, deployment | High | 4 | **Closed for MVP.** Size limits, normalization, allowlists, bounds, cross-site rejection, no-store responses, generic errors, and D1 rate limits are present. |
| 14 | User-visible encoding corruption weakened demo trust. | UX, demo, deployment | High | 4 | **Closed.** Source and persisted seed correction are included; source/browser checks found no corruption marker. |
| 15 | Pulse, drift, and readiness could contradict the evidence queue. | Usefulness, reliability, UX, demo | High | 5 | **Closed.** States, pulse, blockers, and Rules v1 derive from canonical records. |
| 16 | Documentation and evaluation proof were insufficient. | Documentation, GPT usage, Codex usage, proof | High | 4 | **Closed.** Exact paths, boundaries, failure policy, security, nine live cases, adversarial results, runtime proof, and known limits are recorded. |
| 17 | A visible audit-history interface is absent. | UX, usefulness, demo | Medium | 3 | **Open, non-blocking.** The immutable `/api/audit` proof exists; a new UI surface would expand this server-only closeout. |
| 18 | Fine-grained roles beyond authenticated architect actions are absent. | Security, deployment, enterprise usefulness | Medium | 3 | **Open, declared limit.** Private owner-only Sites access and authenticated actor capture are sufficient for the judged single-workspace MVP. |
| 19 | Token/cost telemetry and distributed rate limiting are not claimed. | Reliability, operations, proof | Medium | 2 | **Open, declared limit.** Latency and response IDs are retained; D1 fixed-window limiting is the Version 1 control. |
| 20 | Tablet/mobile detail UX and enterprise connectors are absent. | UX, completeness | Medium | 2 | **Open by scope.** Desktop manual intake is the MVP boundary; these additions do not strengthen the core authority proof enough for this pass. |

## Server-side closeout evidence

- Production `OPENAI_API_KEY` is present only as a masked Sites runtime secret at revision 2.
- The production client bundles contain neither the key name nor the OpenAI endpoint.
- Production health returned `ready`, `gptConfigured: true`, storage `ready`, and `authenticated-and-audited` authority transitions.
- The six required live GPT cases passed again; three adversarial cases also passed.
- Aggregate model result: 9/9 HTTP 200, 9/9 strict schemas, 0 invented owners, 0 automatic grants, 0 unexpected fallback, 9/9 correct governance behavior.
- Separate production audit reads found retained E1 and E9 advisory records.
- Identity-less production mutation returned 401 `unauthorized_action`.
- Local runtime returned 409 for blocked promotion, 400 for authority injection, and 409 for stale state.
- Valid promotion required an authenticated human and wrote a separate immutable event.
- Database attempts to update an event or delete a recommendation were rejected.
- Browser smoke reported the durable audit store, empty local/session storage, no credential marker, no encoding corruption, and no warning/error log entries.
- Anonymous production navigation showed the Sign in with ChatGPT gate.

## Why this order

The changes first strengthen the same high-leverage claim: AROS is a governed decision system, not a themed dashboard. Secure model execution, canonical promotion rules, authenticated human action, durable audit, upgrade safety, and proof improve technical implementation, product completeness, real-world usefulness, reliability, GPT usage, Codex usage, demo strength, and deployment readiness together.

No connector, analytics surface, mobile drawer, or role-management feature was added because it would not strengthen the next hundred governance decisions as much as a correct evidence-to-authority boundary.

## Codex evidence

Codex inspected the inherited prototype, ranked judging risks, repaired the shared server contracts, generated the migration, found and corrected a real existing-schema runtime failure, added adversarial tests, exercised the D1 runtime, scanned source and bundles for secrets, deployed an exact source commit, ran production model cases, validated private access and browser state, repaired regressions, and published truthful evidence.

## Remaining submission action

No application blocker remains for the private desktop MVP. The required `/feedback` session remains a manual Build Week action and must be completed from the authenticated submission session. Judges also require access to the private deployment.
