import { RECOMMENDATION_SCHEMA_VERSION, SERVER_ENVIRONMENT } from "../../../lib/advisory.mjs";
import { database, ensureSchema } from "../../../lib/server-store";

export async function GET() {
  const db = database();
  let storage = "unavailable";
  if (db) {
    try {
      await ensureSchema(db);
      await db.prepare("SELECT 1 AS ready").first();
      storage = "ready";
    } catch {
      storage = "unavailable";
    }
  }
  const ready = storage === "ready";
  return Response.json({
    status: ready ? "ready" : "degraded",
    environment: {
      valid: SERVER_ENVIRONMENT.valid,
      gptConfigured: SERVER_ENVIRONMENT.gptConfigured,
      advisoryMode: SERVER_ENVIRONMENT.mode,
      schemaVersion: RECOMMENDATION_SCHEMA_VERSION,
    },
    storage,
    authorityTransitions: ready ? "authenticated-and-audited" : "disabled",
  }, {
    status: ready ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
