CREATE TABLE `records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity` text NOT NULL,
	`kind` text NOT NULL,
	`ref` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`vendor` text DEFAULT '' NOT NULL,
	`due_date` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_records_entity_kind` ON `records` (`entity`,`kind`);