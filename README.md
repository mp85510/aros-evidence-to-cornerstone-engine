# AROS — Evidence-to-Cornerstone Engine

AROS is a governance workbench for turning organizational evidence into explicit, accountable decisions without letting repetition masquerade as authority.

## Product thesis

- Observation does not become authority.
- Repetition does not become jurisdiction.
- Folders answer where something is; ownership answers who is responsible.
- Evidence earns inheritance.

AROS treats GPT output as advice. Only a human architect can create a governed decision, and only after classification, ownership, jurisdiction, and confidence prerequisites pass.

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
- The OpenAI Responses API uses `gpt-5.6-sol` at low reasoning for architect recommendations when `OPENAI_API_KEY` is configured.
- Structured Outputs constrain recommendations to a four-field schema.
- When the OpenAI API is unavailable, AROS returns a labeled deterministic recommendation. It never presents fallback output as GPT output.
- Sign in with ChatGPT and Sites access policy protect the private deployment. Write events use the authenticated email header when available.

## Local development

Prerequisites: Node.js 22.13 or later.

```bash
pnpm install
pnpm run dev
```

Optional environment:

```bash
OPENAI_API_KEY=your_key
```

Without that key, the workbench remains operational and clearly labels recommendations as `Rules v1`.

## Verification

```bash
pnpm run lint
pnpm test
```

The suite covers:

- server rendering and product metadata;
- safe operation without D1;
- honest AI fallback labeling;
- authority-drift thresholds;
- promotion prerequisites;
- human-only authority transitions;
- derived daily-pulse counts.

See [docs/EVALUATION.md](docs/EVALUATION.md) for the product evaluation matrix and [docs/JUDGE_AUDIT.md](docs/JUDGE_AUDIT.md) for the ranked submission audit.

## Deployment

The site is deployed privately with OpenAI Sites. `.openai/hosting.json` declares the logical D1 binding; Sites owns the production database and migration application.

Required production environment:

- `OPENAI_API_KEY` — enables live GPT‑5.6 Sol architect recommendations.

No key or secret is stored in source control.
