CREATE TABLE `procurement_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`entity` text NOT NULL,
	`hash` text NOT NULL,
	`business_key` text NOT NULL,
	`filename` text NOT NULL,
	`mime` text NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`vendor` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`reference` text NOT NULL,
	`related_reference` text NOT NULL,
	`date` text NOT NULL,
	`currency` text NOT NULL,
	`total` real NOT NULL,
	`extracted_text` text NOT NULL,
	`items` text NOT NULL,
	`created_at` text NOT NULL,
	`approved_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_procurement_actor_entity` ON `procurement_documents` (`actor`,`entity`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_procurement_business_key` ON `procurement_documents` (`business_key`);