import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const evidence = sqliteTable("evidence", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  owner: text("owner"),
  jurisdiction: text("jurisdiction"),
  classification: text("classification").notNull().default("Unclassified"),
  status: text("status").notNull().default("Review"),
  authorityState: text("authority_state").notNull().default("Observation only"),
  confidence: integer("confidence").notNull().default(50),
  citations: integer("citations").notNull().default(0),
  summary: text("summary").notNull().default(""),
  version: integer("version").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const governanceEvents = sqliteTable("governance_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  evidenceId: text("evidence_id").notNull(),
  action: text("action").notNull(),
  actor: text("actor").notNull(),
  detail: text("detail").notNull(),
  priorState: text("prior_state").notNull().default("{}"),
  resultingState: text("resulting_state").notNull().default("{}"),
  reason: text("reason").notNull().default(""),
  sourceRecord: text("source_record").notNull().default("{}"),
  modelAdvisoryId: text("model_advisory_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("governance_events_evidence_id_idx").on(table.evidenceId),
]);

export const recommendations = sqliteTable("recommendations", {
  id: text("id").primaryKey(),
  evidenceId: text("evidence_id"),
  actor: text("actor").notNull(),
  engine: text("engine").notNull(),
  schemaVersion: text("schema_version").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  fallbackState: text("fallback_state").notNull(),
  requestResult: text("request_result").notNull(),
  responseId: text("response_id"),
  recommendationJson: text("recommendation_json").notNull(),
  sourceRecord: text("source_record").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("recommendations_evidence_id_idx").on(table.evidenceId),
]);

export const rateLimitWindows = sqliteTable("rate_limit_windows", {
  identityKey: text("identity_key").notNull(),
  scope: text("scope").notNull(),
  windowStart: integer("window_start").notNull(),
  requestCount: integer("request_count").notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.identityKey, table.scope, table.windowStart] }),
]);
