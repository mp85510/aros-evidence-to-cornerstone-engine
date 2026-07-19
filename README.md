# AROS — Evidence-to-Cornerstone Engine

AROS is a governance workbench for turning organizational evidence into explicit, accountable decisions without letting observation or repetition masquerade as authority.

Production: [https://aros-governance-workbench.mp85510.chatgpt.site](https://aros-governance-workbench.mp85510.chatgpt.site) (private; Sign in with ChatGPT required).

## Product contract

- Observation does not become authority.
- Repetition does not become jurisdiction.
- Production Shell is not a canon object.
- Folders answer where something is; ownership answers who is responsible.
- Evidence earns inheritance.
- GPT output advises; only an explicit authenticated architect action can authorize.

## Version 1 workflow

1. Intake a sourced observation.
2. Classify it without silently increasing confidence.
3. Assign accountable ownership and jurisdiction.
4. Detect authority drift from repeated downstream use.
5. Request a bounded architect recommendation.
6. Resolve promotion prerequisites.
7. Promote only through an explicit authenticated human action.
8. Preserve the transition and advisory as separate immutable audit records.

## Exact server-side model path

```text
Browser
  → POST /api/recommendation
  → request-size and evidence-schema validation
  → D1-backed rate limit
  → server-only OPENAI_API_KEY
  → POST https://api.openai.com/v1/responses
       model: gpt-5.6-sol
       reasoning.effort: low
       store: false
       strict JSON schema
  → explicit schema validation
  → immutable recommendation audit record
  → advisory response to browser
```

The browser never calls OpenAI. `OPENAI_API_KEY`, the authorization header, and the OpenAI endpoint are absent from client modules and production client bundles. The key is a masked Sites runtime secret, not a repository or `.openai/hosting.json` value.

Every recommendation records model/engine, schema version, latency, fallback state, request result, response ID, source record, actor context, and advisory ID. Malformed JSON or authority-shaped extra fields are rejected; invalid authority fields are never silently coerced.

## Authority boundary

The recommendation endpoint may append an immutable advisory record, but it cannot update evidence, ownership, jurisdiction, authority, or promotion state.

Authority transitions use a separate `POST /api/evidence` path. That route:

- requires the trusted Sign in with ChatGPT user identity in production;
- rejects cross-site mutations and synthetic actors;
- validates and sanitizes intake fields;
- rejects client-controlled authority, status, confidence, citation, and version fields;
- requires `expectedVersion` for optimistic concurrency;
- reloads the canonical record and centralizes promotion prerequisites on the server;
- returns clear 4xx errors for unauthorized, invalid, blocked, and stale transitions; and
- commits the evidence change and its governance event together.

Each immutable governance event records actor, action, timestamp, prior state, resulting state, reason, source record, and an optional model advisory reference. The human action and the model recommendation remain distinct records.

## Failure behavior

`Rules v1` is the explicit deterministic fallback. It is never labeled as GPT output.

| Condition | Public state |
|---|---|
| Model/API unavailable | `gpt_unavailable` |
| Model timeout | `timeout` |
| Invalid structured output | `invalid_schema` |
| OpenAI or application rate limit | `rate_limit` |
| Storage unavailable | `storage_failure`; mutations fail closed |
| Missing authenticated user | `unauthorized_action` |
| Record changed after load | `stale_record_conflict` |
| Promotion prerequisites missing | `blocked_transition` |

When the model is unavailable, AROS returns `engine: Rules v1`, `mode: fallback`, and the exact fallback state. When durable advisory storage is unavailable, the GPT call is not made because the recommendation could not be audited.

## Security boundary

- Private owner-only Sites deployment with Sign in with ChatGPT.
- Masked server-side runtime secret at environment revision 2.
- 12 KB evidence-mutation and 8 KB advisory request limits.
- Unicode normalization, control-character removal, field allowlists, length bounds, enum validation, and numeric bounds.
- D1 fixed-window limits: 60 evidence mutations and 20 advisory requests per identity/IP per minute.
- Generic public errors; no stack trace or internal configuration response.
- `cache-control: no-store` on governance APIs.
- Database triggers reject updates/deletes to governance events and recommendations.
- No application logging of prompts, credentials, headers, or stack traces.

The production write boundary relies on Sites to inject the authenticated user header after its private access gate. Fine-grained application roles beyond the authenticated architect action model are a declared Version 1 limit.

## Local development

Prerequisite: Node.js 22.13 or later.

```bash
pnpm install
pnpm run dev
```

For local GPT testing, provide `OPENAI_API_KEY` only through the process environment or a gitignored local environment file. Never prefix it with `NEXT_PUBLIC_`, print it, or place it in browser code. Without it, GPT fails closed and the workbench stays usable with labeled Rules v1 output.

Local D1 startup validation is additive and idempotent, so a database initialized by an earlier prototype converges to the current audit schema.

## Verification

```bash
pnpm run lint
pnpm run build
pnpm test
```

The automated suite contains 22 passing tests covering the product invariants, strict GPT schema, malformed output, owner/authority injection, fallback states, authentication, request sizing, stale conflicts, server promotion rules, encoding, migrations, immutable audit declarations, and client-bundle secret isolation.

Runtime checks additionally proved:

- an existing D1 schema upgraded in place;
- evidence mutations and advisory records persisted across reload requests;
- event updates and recommendation deletes were blocked as immutable;
- blocked promotion, authority injection, stale writes, and unauthenticated writes returned 4xx responses;
- a valid human promotion created a separate actor-attributed event;
- production health reported GPT, D1, and authority controls ready;
- production recommendation audit rows persisted; and
- browser storage was empty, browser logs had no warnings/errors, and no credential-shaped value appeared in storage or sampled responses.

The production live-model evaluation passed all six required cases and three additional adversarial cases: 9/9 strict schemas, 0 invented owners, 0 automatic authority grants, 0 unexpected fallbacks, and 9/9 correct governance behavior.

See [docs/EVALUATION.md](docs/EVALUATION.md), [docs/JUDGE_AUDIT.md](docs/JUDGE_AUDIT.md), [docs/COMPETITION_READINESS.md](docs/COMPETITION_READINESS.md), and [SERVER_SIDE_READINESS.md](SERVER_SIDE_READINESS.md).

## Deployment and submission

`.openai/hosting.json` contains only the opaque Sites project ID and logical D1 binding. Sites owns the production database, migrations, private access policy, and masked runtime environment.

The required Build Week `/feedback` session is external and manual. It is not claimed complete. Before submission, run `/feedback` from the authenticated Build Week session, include the production URL, cite the nine-case evaluation, and state that AI is advisory while only explicit architect authorization creates authority.
