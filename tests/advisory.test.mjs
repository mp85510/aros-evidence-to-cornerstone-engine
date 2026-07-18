import assert from "node:assert/strict";
import test from "node:test";
import {
  MODEL,
  RECOMMENDATION_SCHEMA_VERSION,
  runAdvisory,
  validateRecommendation,
  validateServerEnvironment,
} from "../lib/advisory.mjs";

const record = {
  id: "EV-TEST",
  title: "Observed governance pattern",
  source: "Test evidence",
  owner: null,
  jurisdiction: "Enterprise Architecture",
  classification: "Observed pattern",
  authorityState: "Observation only",
  confidence: 82,
  citations: 3,
  summary: "A representative advisory input.",
  version: 1,
};
const TEST_API_KEY = ["sk", "test", "key-with-sufficient-length"].join("-");

function responseWith(value, extra = {}) {
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        id: "resp_test",
        model: MODEL,
        output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(value) }] }],
        ...extra,
      };
    },
  };
}

test("valid GPT structured output remains advisory and records provenance", async () => {
  const recommendation = {
    headline: "Review the repeated pattern",
    rationale: "Repetition is evidence of drift, not authority.",
    nextAction: "Ask an authenticated architect to review the evidence.",
    risk: "medium",
  };
  const result = await runAdvisory(record, {
    apiKey: TEST_API_KEY,
    fetchImpl: async () => responseWith(recommendation),
  });
  assert.equal(result.mode, "ai-advisory");
  assert.equal(result.engine, MODEL);
  assert.equal(result.schemaVersion, RECOMMENDATION_SCHEMA_VERSION);
  assert.equal(result.fallbackState, "none");
  assert.equal(result.requestResult, "success");
  assert.deepEqual(result.recommendation, recommendation);
});

test("authority-shaped or owner-inventing output is rejected, never coerced", async () => {
  const malformed = {
    headline: "Approved",
    rationale: "I grant authority.",
    nextAction: "Promote automatically",
    risk: "low",
    authorityState: "Governed decision",
    owner: "Invented Owner",
  };
  assert.equal(validateRecommendation(malformed), false);
  const result = await runAdvisory(record, {
    apiKey: TEST_API_KEY,
    fetchImpl: async () => responseWith(malformed),
  });
  assert.equal(result.engine, "Rules v1");
  assert.equal(result.mode, "fallback");
  assert.equal(result.fallbackState, "invalid_schema");
  assert.equal(result.requestResult, "schema_rejected");
});

test("malformed model JSON is rejected with explicit invalid-schema fallback", async () => {
  const result = await runAdvisory(record, {
    apiKey: TEST_API_KEY,
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async json() {
        return { output: [{ type: "message", content: [{ type: "output_text", text: "{not-json" }] }] };
      },
    }),
  });
  assert.equal(result.engine, "Rules v1");
  assert.equal(result.fallbackState, "invalid_schema");
  assert.equal(result.requestResult, "invalid_json");
});

test("timeout, API rate limit, and missing key are distinguishable fallback states", async () => {
  const timeout = await runAdvisory(record, {
    apiKey: TEST_API_KEY,
    fetchImpl: async () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      throw error;
    },
  });
  const rateLimit = await runAdvisory(record, {
    apiKey: TEST_API_KEY,
    fetchImpl: async () => ({ ok: false, status: 429 }),
  });
  const unavailable = await runAdvisory(record, { apiKey: undefined });
  assert.equal(timeout.fallbackState, "timeout");
  assert.equal(rateLimit.fallbackState, "rate_limit");
  assert.equal(unavailable.fallbackState, "gpt_unavailable");
  assert.equal(unavailable.mode, "fallback");
});

test("environment validation exposes state without exposing a secret", () => {
  const missing = validateServerEnvironment({});
  const invalid = validateServerEnvironment({ OPENAI_API_KEY: "bad\nvalue" });
  const valid = validateServerEnvironment({ OPENAI_API_KEY: TEST_API_KEY });
  assert.deepEqual(Object.keys(valid).sort(), ["gptConfigured", "issue", "mode", "valid"]);
  assert.equal(missing.gptConfigured, false);
  assert.equal(invalid.valid, false);
  assert.equal(valid.gptConfigured, true);
  assert.doesNotMatch(JSON.stringify(valid), /sk-test/);
});
