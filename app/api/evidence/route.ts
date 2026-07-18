import { deriveGovernanceState } from "../../../lib/governance.mjs";
import {
  authenticatedActor,
  authorizeEvidenceTransition,
  evidenceSnapshot,
  rateLimitIdentity,
  readJsonObject,
  sanitizeCreatePayload,
} from "../../../lib/server-contracts.mjs";
import {
  database,
  enforceRateLimit,
  ensureSchema,
  normalizeEvidence,
  publicError,
} from "../../../lib/server-store";

const MAX_MUTATION_BYTES = 12_000;

const seed = [
  { id: "EV-284", title: "Enterprise AI exception pattern", source: "Architecture council notes", owner: "Maya Chen", jurisdiction: "Enterprise Architecture", classification: "Observed pattern", authorityState: "Observation only", confidence: 86, citations: 7, summary: "Three teams are applying the same exception logic without a governed decision.", version: 1 },
  { id: "EV-281", title: "Regional retention interpretation", source: "Legal advisory · EMEA", owner: "Jon Bell", jurisdiction: "Data Governance", classification: "Expert interpretation", authorityState: "Observation only", confidence: 74, citations: 2, summary: "A regional interpretation may be crossing into enterprise policy.", version: 1 },
  { id: "EV-279", title: "Model access approval sequence", source: "Production operating guide", owner: "Priya Shah", jurisdiction: "AI Platform", classification: "Operational evidence", authorityState: "Governed decision", confidence: 92, citations: 4, summary: "The approved sequence is owned, scoped, and linked to its evidence.", version: 1 },
  { id: "EV-276", title: "Third-party model risk threshold", source: "Risk working session", owner: null, jurisdiction: "Model Risk", classification: "Candidate decision", authorityState: "Observation only", confidence: 61, citations: 1, summary: "A proposed threshold has no accountable owner.", version: 1 },
  { id: "EV-272", title: "PII redaction verification", source: "Control test results", owner: "Owen Wright", jurisdiction: "Security Assurance", classification: "Validated control", authorityState: "Observation only", confidence: 95, citations: 2, summary: "Control tests support a repeatable verification step.", version: 1 },
];

function withStatus(record: Record<string, unknown>) {
  return { ...record, status: deriveGovernanceState(record) };
}

