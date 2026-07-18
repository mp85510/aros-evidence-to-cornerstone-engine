CREATE TABLE `rate_limit_windows` (
	`identity_key` text NOT NULL,
	`scope` text NOT NULL,
	`window_start` integer NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`identity_key`, `scope`, `window_start`)
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`evidence_id` text,
	`actor` text NOT NULL,
	`engine` text NOT NULL,
	`schema_version` text NOT NULL,
	`latency_ms` integer NOT NULL,
	`fallback_state` text NOT NULL,
	`request_result` text NOT NULL,
	`response_id` text,
	`recommendation_json` text NOT NULL,
	`source_record` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `recommendations_evidence_id_idx` ON `recommendations` (`evidence_id`);--> statement-breakpoint
ALTER TABLE `evidence` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `governance_events` ADD `prior_state` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `governance_events` ADD `resulting_state` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `governance_events` ADD `reason` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `governance_events` ADD `source_record` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `governance_events` ADD `model_advisory_id` text;--> statement-breakpoint
UPDATE `evidence` SET `source` = 'Legal advisory · EMEA' WHERE `id` = 'EV-281';--> statement-breakpoint
CREATE TRIGGER `governance_events_no_update`
BEFORE UPDATE ON `governance_events`
BEGIN
  SELECT RAISE(ABORT, 'governance events are immutable');
END;--> statement-breakpoint
CREATE TRIGGER `governance_events_no_delete`
BEFORE DELETE ON `governance_events`
BEGIN
  SELECT RAISE(ABORT, 'governance events are immutable');
END;--> statement-breakpoint
CREATE TRIGGER `recommendations_no_update`
BEFORE UPDATE ON `recommendations`
BEGIN
  SELECT RAISE(ABORT, 'recommendations are immutable');
END;--> statement-breakpoint
CREATE TRIGGER `recommendations_no_delete`
BEFORE DELETE ON `recommendations`
BEGIN
  SELECT RAISE(ABORT, 'recommendations are immutable');
END;
