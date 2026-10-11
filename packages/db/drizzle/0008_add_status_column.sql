ALTER TABLE "screenly"."app_rules" ADD COLUMN "status" text;
--> statement-breakpoint
-- Data migration, not generated: drizzle cannot infer how existing rows map onto
-- the new column. This must run before NOT NULL/DEFAULT are set, otherwise every
-- row is stamped 'active' by the default and the pending/active distinction below
-- is lost.
UPDATE "screenly"."app_rules" SET
  "status" = CASE
    -- Already finished; the outcome is more specific than a pending payment.
    WHEN "stake_status" = 'settled' THEN 'settled'
    WHEN "stake_status" = 'forfeited' THEN 'forfeited'
    -- Paid-but-abandoned rows. Nothing was charged, so they stay visible and
    -- retryable instead of becoming tombstones.
    WHEN "payment_status" = 'pending' THEN 'pending_payment'
    ELSE 'active'
  END;
--> statement-breakpoint
ALTER TABLE "screenly"."app_rules" ALTER COLUMN "status" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "screenly"."app_rules" ALTER COLUMN "status" SET DEFAULT 'active';