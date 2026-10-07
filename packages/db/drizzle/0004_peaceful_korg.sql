ALTER TABLE "screenly"."app_rules" ADD COLUMN "stake_currency" text;--> statement-breakpoint
ALTER TABLE "screenly"."app_rules" ADD COLUMN "challenge_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "screenly"."app_rules" ADD COLUMN "stake_status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "screenly"."app_rules" ADD COLUMN "forfeited_amount" integer DEFAULT 0 NOT NULL;