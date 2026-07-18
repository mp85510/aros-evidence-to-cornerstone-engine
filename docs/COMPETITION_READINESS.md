# Competition readiness report

Closeout date: 2026-07-18

## Status

AROS is credible as Version 1 of a real governance workbench and is ready for a private desktop Build Week demo. The production model blocker is closed. The remaining actions and limitations below are explicit.

## GPT-5.6 usage proven

- Production recommendation requests run through the server-side OpenAI Responses API.
- Requested and returned model: `gpt-5.6-sol`.
- Reasoning effort: `low`.
- Storage policy: `store: false`.
- Output contract: strict four-field JSON schema.
- Secret: masked Sites runtime `OPENAI_API_KEY`; absent from repository and production client bundles.
- Evidence: six HTTP 200 production runs, six OpenAI response IDs, 6/6 valid schemas, 0 invented owners, 0 automatic-authority outputs, 6/6 correct governance blocker/action, and 0 unexpected fallbacks.
- Measured latency: 4,407-7,191 ms, mean 5,866 ms.
- Fallback: `Rules v1` remains explicitly labeled and was observed during the repaired pre-run credential-format failure.

Full case evidence is in [EVALUATION.md](EVALUATION.md).

## Codex build evidence

Codex continued from the inherited prototype and performed the scoped Build Week repair loop:

1. Reviewed and ranked product weaknesses across judging dimensions.
2. Replaced simulated state with D1-backed evidence and governance events.
3. Implemented deterministic lifecycle rules and server-enforced promotion gates.
4. Added the bounded GPT-5.6 Sol Responses API route and Structured Outputs.
5. Preserved and tested Rules v1 fallback behavior.
6. Generated and included D1 migrations.
7. Replaced obsolete starter tests with product and invariant tests.
8. Secured the production secret, detected a real configuration failure through fallback, repaired it, and republished.
9. Ran six production model evaluations and recorded response IDs and latency.
10. Revalidated the built application and production browser workflow.

The repository diff, test suite, migrations, deployment versions, evaluation records, and judge audit are the reproducible evidence.

## Deployment URL

[https://aros-governance-workbench.mp85510.chatgpt.site](https://aros-governance-workbench.mp85510.chatgpt.site)

Access is private and requires Sign in with ChatGPT.

## Demo-ready workflow

1. Open the private production URL at a desktop viewport.
2. Point out the daily pulse and the distinction between evidence state and authority state.
3. Add a real evidence observation.
4. Show that intake creates an observation, not authority.
5. Classify the record and assign accountable ownership and jurisdiction.
6. Select a repeated record and show authority drift from citations.
7. Request the architect recommendation; call out `gpt-5.6-sol` and `AI advisory`.
8. Explain that the advisory cannot mutate the record.
9. Attempt promotion on a blocked record and show the prerequisite rejection.
10. Promote an eligible record through the explicit architect action and confirm persistence after reload.
11. If the model is unavailable, show the same workflow continuing under visibly labeled `Rules v1`.

## Remaining blockers and declared limitations

- Application blockers: none for the private desktop judged MVP.
- Submission blocker: the required `/feedback` session has not been claimed complete and must be performed manually from the authenticated Build Week submission session.
- Declared limitations: tablet/mobile detail view, external evidence connectors, token/cost telemetry, visible event-history UI, and fine-grained multi-user roles are outside Version 1.
- Access limitation: judges must be granted or possess access to the private Sites deployment.

## Required `/feedback` step

Before final Build Week submission:

1. Open the authenticated Build Week session.
2. Run `/feedback`.
3. Include the production URL.
4. Summarize the six-case GPT-5.6 evaluation result.
5. State that AI is advisory and only explicit architect authorization creates authority.
6. Disclose the private-access requirement and declared Version 1 limitations.

Do not mark this step complete until the session itself confirms submission.
