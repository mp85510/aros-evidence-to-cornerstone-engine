import { env } from "cloudflare:workers";

export type D1Result = {
  meta?: { changes?: number };
};

export type D1Like = {
  prepare(query: string): {
    bind(...values: unknown[]): ReturnType<D1Like["prepare"]>;
    run(): Promise<D1Result>;
    all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
    first<T = Record<string, unknown>>(): Promise<T | null>;
  };
  batch(statements: unknown[]): Promise<D1Result[]>;
};

export function database(): D1Like | null {
  return ((env as unknown as { DB?: D1Like }).DB ?? null);
}

async function ensureColumns(
  db: D1Like,
  table: "evidence" | "governance_events",
  definitions: ReadonlyArray<{ name: string; sql: string }>,
) {
  let columns = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  let existing = new Set(columns.results.map((column) => column.name));
  for (const definition of definitions) {
    if (existing.has(definition.name)) continue;
    try {
      await db.prepare(`ALTER TABLE ${table} ADD ${definition.sql}`).run();
    } catch {
      // A second isolate may have completed the same idempotent upgrade first.
      columns = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
      existing = new Set(columns.results.map((column) => column.name));
      if (!existing.has(definition.name)) throw new Error("storage schema upgrade failed");
    }
    existing.add(definition.name);
  }
}

export async function ensureSchema(db: D1Like) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      owner TEXT,
      jurisdiction TEXT,
      classification TEXT NOT NULL DEFAULT 'Unclassified',
      status TEXT NOT NULL DEFAULT 'Review',
      authority_state TEXT NOT NULL DEFAULT 'Observation only',
      confidence INTEGER NOT NULL DEFAULT 50,
      citations INTEGER NOT NULL DEFAULT 0,
      summary TEXT NOT NULL DEFAULT '',
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS governance_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      evidence_id TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      detail TEXT NOT NULL,
      prior_state TEXT NOT NULL DEFAULT '{}',
      resulting_state TEXT NOT NULL DEFAULT '{}',
      reason TEXT NOT NULL DEFAULT '',
      source_record TEXT NOT NULL DEFAULT '{}',
      model_advisory_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY NOT NULL,
      evidence_id TEXT,
      actor TEXT NOT NULL,
      engine TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      latency_ms INTEGER NOT NULL,
      fallback_state TEXT NOT NULL,
      request_result TEXT NOT NULL,
      response_id TEXT,
      recommendation_json TEXT NOT NULL,
      source_record TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS rate_limit_windows (
      identity_key TEXT NOT NULL,
      scope TEXT NOT NULL,
      window_start INTEGER NOT NULL,
      request_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (identity_key, scope, window_start)
    )`),
  ]);
  await ensureColumns(db, "evidence", [
    { name: "version", sql: "version INTEGER NOT NULL DEFAULT 1" },
  ]);
  await ensureColumns(db, "governance_events", [
    { name: "prior_state", sql: "prior_state TEXT NOT NULL DEFAULT '{}'" },
    { name: "resulting_state", sql: "resulting_state TEXT NOT NULL DEFAULT '{}'" },
    { name: "reason", sql: "reason TEXT NOT NULL DEFAULT ''" },
    { name: "source_record", sql: "source_record TEXT NOT NULL DEFAULT '{}'" },
    { name: "model_advisory_id", sql: "model_advisory_id TEXT" },
  ]);
  await db.batch([
    db.prepare("CREATE INDEX IF NOT EXISTS governance_events_evidence_id_idx ON governance_events (evidence_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS recommendations_evidence_id_idx ON recommendations (evidence_id)"),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS governance_events_no_update
      BEFORE UPDATE ON governance_events
      BEGIN SELECT RAISE(ABORT, 'governance events are immutable'); END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS governance_events_no_delete
      BEFORE DELETE ON governance_events
      BEGIN SELECT RAISE(ABORT, 'governance events are immutable'); END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS recommendations_no_update
      BEFORE UPDATE ON recommendations
      BEGIN SELECT RAISE(ABORT, 'recommendations are immutable'); END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS recommendations_no_delete
      BEFORE DELETE ON recommendations
      BEGIN SELECT RAISE(ABORT, 'recommendations are immutable'); END`),
  ]);
}

export function normalizeEvidence(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    owner: row.owner,
    jurisdiction: row.jurisdiction,
    classification: row.classification,
    status: row.status,
    authorityState: row.authority_state,
    confidence: Number(row.confidence),
    citations: Number(row.citations),
    summary: row.summary,
    version: Number(row.version ?? 1),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function enforceRateLimit(
  db: D1Like,
  identityKey: string,
  scope: string,
  limit: number,
  windowSeconds = 60,
) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  await db.prepare(`INSERT INTO rate_limit_windows
      (identity_key, scope, window_start, request_count)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(identity_key, scope, window_start)
    DO UPDATE SET request_count = request_count + 1`)
    .bind(identityKey, scope, windowStart)
    .run();
  const row = await db.prepare(`SELECT request_count FROM rate_limit_windows
    WHERE identity_key = ? AND scope = ? AND window_start = ?`)
    .bind(identityKey, scope, windowStart)
    .first<{ request_count: number }>();
  return {
    allowed: Number(row?.request_count ?? limit + 1) <= limit,
    limit,
    remaining: Math.max(0, limit - Number(row?.request_count ?? limit)),
    resetAt: windowStart + windowSeconds,
  };
}

export function publicError(status: number, code: string, error: string, extra: Record<string, unknown> = {}) {
  return Response.json({ error, code, ...extra }, {
    status,
    headers: { "cache-control": "no-store" },
  });
}
