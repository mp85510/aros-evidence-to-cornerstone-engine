import { deriveGovernanceState, promotionBlockers } from "./governance.mjs";

export const EVIDENCE_ACTIONS = Object.freeze(["create", "classify", "assign", "promote"]);
export const CLASSIFICATIONS = Object.freeze([
  "Unclassified",
  "Observed pattern",
  "Expert interpretation",
  "Operational evidence",
  "Candidate decision",
  "Validated control",
  "Decision candidate",
  "Governed decision",
]);
export const AUTHORITY_STATES = Object.freeze(["Observation only", "Governed decision"]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_PATTERN = /^EV-[A-Z0-9-]{3,32}$/;
const ADVISORY_ID_PATTERN = /^ADV-[A-Z0-9-]{8,48}$/;

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function cleanText(value, { field, min = 0, max, nullable = false }) {
  if ((value === null || value === undefined || value === "") && nullable) {
    return { ok: true, value: null };
  }
  if (typeof value !== "string") {
    return { ok: false, error: `${field} must be text.` };
  }
  const cleaned = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length < min || cleaned.length > max) {
    return { ok: false, error: `${field} must be between ${min} and ${max} characters.` };
  }
  return { ok: true, value: cleaned };
}

export async function readJsonObject(request, maxBytes) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, status: 413, code: "request_too_large", error: `Request body exceeds ${maxBytes} bytes.` };
  }
  let text;
  try {
    text = await request.text();
  } catch {
    return { ok: false, status: 400, code: "invalid_request", error: "Request body could not be read." };
  }
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return { ok: false, status: 413, code: "request_too_large", error: `Request body exceeds ${maxBytes} bytes.` };
  }
  try {
    const value = JSON.parse(text);
    if (!isObject(value)) throw new Error("not an object");
    return { ok: true, value };
  } catch {
    return { ok: false, status: 400, code: "invalid_json", error: "Request body must be one JSON object." };
  }
}

export function authenticatedActor(request, environment = process.env) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return { ok: false, status: 403, code: "cross_site_action", error: "Cross-site governance actions are not allowed." };
  }
  const forwarded = request.headers.get("oai-authenticated-user-email");
  const devActor = environment.NODE_ENV !== "production" ? environment.AROS_DEV_ACTOR : null;
  const actor = forwarded ?? devActor ?? "";
  if (!EMAIL_PATTERN.test(actor) || actor.length > 254) {
    return { ok: false, status: 401, code: "unauthorized_action", error: "An authenticated human is required for governance mutations." };
  }
  return { ok: true, actor: actor.toLowerCase() };
}

export function advisoryActor(request) {
  const forwarded = request.headers.get("oai-authenticated-user-email");
  if (forwarded && EMAIL_PATTERN.test(forwarded) && forwarded.length <= 254) return forwarded.toLowerCase();
  return "private-viewer";
}

export function rateLimitIdentity(request) {
  return request.headers.get("oai-authenticated-user-email")
    ?? request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "private-viewer";
}

export function sanitizeCreatePayload(payload) {
  const forbidden = ["id", "status", "authorityState", "confidence", "citations", "version", "modelAdvisoryReference"];
  const forbiddenField = forbidden.find((field) => field in payload);
  if (forbiddenField) {
    return { ok: false, status: 400, code: "forbidden_field", error: `${forbiddenField} is server-controlled.` };
  }
  const title = cleanText(payload.title, { field: "title", min: 6, max: 160 });
  const source = cleanText(payload.source, { field: "source", min: 3, max: 500 });
  const owner = cleanText(payload.owner, { field: "owner", min: 2, max: 100, nullable: true });
  const jurisdiction = cleanText(payload.jurisdiction, { field: "jurisdiction", min: 2, max: 120, nullable: true });
  for (const result of [title, source, owner, jurisdiction]) {
    if (!result.ok) return { ok: false, status: 400, code: "invalid_field", error: result.error };
  }
  const classification = payload.classification ?? "Unclassified";
  if (typeof classification !== "string" || !CLASSIFICATIONS.includes(classification)) {
    return { ok: false, status: 400, code: "invalid_classification", error: "Classification is not allowed." };
  }
  return {
    ok: true,
    value: {
      title: title.value,
      source: source.value,
      owner: owner.value,
      jurisdiction: jurisdiction.value,
      classification,
    },
  };
}

