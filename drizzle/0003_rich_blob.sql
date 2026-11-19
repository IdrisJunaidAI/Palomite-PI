CREATE TABLE `vendor_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`entity` text NOT NULL,
	`document_id` text NOT NULL,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`time_zone` text NOT NULL,
	`start_utc` text NOT NULL,
	`end_utc` text NOT NULL,
	`location` text NOT NULL,
	`contact` text NOT NULL,
	`check_number` text NOT NULL,
	`recipient` text NOT NULL,
	`notes` text NOT NULL,
	`status` text NOT NULL,
	`version` integer NOT NULL,
	`history` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_schedule_account_project` ON `vendor_schedules` (`actor`,`entity`);