async function seedIfEmpty(db: NonNullable<ReturnType<typeof database>>) {
  await ensureSchema(db);
  const row = await db.prepare("SELECT COUNT(*) AS count FROM evidence").first<{ count: number }>();
  if ((row?.count ?? 0) > 0) return;
  const statements = [];
  for (const item of seed) {
    const record = withStatus(item);
    statements.push(
      db.prepare(`INSERT INTO evidence
        (id, title, source, owner, jurisdiction, classification, status, authority_state, confidence, citations, summary, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(record.id, record.title, record.source, record.owner, record.jurisdiction, record.classification, record.status, record.authorityState, record.confidence, record.citations, record.summary, record.version),
      db.prepare(`INSERT INTO governance_events
        (evidence_id, action, actor, detail, prior_state, resulting_state, reason, source_record, model_advisory_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(
          record.id,
          "evidence.seeded",
          "system",
          "Initial governed dataset created.",
          "{}",
          JSON.stringify(evidenceSnapshot(record)),
          "System initialized the Version 1 evidence dataset.",
          JSON.stringify(evidenceSnapshot(record)),
          null,
        ),
    );
  }
  await db.batch(statements);
}

export async function GET() {
  const db = database();
  if (!db) {
    return Response.json({
      evidence: seed.map(withStatus),
      persistence: false,
      state: "storage_failure",
      warning: "Durable evidence storage is unavailable; this response is read-only.",
    }, { headers: { "cache-control": "no-store" } });
  }
  try {
    await seedIfEmpty(db);
    const rows = await db.prepare("SELECT * FROM evidence ORDER BY updated_at DESC, id DESC").all();
    return Response.json({
      evidence: rows.results.map(normalizeEvidence),
      persistence: true,
      state: "ready",
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({
      evidence: seed.map(withStatus),
      persistence: false,
      state: "storage_failure",
      warning: "Durable evidence storage is unavailable; this response is read-only.",
    }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}

export async function POST(request: Request) {
  const parsed = await readJsonObject(request, MAX_MUTATION_BYTES);
  if (!parsed.ok) return publicError(parsed.status, parsed.code, parsed.error);
  const payload = parsed.value;

  const authentication = authenticatedActor(request);
  if (!authentication.ok) {
    return publicError(authentication.status, authentication.code, authentication.error);
  }

  const db = database();
  if (!db) {
    return publicError(503, "storage_failure", "Durable storage is required for governance mutations.");
  }
  try {
    await ensureSchema(db);
  } catch {
    return publicError(503, "storage_failure", "Durable storage is unavailable. No mutation was applied.");
  }

  const rate = await enforceRateLimit(db, rateLimitIdentity(request), "evidence-mutation", 60);
  if (!rate.allowed) {
    return publicError(429, "rate_limit", "Governance mutation rate limit exceeded.", { resetAt: rate.resetAt });
  }

  if (payload.action === "create") {
    const sanitized = sanitizeCreatePayload(payload);
    if (!sanitized.ok) return publicError(sanitized.status, sanitized.code, sanitized.error);
    if (sanitized.value.classification === "Governed decision") {
      return publicError(400, "invalid_classification", "Intake cannot create a governed decision.");
    }
    const record = withStatus({
      id: `EV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      ...sanitized.value,
      authorityState: "Observation only",
      confidence: 50,
      citations: 0,
      summary: "New evidence awaiting architectural review.",
      version: 1,
    });
    const snapshot = JSON.stringify(evidenceSnapshot(record));
    try {
      await db.batch([
        db.prepare(`INSERT INTO evidence
          (id, title, source, owner, jurisdiction, classification, status, authority_state, confidence, citations, summary, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(record.id, record.title, record.source, record.owner, record.jurisdiction, record.classification, record.status, record.authorityState, record.confidence, record.citations, record.summary, record.version),
        db.prepare(`INSERT INTO governance_events
          (evidence_id, action, actor, detail, prior_state, resulting_state, reason, source_record, model_advisory_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(
            record.id,
            "evidence.created",
            authentication.actor,
            "Authenticated human added an observation.",
            "{}",
            snapshot,
            "Evidence entered the review queue; no authority was granted.",
            snapshot,
            null,
          ),
      ]);
    } catch {
      return publicError(503, "storage_failure", "Evidence could not be stored. No mutation was acknowledged.");
    }
    return Response.json({ evidence: record, persistence: true, state: "ready" }, {
      status: 201,
      headers: { "cache-control": "no-store" },
    });
  }

  const id = typeof payload.id === "string" ? payload.id : "";
  const currentRow = id
    ? await db.prepare("SELECT * FROM evidence WHERE id = ?").bind(id).first<Record<string, unknown>>()
    : null;
  if (!currentRow) return publicError(404, "evidence_not_found", "Evidence was not found.");
  const current = normalizeEvidence(currentRow);

  const transition = authorizeEvidenceTransition(current, payload);
  if (!transition.ok) {
    return publicError(transition.status, transition.code, transition.error, {
      ...(transition.blockers ? { blockers: transition.blockers } : {}),
      ...(transition.currentVersion ? { currentVersion: transition.currentVersion } : {}),
    });
  }

  if (transition.modelAdvisoryReference) {
    const advisory = await db.prepare("SELECT evidence_id FROM recommendations WHERE id = ?")
      .bind(transition.modelAdvisoryReference)
      .first<{ evidence_id: string | null }>();
    if (!advisory || advisory.evidence_id !== current.id) {
      return publicError(400, "invalid_advisory_reference", "The advisory reference does not belong to this evidence.");
    }
  }

  const priorState = JSON.stringify(evidenceSnapshot(current));
  const resultingState = JSON.stringify(evidenceSnapshot(transition.updated));
  try {
    const results = await db.batch([
      db.prepare(`UPDATE evidence SET owner = ?, jurisdiction = ?, classification = ?, status = ?,
        authority_state = ?, confidence = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND version = ?`)
        .bind(
          transition.updated.owner,
          transition.updated.jurisdiction,
          transition.updated.classification,
          transition.updated.status,
          transition.updated.authorityState,
          transition.updated.confidence,
          current.id,
          current.version,
        ),
      db.prepare(`INSERT INTO governance_events
        (evidence_id, action, actor, detail, prior_state, resulting_state, reason, source_record, model_advisory_id)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE changes() = 1`)
        .bind(
          current.id,
          transition.action,
          authentication.actor,
          transition.reason,
          priorState,
          resultingState,
          transition.reason,
          priorState,
          transition.modelAdvisoryReference,
        ),
    ]);
    if (Number(results[0]?.meta?.changes ?? 0) !== 1) {
      return publicError(409, "stale_record_conflict", "The evidence changed during the action. Reload before retrying.");
    }
  } catch {
    return publicError(503, "storage_failure", "The mutation could not be committed. No success was acknowledged.");
  }

  return Response.json({
    evidence: transition.updated,
    persistence: true,
    state: "ready",
  }, { headers: { "cache-control": "no-store" } });
}
