import assert from "node:assert/strict";
import test from "node:test";
import {
  authenticatedActor,
  authorizeEvidenceTransition,
  readJsonObject,
  sanitizeAdvisoryRecord,
  sanitizeCreatePayload,
} from "../lib/server-contracts.mjs";

const current = {
  id: "EV-READY",
  title: "Ready evidence",
  source: "Verified source",
  owner: "Maya Chen",
  jurisdiction: "Enterprise Architecture",
  classification: "Observed pattern",
  status: "Classified",
  authorityState: "Observation only",
  confidence: 86,
  citations: 2,
  summary: "Ready for explicit human review.",
  version: 4,
};

test("mutations require an authenticated human and reject cross-site actions", () => {
  const anonymous = authenticatedActor(new Request("https://app.local/api/evidence", { method: "POST" }), { NODE_ENV: "production" });
  const crossSite = authenticatedActor(new Request("https://app.local/api/evidence", {
    method: "POST",
    headers: {
      "oai-authenticated-user-email": "architect@example.com",
      "sec-fetch-site": "cross-site",
    },
  }), { NODE_ENV: "production" });
  const authenticated = authenticatedActor(new Request("https://app.local/api/evidence", {
    method: "POST",
    headers: { "oai-authenticated-user-email": "Architect@Example.com" },
  }), { NODE_ENV: "production" });
  assert.equal(anonymous.code, "unauthorized_action");
  assert.equal(crossSite.code, "cross_site_action");
  assert.deepEqual(authenticated, { ok: true, actor: "architect@example.com" });
});

test("client-side authority injection cannot bypass server promotion rules", () => {
  const blocked = { ...current, owner: null, confidence: 61 };
  const injected = authorizeEvidenceTransition(blocked, {
    action: "promote",
    id: blocked.id,
    expectedVersion: blocked.version,
    authorityState: "Governed decision",
  });
  const ordinary = authorizeEvidenceTransition(blocked, {
    action: "promote",
    id: blocked.id,
    expectedVersion: blocked.version,
  });
  assert.equal(injected.code, "forbidden_field");
  assert.equal(ordinary.code, "blocked_transition");
  assert.equal(blocked.authorityState, "Observation only");
});

test("promotion succeeds only as an explicit version-matched transition", () => {
  const stale = authorizeEvidenceTransition(current, {
    action: "promote",
    id: current.id,
    expectedVersion: 3,
  });
  const allowed = authorizeEvidenceTransition(current, {
    action: "promote",
    id: current.id,
    expectedVersion: 4,
  });
  assert.equal(stale.code, "stale_record_conflict");
  assert.equal(allowed.ok, true);
  assert.equal(allowed.updated.authorityState, "Governed decision");
  assert.equal(allowed.updated.version, 5);
});

test("classification never silently raises evidence confidence", () => {
  const lowConfidence = { ...current, classification: "Unclassified", confidence: 50 };
  const transition = authorizeEvidenceTransition(lowConfidence, {
    action: "classify",
    id: current.id,
    expectedVersion: 4,
    classification: "Observed pattern",
  });
  assert.equal(transition.ok, true);
  assert.equal(transition.updated.confidence, 50);
  assert.equal(transition.updated.authorityState, "Observation only");
});

test("intake rejects server-controlled authority fields and sanitizes control characters", () => {
  const forbidden = sanitizeCreatePayload({
    title: "Observed pattern",
    source: "Meeting notes",
    authorityState: "Governed decision",
  });
  const sanitized = sanitizeCreatePayload({
    title: "Observed\u0000 pattern",
    source: "Meeting\nnotes",
    classification: "Observed pattern",
  });
  assert.equal(forbidden.code, "forbidden_field");
  assert.equal(sanitized.ok, true);
  assert.equal(sanitized.value.title, "Observed pattern");
  assert.equal(sanitized.value.source, "Meeting notes");
});

test("conflicting or invalid authority state is rejected rather than coerced", () => {
  const result = sanitizeAdvisoryRecord({
    ...current,
    jurisdiction: "Folder: Enterprise Architecture",
    authorityState: "Automatically governed",
  });
  assert.equal(result.code, "invalid_authority_state");
});

test("request-size and JSON-object boundaries are enforced", async () => {
  const oversized = await readJsonObject(new Request("https://app.local", {
    method: "POST",
    headers: { "content-length": "9000" },
    body: "{}",
  }), 8000);
  const array = await readJsonObject(new Request("https://app.local", {
    method: "POST",
    body: "[]",
  }), 8000);
  assert.equal(oversized.status, 413);
  assert.equal(array.code, "invalid_json");
});
