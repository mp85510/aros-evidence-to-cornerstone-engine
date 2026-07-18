# AROS - Evidence-to-Cornerstone Engine

AROS is a governance workbench for turning organizational evidence into explicit, accountable decisions without letting repetition masquerade as authority.

Production: [https://aros-governance-workbench.mp85510.chatgpt.site](https://aros-governance-workbench.mp85510.chatgpt.site) (private; Sign in with ChatGPT required).

## Product thesis

- Observation does not become authority.
- Repetition does not become jurisdiction.
- Folders answer where something is; ownership answers who is responsible.
- Evidence earns inheritance.

AROS treats GPT output as advice. Only an explicit human architect action can create a governed decision, and only after classification, ownership, jurisdiction, and confidence prerequisites pass.

## Version 1 workflow

1. Add an evidence observation with a source.
2. Classify the evidence.
3. Name an accountable owner and jurisdiction.
4. Detect authority drift when downstream citations accumulate.
5. Ask the advisory engine for a bounded recommendation.
6. Promote the record only through an explicit architect action.
7. Preserve every durable mutation as a governance event.

## Architecture

- Next-compatible React application built with vinext for Cloudflare Workers.
- Cloudflare D1 stores evidence records and governance events.
- Deterministic governance rules calculate states and promotion blockers.
- The server-side recommendation route calls the OpenAI Responses API with `gpt-5.6-sol`, `store: false`, and low reasoning.
- Structured Outputs constrain recommendations to `headline`, `rationale`, `nextAction`, and `risk`.
- The browser calls only the AROS `/api/recommendation` route. The OpenAI endpoint and credential are absent from client bundles.
- `OPENAI_API_KEY` is stored as a masked Sites production runtime secret. It is not stored in `.openai/hosting.json`, repository files, browser storage, logs, or screenshots.
- When the model, API, or credential is unavailable, AROS returns a visibly labeled `Rules v1` deterministic fallback. It never presents fallback output as GPT output.
- Sign in with ChatGPT and the Sites access policy protect the private deployment. Write events use the authenticated email header when available.

## Authority boundary

The recommendation route returns advisory text only and has no evidence mutation path. Promotion is a separate server action that revalidates all governance prerequisites. A recommendation cannot call promotion, update D1, invent jurisdiction, or create authority.

## Local development

Prerequisites: Node.js 22.13 or later.

```bash
pnpm install
pnpm run dev
```

For local live-model testing, provide `OPENAI_API_KEY` through the process environment or a gitignored local environment file. Never prefix it with `NEXT_PUBLIC_`, commit it, print it, or place it in browser code. Without the key, the workbench remains operational and clearly labels recommendations as `Rules v1`.

## Verification

```bash
pnpm run lint
pnpm run build
pnpm test
```

The suite covers:

- server rendering and product metadata;
- safe operation without D1;
- honest AI fallback labeling;
- authority-drift thresholds;
- promotion prerequisites;
- human-only authority transitions;
- derived daily-pulse counts;
- absence of the OpenAI credential name and endpoint from production client bundles.

Production evaluation on 2026-07-18 ran all six documented GPT-5.6 Sol cases. Results: 6/6 valid schemas, 0 invented owners, 0 automatic-authority outputs, 6/6 correct governance blocker/action, and 0 unexpected fallbacks. Measured end-to-end latency was 4,407-7,191 ms (mean 5,866 ms).

See [docs/EVALUATION.md](docs/EVALUATION.md) for inputs, expected behavior, structured outputs, response IDs, pass/fail results, fallback status, latency, and repairs. See [docs/JUDGE_AUDIT.md](docs/JUDGE_AUDIT.md) for the ranked submission audit and [docs/COMPETITION_READINESS.md](docs/COMPETITION_READINESS.md) for the closeout report.

## Deployment

`.openai/hosting.json` contains only the Sites project ID and logical D1/R2 bindings. Sites owns the production database, migrations, and masked runtime secret. A saved version must be republished after a production environment revision changes.

The judged demo remains private. A signed-in judge can intake evidence, classify it, assign ownership and jurisdiction, observe drift, request a live GPT-5.6 advisory, verify Rules v1 labeling during failure, and explicitly promote only an eligible record.

## Build Week submission

The required `/feedback` session is a manual Build Week submission step and is not claimed complete by this repository. Before final submission, run `/feedback` from the authenticated Build Week session, reference the production URL, and include the six-case evaluation evidence.