export function sanitizeAdvisoryRecord(payload) {
  const title = cleanText(payload.title, { field: "title", min: 1, max: 160 });
  const source = cleanText(payload.source, { field: "source", min: 1, max: 500 });
  const owner = cleanText(payload.owner, { field: "owner", min: 2, max: 100, nullable: true });
  const jurisdiction = cleanText(payload.jurisdiction, { field: "jurisdiction", min: 2, max: 120, nullable: true });
  const summary = cleanText(payload.summary ?? "", { field: "summary", min: 0, max: 800 });
  for (const result of [title, source, owner, jurisdiction, summary]) {
    if (!result.ok) return { ok: false, status: 400, code: "invalid_field", error: result.error };
  }
  if (payload.id !== undefined && (typeof payload.id !== "string" || !ID_PATTERN.test(payload.id))) {
    return { ok: false, status: 400, code: "invalid_evidence_id", error: "Evidence id is invalid." };
  }
  if (typeof payload.classification !== "string" || !CLASSIFICATIONS.includes(payload.classification)) {
    return { ok: false, status: 400, code: "invalid_classification", error: "Classification is not allowed." };
  }
  if (typeof payload.authorityState !== "string" || !AUTHORITY_STATES.includes(payload.authorityState)) {
    return { ok: false, status: 400, code: "invalid_authority_state", error: "Authority state is invalid; it was not coerced." };
  }
  const confidence = Number(payload.confidence);
  const citations = Number(payload.citations);
  if (!Number.isInteger(confidence) || confidence < 0 || confidence > 100) {
    return { ok: false, status: 400, code: "invalid_confidence", error: "Confidence must be an integer from 0 to 100." };
  }
  if (!Number.isInteger(citations) || citations < 0 || citations > 100000) {
    return { ok: false, status: 400, code: "invalid_citations", error: "Citations must be a non-negative integer." };
  }
  const version = payload.version === undefined ? null : Number(payload.version);
  if (version !== null && (!Number.isInteger(version) || version < 1)) {
    return { ok: false, status: 400, code: "invalid_version", error: "Version must be a positive integer." };
  }
  return {
    ok: true,
    value: {
      id: payload.id ?? null,
      title: title.value,
      source: source.value,
      owner: owner.value,
      jurisdiction: jurisdiction.value,
      classification: payload.classification,
      authorityState: payload.authorityState,
      confidence,
      citations,
      summary: summary.value,
      version,
    },
  };
}

export function validateMutationEnvelope(payload) {
  if (typeof payload.action !== "string" || !EVIDENCE_ACTIONS.includes(payload.action) || payload.action === "create") {
    return { ok: false, status: 400, code: "unsupported_action", error: "Unsupported governance action." };
  }
  if (typeof payload.id !== "string" || !ID_PATTERN.test(payload.id)) {
    return { ok: false, status: 400, code: "invalid_evidence_id", error: "Evidence id is invalid." };
  }
  const expectedVersion = Number(payload.expectedVersion);
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return { ok: false, status: 400, code: "expected_version_required", error: "A positive expectedVersion is required." };
  }
  const forbidden = ["authorityState", "status", "confidence", "citations", "source", "title", "version"];
  const forbiddenField = forbidden.find((field) => field in payload);
  if (forbiddenField) {
    return { ok: false, status: 400, code: "forbidden_field", error: `${forbiddenField} is server-controlled for this action.` };
  }
  if (payload.modelAdvisoryReference !== undefined
    && (typeof payload.modelAdvisoryReference !== "string" || !ADVISORY_ID_PATTERN.test(payload.modelAdvisoryReference))) {
    return { ok: false, status: 400, code: "invalid_advisory_reference", error: "Model advisory reference is invalid." };
  }
  return { ok: true, expectedVersion };
}

export function authorizeEvidenceTransition(current, payload) {
  const envelope = validateMutationEnvelope(payload);
  if (!envelope.ok) return envelope;
  if (Number(current.version) !== envelope.expectedVersion) {
    return {
      ok: false,
      status: 409,
      code: "stale_record_conflict",
      error: "The evidence changed after it was loaded. Reload before retrying.",
      currentVersion: Number(current.version),
    };
  }
  const updated = { ...current };
  let reason;
  if (payload.action === "classify") {
    if (typeof payload.classification !== "string" || !CLASSIFICATIONS.includes(payload.classification)) {
      return { ok: false, status: 400, code: "invalid_classification", error: "Classification is not allowed." };
    }
    updated.classification = payload.classification;
    reason = `Human classified the evidence as ${updated.classification}; confidence and authority were unchanged.`;
  } else if (payload.action === "assign") {
    const owner = cleanText(payload.owner, { field: "owner", min: 2, max: 100 });
    const jurisdiction = cleanText(payload.jurisdiction, { field: "jurisdiction", min: 2, max: 120 });
    if (!owner.ok || !jurisdiction.ok) {
      return { ok: false, status: 400, code: "invalid_assignment", error: owner.error ?? jurisdiction.error };
    }
    updated.owner = owner.value;
    updated.jurisdiction = jurisdiction.value;
    reason = `Human assigned accountable ownership and jurisdiction.`;
  } else if (payload.action === "promote") {
    if (current.authorityState === "Governed decision") {
      return { ok: false, status: 409, code: "already_governed", error: "The evidence is already governed." };
    }
    const blockers = promotionBlockers(current);
    if (blockers.length) {
      return {
        ok: false,
        status: 409,
        code: "blocked_transition",
        error: `Promotion blocked: resolve ${blockers.join(", ")}.`,
        blockers,
      };
    }
    updated.authorityState = "Governed decision";
    reason = "Authenticated architect explicitly promoted the evidence after server-side prerequisites passed.";
  }
  updated.status = deriveGovernanceState(updated);
  updated.version = Number(current.version) + 1;
  return {
    ok: true,
    updated,
    reason,
    action: `evidence.${payload.action}`,
    modelAdvisoryReference: payload.modelAdvisoryReference ?? null,
  };
}

export function evidenceSnapshot(record) {
  return {
    id: record.id,
    title: record.title,
    source: record.source,
    owner: record.owner ?? null,
    jurisdiction: record.jurisdiction ?? null,
    classification: record.classification,
    status: record.status ?? deriveGovernanceState(record),
    authorityState: record.authorityState,
    confidence: Number(record.confidence),
    citations: Number(record.citations),
    summary: record.summary ?? "",
    version: Number(record.version ?? 1),
  };
}
