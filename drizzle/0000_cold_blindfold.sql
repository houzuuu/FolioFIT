CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '지원자' NOT NULL,
	`headline` text DEFAULT '' NOT NULL,
	`field` text DEFAULT '디자인' NOT NULL,
	`career` text DEFAULT '1~3년' NOT NULL,
	`target_roles` text DEFAULT '' NOT NULL,
	`resume_text` text DEFAULT '' NOT NULL,
	`portfolio_text` text DEFAULT '' NOT NULL,
	`resume_file_name` text DEFAULT '' NOT NULL,
	`portfolio_file_name` text DEFAULT '' NOT NULL,
	`preferences` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
