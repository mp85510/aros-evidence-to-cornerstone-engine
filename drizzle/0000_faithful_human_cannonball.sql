CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`source` text NOT NULL,
	`owner` text,
	`jurisdiction` text,
	`classification` text DEFAULT 'Unclassified' NOT NULL,
	`status` text DEFAULT 'Review' NOT NULL,
	`authority_state` text DEFAULT 'Observation only' NOT NULL,
	`confidence` integer DEFAULT 50 NOT NULL,
	`citations` integer DEFAULT 0 NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `governance_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`evidence_id` text NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
