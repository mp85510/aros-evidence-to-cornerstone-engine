import assert from "node:assert/strict";
import test from "node:test";
import {
  canPromote,
  deriveGovernanceState,
  deterministicRecommendation,
  promotionBlockers,
  pulse,
} from "../lib/governance.mjs";

const ready = {
  owner: "Maya Chen",
  jurisdiction: "Enterprise Architecture",
  classification: "Observed pattern",
  authorityState: "Observation only",
  confidence: 86,
  citations: 2,
};

test("repetition becomes drift risk, never authority", () => {
  const repeated = { ...ready, citations: 7 };
  assert.equal(deriveGovernanceState(repeated), "Drift risk");
  assert.notEqual(repeated.authorityState, "Governed decision");
  assert.equal(deterministicRecommendation(repeated).risk, "high");
});

test("promotion requires every governance prerequisite", () => {
  assert.equal(canPromote(ready), true);
  assert.deepEqual(promotionBlockers({ ...ready, owner: null }), ["accountable owner"]);
  assert.deepEqual(promotionBlockers({ ...ready, confidence: 61 }), ["evidence confidence of at least 70%"]);
});

test("explicit architect action is the only governed state", () => {
  assert.equal(deriveGovernanceState(ready), "Classified");
  assert.equal(deriveGovernanceState({ ...ready, authorityState: "Governed decision" }), "Governed");
});

test("daily pulse derives counts from records", () => {
  const result = pulse([
    ready,
    { ...ready, citations: 7 },
    { ...ready, owner: null },
    { ...ready, authorityState: "Governed decision" },
  ]);
  assert.deepEqual(result, { total: 4, review: 0, drift: 1, unowned: 1, governed: 1 });
});
