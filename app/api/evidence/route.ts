import { env } from "cloudflare:workers";
import { deriveGovernanceState, promotionBlockers } from "../../../lib/governance.mjs";

const seed = [
  { id: "EV-284", title: "Enterprise AI exception pattern", source: "Architecture council notes", owner: "Maya Chen", jurisdiction: "Enterprise Architecture", classification: "Observed pattern", authorityState: "Observation only", confidence: 86, citations: 7, summary: "Three teams are applying the same exception logic without a governed decision." },
  { id: "EV-281", title: "Regional retention interpretation", source: "Legal advisory · EMEA", owner: "Jon Bell", jurisdiction: "Data Governance", classification: "Expert interpretation", authorityState: "Observation only", confidence: 74, citations: 2, summary: "A regional interpretation may be crossing into enterprise policy." },
  { id: "EV-279", title: "Model access approval sequence", source: "Production operating guide", owner: "Priya Shah", jurisdiction: "AI Platform", classification: "Operational evidence", authorityState: "Governed decision", confidence: 92, citations: 4, summary: "The approved sequence is owned, scoped, and linked to its evidence." },
  { id: "EV-276", title: "Third-party model risk threshold", source: "Risk working session", owner: null, jurisdiction: "Model Risk", classification: "Candidate decision", authorityState: "Observation only", confidence: 61, citations: 1, summary: "A proposed threshold has no accountable owner." },
  { id: "EV-272", title: "PII redaction verification", source: "Control test results", owner: "Owen Wright", jurisdiction: "Security Assurance", classification: "Validated control", authorityState: "Observation only", confidence: 95, citations: 2, summary: "Control tests support a repeatable verification step." },
];

type D1Like = {
  prepare(query: string): {
    bind(...values: unknown[]): ReturnType<D1Like["prepare"]>;
    run(): Promise<unknown>;
    all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
    first<T = Record<string, unknown>>(): Promise<T | null>;
  };
  batch(statements: unknown[]): Promise<unknown>;
};

function db(): D1Like | null {
  return ((env as unknown as { DB?: D1Like }).DB ?? null);
}

async function ensureSchema(database: D1Like) {
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS evidence (
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
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS governance_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      evidence_id TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      detail TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    database.prepare("CREATE INDEX IF NOT EXISTS governance_events_evidence_id_idx ON governance_events (evidence_id)"),
  ]);
}

