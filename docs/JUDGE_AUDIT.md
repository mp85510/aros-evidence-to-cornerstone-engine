# Build Week judge audit

Audit date: 2026-07-18

Scoring uses severity (`Critical`, `High`, `Medium`, `Low`) and leverage (`5` improves the most judging dimensions).

## Ranked weaknesses and disposition

| Rank | Weakness | Dimensions affected | Severity | Leverage | Disposition |
|---:|---|---|---|---:|---|
| 1 | The submitted UI was a static simulation: actions only showed toasts and nothing persisted. | Technical, completeness, usefulness, reliability, demo, deployment | Critical | 5 | **Closed.** D1 records, durable mutations, and governance events are live in production. |
| 2 | No GPT-5.6 call existed despite the product presenting an architect recommendation. | Originality, GPT usage, demo, proof | Critical | 5 | **Closed.** Production calls the server-side Responses API with `gpt-5.6-sol`, low reasoning, Structured Outputs, and masked secret revision 2. Six live cases returned OpenAI response IDs. |
| 3 | There was no enforceable evidence-to-authority lifecycle. | Completeness, originality, usefulness, reliability, UX | Critical | 5 | **Closed.** Deterministic states, promotion blockers, and explicit human authorization enforce the lifecycle. |
| 4 | Starter tests asserted a deleted loading skeleton and could never pass. | Technical, reliability, deployment, proof | Critical | 4 | **Closed.** Product, fallback, governance-invariant, server-boundary, and client-secret tests replace them. |
| 5 | User-visible text contained encoding corruption. | UX, demo, deployment | High | 4 | **Closed.** Source was normalized and a regression test checks known corruption markers. |
| 6 | Counts, drift signals, and recommendations were hard-coded and could contradict the queue. | Usefulness, reliability, UX, demo | High | 5 | **Closed.** Pulse, status, blockers, and fallback recommendations derive from current records. |
| 7 | AI output could be mistaken for authority. | Originality, usefulness, reliability, UX | High | 5 | **Closed.** AI mode is labeled, the recommendation route cannot mutate evidence, and only the separate architect promotion action changes authority. |
| 8 | Evidence intake accepted no real data and provided no validation. | Completeness, usefulness, reliability, demo | High | 4 | **Closed.** Validated manual intake creates durable records, which is the intentional Version 1 boundary. |
| 9 | No ownership/jurisdiction gating existed before promotion. | Completeness, originality, usefulness | High | 5 | **Closed.** Visible blockers are enforced on both server and client. |
| 10 | Failure modes were invisible; unavailable storage or AI looked like success. | Reliability, UX, deployment | High | 4 | **Closed.** Storage degradation is explicit and model failure returns visibly labeled `Rules v1` fallback output. |
| 11 | Navigation and several controls were dead. | UX, demo, completeness | High | 3 | **Closed.** Governance lenses, intake, record selection, recommendation, assignment, classification, and promotion work. |
| 12 | No audit trail proved who changed authority state. | Usefulness, reliability, proof | High | 4 | **Closed for MVP.** Durable governance events record action, actor, detail, and time. A visible event-history view is intentionally deferred. |
| 13 | Documentation was untouched starter content. | Documentation, deployment, Codex, proof | High | 4 | **Closed.** Product, architecture, security, evaluation, verification, demo, and deployment evidence are documented. |
| 14 | There was no evaluation set or invariant-based proof. | GPT usage, reliability, proof | High | 4 | **Closed.** Automated invariants plus six production live-model cases passed the documented thresholds. |
| 15 | Codex usage was not evidenced beyond the implementation itself. | Codex usage, documentation, proof | Medium | 3 | **Closed for submission.** The repair audit, scoped diffs, generated migrations, validation commands, production versions, and browser checks form a reproducible build record. |
| 16 | The product had no explicit model/fallback policy. | GPT usage, reliability, UX, deployment | Medium | 4 | **Closed.** Sol/Responses/low-reasoning is explicit; `Rules v1` remains the named deterministic fallback. |
| 17 | Responsive behavior hides the detail pane on tablet instead of providing an alternative. | UX, demo | Medium | 3 | **Open, non-blocking.** Desktop is the judged demo target. A mobile detail drawer is deferred because it does not strengthen the core governance proof. |
| 18 | No latency, token, or cost evidence existed for GPT recommendations. | GPT usage, reliability, proof | Medium | 3 | **Partially closed, non-blocking.** Six end-to-end latency measurements and response IDs are recorded. Token and cost telemetry are not claimed and remain future operational work. |
| 19 | No import or connector path exists for enterprise evidence. | Completeness, usefulness | Medium | 2 | **Open by design.** Manual evidence intake is the Version 1 boundary; connector breadth would expand the MVP without strengthening the decision lifecycle. |
| 20 | No fine-grained role matrix beyond the architect action model is implemented. | Reliability, deployment | Medium | 2 | **Open by design.** Private Sites access and authenticated actor capture are sufficient for the judged single-workspace MVP. |

## Competition blocker closeout

- Production `OPENAI_API_KEY`: present only as a masked Sites runtime secret; value is redacted by the environment API.
- Deployment environment: republished successfully at secret revision 2.
- Live model: all six requests returned HTTP 200, `engine: gpt-5.6-sol`, `mode: ai-advisory`, valid structured output, and an OpenAI Responses API response ID.
- Quality result: 6/6 schema-valid, 0 invented owners, 0 automatic-authority outputs, 6/6 correct blocker/action, 0 unexpected fallbacks.
- Reliability result: the pre-run credential-format defect produced the labeled `Rules v1` fallback, was repaired, and did not corrupt state.
- Authority boundary: the recommendation route has no D1 mutation capability. Promotion remains a separate prerequisite-gated architect action.

## Why this repair order

The first six repairs strengthen the same core claim: AROS is a working governance system, not a themed dashboard. They improve technical credibility, product completeness, usefulness, reliability, demo strength, and evaluation proof simultaneously. Connector breadth, analytics, and richer roles were not added because they do not strengthen the next hundred governance decisions as much as a correct lifecycle and audit trail.

## Submission narrative

AROS uses Codex as the engineering and validation agent: inspect an inherited prototype, rank cross-dimensional risks, implement the smallest high-leverage repairs, generate D1 migrations, replace invalid tests, secure the production model credential, run production evaluations, repair a real fallback-triggering configuration defect, validate the browser workflow, document evidence, and publish an exact private production version.

GPT-5.6 Sol is used only for bounded architectural synthesis. Deterministic Rules v1, server-enforced prerequisites, and explicit human authorization control governance state.

## Remaining submission actions

No application blocker remains for the private desktop judged demo. The required `/feedback` session remains an external manual Build Week step and must be completed from the authenticated submission session. Public access, mobile detail UX, connector ingestion, token/cost telemetry, and fine-grained roles are declared limitations rather than hidden claims.
