# Build Week judge audit

Audit date: 2026-07-18

Scoring uses severity (`Critical`, `High`, `Medium`, `Low`) and leverage (`5` improves the most judging dimensions).

## Ranked weaknesses and disposition

| Rank | Weakness | Dimensions affected | Severity | Leverage | Disposition |
|---:|---|---|---|---:|---|
| 1 | The submitted UI was a static simulation: actions only showed toasts and nothing persisted. | Technical, completeness, usefulness, reliability, demo, deployment | Critical | 5 | Repaired with D1 records, durable mutations, and audit events. |
| 2 | No GPT‑5.6 call existed despite the product presenting an “architect recommendation.” | Originality, GPT usage, demo, proof | Critical | 5 | Runtime path implemented with Responses API, Sol, low reasoning, and Structured Outputs. Production still requires `OPENAI_API_KEY`. |
| 3 | There was no enforceable evidence-to-authority lifecycle. | Completeness, originality, usefulness, reliability, UX | Critical | 5 | Repaired with deterministic states, promotion blockers, and explicit human authorization. |
| 4 | Starter tests asserted a deleted loading skeleton and could never pass. | Technical, reliability, deployment, proof | Critical | 4 | Replaced with product, API fallback, and governance-invariant tests. |
| 5 | User-visible text contained encoding corruption. | UX, demo, deployment | High | 4 | Repaired by replacing corrupted source and adding a rendered-output regression test. |
| 6 | Counts, drift signals, and recommendations were hard-coded and could contradict the queue. | Usefulness, reliability, UX, demo | High | 5 | Repaired: pulse and states derive from current records. |
| 7 | AI output could be mistaken for authority. | Originality, usefulness, reliability, UX | High | 5 | Repaired: AI is advisory, model mode is labeled, and only explicit architect action changes authority. |
| 8 | Evidence intake accepted no real data and provided no validation. | Completeness, usefulness, reliability, demo | High | 4 | Repaired with validated intake and durable creation. |
| 9 | No ownership/jurisdiction gating existed before promotion. | Product completeness, originality, usefulness | High | 5 | Repaired with visible blockers enforced on server and client. |
| 10 | Failure modes were invisible; unavailable storage or AI looked like success. | Reliability, UX, deployment | High | 4 | Repaired with honest degraded modes and error banners. |
| 11 | Navigation and several controls were dead. | UX, demo, completeness | High | 3 | Replaced with working governance lenses and actions. |
| 12 | No audit trail proved who changed authority state. | Usefulness, reliability, proof | High | 4 | Durable governance events now record action, actor, detail, and time. A visible history view remains future work. |
| 13 | Documentation was untouched starter content. | Documentation, deployment, Codex, proof | High | 4 | Replaced with product, architecture, operating, test, and deployment documentation. |
| 14 | There was no evaluation set or invariant-based proof. | GPT usage, reliability, proof | High | 4 | Added deterministic governance evals and an evaluation matrix. Live model-quality evals remain blocked on an API key. |
| 15 | “Codex usage” was not evidenced beyond the implementation itself. | Codex usage, documentation, proof | Medium | 3 | This repair log, tests, deployment provenance, and scoped Codex workflow provide reproducible evidence. A short submission narrative is included below. |
| 16 | The product had no explicit model/fallback policy. | GPT usage, reliability, UX, deployment | Medium | 4 | Added Sol/Responses/low-reasoning policy and deterministic fallback disclosure. |
| 17 | Responsive behavior hid the detail pane on tablet rather than providing an alternative. | UX, demo | Medium | 3 | Still open. Desktop is the judged demo target; a mobile detail drawer is intentionally deferred. |
| 18 | No latency, token, or cost telemetry exists for GPT recommendations. | GPT usage, reliability, proof | Medium | 3 | Open. Requires live API traffic; response IDs are returned for future tracing. |
| 19 | No import or connector path exists for real enterprise evidence. | Completeness, usefulness | Medium | 2 | Intentionally deferred: manual evidence intake is the Version 1 boundary. |
| 20 | No role matrix beyond the architect action model is implemented. | Reliability, deployment | Medium | 2 | Private Sites access and authenticated actor capture are in place. Fine-grained roles are deferred until multi-user demand is proven. |

## Why this repair order

The first six repairs all strengthen the same core claim: AROS is a working governance system, not a themed dashboard. They improve technical credibility, product completeness, usefulness, reliability, demo strength, and evaluation proof simultaneously. Connector breadth, analytics, and richer roles were not added because they do not strengthen the next hundred governance decisions as much as a correct lifecycle and audit trail.

## Submission narrative

AROS uses Codex as the engineering and validation agent: inspect an inherited prototype, identify cross-dimensional risks, implement the smallest high-leverage repairs, generate database migrations, replace invalid tests, run regression checks, document the architecture, and publish a private production version. GPT‑5.6 is used inside the product only for bounded architectural synthesis; deterministic rules and human authorization control governance state.