async function seedIfEmpty(database: D1Like) {
  await ensureSchema(database);
  const row = await database.prepare("SELECT COUNT(*) AS count FROM evidence").first<{ count: number }>();
  if ((row?.count ?? 0) > 0) return;
  await database.batch(seed.map((item) => database.prepare(
    `INSERT INTO evidence
      (id, title, source, owner, jurisdiction, classification, status, authority_state, confidence, citations, summary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(item.id, item.title, item.source, item.owner, item.jurisdiction, item.classification, deriveGovernanceState(item), item.authorityState, item.confidence, item.citations, item.summary)));
}

function normalize(row: Record<string, unknown>) {
  return {
    id: row.id, title: row.title, source: row.source, owner: row.owner,
    jurisdiction: row.jurisdiction, classification: row.classification,
    status: row.status, authorityState: row.authority_state,
    confidence: row.confidence, citations: row.citations, summary: row.summary,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export async function GET() {
  const database = db();
  if (!database) return Response.json({ evidence: seed.map((item) => ({ ...item, status: deriveGovernanceState(item) })), persistence: false });
  try {
    await seedIfEmpty(database);
    const rows = await database.prepare("SELECT * FROM evidence ORDER BY updated_at DESC, id DESC").all();
    return Response.json({ evidence: rows.results.map(normalize), persistence: true });
  } catch (error) {
    return Response.json({
      evidence: seed.map((item) => ({ ...item, status: deriveGovernanceState(item) })),
      persistence: false,
      warning: error instanceof Error ? error.message : "Evidence store unavailable",
    });
  }
}

export async function POST(request: Request) {
  const payload = await request.json() as Record<string, unknown>;
  let database = db();
  if (database) {
    try {
      await ensureSchema(database);
    } catch {
      database = null;
    }
  }
  const actor = request.headers.get("oai-authenticated-user-email") ?? "Build Week reviewer";

  if (payload.action === "create") {
    const title = String(payload.title ?? "").trim();
    const source = String(payload.source ?? "").trim();
    if (title.length < 6 || source.length < 3) return Response.json({ error: "A specific title and source are required." }, { status: 400 });
    const record = {
      id: `EV-${Math.floor(300 + Math.random() * 699)}`, title, source,
      owner: payload.owner ? String(payload.owner) : null,
      jurisdiction: payload.jurisdiction ? String(payload.jurisdiction) : null,
      classification: String(payload.classification ?? "Unclassified"),
      authorityState: "Observation only", confidence: 50, citations: 0,
      summary: "New evidence awaiting architectural review.",
    };
    const status = deriveGovernanceState(record);
    if (!database) return Response.json({ evidence: { ...record, status }, persistence: false }, { status: 201 });
    await database.prepare(`INSERT INTO evidence
      (id, title, source, owner, jurisdiction, classification, status, authority_state, confidence, citations, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(record.id, record.title, record.source, record.owner, record.jurisdiction, record.classification, status, record.authorityState, record.confidence, record.citations, record.summary).run();
    await database.prepare("INSERT INTO governance_events (evidence_id, action, actor, detail) VALUES (?, ?, ?, ?)")
      .bind(record.id, "evidence.created", actor, "Observation entered the review queue; no authority granted.").run();
    return Response.json({ evidence: { ...record, status }, persistence: true }, { status: 201 });
  }

  const id = String(payload.id ?? "");
  if (!id) return Response.json({ error: "Evidence id is required." }, { status: 400 });
  const current = database
    ? normalize((await database.prepare("SELECT * FROM evidence WHERE id = ?").bind(id).first()) ?? {})
    : seed.find((item) => item.id === id);
  if (!current?.id) return Response.json({ error: "Evidence not found." }, { status: 404 });

  const updated = { ...current };
  let detail = "";
  if (payload.action === "classify") {
    updated.classification = String(payload.classification ?? "Observed pattern");
    updated.confidence = Math.max(Number(updated.confidence), 70);
    detail = `Classified as ${updated.classification}; authority remains observational.`;
  } else if (payload.action === "assign") {
    updated.owner = String(payload.owner ?? "").trim() || null;
    updated.jurisdiction = String(payload.jurisdiction ?? "").trim() || null;
    detail = `Ownership assigned to ${updated.owner}; jurisdiction set to ${updated.jurisdiction}.`;
  } else if (payload.action === "promote") {
    const blockers = promotionBlockers(updated);
    if (blockers.length) return Response.json({ error: `Promotion blocked: resolve ${blockers.join(", ")}.` }, { status: 409 });
    updated.authorityState = "Governed decision";
    detail = "Architect promoted the evidence to a governed decision after prerequisites passed.";
  } else {
    return Response.json({ error: "Unsupported governance action." }, { status: 400 });
  }
  updated.status = deriveGovernanceState(updated);
  if (!database) return Response.json({ evidence: updated, persistence: false });
  await database.prepare(`UPDATE evidence SET owner = ?, jurisdiction = ?, classification = ?, status = ?,
    authority_state = ?, confidence = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(updated.owner, updated.jurisdiction, updated.classification, updated.status, updated.authorityState, updated.confidence, id).run();
  await database.prepare("INSERT INTO governance_events (evidence_id, action, actor, detail) VALUES (?, ?, ?, ?)")
    .bind(id, `evidence.${payload.action}`, actor, detail).run();
  return Response.json({ evidence: updated, persistence: true });
}
