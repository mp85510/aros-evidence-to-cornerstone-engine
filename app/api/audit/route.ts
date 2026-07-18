import { database, ensureSchema, publicError } from "../../../lib/server-store";

const ID_PATTERN = /^EV-[A-Z0-9-]{3,32}$/;

export async function GET(request: Request) {
  const evidenceId = new URL(request.url).searchParams.get("evidenceId");
  if (!evidenceId || !ID_PATTERN.test(evidenceId)) {
    return publicError(400, "invalid_evidence_id", "A valid evidenceId is required.");
  }
  const db = database();
  if (!db) return publicError(503, "storage_failure", "Durable audit storage is unavailable.");
  try {
    await ensureSchema(db);
    const [events, recommendations] = await Promise.all([
      db.prepare(`SELECT id, evidence_id, action, actor, prior_state, resulting_state,
        reason, source_record, model_advisory_id, created_at
        FROM governance_events WHERE evidence_id = ? ORDER BY id DESC LIMIT 100`)
        .bind(evidenceId)
        .all(),
      db.prepare(`SELECT id, evidence_id, actor, engine, schema_version, latency_ms,
        fallback_state, request_result, response_id, recommendation_json, source_record, created_at
        FROM recommendations WHERE evidence_id = ? ORDER BY created_at DESC, id DESC LIMIT 100`)
        .bind(evidenceId)
        .all(),
    ]);
    return Response.json({
      evidenceId,
      events: events.results,
      recommendations: recommendations.results,
      persistence: true,
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    return publicError(503, "storage_failure", "Durable audit storage is unavailable.");
  }
}
