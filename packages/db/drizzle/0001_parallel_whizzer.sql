ALTER TABLE "screenly"."app_rules" ADD COLUMN "payment_status" text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "screenly"."app_rules" ADD COLUMN "payment_id" text;--> statement-breakpoint
ALTER TABLE "screenly"."app_rules" ADD COLUMN "locked_amount" integer;