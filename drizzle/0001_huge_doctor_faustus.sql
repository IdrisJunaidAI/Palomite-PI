CREATE TABLE `layout_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`mime` text NOT NULL,
	`extracted_text` text NOT NULL,
	`record_count` integer NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `records` ADD `document_id` text;--> statement-breakpoint
ALTER TABLE `records` ADD `source_page` integer;