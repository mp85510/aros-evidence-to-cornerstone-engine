# AROS final submission package

Closeout date: 2026-07-18

Production: [https://aros-governance-workbench.mp85510.chatgpt.site](https://aros-governance-workbench.mp85510.chatgpt.site)

Production version: Sites version 5

Validated production commit: `3bc853c89817bfca8e0f943bd1de89c88fe204b3`

Current Codex task ID: `019f76e9-c19b-7973-9f82-bd096b84d306`

## Submission status

The application, deployment, automated validation, live GPT-5.6 evaluation, documentation, demo narrative, and Devpost copy are complete.

The submission is not yet administratively complete because three actions require the authenticated owner:

1. Run `/feedback` in this Build Week task and retain the resulting receipt.
2. Grant the required judge accounts access to the private Sites deployment.
3. Configure or provide the repository URL required by the submission and grant the judges access.

## `/feedback` workflow

- Requested command: `/feedback`
- Execution status: **Pending authenticated human action**
- Receipt/session ID: **Not issued**
- Traceability task ID: `019f76e9-c19b-7973-9f82-bd096b84d306`
- Reason: the current agent surface has no callable Build Week feedback tool and cannot type a slash command into the Codex task composer. Tool discovery found no feedback submission endpoint. No receipt has been invented.

Required owner action:

1. In this exact authenticated Build Week task, enter `/feedback`.
2. Complete the prompts without opening a different task.
3. Copy the confirmation receipt or session ID into this section and the Devpost submission record.
4. Confirm the receipt visibly before marking feedback complete.

Suggested feedback summary:

> AROS is a production-deployed governance workbench that keeps evidence, ownership, jurisdiction, and authority distinct. GPT-5.6 Sol provides strict-schema architectural advice through a server-only Responses API path, while authenticated human action and deterministic server prerequisites exclusively control authority. Codex evolved the inherited prototype, repaired persistence and security boundaries, generated migrations and adversarial tests, deployed the private Sites application, and recorded nine passing live-model evaluations.

## Three-minute demo script

### 0:00–0:15 — Frame the product

Open the private production URL.

Say:

> AROS is an Evidence-to-Cornerstone Engine. It solves one governance failure: observations and repeated practices quietly becoming assumed authority. In AROS, AI advises, but architects authorize.

Point to:

- “Turn evidence into accountable decisions.”
- “AI advises. Architects authorize.”
- Daily Pulse.

### 0:15–0:40 — Intake an observation

Click **+ Add evidence**.

Enter:

- Evidence title: `Regional model exception repeated in approvals`
- Source or context: `Architecture council review — July`
- Proposed owner: `Unassigned`
- Classification: `Unclassified`
- Proposed jurisdiction: `Not established`

Click **Add to review queue**.

Say:

> Intake creates an observation, not authority. The server controls authority, confidence, citations, status, and version.

Confirm the new item is selected and shows `Observation only`.

### 0:40–1:00 — Classify

Click **Confirm classification**.

Say:

> Classification describes the evidence. It does not silently increase confidence or grant authority.

Confirm the record becomes `Observed pattern` and remains observation-only.

### 1:00–1:20 — Assign ownership and jurisdiction

Click **Confirm ownership**.

The production workflow assigns the default accountable owner and jurisdiction when the record is unassigned:

- Owner: Maya Chen
- Jurisdiction: Enterprise Architecture

Say:

> Folders answer where something is. Ownership answers who is responsible, and jurisdiction defines where a decision belongs.

### 1:20–1:40 — Explain drift detection

In the queue, point to downstream-citation counts and select **Enterprise AI exception pattern**.

Say:

> AROS treats three or more downstream citations on an observation-only record as authority drift. Repetition is a signal to govern; it is never jurisdiction by itself. This seven-citation record is now governed, showing the resolved end state of that consolidation point.

Important pre-demo note: the current production database has no active observation-only drift record because the original seven-citation example was explicitly promoted during validation. Do not claim that the current row is still a drift alert. If the live red `Drift risk` state is required, create a fresh approved demo fixture before judging; do not demote an existing governed decision merely for presentation.

### 1:40–2:05 — Request GPT-5.6 advice

Return to the newly created record and click **Refresh analysis**.

Wait for the label to show `gpt-5.6-sol · AI advisory`.

Say:

> This request goes from the browser to the AROS server, then to the OpenAI Responses API using GPT-5.6 Sol, low reasoning, store false, and a strict four-field schema. The key never enters the browser. The recommendation is stored as an immutable advisory record, but it has no evidence mutation path.

Read the headline and next action.

### 2:05–2:25 — Show blocked promotion

Point to **Promotion readiness**.

The new record remains blocked by the evidence-confidence prerequisite. The **Promote to governed decision** button is disabled.

Say:

> Ownership and classification are not enough. The canonical server record must satisfy every prerequisite. Client authority fields, stale versions, and identity-less actions are rejected with explicit 4xx responses.

### 2:25–2:45 — Explicit human authorization

Select **PII redaction verification** (`EV-272`). It is the current production-ready candidate with:

- Validated control classification
- Owen Wright as owner
- Security Assurance jurisdiction
- 95% confidence
- Observation-only authority

Optionally click **Refresh analysis**, then click **Promote to governed decision**.

Say:

> GPT did not perform this transition. I am taking an explicit authenticated architect action after the server has rechecked the prerequisites.

Confirm the item becomes `Governed`.

### 2:45–3:00 — Reload persistence and close

Reload the page.

Re-select `EV-272` and confirm it remains `Governed`.

Say:

> The decision, version, actor-attributed transition, prior and resulting states, reason, and any advisory reference persist in D1. AROS strengthens the next hundred decisions by making authority explicit, attributable, and earned.

## Devpost-ready copy

### Project title

AROS — Evidence-to-Cornerstone Engine

### One-sentence pitch

AROS is a governance workbench that turns scattered organizational evidence into explicit, accountable decisions without allowing observation, repetition, or AI output to become authority.

### Problem

Organizations accumulate operational notes, exceptions, control results, meeting decisions, and repeated practices across folders and production systems. Over time, repetition is mistaken for approval, file location is mistaken for jurisdiction, and an observed pattern quietly becomes an assumed rule. Teams can see what is happening but cannot reliably answer who owns it, where authority belongs, what evidence supports it, or who explicitly authorized the transition.

### Solution

AROS provides an evidence-to-authority lifecycle built around a simple contract: observation does not become authority. Users intake evidence, classify it, assign accountable ownership and jurisdiction, detect authority drift from repeated downstream use, receive a bounded architect recommendation, and promote only after deterministic prerequisites pass and an authenticated human explicitly authorizes the decision. Daily Pulse and consolidation signals keep attention on the evidence most likely to affect future decisions.

### Technical implementation

AROS is a Next-compatible React application built with vinext for Cloudflare Workers and deployed privately with OpenAI Sites. Cloudflare D1 stores evidence, record versions, promotion state, immutable governance events, recommendation provenance, and rate-limit windows.

The server validates and sanitizes intake, applies request-size limits, rejects cross-site and unauthenticated mutations, centralizes promotion prerequisites, and uses optimistic concurrency to reject stale writes. Every accepted evidence mutation writes an immutable governance event containing actor, action, timestamp, prior state, resulting state, reason, source record, and an optional advisory reference.

Production secrets are stored as masked server-side Sites environment values. Public errors are generic and governance responses use `cache-control: no-store`. Database triggers prevent changes to governance events and recommendations after creation.

### GPT-5.6 usage

The browser calls only the AROS `/api/recommendation` route. The server calls the OpenAI Responses API with `gpt-5.6-sol`, reasoning effort `low`, and `store: false`. Strict Structured Outputs constrain every recommendation to `headline`, `rationale`, `nextAction`, and `risk`, followed by explicit server validation.

The developer contract treats submitted evidence as untrusted content and forbids the model from granting authority, inventing an owner, selecting jurisdiction, or mutating evidence. Malformed or authority-shaped outputs are rejected rather than coerced. Rules v1 is a clearly labeled fallback for unavailable, timeout, invalid-schema, and rate-limit conditions.

Nine production live-model cases passed: the six required scenarios plus invented-owner, automatic-authority, and conflicting-jurisdiction attacks. Results were 9/9 valid schemas, zero invented owners, zero automatic authority grants, zero unexpected fallbacks, and 9/9 correct governance behavior.

### Codex usage

Codex evolved an inherited HTML/CSS/JavaScript prototype rather than replacing it. It reviewed the submission as a judge, ranked weaknesses by severity and judging leverage, and repaired the highest-impact boundaries first.

Codex implemented the D1 lifecycle, server-only GPT path, strict output contracts, authenticated promotion boundary, immutable audit model, schema migration, stale-write protection, sanitization, rate limiting, and explicit failure states. During runtime validation, Codex discovered that an existing D1 database retained the prototype schema; it repaired the upgrade path and re-ran persistence tests. Codex also created adversarial tests, scanned source and client bundles for secrets, ran browser smoke checks, deployed exact committed versions, executed the production GPT evaluation set, and produced the final evidence package.

### Impact

AROS helps architecture, security, risk, data governance, and platform teams stop undocumented practices from becoming de facto policy. It creates a reviewable path from evidence to ownership to jurisdiction to explicit authority. That improves future decisions by preserving why a decision exists, who authorized it, what evidence it inherited, and where it applies.

### Originality

Most AI governance tools focus on model policy, compliance checklists, or document search. AROS focuses on the organizational mechanism by which authority drifts: repetition, location, and convenience being mistaken for governance. GPT-5.6 is deliberately bounded to architectural synthesis while deterministic rules and authenticated human action control state. The product’s core innovation is not automated authority; it is making authority earned, attributable, and resistant to accidental inheritance.

### Limitations

- The judged deployment is private and requires explicit judge access plus Sign in with ChatGPT.
- Version 1 supports manual evidence intake rather than enterprise connectors.
- Fine-grained application roles beyond authenticated architect action are not implemented.
- Immutable history is available through the audit API but does not yet have a dedicated visible history screen.
- Rate limiting is a basic D1 fixed-window control.
- Token and cost telemetry are not claimed.
- Desktop is the primary judged workflow; tablet/mobile detail navigation is deferred.

## Judge-access checklist

Current verified state:

- [x] Production URL resolves.
- [x] Sites version 5 is deployed.
- [x] Deployment is private.
- [x] Sign in with ChatGPT gate is active for anonymous visitors.
- [x] Production health reports GPT configured, D1 ready, and authenticated/audited authority transitions.
- [x] The API key is a masked server-side secret.
- [ ] Judge accounts have been added. Current access policy contains only the owner and no groups.

Required access procedure:

1. Obtain the exact ChatGPT account email or approved workspace group for every judge.
2. Add those identities to the Sites access policy; do not make the application public merely to avoid access setup.
3. Confirm no unintended users or groups were added.
4. Ask each judge to open the production URL while signed into the granted ChatGPT account.
5. Verify that each judge reaches the AROS workbench rather than the sign-in or access-denied screen.
6. Verify that authenticated mutation actions succeed and identity-less requests remain rejected.
7. Keep an owner account signed in and ready as the demo fallback.
8. Record the final access-policy revision and the successful judge-access check in the submission notes.

## Repository and documentation verification

Verified:

- [x] Local Git repository is readable.
- [x] Working tree was clean before this submission document was added.
- [x] Validated production commit exists: `3bc853c89817bfca8e0f943bd1de89c88fe204b3`.
- [x] The exact production source was pushed to the private Sites source repository using a short-lived credential.
- [x] `README.md` exists and documents the product, architecture, security, verification, deployment, and submission path.
- [x] `docs/EVALUATION.md` records every live input, expected behavior, structured output, result, fallback state, latency, repair, advisory ID, and response ID.
- [x] `docs/JUDGE_AUDIT.md` records ranked weaknesses and dispositions.
- [x] `docs/COMPETITION_READINESS.md` records GPT, Codex, security, reliability, demo, and limitation evidence.
- [x] `SERVER_SIDE_READINESS.md` records the hardened server closeout.
- [ ] A persistent Git remote is configured. `git remote -v` currently returns no remote.
- [ ] A Devpost-accessible repository URL and judge permissions have been confirmed.

Required repository action:

1. Create or select the final submission repository.
2. Configure its persistent Git remote.
3. Push the validated source and this submission document.
4. Set public/private visibility according to competition requirements.
5. If private, grant the judge identities access.
6. Open the repository URL in a clean browser session and verify `README.md` plus all evidence documents are readable.
7. Add the verified repository URL to Devpost.

## Production-data preflight

The production database currently contains a governed record titled `strawberry` (`EV-751`) and no active observation-only record above the three-citation drift threshold.

Before the judged demo:

- [ ] Confirm whether `EV-751` is intentional. If it is test data, remove it only through an approved auditable data-administration path; do not silently delete governance history.
- [ ] Decide whether the resolved seven-citation `Enterprise AI exception pattern` is sufficient for the drift narrative.
- [ ] If judges must see the active red `Drift risk` state, add a fresh, truthful, observation-only demo fixture with at least three citations through an approved data path. Do not demote an existing governed decision to manufacture a demo state.
- [ ] Preserve `EV-272` as the ready candidate for the explicit-authorization and reload-persistence portion of the demo until judging.

## Final human actions

- [ ] Run `/feedback` in task `019f76e9-c19b-7973-9f82-bd096b84d306`.
- [ ] Record the `/feedback` receipt or session ID.
- [ ] Grant and verify judge access to the private Sites deployment.
- [ ] Configure and verify the persistent repository URL.
- [ ] Resolve the production-data preflight items without erasing audit history.
- [ ] Paste the Devpost copy and verified URLs into the submission.
- [ ] Perform one timed three-minute dry run using the production account.
- [ ] Submit only after the feedback receipt, judge access, repository access, and final URL checks are complete.
