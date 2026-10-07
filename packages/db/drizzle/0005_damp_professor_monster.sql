ALTER TABLE "screenly"."app_rules" ADD COLUMN "payment_rail" text DEFAULT 'dodo' NOT NULL;--> statement-breakpoint
ALTER TABLE "screenly"."app_rules" ADD COLUMN "play_purchase_token" text;--> statement-breakpoint
ALTER TABLE "screenly"."app_rules" ADD COLUMN "play_order_id" text;