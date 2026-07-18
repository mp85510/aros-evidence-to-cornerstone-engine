import {
  RECOMMENDATION_SCHEMA_VERSION,
  runAdvisory,
  SERVER_ENVIRONMENT,
} from "../../../lib/advisory.mjs";
import { deterministicRecommendation } from "../../../lib/governance.mjs";
import {
  advisoryActor,
  rateLimitIdentity,
  readJsonObject,
  sanitizeAdvisoryRecord,
} from "../../../lib/server-contracts.mjs";
import {
  database,
  enforceRateLimit,
  ensureSchema,
  publicError,
} from "../../../lib/server-store";

const MAX_ADVISORY_BYTES = 8_000;

function storageFallback(record: Record<string, unknown>) {
  return {
    recommendation: deterministicRecommendation(record),
    engine: "Rules v1",
    mode: "fallback",
    schemaVersion: RECOMMENDATION_SCHEMA_VERSION,
    latencyMs: 0,
    fallbackState: "storage_failure",
    requestResult: "not_recorded",
    responseId: null,
    advisoryId: null,
    note: "GPT advisory was not run because its audit record could not be stored. Rules v1 was applied.",
  };
}

export async function POST(request: Request) {
  const parsed = await readJsonObject(request, MAX_ADVISORY_BYTES);
  if (!parsed.ok) return publicError(parsed.status, parsed.code, parsed.error);

  const sanitized = sanitizeAdvisoryRecord(parsed.value);
  if (!sanitized.ok) return publicError(sanitized.status, sanitized.code, sanitized.error);
  const record = sanitized.value;

  const db = database();
  if (!db) {
    return Response.json(storageFallback(record), {
      status: 503,
      headers: { "cache-control": "no-store" },
    });
  }
  try {
    await ensureSchema(db);
  } catch {
    return Response.json(storageFallback(record), {
      status: 503,
      headers: { "cache-control": "no-store" },
    });
  }

  const rate = await enforceRateLimit(db, rateLimitIdentity(request), "architect-advisory", 20);
  const result = rate.allowed
    ? await runAdvisory(record, {
      apiKey: SERVER_ENVIRONMENT.gptConfigured ? process.env.OPENAI_API_KEY : undefined,
      timeoutMs: 15_000,
    })
    : {
      recommendation: deterministicRecommendation(record),
      engine: "Rules v1",
      mode: "fallback",
      schemaVersion: RECOMMENDATION_SCHEMA_VERSION,
      latencyMs: 0,
      fallbackState: "rate_limit",
      requestResult: "application_rate_limited",
      responseId: null,
    };

  const advisoryId = `ADV-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
  try {
    await db.prepare(`INSERT INTO recommendations
      (id, evidence_id, actor, engine, schema_version, latency_ms, fallback_state,
       request_result, response_id, recommendation_json, source_record)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        advisoryId,
        record.id,
        advisoryActor(request),
        result.engine,
        result.schemaVersion,
        result.latencyMs,
        result.fallbackState,
        result.requestResult,
        result.responseId,
        JSON.stringify(result.recommendation),
        JSON.stringify(record),
      )
      .run();
  } catch {
    return Response.json(storageFallback(record), {
      status: 503,
      headers: { "cache-control": "no-store" },
    });
  }

  return Response.json({
    ...result,
    advisoryId,
    note: result.mode === "ai-advisory"
      ? "AI output is advisory only and cannot mutate governance state."
      : `GPT advisory was not used (${result.fallbackState}); Rules v1 was applied.`,
  }, {
    status: rate.allowed ? 200 : 429,
    headers: {
      "cache-control": "no-store",
      "x-rate-limit-limit": String(rate.limit),
      "x-rate-limit-remaining": String(rate.remaining),
      "x-rate-limit-reset": String(rate.resetAt),
    },
  });
}
