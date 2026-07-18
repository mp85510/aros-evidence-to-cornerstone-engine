import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const governanceEvents = sqliteTable("governance_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  evidenceId: text("evidence_id").notNull(),
  action: text("action").notNull(),
  actor: text("actor").notNull(),
  detail: text("detail").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("governance_events_evidence_id_idx").on(table.evidenceId),
]);
